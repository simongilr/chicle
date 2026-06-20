import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityMetadata, ObjectLiteral, Repository } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { AuthContext } from '../auth/auth.types';
import { SchemaChange, SchemaChangeOperation } from './schema-change.entity';

type TableScope = 'tenant' | 'current_tenant' | 'global';
type TableSource = 'entity' | 'schema';
type SchemaColumnType = 'string' | 'text' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'json' | 'uuid';

interface VisibleColumn {
  name: string;
  type: string;
  nullable: boolean;
  primary: boolean;
  editable: boolean;
}

export interface VisibleTable {
  name: string;
  entity: string;
  scope: TableScope;
  source: TableSource;
  editable: boolean;
  designable: boolean;
  columns: VisibleColumn[];
}

export interface DatabaseTablesResponse {
  tables: VisibleTable[];
}

export interface DatabaseRowsResponse {
  table: VisibleTable;
  page: number;
  pageSize: number;
  total: number;
  rows: ObjectLiteral[];
}

export interface DatabaseUpdateResponse {
  table: VisibleTable;
  row: ObjectLiteral;
}

export interface SchemaFieldInput {
  name: string;
  type: SchemaColumnType;
  length?: number;
  precision?: number;
  scale?: number;
  nullable?: boolean;
  defaultValue?: string | number | boolean | null;
}

export interface SchemaDesignRequest {
  operation: SchemaChangeOperation;
  tableName: string;
  columns?: SchemaFieldInput[];
  column?: SchemaFieldInput;
  currentColumnName?: string;
  confirmation?: string;
}

interface SchemaPlan {
  operation: SchemaChangeOperation;
  tableName: string;
  columnName?: string | null;
  sql: string;
  migrationName: string;
  migrationSource: string;
  warnings: string[];
}

export interface SchemaPreviewResponse extends SchemaPlan {}

export interface SchemaApplyResponse extends SchemaPlan {
  change: SchemaChange;
}

export interface SchemaHistoryResponse {
  changes: SchemaChange[];
}

const GLOBAL_TABLES = new Set(['confisys', 'permissions']);
const READONLY_TABLES = new Set([
  'audit_events',
  'auth_login_attempts',
  'auth_sessions',
  'permissions',
  'role_permissions',
  'schema_changes',
  'tenant_memberships',
  'user_roles'
]);
const READONLY_COLUMNS = new Set(['id', 'tenantId', 'createdAt', 'updatedAt', 'deletedAt', 'systemRole']);
const SENSITIVE_COLUMNS = new Set([
  'password',
  'passwordHash',
  'password_hash',
  'refreshTokenHash',
  'refresh_token_hash',
  'token',
  'tokenId',
  'token_id',
  'secret'
]);
const CUSTOM_TABLE_PREFIX = 'custom_';
const MAX_CUSTOM_COLUMNS = 60;

@Injectable()
export class DatabaseViewerService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    @InjectRepository(SchemaChange)
    private readonly schemaChanges: Repository<SchemaChange>
  ) {}

  async listTables(auth: AuthContext): Promise<DatabaseTablesResponse> {
    const entityTables = this.visibleMetadatas(auth).map(({ metadata, scope }) => this.toEntityVisibleTable(metadata, scope));
    const customTables = await this.customTables(auth);
    const tableMap = new Map<string, VisibleTable>();

    for (const table of [...entityTables, ...customTables]) {
      tableMap.set(table.name, table);
    }

    return {
      tables: [...tableMap.values()].sort((a, b) => a.name.localeCompare(b.name))
    };
  }

  async listRows(auth: AuthContext, table: string, page = 1, pageSize = 25): Promise<DatabaseRowsResponse> {
    const visible = await this.findVisibleTable(auth, table);
    if (!visible) {
      throw new NotFoundException('Table not available');
    }

    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize = Number.isFinite(pageSize) ? Math.min(Math.max(Math.floor(pageSize), 5), 100) : 25;

    if (visible.source === 'schema') {
      return this.listCustomRows(auth, visible, safePage, safePageSize);
    }

    const metadata = this.requireMetadata(table);
    const repository = this.dataSource.getRepository<ObjectLiteral>(metadata.target);
    const where = this.scopeWhere(auth, metadata, visible.scope);
    const order = this.defaultOrder(metadata);

    const [rows, total] = await repository.findAndCount({
      where,
      order,
      skip: (safePage - 1) * safePageSize,
      take: safePageSize
    });

    return {
      table: visible,
      page: safePage,
      pageSize: safePageSize,
      total,
      rows: rows.map((row) => this.maskRow(row))
    };
  }

  async updateRow(
    auth: AuthContext,
    table: string,
    id: string,
    values: Record<string, unknown>
  ): Promise<DatabaseUpdateResponse> {
    const visible = await this.findVisibleTable(auth, table);
    if (!visible) {
      throw new NotFoundException('Table not available');
    }

    if (!visible.editable) {
      throw new ForbiddenException('This table is read-only in the database viewer');
    }

    if (visible.source === 'schema') {
      return this.updateCustomRow(auth, visible, id, values);
    }

    const metadata = this.requireMetadata(table);
    const primary = metadata.primaryColumns[0];
    if (!primary || metadata.primaryColumns.length !== 1) {
      throw new BadRequestException('Only single primary key tables can be edited');
    }

    const repository = this.dataSource.getRepository<ObjectLiteral>(metadata.target);
    const row = await repository.findOne({
      where: {
        ...this.scopeWhere(auth, metadata, visible.scope),
        [primary.propertyName]: id
      }
    });
    if (!row) {
      throw new NotFoundException('Row not found');
    }

    const updates: ObjectLiteral = {};
    for (const [key, rawValue] of Object.entries(values ?? {})) {
      const column = metadata.columns.find((item) => item.propertyName === key);
      if (!column) {
        continue;
      }

      if (!this.isEntityColumnEditable(metadata, column)) {
        throw new BadRequestException(`Column ${key} cannot be edited`);
      }

      updates[key] = this.coerceEntityValue(column, rawValue);
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('No editable values were provided');
    }

    const saved = await repository.save({ ...row, ...updates });
    return {
      table: visible,
      row: this.maskRow(saved)
    };
  }

  async previewSchemaChange(auth: AuthContext, request: SchemaDesignRequest): Promise<SchemaPreviewResponse> {
    this.assertCanDesign(auth);
    return this.buildSchemaPlan(request);
  }

  async applySchemaChange(auth: AuthContext, request: SchemaDesignRequest): Promise<SchemaApplyResponse> {
    this.assertCanDesign(auth);
    const plan = await this.buildSchemaPlan(request);
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    try {
      await queryRunner.query(plan.sql);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown schema error';
      await this.recordSchemaChange(auth, plan, request, 'failed', message);
      throw new BadRequestException(`Schema change failed: ${message}`);
    } finally {
      await queryRunner.release();
    }

    const change = await this.recordSchemaChange(auth, plan, request, 'applied');
    await this.tryWriteMigrationFile(plan, change);

    return { ...plan, change };
  }

  async schemaHistory(auth: AuthContext): Promise<SchemaHistoryResponse> {
    this.assertCanDesign(auth);
    const changes = await this.schemaChanges.find({
      where: { tenantId: auth.tenant.id },
      order: { sequence: 'DESC' },
      take: 50
    });

    return { changes };
  }

  private visibleMetadatas(auth: AuthContext) {
    if (!this.isOwnerOrAdmin(auth)) {
      throw new ForbiddenException('Database viewer is only available for owner or admin users');
    }

    return this.dataSource.entityMetadatas
      .map((metadata) => ({ metadata, scope: this.scopeFor(metadata) }))
      .filter((item): item is { metadata: EntityMetadata; scope: TableScope } => Boolean(item.scope));
  }

  private isOwnerOrAdmin(auth: AuthContext) {
    return (
      auth.user.systemRole === 'owner' ||
      auth.user.systemRole === 'admin' ||
      auth.roles.some((role) => role.key === 'owner' || role.key === 'admin')
    );
  }

  private assertCanDesign(auth: AuthContext) {
    if (!this.isOwnerOrAdmin(auth)) {
      throw new ForbiddenException('Database schema designer is only available for owner or admin users');
    }
  }

  private scopeFor(metadata: EntityMetadata): TableScope | null {
    if (metadata.tableName === 'tenants') {
      return 'current_tenant';
    }

    if (metadata.columns.some((column) => column.propertyName === 'tenantId')) {
      return 'tenant';
    }

    if (GLOBAL_TABLES.has(metadata.tableName)) {
      return 'global';
    }

    return null;
  }

  private scopeWhere(auth: AuthContext, metadata: EntityMetadata, scope: TableScope) {
    if (scope === 'tenant') {
      return { tenantId: auth.tenant.id };
    }

    if (scope === 'current_tenant') {
      return { id: auth.tenant.id };
    }

    return {};
  }

  private defaultOrder(metadata: EntityMetadata) {
    const createdAt = metadata.columns.find((column) => column.propertyName === 'createdAt');
    if (createdAt) {
      return { createdAt: 'DESC' as const };
    }

    const id = metadata.columns.find((column) => column.propertyName === 'id');
    if (id) {
      return { id: 'ASC' as const };
    }

    return {};
  }

  private requireMetadata(table: string) {
    const metadata = this.dataSource.entityMetadatas.find((item) => item.tableName === table);
    if (!metadata) {
      throw new NotFoundException('Entity metadata not available');
    }

    return metadata;
  }

  private toEntityVisibleTable(metadata: EntityMetadata, scope: TableScope): VisibleTable {
    return {
      name: metadata.tableName,
      entity: metadata.name,
      scope,
      source: 'entity',
      editable: this.isEntityTableEditable(metadata),
      designable: false,
      columns: metadata.columns.map((column) => ({
        name: column.propertyName,
        type: String(column.type),
        nullable: column.isNullable,
        primary: column.isPrimary,
        editable: this.isEntityColumnEditable(metadata, column)
      }))
    };
  }

  private async customTables(auth: AuthContext): Promise<VisibleTable[]> {
    this.assertCanDesign(auth);
    const rows = await this.dataSource.query(
      `
        SELECT TABLE_NAME AS tableName
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME LIKE 'custom\\_%' ESCAPE '\\\\'
        ORDER BY TABLE_NAME ASC
      `
    );

    return Promise.all(rows.map((row: { tableName: string }) => this.customTable(row.tableName)));
  }

  private async findVisibleTable(auth: AuthContext, table: string): Promise<VisibleTable | null> {
    const metadata = this.visibleMetadatas(auth).find((item) => item.metadata.tableName === table);
    if (metadata) {
      return this.toEntityVisibleTable(metadata.metadata, metadata.scope);
    }

    if (!this.isCustomTableName(table, false)) {
      return null;
    }

    const exists = await this.tableExists(table);
    return exists ? this.customTable(table) : null;
  }

  private async customTable(tableName: string): Promise<VisibleTable> {
    const columns = await this.customColumns(tableName);
    return {
      name: tableName,
      entity: 'Custom schema',
      scope: 'tenant',
      source: 'schema',
      editable: true,
      designable: true,
      columns
    };
  }

  private async customColumns(tableName: string): Promise<VisibleColumn[]> {
    const rows = await this.dataSource.query(
      `
        SELECT COLUMN_NAME AS name,
               COLUMN_TYPE AS type,
               IS_NULLABLE AS isNullable,
               COLUMN_KEY AS columnKey
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION ASC
      `,
      [tableName]
    );

    return rows.map((row: { name: string; type: string; isNullable: string; columnKey: string }) => ({
      name: row.name,
      type: row.type,
      nullable: row.isNullable === 'YES',
      primary: row.columnKey === 'PRI',
      editable: !READONLY_COLUMNS.has(row.name) && !SENSITIVE_COLUMNS.has(row.name)
    }));
  }

  private async listCustomRows(
    auth: AuthContext,
    table: VisibleTable,
    page: number,
    pageSize: number
  ): Promise<DatabaseRowsResponse> {
    const offset = (page - 1) * pageSize;
    const orderColumn = table.columns.some((column) => column.name === 'createdAt') ? 'createdAt' : 'id';
    const rows = await this.dataSource.query(
      `SELECT * FROM ${this.escapeIdentifier(table.name)} WHERE ${this.escapeIdentifier('tenantId')} = ? ORDER BY ${this.escapeIdentifier(
        orderColumn
      )} DESC LIMIT ? OFFSET ?`,
      [auth.tenant.id, pageSize, offset]
    );
    const totals = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM ${this.escapeIdentifier(table.name)} WHERE ${this.escapeIdentifier('tenantId')} = ?`,
      [auth.tenant.id]
    );

    return {
      table,
      page,
      pageSize,
      total: Number(totals[0]?.total ?? 0),
      rows: rows.map((row: ObjectLiteral) => this.maskRow(row))
    };
  }

  private async updateCustomRow(
    auth: AuthContext,
    table: VisibleTable,
    id: string,
    values: Record<string, unknown>
  ): Promise<DatabaseUpdateResponse> {
    const row = await this.dataSource.query(
      `SELECT * FROM ${this.escapeIdentifier(table.name)} WHERE ${this.escapeIdentifier('id')} = ? AND ${this.escapeIdentifier(
        'tenantId'
      )} = ? LIMIT 1`,
      [id, auth.tenant.id]
    );
    if (!row.length) {
      throw new NotFoundException('Row not found');
    }

    const editableColumns = new Map(table.columns.filter((column) => column.editable).map((column) => [column.name, column]));
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(values ?? {})) {
      const column = editableColumns.get(key);
      if (!column) {
        continue;
      }

      updates[key] = this.coerceVisibleValue(column, value);
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('No editable values were provided');
    }

    if (table.columns.some((column) => column.name === 'updatedAt')) {
      updates.updatedAt = new Date();
    }

    await this.dataSource.query(
      `UPDATE ${this.escapeIdentifier(table.name)}
       SET ${Object.keys(updates)
         .map((column) => `${this.escapeIdentifier(column)} = ?`)
         .join(', ')}
       WHERE ${this.escapeIdentifier('id')} = ? AND ${this.escapeIdentifier('tenantId')} = ?`,
      [...Object.values(updates), id, auth.tenant.id]
    );

    const saved = await this.dataSource.query(
      `SELECT * FROM ${this.escapeIdentifier(table.name)} WHERE ${this.escapeIdentifier('id')} = ? AND ${this.escapeIdentifier(
        'tenantId'
      )} = ? LIMIT 1`,
      [id, auth.tenant.id]
    );

    return { table, row: this.maskRow(saved[0]) };
  }

  private async buildSchemaPlan(request: SchemaDesignRequest): Promise<SchemaPlan> {
    const operation = request.operation;
    const tableName = this.assertCustomTableName(request.tableName);
    const warnings: string[] = [
      'Las migraciones generadas nunca editan archivos viejos; cada cambio crea una migración nueva y secuencial.',
      'Las tablas custom incluyen tenantId para mantener los datos filtrados por organización.'
    ];
    let sql = '';
    let columnName: string | null = null;

    if (operation === 'create_table') {
      if (await this.tableExists(tableName)) {
        throw new BadRequestException(`Table ${tableName} already exists`);
      }

      const columns = this.assertSchemaColumns(request.columns ?? []);
      const customColumns = columns.map((column) => this.columnDefinition(column)).join(',\n        ');
      sql = `
CREATE TABLE ${this.escapeIdentifier(tableName)} (
  ${this.escapeIdentifier('id')} varchar(36) NOT NULL,
  ${this.escapeIdentifier('tenantId')} varchar(36) NOT NULL,
  ${customColumns},
  ${this.escapeIdentifier('createdAt')} datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  ${this.escapeIdentifier('updatedAt')} datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (${this.escapeIdentifier('id')}),
  KEY ${this.escapeIdentifier(`IDX_${tableName}_tenantId`)} (${this.escapeIdentifier('tenantId')})
) ENGINE=InnoDB`.trim();
    } else if (operation === 'add_column') {
      await this.assertExistingCustomTable(tableName);
      const column = this.assertSchemaColumn(request.column);
      await this.assertColumnDoesNotExist(tableName, column.name);
      if (!column.nullable && column.defaultValue === undefined) {
        throw new BadRequestException('Adding a NOT NULL column requires a default value or nullable=true');
      }
      columnName = column.name;
      sql = `ALTER TABLE ${this.escapeIdentifier(tableName)} ADD COLUMN ${this.columnDefinition(column)}`;
    } else if (operation === 'alter_column') {
      await this.assertExistingCustomTable(tableName);
      const currentColumnName = this.assertCustomColumnName(request.currentColumnName ?? '');
      this.assertNotProtectedColumn(currentColumnName);
      await this.assertColumnExists(tableName, currentColumnName);
      const column = this.assertSchemaColumn(request.column);
      if (column.name !== currentColumnName) {
        await this.assertColumnDoesNotExist(tableName, column.name);
      }
      columnName = column.name;
      sql = `ALTER TABLE ${this.escapeIdentifier(tableName)} CHANGE COLUMN ${this.escapeIdentifier(currentColumnName)} ${this.columnDefinition(
        column
      )}`;
      warnings.push('Cambiar tipo o nullable puede fallar si los datos actuales no cumplen la nueva definición.');
    } else if (operation === 'drop_column') {
      await this.assertExistingCustomTable(tableName);
      const currentColumnName = this.assertCustomColumnName(request.currentColumnName ?? '');
      this.assertNotProtectedColumn(currentColumnName);
      await this.assertColumnExists(tableName, currentColumnName);
      if (request.confirmation !== `DROP ${tableName}.${currentColumnName}`) {
        throw new BadRequestException(`Confirmation must be: DROP ${tableName}.${currentColumnName}`);
      }
      columnName = currentColumnName;
      sql = `ALTER TABLE ${this.escapeIdentifier(tableName)} DROP COLUMN ${this.escapeIdentifier(currentColumnName)}`;
      warnings.push('Eliminar una columna borra sus datos. Esta operación no se puede recuperar desde la DB.');
    } else {
      throw new BadRequestException('Unsupported schema operation');
    }

    const migrationName = this.migrationName(operation, tableName, columnName ?? undefined);
    const migrationSource = this.migrationSource(migrationName, sql, operation, tableName, columnName);

    return {
      operation,
      tableName,
      columnName,
      sql,
      migrationName,
      migrationSource,
      warnings
    };
  }

  private async recordSchemaChange(
    auth: AuthContext,
    plan: SchemaPlan,
    request: SchemaDesignRequest,
    status: 'applied' | 'failed',
    error?: string
  ) {
    const next = await this.schemaChanges
      .createQueryBuilder('change')
      .select('COALESCE(MAX(change.sequence), 0) + 1', 'sequence')
      .where('change.tenantId = :tenantId', { tenantId: auth.tenant.id })
      .getRawOne<{ sequence: string | number }>();

    return this.schemaChanges.save(
      this.schemaChanges.create({
        tenantId: auth.tenant.id,
        actorUserId: auth.user.id,
        sequence: Number(next?.sequence ?? 1),
        operation: plan.operation,
        tableName: plan.tableName,
        columnName: plan.columnName,
        status,
        request: request as unknown as Record<string, unknown>,
        sql: plan.sql,
        migrationName: plan.migrationName,
        migrationSource: plan.migrationSource,
        error: error ?? null
      })
    );
  }

  private async tryWriteMigrationFile(plan: SchemaPlan, change: SchemaChange) {
    if (this.config.get<string>('CHICLE_SCHEMA_MIGRATIONS_WRITE_FILES', 'false') !== 'true') {
      return;
    }

    const configuredDir = this.config.get<string>('CHICLE_SCHEMA_MIGRATIONS_DIR', 'src/database/migrations');
    const migrationsDir = resolve(process.cwd(), configuredDir);
    const filename = `${plan.migrationName}.ts`;
    const migrationPath = join(migrationsDir, filename);

    await mkdir(migrationsDir, { recursive: true });
    await writeFile(migrationPath, plan.migrationSource, { encoding: 'utf8', flag: 'wx' });
    await this.schemaChanges.update(change.id, { migrationPath });
    change.migrationPath = migrationPath;
  }

  private assertSchemaColumns(columns: SchemaFieldInput[]) {
    if (!Array.isArray(columns) || columns.length === 0) {
      throw new BadRequestException('At least one custom column is required');
    }

    if (columns.length > MAX_CUSTOM_COLUMNS) {
      throw new BadRequestException(`A custom table can have at most ${MAX_CUSTOM_COLUMNS} custom columns`);
    }

    const seen = new Set<string>();
    return columns.map((column) => {
      const parsed = this.assertSchemaColumn(column);
      if (seen.has(parsed.name)) {
        throw new BadRequestException(`Duplicated column ${parsed.name}`);
      }
      seen.add(parsed.name);
      return parsed;
    });
  }

  private assertSchemaColumn(column?: SchemaFieldInput): Required<Pick<SchemaFieldInput, 'name' | 'type'>> & SchemaFieldInput {
    if (!column) {
      throw new BadRequestException('Column definition is required');
    }

    const name = this.assertCustomColumnName(column.name);
    this.assertNotProtectedColumn(name);
    const type = column.type;
    if (!['string', 'text', 'integer', 'decimal', 'boolean', 'date', 'datetime', 'json', 'uuid'].includes(type)) {
      throw new BadRequestException('Unsupported column type');
    }

    return {
      ...column,
      name,
      type,
      nullable: column.nullable ?? true
    };
  }

  private columnDefinition(column: SchemaFieldInput) {
    const name = this.assertCustomColumnName(column.name);
    const type = this.sqlType(column);
    const nullable = column.nullable === false ? 'NOT NULL' : 'NULL';
    const defaultSql = this.defaultSql(column);
    return `${this.escapeIdentifier(name)} ${type} ${nullable}${defaultSql}`;
  }

  private sqlType(column: SchemaFieldInput) {
    if (column.type === 'string') {
      const length = this.numberInRange(column.length, 1, 500, 180);
      return `varchar(${length})`;
    }

    if (column.type === 'text') {
      return 'text';
    }

    if (column.type === 'integer') {
      return 'int';
    }

    if (column.type === 'decimal') {
      const precision = this.numberInRange(column.precision, 1, 30, 12);
      const scale = this.numberInRange(column.scale, 0, Math.min(precision, 10), 2);
      return `decimal(${precision},${scale})`;
    }

    if (column.type === 'boolean') {
      return 'tinyint(1)';
    }

    if (column.type === 'date') {
      return 'date';
    }

    if (column.type === 'datetime') {
      return 'datetime(6)';
    }

    if (column.type === 'json') {
      return 'json';
    }

    return 'varchar(36)';
  }

  private defaultSql(column: SchemaFieldInput) {
    if (column.defaultValue === undefined || column.defaultValue === null) {
      return '';
    }

    if (column.type === 'text' || column.type === 'json') {
      throw new BadRequestException('text and json columns cannot use defaultValue');
    }

    if (column.type === 'boolean') {
      return ` DEFAULT ${column.defaultValue === true || column.defaultValue === 'true' ? '1' : '0'}`;
    }

    if (column.type === 'integer' || column.type === 'decimal') {
      const parsed = Number(column.defaultValue);
      if (!Number.isFinite(parsed)) {
        throw new BadRequestException(`Default for ${column.name} must be numeric`);
      }
      return ` DEFAULT ${parsed}`;
    }

    return ` DEFAULT '${String(column.defaultValue).replace(/'/g, "''")}'`;
  }

  private numberInRange(value: number | undefined, min: number, max: number, fallback: number) {
    const parsed = Number(value ?? fallback);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
      throw new BadRequestException(`Numeric value must be between ${min} and ${max}`);
    }
    return parsed;
  }

  private migrationName(operation: SchemaChangeOperation, tableName: string, columnName?: string) {
    const suffix = [operation, tableName, columnName].filter(Boolean).join('_').replace(/_/g, '-');
    return `${Date.now()}-${suffix}`;
  }

  private migrationSource(className: string, sql: string, operation: string, tableName: string, columnName?: string | null) {
    const pascal = className
      .replace(/^[0-9]+-/, '')
      .split(/[^a-zA-Z0-9]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    const timestamp = className.match(/^[0-9]+/)?.[0] ?? String(Date.now());
    const escapedSql = sql.replace(/`/g, '\\`').replace(/\${/g, '\\${');
    const downSql = this.downSql(operation, tableName, columnName);

    return `import { MigrationInterface, QueryRunner } from 'typeorm';

export class ${pascal}${timestamp} implements MigrationInterface {
  name = '${pascal}${timestamp}';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`${escapedSql}\`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    ${downSql}
  }
}
`;
  }

  private downSql(operation: string, tableName: string, columnName?: string | null) {
    if (operation === 'create_table') {
      return `await queryRunner.query('DROP TABLE IF EXISTS ${this.escapeIdentifier(tableName)}');`;
    }

    if (operation === 'add_column' && columnName) {
      return `await queryRunner.query('ALTER TABLE ${this.escapeIdentifier(tableName)} DROP COLUMN ${this.escapeIdentifier(columnName)}');`;
    }

    return '// Reversar este cambio requiere una migracion manual porque puede afectar datos existentes.';
  }

  private async assertExistingCustomTable(tableName: string) {
    if (!(await this.tableExists(tableName))) {
      throw new NotFoundException(`Table ${tableName} does not exist`);
    }
  }

  private async tableExists(tableName: string) {
    const rows = await this.dataSource.query(
      `
        SELECT COUNT(*) AS total
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
      `,
      [tableName]
    );
    return Number(rows[0]?.total ?? 0) > 0;
  }

  private async assertColumnExists(tableName: string, columnName: string) {
    if (!(await this.columnExists(tableName, columnName))) {
      throw new NotFoundException(`Column ${columnName} does not exist in ${tableName}`);
    }
  }

  private async assertColumnDoesNotExist(tableName: string, columnName: string) {
    if (await this.columnExists(tableName, columnName)) {
      throw new BadRequestException(`Column ${columnName} already exists in ${tableName}`);
    }
  }

  private async columnExists(tableName: string, columnName: string) {
    const rows = await this.dataSource.query(
      `
        SELECT COUNT(*) AS total
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
      `,
      [tableName, columnName]
    );
    return Number(rows[0]?.total ?? 0) > 0;
  }

  private assertCustomTableName(name: string) {
    if (!this.isCustomTableName(name, true)) {
      throw new BadRequestException(`Custom tables must start with ${CUSTOM_TABLE_PREFIX} and use snake_case`);
    }

    return name;
  }

  private isCustomTableName(name: string, strictLength: boolean) {
    const pattern = strictLength ? /^custom_[a-z][a-z0-9_]{1,55}$/ : /^custom_[a-z][a-z0-9_]*$/;
    return pattern.test(name);
  }

  private assertCustomColumnName(name: string) {
    if (!/^[a-z][a-z0-9_]{1,62}$/.test(name)) {
      throw new BadRequestException('Column names must use snake_case and start with a letter');
    }

    return name;
  }

  private assertNotProtectedColumn(name: string) {
    if (READONLY_COLUMNS.has(name) || SENSITIVE_COLUMNS.has(name)) {
      throw new BadRequestException(`Column ${name} is protected`);
    }
  }

  private escapeIdentifier(identifier: string) {
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(identifier)) {
      throw new BadRequestException(`Invalid identifier ${identifier}`);
    }

    return `\`${identifier}\``;
  }

  private maskRow(row: ObjectLiteral) {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, SENSITIVE_COLUMNS.has(key) ? '••••••••' : value])
    );
  }

  private isEntityTableEditable(metadata: EntityMetadata) {
    return !READONLY_TABLES.has(metadata.tableName);
  }

  private isEntityColumnEditable(metadata: EntityMetadata, column: ColumnMetadata) {
    return (
      this.isEntityTableEditable(metadata) &&
      !column.isPrimary &&
      !READONLY_COLUMNS.has(column.propertyName) &&
      !SENSITIVE_COLUMNS.has(column.propertyName)
    );
  }

  private coerceEntityValue(column: ColumnMetadata, value: unknown) {
    return this.coerceValue(String(column.type), column.isNullable, column.propertyName, value);
  }

  private coerceVisibleValue(column: VisibleColumn, value: unknown) {
    return this.coerceValue(column.type, column.nullable, column.name, value);
  }

  private coerceValue(typeValue: string, nullable: boolean, name: string, value: unknown) {
    if (value === null || value === '') {
      if (nullable) {
        return null;
      }

      if (value === null) {
        throw new BadRequestException(`Column ${name} cannot be null`);
      }
    }

    const type = typeValue.toLowerCase();
    if (type.includes('json')) {
      try {
        return typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        throw new BadRequestException(`Column ${name} must contain valid JSON`);
      }
    }

    if (type === 'boolean' || type === 'bool' || type === 'tinyint(1)') {
      return value === true || value === 'true' || value === 1 || value === '1';
    }

    if (['int', 'integer', 'bigint', 'smallint', 'tinyint', 'float', 'double', 'decimal', 'number'].some((item) => type.includes(item))) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        throw new BadRequestException(`Column ${name} must be numeric`);
      }
      return parsed;
    }

    if (type.includes('date') || type.includes('time')) {
      const parsed = new Date(String(value));
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException(`Column ${name} must be a valid date`);
      }
      return parsed;
    }

    return value;
  }
}

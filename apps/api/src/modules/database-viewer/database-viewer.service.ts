import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { DataSource, EntityMetadata, ObjectLiteral } from 'typeorm';
import { AuthContext } from '../auth/auth.types';

type TableScope = 'tenant' | 'current_tenant' | 'global';

export interface VisibleTable {
  name: string;
  entity: string;
  scope: TableScope;
  editable: boolean;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    primary: boolean;
    editable: boolean;
  }>;
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

const GLOBAL_TABLES = new Set(['confisys', 'permissions']);
const READONLY_TABLES = new Set([
  'audit_events',
  'auth_login_attempts',
  'auth_sessions',
  'permissions',
  'role_permissions',
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

@Injectable()
export class DatabaseViewerService {
  constructor(private readonly dataSource: DataSource) {}

  async listTables(auth: AuthContext): Promise<DatabaseTablesResponse> {
    const tables = this.visibleMetadatas(auth)
      .map(({ metadata, scope }) => this.toVisibleTable(metadata, scope))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { tables };
  }

  async listRows(auth: AuthContext, table: string, page = 1, pageSize = 25): Promise<DatabaseRowsResponse> {
    const visible = this.visibleMetadatas(auth).find(({ metadata }) => metadata.tableName === table);
    if (!visible) {
      throw new NotFoundException('Table not available');
    }

    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize = Number.isFinite(pageSize) ? Math.min(Math.max(Math.floor(pageSize), 5), 100) : 25;
    const repository = this.dataSource.getRepository<ObjectLiteral>(visible.metadata.target);
    const where = this.scopeWhere(auth, visible.metadata, visible.scope);
    const order = this.defaultOrder(visible.metadata);

    const [rows, total] = await repository.findAndCount({
      where,
      order,
      skip: (safePage - 1) * safePageSize,
      take: safePageSize
    });

    return {
      table: this.toVisibleTable(visible.metadata, visible.scope),
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
    const visible = this.visibleMetadatas(auth).find(({ metadata }) => metadata.tableName === table);
    if (!visible) {
      throw new NotFoundException('Table not available');
    }

    if (!this.isTableEditable(visible.metadata)) {
      throw new ForbiddenException('This table is read-only in the database viewer');
    }

    const primary = visible.metadata.primaryColumns[0];
    if (!primary || visible.metadata.primaryColumns.length !== 1) {
      throw new BadRequestException('Only single primary key tables can be edited');
    }

    const repository = this.dataSource.getRepository<ObjectLiteral>(visible.metadata.target);
    const row = await repository.findOne({
      where: {
        ...this.scopeWhere(auth, visible.metadata, visible.scope),
        [primary.propertyName]: id
      }
    });
    if (!row) {
      throw new NotFoundException('Row not found');
    }

    const updates: ObjectLiteral = {};
    for (const [key, rawValue] of Object.entries(values ?? {})) {
      const column = visible.metadata.columns.find((item) => item.propertyName === key);
      if (!column) {
        continue;
      }

      if (!this.isColumnEditable(visible.metadata, column)) {
        throw new BadRequestException(`Column ${key} cannot be edited`);
      }

      updates[key] = this.coerceValue(column, rawValue);
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('No editable values were provided');
    }

    const saved = await repository.save({ ...row, ...updates });
    return {
      table: this.toVisibleTable(visible.metadata, visible.scope),
      row: this.maskRow(saved)
    };
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

  private toVisibleTable(metadata: EntityMetadata, scope: TableScope): VisibleTable {
    return {
      name: metadata.tableName,
      entity: metadata.name,
      scope,
      editable: this.isTableEditable(metadata),
      columns: metadata.columns.map((column) => ({
        name: column.propertyName,
        type: String(column.type),
        nullable: column.isNullable,
        primary: column.isPrimary,
        editable: this.isColumnEditable(metadata, column)
      }))
    };
  }

  private maskRow(row: ObjectLiteral) {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, SENSITIVE_COLUMNS.has(key) ? '••••••••' : value])
    );
  }

  private isTableEditable(metadata: EntityMetadata) {
    return !READONLY_TABLES.has(metadata.tableName);
  }

  private isColumnEditable(metadata: EntityMetadata, column: ColumnMetadata) {
    return (
      this.isTableEditable(metadata) &&
      !column.isPrimary &&
      !READONLY_COLUMNS.has(column.propertyName) &&
      !SENSITIVE_COLUMNS.has(column.propertyName)
    );
  }

  private coerceValue(column: ColumnMetadata, value: unknown) {
    if (value === null || value === '') {
      if (column.isNullable) {
        return null;
      }

      if (value === null) {
        throw new BadRequestException(`Column ${column.propertyName} cannot be null`);
      }
    }

    const type = String(column.type).toLowerCase();
    if (type.includes('json')) {
      try {
        return typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        throw new BadRequestException(`Column ${column.propertyName} must contain valid JSON`);
      }
    }

    if (type === 'boolean' || type === 'bool') {
      return value === true || value === 'true' || value === 1 || value === '1';
    }

    if (['int', 'integer', 'bigint', 'smallint', 'tinyint', 'float', 'double', 'decimal', 'number'].includes(type)) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        throw new BadRequestException(`Column ${column.propertyName} must be numeric`);
      }
      return parsed;
    }

    if (type.includes('date') || type.includes('time')) {
      const parsed = new Date(String(value));
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException(`Column ${column.propertyName} must be a valid date`);
      }
      return parsed;
    }

    return value;
  }
}

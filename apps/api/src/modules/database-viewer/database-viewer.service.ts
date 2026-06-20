import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityMetadata, ObjectLiteral } from 'typeorm';
import { AuthContext } from '../auth/auth.types';

type TableScope = 'tenant' | 'current_tenant' | 'global';

export interface VisibleTable {
  name: string;
  entity: string;
  scope: TableScope;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    primary: boolean;
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

const GLOBAL_TABLES = new Set(['confisys', 'permissions']);
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
      columns: metadata.columns.map((column) => ({
        name: column.propertyName,
        type: String(column.type),
        nullable: column.isNullable,
        primary: column.isPrimary
      }))
    };
  }

  private maskRow(row: ObjectLiteral) {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, SENSITIVE_COLUMNS.has(key) ? '••••••••' : value])
    );
  }
}

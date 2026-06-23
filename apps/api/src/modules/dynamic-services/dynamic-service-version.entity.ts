import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type DynamicServiceVersionStatus = 'draft' | 'published' | 'archived';
export type DynamicServiceHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type DynamicServiceIntent = 'query' | 'get_one' | 'create' | 'update' | 'delete' | 'validate' | 'sync' | 'notify' | 'custom';
export type DynamicServiceSource = 'external_api' | 'internal_table' | 'dynamic_record' | 'future_connector';
export type DynamicServiceResultKind = 'none' | 'single' | 'list' | 'paginated_list' | 'boolean' | 'file';
export type DynamicServiceEffectType = 'none' | 'show_response' | 'update_record' | 'update_custom_table' | 'emit_event';
export type DynamicServiceQueryMode = 'single_table' | 'multi_table' | 'advanced_read_model';
export type DynamicServiceFilterOperator = 'equals' | 'contains' | 'starts_with' | 'greater_than' | 'greater_or_equal' | 'less_than' | 'less_or_equal';
export type DynamicServiceFilterValueSource = 'input' | 'literal' | 'tenant' | 'current_user';
export type DynamicServiceFilterMatchMode = 'all' | 'any';

export interface DynamicServiceFilter {
  field: string;
  operator: DynamicServiceFilterOperator;
  valueSource: DynamicServiceFilterValueSource;
  inputKey?: string;
  value?: string;
  required?: boolean;
}

export interface DynamicServiceDefinition {
  intent?: DynamicServiceIntent;
  source?: DynamicServiceSource;
  resultKind?: DynamicServiceResultKind;
  pagination?: {
    enabled: boolean;
    mode?: 'page' | 'offset' | 'cursor';
    pageParam?: string;
    pageSizeParam?: string;
    itemsPath?: string;
    totalPath?: string;
  };
  effects?: Array<{
    type: DynamicServiceEffectType;
    target?: string;
    map?: Record<string, string>;
  }>;
  dataTarget?: {
    queryMode: DynamicServiceQueryMode;
    primaryTable?: string;
    involvedTables?: string[];
    recordKey?: string;
    relationNotes?: string;
    filterNotes?: string;
    matchMode?: DynamicServiceFilterMatchMode;
    filters?: DynamicServiceFilter[];
  };
  method: DynamicServiceHttpMethod;
  url: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retry?: {
    attempts?: number;
    backoffMs?: number;
  };
  responseMap?: Record<string, string>;
}

@Entity('dynamic_service_versions')
@Index(['serviceId', 'version'], { unique: true })
export class DynamicServiceVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  serviceId!: string;

  @Column({ type: 'int' })
  version!: number;

  @Column({ type: 'varchar', length: 24, default: 'draft' })
  status!: DynamicServiceVersionStatus;

  @Column({ type: 'json' })
  definition!: DynamicServiceDefinition;

  @Column({ type: 'varchar', length: 180, nullable: true })
  createdByUserId?: string | null;

  @Column({ type: 'datetime', nullable: true })
  publishedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

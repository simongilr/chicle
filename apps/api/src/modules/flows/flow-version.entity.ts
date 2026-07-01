import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { FlowRuntimeConfig } from './flow.entity';

export type FlowVersionStatus = 'draft' | 'published' | 'archived';
export type FlowStepType =
  | 'start'
  | 'dynamic_service'
  | 'parallel'
  | 'foreach'
  | 'subflow'
  | 'delay'
  | 'emit_event'
  | 'formula'
  | 'validation'
  | 'decision'
  | 'action'
  | 'response'
  | 'end';
export type FlowExpressionLanguage = 'chicle_expr' | 'json_logic';

export interface FlowDefinitionStep {
  key: string;
  name?: string;
  type: FlowStepType;
  serviceKey?: string;
  actionKey?: string;
  expression?: string;
  condition?: string;
  language?: FlowExpressionLanguage;
  inputMap?: Record<string, unknown>;
  outputKey?: string;
  config?: Record<string, unknown>;
  runtimeConfig?: FlowRuntimeConfig;
  next?: string;
  onSuccess?: string;
  onError?: string;
  onTimeout?: string;
  onTrue?: string;
  onFalse?: string;
  ui?: Record<string, unknown>;
}

export interface FlowDefinition {
  key: string;
  name: string;
  version: number;
  description?: string | null;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  runtimeConfig?: FlowRuntimeConfig;
  steps: FlowDefinitionStep[];
}

@Entity('flow_versions')
@Index(['flowId', 'version'], { unique: true })
@Index(['tenantId', 'flowId'])
@Index(['tenantId', 'status'])
export class FlowVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  flowId!: string;

  @Column({ type: 'int' })
  version!: number;

  @Column({ type: 'varchar', length: 24, default: 'draft' })
  status!: FlowVersionStatus;

  @Column({ type: 'json' })
  definition!: FlowDefinition;

  @Column({ type: 'json', nullable: true })
  inputSchema?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  outputSchema?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  runtimeConfig?: FlowRuntimeConfig | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  createdByUserId?: string | null;

  @Column({ type: 'datetime', nullable: true })
  publishedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

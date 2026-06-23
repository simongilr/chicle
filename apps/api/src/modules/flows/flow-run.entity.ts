import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type FlowRunTriggerType = 'manual' | 'http' | 'form' | 'event' | 'schedule' | 'test';
export type FlowRunStatus = 'queued' | 'running' | 'success' | 'failed' | 'timeout' | 'cancelled';

@Entity('flow_runs')
@Index(['tenantId', 'createdAt'])
@Index(['tenantId', 'flowId', 'createdAt'])
@Index(['tenantId', 'status'])
export class FlowRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  flowId!: string;

  @Column('uuid')
  versionId!: string;

  @Column({ type: 'varchar', length: 24, default: 'manual' })
  triggerType!: FlowRunTriggerType;

  @Column({ type: 'varchar', length: 180, nullable: true })
  triggerKey?: string | null;

  @Column({ type: 'varchar', length: 24, default: 'queued' })
  status!: FlowRunStatus;

  @Column({ type: 'json' })
  input!: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  output?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  error?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  contextSnapshot?: Record<string, unknown> | null;

  @Column({ type: 'int', nullable: true })
  durationMs?: number | null;

  @Column({ type: 'datetime', nullable: true })
  startedAt?: Date | null;

  @Column({ type: 'datetime', nullable: true })
  finishedAt?: Date | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  createdByUserId?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

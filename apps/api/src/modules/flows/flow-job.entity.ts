import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { FlowRunTriggerType } from './flow-run.entity';

export type FlowJobStatus = 'queued' | 'running' | 'waiting' | 'success' | 'failed' | 'cancelled';

@Entity('flow_jobs')
@Index(['tenantId', 'status', 'availableAt'])
@Index(['tenantId', 'flowId', 'createdAt'])
@Index(['tenantId', 'idempotencyKey'], { unique: true })
export class FlowJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  flowId!: string;

  @Column('uuid', { nullable: true })
  triggerId?: string | null;

  @Column({ type: 'varchar', length: 24 })
  triggerType!: FlowRunTriggerType;

  @Column({ type: 'varchar', length: 180, nullable: true })
  triggerKey?: string | null;

  @Column({ type: 'varchar', length: 180 })
  idempotencyKey!: string;

  @Column({ type: 'json' })
  input!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 24, default: 'queued' })
  status!: FlowJobStatus;

  @Column({ type: 'int', default: 0 })
  priority!: number;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ type: 'int', default: 3 })
  maxAttempts!: number;

  @Column({ type: 'datetime' })
  availableAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  lockedAt?: Date | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  lockToken?: string | null;

  @Column('uuid', { nullable: true })
  runId?: string | null;

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  createdByUserId?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

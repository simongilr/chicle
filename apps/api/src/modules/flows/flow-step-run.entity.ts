import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { FlowStepType } from './flow-version.entity';

export type FlowStepRunStatus = 'pending' | 'running' | 'success' | 'failed' | 'timeout' | 'skipped';

@Entity('flow_step_runs')
@Index(['tenantId', 'runId'])
@Index(['tenantId', 'flowId', 'createdAt'])
@Index(['runId', 'stepKey'])
export class FlowStepRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  runId!: string;

  @Column('uuid')
  flowId!: string;

  @Column('uuid')
  versionId!: string;

  @Column({ type: 'varchar', length: 120 })
  stepKey!: string;

  @Column({ type: 'varchar', length: 180 })
  stepName!: string;

  @Column({ type: 'varchar', length: 40 })
  stepType!: FlowStepType;

  @Column({ type: 'varchar', length: 24, default: 'pending' })
  status!: FlowStepRunStatus;

  @Column({ type: 'json', nullable: true })
  input?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  output?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  error?: Record<string, unknown> | null;

  @Column({ type: 'int', nullable: true })
  durationMs?: number | null;

  @Column({ type: 'datetime', nullable: true })
  startedAt?: Date | null;

  @Column({ type: 'datetime', nullable: true })
  finishedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}

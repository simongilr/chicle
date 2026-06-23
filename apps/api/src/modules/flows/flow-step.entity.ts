import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { FlowRuntimeConfig } from './flow.entity';
import { FlowStepType } from './flow-version.entity';

@Entity('flow_steps')
@Index(['tenantId', 'flowId'])
@Index(['tenantId', 'versionId'])
@Index(['flowId', 'key'])
export class FlowStep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  flowId!: string;

  @Column('uuid', { nullable: true })
  versionId?: string | null;

  @Column({ type: 'varchar', length: 120 })
  key!: string;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'varchar', length: 40 })
  type!: FlowStepType;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @Column({ type: 'json', nullable: true })
  config?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  inputMap?: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  outputKey?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  nextStepKey?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  onSuccessStepKey?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  onErrorStepKey?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  onTimeoutStepKey?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  onTrueStepKey?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  onFalseStepKey?: string | null;

  @Column({ type: 'json', nullable: true })
  runtimeConfig?: FlowRuntimeConfig | null;

  @Column({ type: 'json', nullable: true })
  ui?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

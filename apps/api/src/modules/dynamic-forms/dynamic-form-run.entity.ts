import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type DynamicFormRunStatus = 'success' | 'failed' | 'queued';

@Entity('dynamic_form_runs')
@Index(['tenantId', 'formId', 'createdAt'])
@Index(['tenantId', 'formVersionId', 'createdAt'])
@Index(['tenantId', 'idempotencyKey'], { unique: true })
export class DynamicFormRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  formId!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  formVersionId?: string | null;

  @Column({ type: 'int' })
  version!: number;

  @Column({ type: 'varchar', length: 24, default: 'success' })
  status!: DynamicFormRunStatus;

  @Column({ type: 'varchar', length: 180 })
  idempotencyKey!: string;

  @Column({ type: 'json' })
  input!: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  output?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  error?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  bindingsSnapshot?: Record<string, unknown> | null;

  @Column({ type: 'int', nullable: true })
  durationMs?: number | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  actorUserId?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

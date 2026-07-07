import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type DynamicFormVersionStatus = 'draft' | 'published' | 'archived';

@Entity('dynamic_form_versions')
@Index(['formId', 'version'], { unique: true })
@Index(['tenantId', 'formId'])
@Index(['tenantId', 'status'])
export class DynamicFormVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  formId!: string;

  @Column({ type: 'int' })
  version!: number;

  @Column({ type: 'varchar', length: 24, default: 'draft' })
  status!: DynamicFormVersionStatus;

  @Column({ type: 'json' })
  schema!: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  bindingsSnapshot?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  inputSchema?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  outputSchema?: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  createdByUserId?: string | null;

  @Column({ type: 'datetime', nullable: true })
  publishedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type DynamicFormStatus = 'draft' | 'published' | 'archived';

@Entity('dynamic_forms')
@Index(['tenantId', 'key'], { unique: true })
@Index(['tenantId', 'status'])
@Index(['tenantId', 'trashedAt'])
export class DynamicForm {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column({ length: 120 })
  key!: string;

  @Column({ length: 180 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  category?: string | null;

  @Column({ default: 1 })
  version!: number;

  @Column({ type: 'json' })
  schema!: Record<string, unknown>;

  @Column({ default: false })
  published!: boolean;

  @Column({ type: 'varchar', length: 24, default: 'draft' })
  status!: DynamicFormStatus;

  @Column({ type: 'varchar', length: 36, nullable: true })
  publishedVersionId?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  tags?: string[] | null;

  @Column({ type: 'datetime', nullable: true })
  trashedAt?: Date | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  trashedByUserId?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

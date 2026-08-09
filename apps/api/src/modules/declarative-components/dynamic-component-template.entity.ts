import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type DynamicComponentTemplateStatus = 'draft' | 'published' | 'archived' | 'trashed';

@Entity('dynamic_component_templates')
@Index(['tenantId', 'key'], { unique: true })
@Index(['tenantId', 'status'])
@Index(['tenantId', 'trashedAt'])
export class DynamicComponentTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column({ type: 'varchar', length: 120 })
  key!: string;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  category?: string | null;

  @Column({ type: 'varchar', length: 140 })
  componentKey!: string;

  @Column({ type: 'json' })
  contract!: Record<string, unknown>;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'tinyint', default: 0 })
  published!: boolean;

  @Column({ type: 'varchar', length: 24, default: 'draft' })
  status!: DynamicComponentTemplateStatus;

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

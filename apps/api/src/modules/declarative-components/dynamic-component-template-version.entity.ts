import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('dynamic_component_template_versions')
@Index(['tenantId', 'templateId', 'version'], { unique: true })
@Index(['tenantId', 'templateId', 'status'])
export class DynamicComponentTemplateVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  templateId!: string;

  @Column({ type: 'int' })
  version!: number;

  @Column({ type: 'varchar', length: 24, default: 'draft' })
  status!: 'draft' | 'published' | 'archived';

  @Column({ type: 'json' })
  contract!: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  dependencySnapshot?: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  createdByUserId?: string | null;

  @Column({ type: 'datetime', nullable: true })
  publishedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

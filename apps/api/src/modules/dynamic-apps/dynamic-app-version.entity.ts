import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type DynamicAppVersionStatus = 'draft' | 'published' | 'archived';

@Entity('dynamic_app_versions')
@Index(['appId', 'version'], { unique: true })
@Index(['tenantId', 'appId'])
@Index(['tenantId', 'status'])
export class DynamicAppVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  appId!: string;

  @Column({ type: 'int' })
  version!: number;

  @Column({ type: 'varchar', length: 24, default: 'draft' })
  status!: DynamicAppVersionStatus;

  @Column({ type: 'json' })
  manifest!: Record<string, unknown>;

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

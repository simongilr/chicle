import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type DynamicScreenVersionStatus = 'draft' | 'published' | 'archived';

@Entity('dynamic_screen_versions')
@Index(['screenId', 'version'], { unique: true })
@Index(['tenantId', 'screenId'])
@Index(['tenantId', 'appId'])
@Index(['tenantId', 'status'])
export class DynamicScreenVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  appId!: string;

  @Column('uuid')
  screenId!: string;

  @Column({ type: 'int' })
  version!: number;

  @Column({ type: 'varchar', length: 24, default: 'draft' })
  status!: DynamicScreenVersionStatus;

  @Column({ type: 'json' })
  definition!: Record<string, unknown>;

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

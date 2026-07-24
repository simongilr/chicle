import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type EnvironmentKind = 'local' | 'non_prod' | 'production' | 'custom';

@Entity('environment_profiles')
@Index(['tenantId', 'key'], { unique: true })
export class EnvironmentProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column({ length: 80 })
  key!: string;

  @Column({ length: 160 })
  name!: string;

  @Column({ length: 40, default: 'custom' })
  kind!: EnvironmentKind;

  @Column({ default: true })
  active!: boolean;

  @Column({ default: false })
  isDefault!: boolean;

  @Column({ default: false })
  requiresReauth!: boolean;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

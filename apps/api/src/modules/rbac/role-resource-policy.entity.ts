import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type RoleResourceType = 'dynamic_service' | 'flow';
export type RoleResourceMode = 'all' | 'selected' | 'none';

@Entity('role_resource_policies')
@Index(['tenantId', 'roleId', 'resourceType'], { unique: true })
export class RoleResourcePolicy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  roleId!: string;

  @Column({ type: 'varchar', length: 40 })
  resourceType!: RoleResourceType;

  @Column({ type: 'varchar', length: 20, default: 'all' })
  mode!: RoleResourceMode;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

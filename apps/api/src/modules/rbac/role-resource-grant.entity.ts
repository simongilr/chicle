import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { RoleResourceType } from './role-resource-policy.entity';

@Entity('role_resource_grants')
@Index(['tenantId', 'roleId', 'resourceType', 'resourceId'], { unique: true })
export class RoleResourceGrant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  roleId!: string;

  @Column({ type: 'varchar', length: 40 })
  resourceType!: RoleResourceType;

  @Column('uuid')
  resourceId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

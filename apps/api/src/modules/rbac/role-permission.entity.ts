import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('role_permissions')
@Index(['roleId', 'permissionId'], { unique: true })
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  roleId!: string;

  @Column('uuid')
  permissionId!: string;
}

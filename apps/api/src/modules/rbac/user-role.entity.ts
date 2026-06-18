import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_roles')
@Index(['tenantId', 'userId', 'roleId'], { unique: true })
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  userId!: string;

  @Column('uuid')
  roleId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

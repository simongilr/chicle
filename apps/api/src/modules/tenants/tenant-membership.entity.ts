import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserSystemRole } from '../users/user.entity';

@Entity('tenant_memberships')
@Index(['tenantId', 'userId'], { unique: true })
@Index(['userId', 'active'])
export class TenantMembership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  userId!: string;

  @Column({ type: 'varchar', length: 40, default: 'member' })
  systemRole!: UserSystemRole;

  @Column({ default: true })
  active!: boolean;

  @Column({ default: false })
  primaryMembership!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

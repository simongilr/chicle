import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('auth_sessions')
export class AuthSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  userId!: string;

  @Index({ unique: true })
  @Column({ length: 80 })
  tokenId!: string;

  @Column({ default: true })
  active!: boolean;

  @Column({ type: 'datetime' })
  expiresAt!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refreshTokenHash?: string | null;

  @Column({ type: 'datetime', nullable: true })
  refreshExpiresAt?: Date | null;

  @Column({ type: 'datetime', nullable: true })
  refreshedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

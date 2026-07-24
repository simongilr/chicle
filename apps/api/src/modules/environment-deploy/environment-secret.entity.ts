import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type EnvironmentSecretScopeType =
  | 'api'
  | 'app'
  | 'worker'
  | 'integration'
  | 'dynamic_service'
  | 'flow'
  | 'microservice';
export type EnvironmentSecretStatus = 'active' | 'pending' | 'rotating' | 'disabled';

@Entity('environment_secrets')
@Index(['tenantId', 'environmentId', 'scopeType', 'scopeKey', 'key'], { unique: true })
export class EnvironmentSecret {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  environmentId!: string;

  @Column({ length: 40 })
  scopeType!: EnvironmentSecretScopeType;

  @Column({ length: 120, default: 'default' })
  scopeKey!: string;

  @Column({ length: 160 })
  key!: string;

  @Column({ type: 'text' })
  encryptedValue!: string;

  @Column({ length: 40, default: 'aes-256-gcm' })
  algorithm!: string;

  @Column({ length: 80 })
  iv!: string;

  @Column({ length: 80 })
  authTag!: string;

  @Column({ length: 80, default: 'local-v1' })
  keyVersion!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  maskedPreview?: string | null;

  @Column({ length: 30, default: 'active' })
  status!: EnvironmentSecretStatus;

  @Column({ type: 'datetime', nullable: true })
  lastRotatedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

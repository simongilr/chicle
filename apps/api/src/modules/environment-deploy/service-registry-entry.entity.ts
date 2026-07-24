import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type ServiceRegistryType = 'internal_module' | 'microservice' | 'external_api' | 'worker' | 'provider';
export type ServiceRegistryAuthMode = 'none' | 'service_token' | 'jwt' | 'mtls' | 'basic' | 'api_key';

@Entity('service_registry')
@Index(['tenantId', 'environmentId', 'key'], { unique: true })
export class ServiceRegistryEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  environmentId!: string;

  @Column({ length: 120 })
  key!: string;

  @Column({ length: 180 })
  name!: string;

  @Column({ length: 40, default: 'microservice' })
  type!: ServiceRegistryType;

  @Column({ type: 'text' })
  baseUrl!: string;

  @Column({ length: 160, default: '/health' })
  healthPath!: string;

  @Column({ length: 40, default: 'none' })
  authMode!: ServiceRegistryAuthMode;

  @Column({ type: 'varchar', length: 260, nullable: true })
  secretRef?: string | null;

  @Column({ default: 8000 })
  timeoutMs!: number;

  @Column({ type: 'json', nullable: true })
  retryPolicy?: Record<string, unknown> | null;

  @Column({ default: false })
  tlsRequired!: boolean;

  @Column({ type: 'json', nullable: true })
  allowedOperations?: string[] | null;

  @Column({ default: true })
  active!: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

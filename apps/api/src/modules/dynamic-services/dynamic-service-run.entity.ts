import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type DynamicServiceRunStatus = 'pending' | 'running' | 'success' | 'failed' | 'timeout' | 'blocked';
export type DynamicServiceRunTrigger = 'manual_test' | 'frontend' | 'public_api' | 'event' | 'workflow' | 'action';

@Entity('dynamic_service_runs')
@Index(['tenantId', 'createdAt'])
@Index(['serviceId', 'createdAt'])
export class DynamicServiceRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  serviceId!: string;

  @Column('uuid')
  versionId!: string;

  @Column({ type: 'varchar', length: 24, default: 'manual_test' })
  triggerType!: DynamicServiceRunTrigger;

  @Column({ type: 'varchar', length: 120, nullable: true })
  triggerEventId?: string | null;

  @Column({ type: 'varchar', length: 24, default: 'pending' })
  status!: DynamicServiceRunStatus;

  @Column({ type: 'json', nullable: true })
  requestSnapshot?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  responseSnapshot?: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @Column({ type: 'int', default: 0 })
  durationMs!: number;

  @Column({ type: 'int', nullable: true })
  timeoutMs?: number | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  actorUserId?: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}

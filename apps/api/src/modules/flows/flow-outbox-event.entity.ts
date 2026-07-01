import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type FlowOutboxStatus = 'pending' | 'processing' | 'published' | 'failed';

@Entity('flow_outbox_events')
@Index(['tenantId', 'status', 'availableAt'])
@Index(['tenantId', 'eventKey', 'createdAt'])
@Index(['tenantId', 'idempotencyKey'], { unique: true })
export class FlowOutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column({ type: 'varchar', length: 180 })
  eventKey!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  aggregateType?: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  aggregateId?: string | null;

  @Column({ type: 'varchar', length: 180 })
  idempotencyKey!: string;

  @Column({ type: 'json' })
  payload!: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  headers?: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 24, default: 'pending' })
  status!: FlowOutboxStatus;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ type: 'datetime' })
  availableAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  processedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  createdByUserId?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

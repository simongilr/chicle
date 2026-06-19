import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_events')
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  tenantId!: string;

  @Column('uuid', { nullable: true })
  actorUserId?: string | null;

  @Index()
  @Column({ length: 120 })
  action!: string;

  @Column({ length: 80 })
  resourceType!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  resourceId?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;
}

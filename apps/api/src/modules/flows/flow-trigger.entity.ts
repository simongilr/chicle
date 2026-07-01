import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type FlowTriggerType = 'http' | 'form_submit' | 'record_event' | 'schedule' | 'manual';

@Entity('flow_triggers')
@Index(['tenantId', 'flowId'])
@Index(['tenantId', 'type', 'key'])
@Index(['tenantId', 'active'])
export class FlowTrigger {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  flowId!: string;

  @Column('uuid', { nullable: true })
  versionId?: string | null;

  @Column({ type: 'varchar', length: 40 })
  type!: FlowTriggerType;

  @Column({ type: 'varchar', length: 180 })
  key!: string;

  @Column({ type: 'json', nullable: true })
  config?: Record<string, unknown> | null;

  @Column({ default: true })
  active!: boolean;

  @Column({ type: 'datetime', nullable: true })
  nextFireAt?: Date | null;

  @Column({ type: 'datetime', nullable: true })
  lastFiredAt?: Date | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  createdByUserId?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

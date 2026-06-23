import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type FlowDecisionHitPolicy = 'first' | 'collect' | 'any';

@Entity('flow_decision_tables')
@Index(['tenantId', 'key'], { unique: true })
@Index(['tenantId', 'active'])
export class FlowDecisionTable {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column({ type: 'varchar', length: 120 })
  key!: string;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 24, default: 'first' })
  hitPolicy!: FlowDecisionHitPolicy;

  @Column({ type: 'json' })
  inputs!: Record<string, unknown>[];

  @Column({ type: 'json' })
  outputs!: Record<string, unknown>[];

  @Column({ type: 'json' })
  rules!: Record<string, unknown>[];

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

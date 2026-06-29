import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type FlowTestExpectedStatus = 'success' | 'failed';
export type FlowTestTarget = 'draft' | 'published';
export type FlowTestAssertionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'exists'
  | 'truthy'
  | 'greater_than'
  | 'less_than';

export interface FlowTestAssertion {
  path: string;
  operator: FlowTestAssertionOperator;
  expected?: unknown;
}

@Entity('flow_test_cases')
@Index(['tenantId', 'flowId'])
@Index(['tenantId', 'active'])
export class FlowTestCase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  flowId!: string;

  @Column('uuid', { nullable: true })
  versionId?: string | null;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'json' })
  input!: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  expectedOutput?: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 24, default: 'success' })
  expectedStatus!: FlowTestExpectedStatus;

  @Column({ type: 'varchar', length: 24, default: 'draft' })
  target!: FlowTestTarget;

  @Column({ type: 'varchar', length: 120, nullable: true })
  throughStepKey?: string | null;

  @Column({ type: 'json', nullable: true })
  assertions?: FlowTestAssertion[] | null;

  @Column({ type: 'json', nullable: true })
  lastResult?: Record<string, unknown> | null;

  @Column({ type: 'datetime', nullable: true })
  lastRunAt?: Date | null;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

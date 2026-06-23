import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type FlowTestExpectedStatus = 'success' | 'failed';

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

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { FlowExpressionLanguage } from './flow-version.entity';

export type FlowExpressionType = 'formula' | 'condition' | 'mapping' | 'visibility' | 'default_value' | 'validation';

@Entity('flow_expressions')
@Index(['tenantId', 'key'], { unique: true })
@Index(['tenantId', 'active'])
export class FlowExpression {
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

  @Column({ type: 'varchar', length: 40 })
  type!: FlowExpressionType;

  @Column({ type: 'text' })
  expression!: string;

  @Column({ type: 'varchar', length: 40, default: 'chicle_expr' })
  language!: FlowExpressionLanguage;

  @Column({ type: 'json', nullable: true })
  testCases?: Record<string, unknown>[] | null;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

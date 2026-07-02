import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type FlowTemplateScope = 'system' | 'tenant';

@Entity('flow_templates')
@Index(['tenantId', 'key'])
@Index(['ownerKey', 'key'], { unique: true })
@Index(['scope', 'active'])
export class FlowTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: true })
  tenantId?: string | null;

  @Column({ type: 'varchar', length: 36 })
  ownerKey!: string;

  @Column({ type: 'varchar', length: 120 })
  key!: string;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  category?: string | null;

  @Column({ type: 'varchar', length: 24, default: 'tenant' })
  scope!: FlowTemplateScope;

  @Column({ type: 'json' })
  definition!: Record<string, unknown>;

  @Column({ default: true })
  active!: boolean;

  @Column('uuid', { nullable: true })
  sourceFlowId?: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  createdByUserId?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

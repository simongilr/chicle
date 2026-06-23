import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('flow_action_catalog')
@Index(['tenantId', 'key'], { unique: true })
@Index(['tenantId', 'active'])
export class FlowActionCatalog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column({ type: 'varchar', length: 120 })
  key!: string;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'varchar', length: 80 })
  category!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'json', nullable: true })
  inputSchema?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  outputSchema?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  configSchema?: Record<string, unknown> | null;

  @Column({ default: false })
  builtIn!: boolean;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

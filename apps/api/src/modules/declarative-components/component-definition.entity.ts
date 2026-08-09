import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type ComponentDefinitionStatus = 'active' | 'deprecated' | 'disabled';

@Entity('component_definitions')
@Index(['componentKey'], { unique: true })
@Index(['category'])
@Index(['status'])
export class ComponentDefinition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 140 })
  componentKey!: string;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'varchar', length: 80 })
  category!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'int', default: 1 })
  schemaVersion!: number;

  @Column({ type: 'varchar', length: 24, default: 'active' })
  status!: ComponentDefinitionStatus;

  @Column({ type: 'json', nullable: true })
  propsSchema?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  eventsSchema?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  defaultProps?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  allowedChildren?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  documentation?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type ComponentAdapterKit = 'primeng' | 'ionic' | 'material' | 'bootstrap' | 'native';
export type ComponentAdapterStatus = 'available' | 'fallback' | 'planned' | 'disabled';

@Entity('component_adapters')
@Index(['componentKey', 'kit'], { unique: true })
@Index(['kit', 'adapterStatus'])
export class ComponentAdapter {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 140 })
  componentKey!: string;

  @Column({ type: 'varchar', length: 32 })
  kit!: ComponentAdapterKit;

  @Column({ type: 'varchar', length: 24, default: 'planned' })
  adapterStatus!: ComponentAdapterStatus;

  @Column({ type: 'varchar', length: 180, nullable: true })
  technicalSelector?: string | null;

  @Column({ type: 'varchar', length: 240, nullable: true })
  importPath?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  previewKey?: string | null;

  @Column({ type: 'json', nullable: true })
  adapterMetadata?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

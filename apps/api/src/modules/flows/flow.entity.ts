import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type FlowStatus = 'draft' | 'active' | 'paused' | 'trashed';

export interface FlowRuntimeConfig {
  maxDurationMs?: number;
  maxSteps?: number;
  defaultStepTimeoutMs?: number;
  retry?: {
    attempts?: number;
    backoffMs?: number;
  };
  logs?: {
    captureInput?: boolean;
    captureOutput?: boolean;
    maskSecrets?: boolean;
  };
}

@Entity('flows')
@Index(['tenantId', 'key'], { unique: true })
@Index(['tenantId', 'status'])
@Index(['tenantId', 'trashedAt'])
export class Flow {
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

  @Column({ type: 'varchar', length: 80, nullable: true })
  category?: string | null;

  @Column({ type: 'varchar', length: 24, default: 'draft' })
  status!: FlowStatus;

  @Column('uuid', { nullable: true })
  publishedVersionId?: string | null;

  @Column({ type: 'json', nullable: true })
  runtimeConfig?: FlowRuntimeConfig | null;

  @Column({ type: 'json', nullable: true })
  tags?: string[] | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @Column({ type: 'datetime', nullable: true })
  trashedAt?: Date | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  trashedByUserId?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

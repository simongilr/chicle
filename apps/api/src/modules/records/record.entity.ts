import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('records')
@Index(['tenantId', 'idempotencyKey'], { unique: true })
export class RecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column({ length: 120 })
  recordType!: string;

  @Column({ length: 120, nullable: true })
  formKey?: string | null;

  @Column({ nullable: true })
  formVersion?: number | null;

  @Column({ length: 180 })
  idempotencyKey!: string;

  @Column({ type: 'json' })
  data!: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;
}

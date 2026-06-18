import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type ConfisysValueType = 'string' | 'number' | 'boolean' | 'json';

@Entity('confisys')
export class ConfisysParam {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ length: 160 })
  key!: string;

  @Column({ type: 'text' })
  value!: string;

  @Column({ length: 20, default: 'string' })
  valueType!: ConfisysValueType;

  @Column({ length: 80, default: 'system' })
  category!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_public', default: false })
  isPublic!: boolean;

  @Column({ default: true })
  editable!: boolean;

  @Column({ length: 40, default: 'seed' })
  source!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

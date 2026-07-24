import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { TranslationScope } from './translation-namespace.entity';

@Entity('translation_entries')
@Index(['scope', 'ownerKey', 'namespace', 'locale', 'key'], { unique: true })
@Index(['scope', 'ownerKey', 'namespace', 'locale'])
export class TranslationEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 40, default: 'platform' })
  scope!: TranslationScope;

  @Column({ length: 120, default: 'global' })
  ownerKey!: string;

  @Column({ length: 120 })
  namespace!: string;

  @Column({ length: 12 })
  locale!: string;

  @Column({ length: 220 })
  key!: string;

  @Column({ type: 'text' })
  value!: string;

  @Column({ type: 'text', nullable: true })
  fallbackValue?: string | null;

  @Column({ length: 40, default: 'seed' })
  source!: string;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

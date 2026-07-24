import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { TranslationScope } from './translation-namespace.entity';

@Entity('translation_missing_keys')
@Index(['scope', 'ownerKey', 'namespace', 'locale', 'key'])
export class TranslationMissingKey {
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

  @Column({ type: 'varchar', length: 220, nullable: true })
  route?: string | null;

  @Column({ type: 'json', nullable: true })
  context?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

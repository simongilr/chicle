import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type { TranslationScope } from './translation-namespace.entity';

@Entity('translation_bundle_versions')
@Index(['scope', 'ownerKey', 'namespace', 'locale', 'version'], { unique: true })
@Index(['scope', 'ownerKey', 'namespace', 'locale', 'active'])
export class TranslationBundleVersion {
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

  @Column({ length: 80 })
  version!: string;

  @Column({ length: 80 })
  hash!: string;

  @Column({ type: 'json' })
  entries!: Record<string, string>;

  @Column({ default: true })
  active!: boolean;

  @Column({ type: 'datetime', nullable: true })
  publishedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}

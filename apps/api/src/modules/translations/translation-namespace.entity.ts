import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type TranslationScope = 'platform' | 'tenant' | 'template' | 'app' | 'artifact';

@Entity('translation_namespaces')
@Index(['scope', 'ownerKey', 'key'], { unique: true })
export class TranslationNamespace {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 40, default: 'platform' })
  scope!: TranslationScope;

  @Column({ length: 120, default: 'global' })
  ownerKey!: string;

  @Column({ length: 120 })
  key!: string;

  @Column({ length: 180 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ default: true })
  active!: boolean;

  @Column({ default: true })
  isPublic!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

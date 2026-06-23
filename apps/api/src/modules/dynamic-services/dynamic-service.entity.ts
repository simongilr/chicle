import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type DynamicServiceType = 'http_request';

@Entity('dynamic_services')
@Index(['tenantId', 'key'], { unique: true })
export class DynamicService {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column({ type: 'varchar', length: 120 })
  key!: string;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'varchar', length: 40, default: 'http_request' })
  type!: DynamicServiceType;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ default: true })
  active!: boolean;

  @Column({ type: 'datetime', nullable: true })
  trashedAt?: Date | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  trashedByUserId?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ length: 120 })
  slug!: string;

  @Column({ length: 180 })
  name!: string;

  @Column({ default: true })
  active!: boolean;

  @Column({ type: 'json', nullable: true })
  settings?: Record<string, unknown> | null;
}

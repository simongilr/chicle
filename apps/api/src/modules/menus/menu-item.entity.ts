import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('menus')
@Index(['tenantId', 'key'], { unique: true })
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  tenantId!: string;

  @Column()
  key!: string;

  @Column()
  label!: string;

  @Column()
  route!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  icon?: string | null;

  @Column({ type: 'simple-json', nullable: true })
  permissions?: string[] | null;

  @Column({ default: true })
  active!: boolean;

  @Column({ default: 0 })
  sortOrder!: number;
}

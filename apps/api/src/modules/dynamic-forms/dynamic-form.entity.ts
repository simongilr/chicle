import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('dynamic_forms')
@Index(['tenantId', 'key'], { unique: true })
export class DynamicForm {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column({ length: 120 })
  key!: string;

  @Column({ length: 180 })
  title!: string;

  @Column({ default: 1 })
  version!: number;

  @Column({ type: 'json' })
  schema!: Record<string, unknown>;

  @Column({ default: false })
  published!: boolean;
}

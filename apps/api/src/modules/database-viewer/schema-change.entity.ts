import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type SchemaChangeOperation = 'create_table' | 'add_column' | 'alter_column' | 'drop_column' | 'drop_table';
export type SchemaChangeStatus = 'applied' | 'failed';

@Entity('schema_changes')
@Index(['tenantId', 'sequence'], { unique: true })
@Index(['tenantId', 'tableName'])
export class SchemaChange {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid', { nullable: true })
  actorUserId?: string | null;

  @Column()
  sequence!: number;

  @Column({ type: 'varchar', length: 40 })
  operation!: SchemaChangeOperation;

  @Column({ type: 'varchar', length: 80 })
  tableName!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  columnName?: string | null;

  @Column({ type: 'varchar', length: 20, default: 'applied' })
  status!: SchemaChangeStatus;

  @Column({ type: 'json' })
  request!: Record<string, unknown>;

  @Column({ type: 'text' })
  sql!: string;

  @Column({ type: 'varchar', length: 180 })
  migrationName!: string;

  @Column({ type: 'varchar', length: 400, nullable: true })
  migrationPath?: string | null;

  @Column({ type: 'longtext' })
  migrationSource!: string;

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}

import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type DynamicFormWriteTargetType = 'record' | 'dynamic_service' | 'flow' | 'internal_table';
export type DynamicFormWriteOperation = 'create' | 'update' | 'upsert' | 'delete';

@Entity('dynamic_form_write_policies')
@Index(['tenantId', 'formId'])
@Index(['tenantId', 'formVersionId'])
@Index(['tenantId', 'targetType', 'targetKey'])
export class DynamicFormWritePolicy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  formId!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  formVersionId?: string | null;

  @Column({ type: 'varchar', length: 40 })
  targetType!: DynamicFormWriteTargetType;

  @Column({ type: 'varchar', length: 180, nullable: true })
  targetKey?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  tableName?: string | null;

  @Column({ type: 'varchar', length: 40 })
  allowedOperation!: DynamicFormWriteOperation;

  @Column({ type: 'json', nullable: true })
  allowedColumns?: string[] | null;

  @Column({ type: 'json', nullable: true })
  requiredColumns?: string[] | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  tenantColumn?: string | null;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

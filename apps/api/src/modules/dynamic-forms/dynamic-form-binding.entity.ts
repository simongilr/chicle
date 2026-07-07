import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type DynamicFormBindingType =
  | 'options'
  | 'default_value'
  | 'validation'
  | 'calculation'
  | 'enrichment'
  | 'submit'
  | 'command';
export type DynamicFormBindingEvent =
  | 'onLoad'
  | 'onOpen'
  | 'onChange'
  | 'onBlur'
  | 'onClick'
  | 'onSubmit';
export type DynamicFormBindingTargetType = 'dynamic_service' | 'flow' | 'record' | 'static';

@Entity('dynamic_form_bindings')
@Index(['tenantId', 'formId'])
@Index(['tenantId', 'formVersionId'])
@Index(['tenantId', 'targetType', 'targetKey'])
export class DynamicFormBinding {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  formId!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  formVersionId?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  fieldKey?: string | null;

  @Column({ type: 'varchar', length: 40 })
  bindingType!: DynamicFormBindingType;

  @Column({ type: 'varchar', length: 40 })
  event!: DynamicFormBindingEvent;

  @Column({ type: 'varchar', length: 40 })
  targetType!: DynamicFormBindingTargetType;

  @Column({ type: 'varchar', length: 180, nullable: true })
  targetKey?: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  targetVersionId?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  operation?: string | null;

  @Column({ type: 'json', nullable: true })
  payloadMap?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  responseMap?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  cachePolicy?: Record<string, unknown> | null;

  @Column({ type: 'int', nullable: true })
  timeoutMs?: number | null;

  @Column({ default: false })
  required!: boolean;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

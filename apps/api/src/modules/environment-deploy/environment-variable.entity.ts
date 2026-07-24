import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type EnvironmentValueType = 'string' | 'number' | 'boolean' | 'json';
export type EnvironmentVariableTarget = 'api' | 'app' | 'worker' | 'docker' | 'runtime' | 'microservice';

@Entity('environment_variables')
@Index(['tenantId', 'environmentId', 'key'], { unique: true })
export class EnvironmentVariable {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  environmentId!: string;

  @Column({ length: 80, default: 'general' })
  groupKey!: string;

  @Column({ length: 160 })
  key!: string;

  @Column({ type: 'text' })
  value!: string;

  @Column({ length: 20, default: 'string' })
  valueType!: EnvironmentValueType;

  @Column({ length: 40, default: 'api' })
  target!: EnvironmentVariableTarget;

  @Column({ default: true })
  editable!: boolean;

  @Column({ default: false })
  requiresRestart!: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

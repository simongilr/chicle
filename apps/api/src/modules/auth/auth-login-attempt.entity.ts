import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('auth_login_attempts')
export class AuthLoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ length: 80 })
  key!: string;

  @Column({ default: 0 })
  count!: number;

  @Column({ type: 'datetime' })
  firstAttemptAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  blockedUntil?: Date | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}

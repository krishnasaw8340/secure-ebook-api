import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum CoinTransactionType {
  RECHARGE = 'RECHARGE',
  BONUS = 'BONUS',
  UNLOCK = 'UNLOCK',
  REFUND = 'REFUND',
}

@Entity({ schema: 'wallet', name: 'coin_transactions' })
export class CoinTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Index()
  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string | null;

  /** Signed amount: positive credits, negative debits. */
  @Column({ type: 'integer' })
  amount: number;

  @Column({ name: 'balance_after', type: 'integer' })
  balanceAfter: number;

  @Column({
    type: 'enum',
    enum: CoinTransactionType,
  })
  type: CoinTransactionType;

  /** Globally unique; makes duplicate crediting impossible at the DB level. */
  @Index({ unique: true })
  @Column({ name: 'idempotency_key', type: 'varchar', length: 191 })
  idempotencyKey: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

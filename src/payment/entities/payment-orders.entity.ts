import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { CoinPackage } from '../../wallet/entities/coin-package.entity';

export enum PaymentOrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

@Entity({ schema: 'payment', name: 'payment_orders' })
@Unique('UQ_payment_orders_provider_order', ['provider', 'providerOrderId'])
@Unique('UQ_payment_orders_provider_payment', ['provider', 'providerPaymentId'])
export class PaymentOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'package_id', type: 'uuid' })
  packageId: string;

  /** Snapshot at purchase time so later package edits never alter an order. */
  @Column({ name: 'coins_amount', type: 'integer' })
  coinsAmount: number;

  @Column({ name: 'price_amount', type: 'numeric', precision: 10, scale: 2 })
  priceAmount: string;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Index()
  @Column({
    type: 'enum',
    enum: PaymentOrderStatus,
    default: PaymentOrderStatus.PENDING,
  })
  status: PaymentOrderStatus;

  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @Column({
    name: 'provider_order_id',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  providerOrderId: string | null;

  @Column({
    name: 'provider_payment_id',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  providerPaymentId: string | null;

  @Column({ name: 'checkout_url', type: 'text', nullable: true })
  checkoutUrl: string | null;

  @Column({
    name: 'failure_reason',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  failureReason: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => CoinPackage, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'package_id' })
  package: CoinPackage;
}

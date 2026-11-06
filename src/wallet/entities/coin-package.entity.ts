import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'wallet', name: 'coin_packages' })
@Check('"CHK_coin_packages_coins_positive"', '"coins" > 0')
@Check('"CHK_coin_packages_price_positive"', '"price_amount" > 0')
export class CoinPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'integer' })
  coins: number;

  @Column({ name: 'price_amount', type: 'numeric', precision: 10, scale: 2 })
  priceAmount: string;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

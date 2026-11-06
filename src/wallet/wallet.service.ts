import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import {
  CoinTransaction,
  CoinTransactionType,
} from './entities/coin-transaction.entity';
import { CoinPackage } from './entities/coin-package.entity';

export interface CreditParams {
  userId: string;
  amount: number;
  type: CoinTransactionType;
  idempotencyKey: string;
  orderId?: string | null;
}

export interface CreditResult {
  credited: boolean;
  balance: number;
}

export interface DebitParams {
  userId: string;
  amount: number;
  type: CoinTransactionType;
  idempotencyKey: string;
}

export interface DebitResult {
  debited: boolean;
  balance: number;
}

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet) private readonly wallets: Repository<Wallet>,
    @InjectRepository(CoinTransaction)
    private readonly transactions: Repository<CoinTransaction>,
    @InjectRepository(CoinPackage)
    private readonly packages: Repository<CoinPackage>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async getBalance(userId: string): Promise<{ balance: number }> {
    const wallet = await this.wallets.findOne({ where: { userId } });
    return { balance: wallet?.balance ?? 0 };
  }

  listTransactions(userId: string, limit = 50): Promise<CoinTransaction[]> {
    return this.transactions.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 200),
    });
  }

  listActivePackages(): Promise<CoinPackage[]> {
    return this.packages.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', coins: 'ASC' },
    });
  }

  /**
   * One-time free coins for a user's first login. Idempotent: the ledger key
   * `welcome-bonus:<userId>` is unique, so repeat or parallel logins can never
   * grant it twice. Returns true only when coins were actually granted.
   */
  async grantWelcomeBonus(userId: string): Promise<boolean> {
    const amount = this.config.get<number>('payment.welcomeBonusCoins', 200);
    if (!Number.isInteger(amount) || amount <= 0) return false;

    const result = await this.dataSource.transaction((manager) =>
      this.creditWithManager(manager, {
        userId,
        amount,
        type: CoinTransactionType.BONUS,
        idempotencyKey: `welcome-bonus:${userId}`,
      }),
    );
    return result.credited;
  }

  /** Create the wallet if missing (race-safe) and lock its row. */
  private async lockWallet(
    manager: EntityManager,
    userId: string,
  ): Promise<Wallet> {
    await manager
      .createQueryBuilder()
      .insert()
      .into(Wallet)
      .values({ userId })
      .orIgnore()
      .execute();

    return manager.findOneOrFail(Wallet, {
      where: { userId },
      lock: { mode: 'pessimistic_write' },
    });
  }

  /**
   * Credit a wallet INSIDE a caller-owned transaction.
   *
   * 1. Lazily creates the wallet and locks the row (SELECT ... FOR UPDATE) so
   *    concurrent credits serialize.
   * 2. Short-circuits if the idempotency key was already applied.
   * 3. Writes the new balance and a ledger row; the UNIQUE idempotency key is
   *    the final backstop against a double credit.
   */
  async creditWithManager(
    manager: EntityManager,
    params: CreditParams,
  ): Promise<CreditResult> {
    if (!Number.isInteger(params.amount) || params.amount <= 0) {
      throw new Error('Credit amount must be a positive integer');
    }

    const wallet = await this.lockWallet(manager, params.userId);

    const existing = await manager.findOne(CoinTransaction, {
      where: { idempotencyKey: params.idempotencyKey },
    });
    if (existing) {
      return { credited: false, balance: wallet.balance };
    }

    wallet.balance += params.amount;
    await manager.save(Wallet, wallet);

    await manager.insert(CoinTransaction, {
      userId: params.userId,
      orderId: params.orderId ?? null,
      amount: params.amount,
      balanceAfter: wallet.balance,
      type: params.type,
      idempotencyKey: params.idempotencyKey,
    });

    return { credited: true, balance: wallet.balance };
  }

  /**
   * Debit a wallet INSIDE a caller-owned transaction. Same locking and
   * idempotency guarantees as credits; throws 402 when the balance is too
   * low, so coins can never go negative (the DB CHECK is a second backstop).
   */
  async debitWithManager(
    manager: EntityManager,
    params: DebitParams,
  ): Promise<DebitResult> {
    if (!Number.isInteger(params.amount) || params.amount <= 0) {
      throw new Error('Debit amount must be a positive integer');
    }

    const wallet = await this.lockWallet(manager, params.userId);

    const existing = await manager.findOne(CoinTransaction, {
      where: { idempotencyKey: params.idempotencyKey },
    });
    if (existing) {
      return { debited: false, balance: wallet.balance };
    }

    if (wallet.balance < params.amount) {
      throw new HttpException(
        {
          message: 'Insufficient coins. Please recharge your wallet.',
          code: 'INSUFFICIENT_COINS',
          required: params.amount,
          balance: wallet.balance,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    wallet.balance -= params.amount;
    await manager.save(Wallet, wallet);

    await manager.insert(CoinTransaction, {
      userId: params.userId,
      orderId: null,
      amount: -params.amount,
      balanceAfter: wallet.balance,
      type: params.type,
      idempotencyKey: params.idempotencyKey,
    });

    return { debited: true, balance: wallet.balance };
  }
}

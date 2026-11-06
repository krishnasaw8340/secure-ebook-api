import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Chapter } from '../entities/chapter.entity';
import { Book } from '../entities/book.entity';
import { ChapterUnlock } from '../entities/chapter-unlock.entity';
import { ChapterPricingModel } from '../../common/enums/chapter-pricing-model.enum';
import { RoleType } from '../../common/enums/role.enum';
import { CoinTransactionType } from '../../wallet/entities/coin-transaction.entity';
import { WalletService } from '../../wallet/wallet.service';
import type { JwtUser } from '../../auth/interfaces/jwt-user.interface';

export interface ChapterUnlockResult {
  chapterId: string;
  unlocked: true;
  coinsCharged: number;
  balance: number;
}

export function isAdminUser(user?: JwtUser): boolean {
  return (
    !!user?.roles?.includes(RoleType.ADMIN) ||
    !!user?.roles?.includes(RoleType.SUPER_ADMIN)
  );
}

/** FREE chapters cost 0; PAID use the chapter's cost, else the book default. */
export function resolveChapterCost(
  chapter: Pick<Chapter, 'pricingModel' | 'coinCost'>,
  book?: Pick<Book, 'defaultChapterCoinCost'> | null,
): number {
  if (chapter.pricingModel !== ChapterPricingModel.PAID) return 0;
  if (chapter.coinCost > 0) return chapter.coinCost;
  return Math.max(book?.defaultChapterCoinCost ?? 0, 0);
}

@Injectable()
export class ChapterUnlockService {
  constructor(
    @InjectRepository(ChapterUnlock)
    private readonly unlocks: Repository<ChapterUnlock>,
    @InjectRepository(Book) private readonly books: Repository<Book>,
    private readonly dataSource: DataSource,
    private readonly walletService: WalletService,
  ) {}

  /** Throws 403 unless the chapter is free, or the user unlocked it / is admin. */
  async assertEntitled(chapter: Chapter, user?: JwtUser): Promise<void> {
    if (chapter.pricingModel !== ChapterPricingModel.PAID) return;
    if (isAdminUser(user)) return;

    const book =
      chapter.coinCost > 0
        ? null
        : await this.books.findOne({ where: { id: chapter.bookId } });
    if (resolveChapterCost(chapter, book) <= 0) return;

    const owned =
      !!user?.userId &&
      (await this.unlocks.exists({
        where: { userId: user.userId, chapterId: chapter.id },
      }));
    if (!owned) {
      throw new ForbiddenException({
        message: 'This chapter is locked. Unlock it with coins to read.',
        code: 'CHAPTER_LOCKED',
      });
    }
  }

  /**
   * Spend coins to unlock a chapter, atomically:
   * lock wallet -> debit (402 if short) -> ledger row -> unlock row.
   * Idempotent per (user, chapter): repeating the call never charges twice.
   */
  async unlock(
    userId: string,
    chapterId: string,
    user?: JwtUser,
  ): Promise<ChapterUnlockResult> {
    return this.dataSource.transaction(async (manager) => {
      const chapter = await manager.findOne(Chapter, {
        where: { id: chapterId },
      });
      if (
        !chapter ||
        chapter.deletedAt ||
        (!chapter.published && !isAdminUser(user))
      ) {
        throw new NotFoundException(`Chapter "${chapterId}" not found`);
      }

      const book = await manager.findOne(Book, {
        where: { id: chapter.bookId },
      });
      const cost = resolveChapterCost(chapter, book);

      if (cost <= 0 || isAdminUser(user)) {
        const { balance } = await this.walletService.getBalance(userId);
        return { chapterId, unlocked: true, coinsCharged: 0, balance };
      }

      const debit = await this.walletService.debitWithManager(manager, {
        userId,
        amount: cost,
        type: CoinTransactionType.UNLOCK,
        idempotencyKey: `unlock:${userId}:${chapterId}`,
      });

      await manager
        .createQueryBuilder()
        .insert()
        .into(ChapterUnlock)
        .values({
          userId,
          chapterId,
          coinsPaid: cost,
          source: 'COIN_PURCHASE',
        })
        .orIgnore()
        .execute();

      return {
        chapterId,
        unlocked: true,
        coinsCharged: debit.debited ? cost : 0,
        balance: debit.balance,
      };
    });
  }

  async listUnlocks(userId: string) {
    const rows = await this.unlocks.find({
      where: { userId },
      order: { unlockedAt: 'DESC' },
    });
    return rows.map((u) => ({
      chapterId: u.chapterId,
      coinsPaid: u.coinsPaid,
      unlockedAt: u.unlockedAt,
    }));
  }
}

import { ForbiddenException, HttpException } from '@nestjs/common';
import { ChapterUnlockService } from './chapter-unlock.service';
import { WalletService } from '../../wallet/wallet.service';
import { ChapterPricingModel } from '../../common/enums/chapter-pricing-model.enum';
import { resolveChapterCost } from './chapter-unlock.service';

const CHAPTER = {
  id: 'c1',
  bookId: 'b1',
  pricingModel: ChapterPricingModel.PAID,
  coinCost: 30,
  published: true,
  deletedAt: null,
};

/** In-memory wallet + ledger so we exercise the real debit logic. */
function setup(balance: number) {
  const ledger = new Map<string, number>();
  const wallet = { userId: 'u1', balance };
  const manager = {
    createQueryBuilder: () => ({
      insert: () => ({
        into: () => ({
          values: () => ({
            orIgnore: () => ({ execute: () => Promise.resolve() }),
          }),
        }),
      }),
    }),
    findOneOrFail: () => Promise.resolve(wallet),
    findOne: (
      entity: { name: string },
      opts: { where: Record<string, string> },
    ) => {
      if (entity.name === 'CoinTransaction') {
        return Promise.resolve(
          ledger.has(opts.where.idempotencyKey) ? {} : null,
        );
      }
      if (entity.name === 'Chapter') return Promise.resolve(CHAPTER);
      return Promise.resolve({ defaultChapterCoinCost: 0 });
    },
    save: () => Promise.resolve(wallet),
    insert: (_e: unknown, row: { idempotencyKey: string; amount: number }) => {
      ledger.set(row.idempotencyKey, row.amount);
      return Promise.resolve();
    },
  };
  const dataSource = {
    transaction: (fn: (m: typeof manager) => Promise<unknown>) => fn(manager),
  };
  const walletService = new WalletService(
    {} as never,
    {} as never,
    {} as never,
    dataSource as never,
    { get: jest.fn() } as never,
  );
  const service = new ChapterUnlockService(
    {} as never,
    {} as never,
    dataSource as never,
    walletService,
  );
  return { service, wallet, ledger };
}

describe('ChapterUnlockService.unlock', () => {
  it('spends coins once and never charges twice for the same chapter', async () => {
    const { service, wallet, ledger } = setup(200);

    const first = await service.unlock('u1', 'c1');
    const second = await service.unlock('u1', 'c1');

    expect(first).toMatchObject({ coinsCharged: 30, balance: 170 });
    expect(second).toMatchObject({ coinsCharged: 0, balance: 170 });
    expect(wallet.balance).toBe(170);
    expect(ledger.get('unlock:u1:c1')).toBe(-30);
  });

  it('rejects with 402 and charges nothing when coins run out', async () => {
    const { service, wallet, ledger } = setup(10);

    await expect(service.unlock('u1', 'c1')).rejects.toMatchObject({
      status: 402,
    });
    await expect(service.unlock('u1', 'c1')).rejects.toBeInstanceOf(
      HttpException,
    );
    expect(wallet.balance).toBe(10);
    expect(ledger.size).toBe(0);
  });
});

describe('access rules', () => {
  it('locks paid chapters for users without an unlock row', async () => {
    const service = new ChapterUnlockService(
      { exists: jest.fn().mockResolvedValue(false) } as never,
      {} as never,
      {} as never,
      {} as never,
    );
    await expect(
      service.assertEntitled(CHAPTER as never, {
        userId: 'u1',
        email: 'a@b.c',
        roles: ['USER'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows unlocked users and admins, and free chapters', async () => {
    const owned = new ChapterUnlockService(
      { exists: jest.fn().mockResolvedValue(true) } as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const user = { userId: 'u1', email: 'a@b.c', roles: ['USER'] };
    await expect(
      owned.assertEntitled(CHAPTER as never, user),
    ).resolves.toBeUndefined();
    await expect(
      owned.assertEntitled(CHAPTER as never, { ...user, roles: ['ADMIN'] }),
    ).resolves.toBeUndefined();
    await expect(
      owned.assertEntitled(
        { ...CHAPTER, pricingModel: ChapterPricingModel.FREE } as never,
        undefined,
      ),
    ).resolves.toBeUndefined();
  });

  it('falls back to the book default cost for PAID chapters', () => {
    expect(
      resolveChapterCost(
        { ...CHAPTER, coinCost: 0 },
        { defaultChapterCoinCost: 15 },
      ),
    ).toBe(15);
    expect(resolveChapterCost({ ...CHAPTER, coinCost: 0 }, null)).toBe(0);
  });
});

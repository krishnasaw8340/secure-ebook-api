import { WalletService } from './wallet.service';
import { CoinTransactionType } from './entities/coin-transaction.entity';

describe('WalletService.creditWithManager', () => {
  const service = new WalletService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  it('rejects non-positive or fractional amounts', async () => {
    for (const amount of [0, -5, 1.5]) {
      await expect(
        service.creditWithManager({} as never, {
          userId: 'u',
          amount,
          type: CoinTransactionType.RECHARGE,
          idempotencyKey: 'k',
        }),
      ).rejects.toThrow('positive integer');
    }
  });
});

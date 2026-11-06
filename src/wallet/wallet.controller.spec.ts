import { UnauthorizedException } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

describe('WalletController', () => {
  const controller = new WalletController({} as WalletService);

  it('rejects wallet reads without an authenticated user', () => {
    expect(() => controller.getWallet()).toThrow(UnauthorizedException);
  });
});

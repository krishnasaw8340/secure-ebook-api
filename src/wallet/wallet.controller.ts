import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet(@CurrentUser() user?: JwtUser) {
    return this.walletService.getBalance(this.requireUserId(user));
  }

  @Get('transactions')
  async getTransactions(
    @CurrentUser() user?: JwtUser,
    @Query('limit') limit?: string,
  ) {
    const rows = await this.walletService.listTransactions(
      this.requireUserId(user),
      limit ? Number(limit) || 50 : 50,
    );
    return rows.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      balanceAfter: tx.balanceAfter,
      createdAt: tx.createdAt,
    }));
  }

  @Get('packages')
  async getPackages() {
    const rows = await this.walletService.listActivePackages();
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      coins: p.coins,
      price: p.priceAmount,
      currency: p.currency,
    }));
  }

  private requireUserId(user?: JwtUser): string {
    if (!user?.userId) throw new UnauthorizedException();
    return user.userId;
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { Wallet } from './entities/wallet.entity';
import { CoinTransaction } from './entities/coin-transaction.entity';
import { CoinPackage } from './entities/coin-package.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, CoinTransaction, CoinPackage])],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService, TypeOrmModule],
})
export class WalletModule {}

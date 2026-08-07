import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CatalogModule } from './catalog/catalog.module';
import { ReadingModule } from './reading/reading.module';
import { WalletModule } from './wallet/wallet.module';
import { PaymentModule } from './payment/payment.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import configuration from './config';
import validationSchema from './config/validation.schema';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: configuration,
      expandVariables: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validationSchema: validationSchema,
    }),
    AuthModule,
    UserModule,
    CatalogModule,
    ReadingModule,
    WalletModule,
    PaymentModule,
    CommonModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

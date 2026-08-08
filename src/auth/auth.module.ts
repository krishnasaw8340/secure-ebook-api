import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { OtpVerification } from './entities/otp-verification.entity';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserRole, RefreshToken, OtpVerification]),
    JwtModule.register({}),
    UserModule,
  ],
  providers: [AuthService, PasswordService, TokenService, RefreshTokenService],
  controllers: [AuthController],
  exports: [AuthService, PasswordService, TokenService, RefreshTokenService],
})
export class AuthModule { }

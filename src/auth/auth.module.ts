import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { OtpVerification } from './entities/otp-verification.entity';

@Module({
  imports: [User, Role, UserRole, RefreshToken, OtpVerification],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule { }

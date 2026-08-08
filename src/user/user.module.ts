import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { UserController } from './controllers/user.controller';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/entities/role.entity';
import { UserRole } from '../auth/entities/user-role.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserRole, RefreshToken]),
  ],
  providers: [UsersService],
  controllers: [UserController],
  exports: [UsersService],
})
export class UserModule { }

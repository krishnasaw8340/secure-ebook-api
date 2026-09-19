import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { UserRole } from '../../auth/entities/user-role.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { RoleType } from '../../common/enums/role.enum';
import { PasswordService } from '../../common/services/password.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserProfileResponseDto } from '../dto/user-profile-response.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly passwordService: PasswordService,
  ) {}

  async createUser(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(
    email: string,
    includePassword = false,
    includeRoles = false,
  ): Promise<User | null> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email });

    if (includePassword) {
      queryBuilder.addSelect('user.password');
    }

    if (includeRoles) {
      queryBuilder
        .leftJoinAndSelect('user.userRoles', 'userRoles')
        .leftJoinAndSelect('userRoles.role', 'role');
    }

    return queryBuilder.getOne();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findWithRoles(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: {
        userRoles: {
          role: true,
        },
      },
    });
  }

  async getProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.findWithRoles(userId);

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const roles =
      user.userRoles
        ?.map((ur) => ur.role?.name)
        .filter((name): name is RoleType => Boolean(name)) || [];

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      isEmailVerified: user.isEmailVerified,
      status: user.status,
      roles,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if new username is already claimed by another user
    if (dto.username && dto.username !== user.username) {
      const existingUser = await this.findByUsername(dto.username);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Username is already taken');
      }
      user.username = dto.username;
    }

    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName;
    }

    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl;
    }

    await this.userRepository.save(user);

    return this.getProfile(userId);
  }

  async assignRole(userId: string, roleName: RoleType): Promise<UserRole> {
    const role = await this.roleRepository.findOne({
      where: { name: roleName },
    });
    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }
    const userRole = this.userRoleRepository.create({
      userId,
      roleId: role.id,
    });
    return this.userRoleRepository.save(userRole);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const result = await this.userRepository.update(userId, {
      password: passwordHash,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
  }

  async verifyEmail(userId: string): Promise<void> {
    const result = await this.userRepository.update(userId, {
      isEmailVerified: true,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // 1. Fetch user with password selected
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Validate current password against stored bcrypt hash
    const isCurrentPasswordValid = await this.passwordService.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // 3. Ensure new password is not identical to current password
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // 4. Hash new password with bcrypt
    const newPasswordHash = await this.passwordService.hash(dto.newPassword);

    // 5. Update user password in DB
    await this.userRepository.update(userId, {
      password: newPasswordHash,
    });

    // 6. Revoke all active refresh tokens for user (terminate all device sessions)
    await this.refreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    return {
      message:
        'Password changed successfully. All active sessions have been logged out for security.',
    };
  }
}

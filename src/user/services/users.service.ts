import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { UserRole } from '../../auth/entities/user-role.entity';
import { RoleType } from '../../common/enums/role.enum';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(UserRole)
        private readonly userRoleRepository: Repository<UserRole>,
    ) { }

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

    async assignRole(userId: string, roleName: RoleType): Promise<UserRole> {
        const role = await this.roleRepository.findOne({ where: { name: roleName } });
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
        const result = await this.userRepository.update(userId, { password: passwordHash });
        if (result.affected === 0) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }
    }

    async verifyEmail(userId: string): Promise<void> {
        const result = await this.userRepository.update(userId, { isEmailVerified: true });
        if (result.affected === 0) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }
    }

}

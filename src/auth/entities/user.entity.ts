import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserStatus } from '../../common/enums/user-status.enum';
import { UserRole } from './user-role.entity';
import { OneToMany } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';

@Entity({
    schema: 'auth',
    name: 'users',
})
export class User extends BaseEntity {
    @Column({
        type: 'varchar',
        length: 150,
        unique: true,
    })
    email: string;

    @Column({
        type: 'varchar',
        length: 150,
        unique: true,
    })
    username?: string;


    // The password is excluded automatically. it will {
    //   "email": "krishna@gmail.com"
    // }
    @Column({
        select: false,
    })
    password: string;

    @Column({
        name: 'full_name',
        length: 150,
    })
    fullName: string;

    @OneToMany(() => UserRole, (userRole) => userRole.user)
    userRoles: UserRole[];

    @Column({
        name: 'avatar_url',
        nullable: true,
    })
    avatarUrl?: string;

    @Column({
        name: 'is_email_verified',
        default: false,
    })
    isEmailVerified: boolean;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.ACTIVE,
    })
    status: UserStatus;


    @OneToMany(
        () => RefreshToken,
        (refreshToken) => refreshToken.user,
    )
    refreshTokens: RefreshToken[];
}
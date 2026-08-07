
// Why do we need a Refresh Token table?

// Many beginners ask:

// "JWT already stores everything. Why save Refresh Tokens in the database?"

// Because JWT Access Tokens are stateless and Refresh Tokens are stateful.


import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    Index,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from './user.entity';

@Entity({
    schema: 'auth',
    name: 'refresh_tokens',
})
export class RefreshToken extends BaseEntity {
    @Column({
        name: 'user_id',
        type: 'uuid',
    })
    @Index()
    userId: string;

    @ManyToOne(() => User, (user) => user.refreshTokens, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    @JoinColumn({
        name: 'user_id',
    })
    user: User;

    @Column({
        name: 'token_hash',
        unique: true,
    })
    tokenHash: string;

    @Column({
        name: 'device_name',
        nullable: true,
        length: 100,
    })
    deviceName?: string;

    @Column({
        name: 'ip_address',
        nullable: true,
        length: 45,
    })
    ipAddress?: string;

    @Column({
        name: 'user_agent',
        type: 'text',
        nullable: true,
    })
    userAgent?: string;

    @Column({
        name: 'last_used_at',
        type: 'timestamptz',
        nullable: true,
    })
    lastUsedAt?: Date;

    @Column({
        name: 'expires_at',
        type: 'timestamptz',
    })
    expiresAt: Date;

    @Column({
        name: 'revoked_at',
        type: 'timestamptz',
        nullable: true,
    })
    revokedAt?: Date;
}




// Every time the refresh endpoint is called successfully, update this timestamp.

// This lets you:

// Show the last active time for each device.
// Identify stale sessions for cleanup.
// Build an "Active Devices" page.
// Detect suspicious behavior, such as a refresh token suddenly being used after months of inactivity.
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { createHash } from 'crypto';

@Injectable()
export class RefreshTokenService {
    constructor(
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) { }

    // Hash token using SHA-256
    hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    async create(
        userId: string,
        token: string,
        expiresAt: Date,
        deviceName?: string,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<RefreshToken> {
        const tokenHash = this.hashToken(token);
        const refreshToken = this.refreshTokenRepository.create({
            userId,
            tokenHash,
            expiresAt,
            deviceName,
            ipAddress,
            userAgent,
            lastUsedAt: new Date(),
        });
        return this.refreshTokenRepository.save(refreshToken);
    }

    async save(
        userId: string,
        token: string,
        deviceName?: string,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<RefreshToken> {
        // Calculate default expiresAt of 30 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        return this.create(userId, token, expiresAt, deviceName, ipAddress, userAgent);
    }

    async findValidToken(userId: string, token: string): Promise<RefreshToken | null> {
        const tokenHash = this.hashToken(token);
        const record = await this.refreshTokenRepository.findOne({
            where: { userId, tokenHash },
        });

        if (!record || record.revokedAt || new Date() > record.expiresAt) {
            return null;
        }

        return record;
    }

    async validateToken(userId: string, token: string): Promise<RefreshToken> {
        const tokenHash = this.hashToken(token);
        const record = await this.refreshTokenRepository.findOne({
            where: { userId, tokenHash },
        });

        if (!record) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (record.revokedAt) {
            throw new UnauthorizedException('Refresh token has been revoked');
        }

        if (new Date() > record.expiresAt) {
            throw new UnauthorizedException('Refresh token has expired');
        }

        // Update last used at timestamp
        record.lastUsedAt = new Date();
        await this.refreshTokenRepository.save(record);

        return record;
    }

    async revokeById(tokenId: string): Promise<void> {
        await this.refreshTokenRepository.update(
            { id: tokenId },
            { revokedAt: new Date() },
        );
    }

    async revoke(userId: string, token: string): Promise<void> {
        const tokenHash = this.hashToken(token);
        await this.refreshTokenRepository.update(
            { userId, tokenHash },
            { revokedAt: new Date() },
        );
    }

    async revokeAll(userId: string): Promise<void> {
        await this.refreshTokenRepository.update(
            { userId },
            { revokedAt: new Date() },
        );
    }

    async revokeAllForUser(userId: string): Promise<void> {
        await this.refreshTokenRepository
            .createQueryBuilder()
            .update()
            .set({
                revokedAt: new Date(),
            })
            .where('user_id = :userId', { userId })
            .andWhere('revoked_at IS NULL')
            .execute();
    }
}

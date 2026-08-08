import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async generateAccessToken(payload: JwtPayload): Promise<string> {
        return this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('jwt.secret'),
            expiresIn: this.configService.get<string>('jwt.expiresIn') as any,
        });
    }

    async generateRefreshToken(payload: JwtPayload): Promise<string> {
        return this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('jwt.refreshSecret'),
            expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') as any,
        });
    }

    async verifyAccessToken(token: string): Promise<JwtPayload> {
        return this.jwtService.verifyAsync<JwtPayload>(token, {
            secret: this.configService.get<string>('jwt.secret'),
        });
    }

    async verifyRefreshToken(token: string): Promise<JwtPayload> {
        return this.jwtService.verifyAsync<JwtPayload>(token, {
            secret: this.configService.get<string>('jwt.refreshSecret'),
        });
    }

    decode(token: string): JwtPayload | null {
        return this.jwtService.decode(token) as JwtPayload;
    }
}

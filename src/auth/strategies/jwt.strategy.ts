import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private readonly configService: ConfigService) {
        const secret = configService.get<string>('jwt.secret') || configService.get<string>('jwt.accessSecret') || 'secret';
        const issuer = configService.get<string>('jwt.issuer');
        const audience = configService.get<string>('jwt.audience');

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
            ...(issuer ? { issuer } : {}),
            ...(audience ? { audience } : {}),
        });
    }

    async validate(payload: JwtPayload) {
        return {
            userId: payload.sub,
            email: payload.email,
            roles: payload.roles,
        };
    }
}
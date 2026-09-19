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
    const secret = this.configService.get<string>('jwt.secret');
    const expiresIn = this.configService.get<string>('jwt.expiresIn');
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: (expiresIn || '15m') as
        `${number}m` | `${number}d` | `${number}s` | `${number}h` | number,
    });
  }

  async generateRefreshToken(payload: JwtPayload): Promise<string> {
    const secret = this.configService.get<string>('jwt.refreshSecret');
    const expiresIn = this.configService.get<string>('jwt.refreshExpiresIn');
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: (expiresIn || '30d') as
        `${number}m` | `${number}d` | `${number}s` | `${number}h` | number,
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
    return this.jwtService.decode(token);
  }
}

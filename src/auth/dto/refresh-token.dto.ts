import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
    @ApiProperty({
        description: 'The refresh token issued during authentication',
        example: 'eyJhbGciOiJIUzI1Ni...',
    })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;

    @ApiPropertyOptional({ example: 'Chrome on macOS', description: 'Optional custom device name' })
    @IsString()
    @IsOptional()
    deviceName?: string;
}


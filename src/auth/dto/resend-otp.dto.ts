import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationOtpDto {
    @ApiProperty({ example: 'user@example.com', description: 'Registered email address' })
    @IsEmail()
    email: string;
}

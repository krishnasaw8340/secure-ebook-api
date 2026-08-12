import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
    @ApiProperty({ example: 'user@example.com', description: 'Registered email address' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '123456', description: '6-digit OTP verification code' })
    @IsString()
    @Length(6, 6)
    otp: string;
}

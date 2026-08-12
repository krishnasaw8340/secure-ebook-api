import { IsEmail, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({ example: 'testuser@gmail.com', description: 'Registered email address' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '123456', description: '6-digit OTP verification code' })
    @IsString()
    @Length(6, 6)
    otp: string;

    @ApiProperty({ example: 'NewPassword@123', description: 'New password (minimum 8 characters)' })
    @IsString()
    @MinLength(8)
    newPassword: string;
}

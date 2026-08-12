import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
    @ApiProperty({ example: 'testuser@gmail.com', description: 'Registered email address' })
    @IsEmail()
    email: string;
}

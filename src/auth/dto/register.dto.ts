import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'johndoe', description: 'Unique username' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: 'John Doe', description: 'Full name' })
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiProperty({ example: 'password123', description: 'Secure password', minLength: 8 })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @IsNotEmpty()
    password: string;
}

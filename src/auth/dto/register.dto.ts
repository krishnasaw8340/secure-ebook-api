import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleType } from 'src/common/enums/role.enum';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'johndoe', description: 'Unique username' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: 'USER', description: 'User Role' })
    @IsEnum(RoleType)
    @IsNotEmpty()
    roleType: RoleType

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

export class LoginDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'password123', description: 'Secure password', minLength: 8 })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @IsNotEmpty()
    password: string;
}

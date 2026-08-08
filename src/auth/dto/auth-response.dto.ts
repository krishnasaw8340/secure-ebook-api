import { ApiProperty } from '@nestjs/swagger';

class UserResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    email: string;

    @ApiProperty({ required: false })
    username?: string;

    @ApiProperty()
    fullName: string;

    @ApiProperty({ required: false })
    avatarUrl?: string;

    @ApiProperty()
    isEmailVerified: boolean;

    @ApiProperty()
    status: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class AuthResponseDto {
    @ApiProperty({ type: UserResponseDto })
    user: UserResponseDto;

    @ApiProperty()
    accessToken: string;

    @ApiProperty()
    refreshToken: string;
}

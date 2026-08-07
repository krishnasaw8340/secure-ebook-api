import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from './user.entity';
import { OtpPurpose } from '../../common/enums/otp-purpose.enum';

@Entity({
    schema: 'auth',
    name: 'otp_verifications',
})
export class OtpVerification extends BaseEntity {
    @Column({
        name: 'user_id',
        type: 'uuid',
        nullable: true,
    })
    @Index()
    userId?: string;

    @ManyToOne(() => User, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({
        name: 'user_id',
    })
    user?: User;

    @Column({
        type: 'varchar',
        length: 150,
    })
    @Index()
    email: string;

    @Column({
        name: 'otp_code',
        type: 'varchar',
        length: 255,
    })
    otpCode: string;

    @Column({
        type: 'enum',
        enum: OtpPurpose,
    })
    purpose: OtpPurpose;

    @Column({
        name: 'expires_at',
        type: 'timestamptz',
    })
    expiresAt: Date;

    @Column({
        default: 0,
    })
    attempts: number;

    @Column({
        default: false,
    })
    verified: boolean;

    @Column({
        name: 'verified_at',
        type: 'timestamptz',
        nullable: true,
    })
    verifiedAt?: Date;
}
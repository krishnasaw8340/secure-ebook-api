import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';
import { OtpVerification } from '../entities/otp-verification.entity';
import { OtpPurpose } from '../../common/enums/otp-purpose.enum';
import { PasswordService } from './password.service';

@Injectable()
export class OtpService {
    private readonly logger = new Logger(OtpService.name);
    private readonly MAX_ATTEMPTS = 5;
    private readonly EXPIRATION_MINUTES = 10;

    constructor(
        @InjectRepository(OtpVerification)
        private readonly otpRepository: Repository<OtpVerification>,
        private readonly passwordService: PasswordService,
    ) { }

    /**
     * Generates a cryptographically secure 6-digit OTP,
     * hashes it, stores it in the database, and logs it.
     */
    async generateAndSaveOtp(
        userId: string | undefined,
        email: string,
        purpose: OtpPurpose,
    ): Promise<string> {
        // 1. Generate 6-digit OTP
        const otp = randomInt(100000, 1000000).toString();

        // 2. Hash the OTP using bcrypt (reuse PasswordService)
        const otpHash = await this.passwordService.hash(otp);

        // 3. Expiration set to 10 minutes
        const expiresAt = new Date(Date.now() + this.EXPIRATION_MINUTES * 60 * 1000);

        // 4. Save to DB
        const otpRecord = this.otpRepository.create({
            userId,
            email,
            otpCode: otpHash,
            purpose,
            expiresAt,
            attempts: 0,
            verified: false,
        });

        await this.otpRepository.save(otpRecord);

        // 5. Log OTP for development
        this.logger.debug(`[DEV ONLY] OTP for ${email} (${purpose}): ${otp}`);

        return otp;
    }

    /**
     * Verifies the user-submitted OTP against stored hash,
     * enforcing expiry and maximum attempt limits.
     */
    async verify(
        userId: string | undefined,
        email: string,
        otp: string,
        purpose: OtpPurpose,
    ): Promise<void> {
        // 1. Find latest active/unverified OTP record for this email and purpose
        const record = await this.otpRepository.findOne({
            where: { email, purpose, verified: false },
            order: { createdAt: 'DESC' },
        });

        if (!record) {
            throw new BadRequestException('Invalid verification request');
        }

        // 2. Check if expired
        if (new Date() > record.expiresAt) {
            throw new BadRequestException('OTP has expired. Please request a new one.');
        }

        // 3. Check attempt limit
        if (record.attempts >= this.MAX_ATTEMPTS) {
            throw new BadRequestException(
                'Maximum verification attempts exceeded. Please request a new OTP.',
            );
        }

        // 4. Verify OTP using bcrypt compare
        const isValid = await this.passwordService.compare(otp, record.otpCode);

        if (!isValid) {
            record.attempts += 1;
            await this.otpRepository.save(record);
            throw new BadRequestException('Invalid OTP code');
        }

        // 5. Mark OTP record as verified
        record.verified = true;
        record.verifiedAt = new Date();
        await this.otpRepository.save(record);
    }
}

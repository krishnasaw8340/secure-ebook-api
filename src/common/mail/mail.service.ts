import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
    renderVerificationOtpTemplate,
    renderPasswordResetOtpTemplate,
} from './templates';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('mail.host'),
            port: this.configService.get<number>('mail.port'),
            secure: this.configService.get<boolean>('mail.secure'),
            auth: {
                user: this.configService.get<string>('mail.username'),
                pass: this.configService.get<string>('mail.password'),
            },
        });
    }

    async sendVerificationOtp(email: string, otp: string): Promise<void> {
        try {
            const template = renderVerificationOtpTemplate({
                otp,
                email,
                expiresInMinutes: 10,
            });

            await this.transporter.sendMail({
                from: this.configService.get<string>('mail.from'),
                to: email,
                subject: template.subject,
                text: template.text,
                html: template.html,
            });
            this.logger.log(`Verification OTP email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send verification email to ${email}`, error);
            throw new InternalServerErrorException(
                'Unable to send verification email',
            );
        }
    }

    async sendPasswordResetOtp(email: string, otp: string): Promise<void> {
        try {
            const template = renderPasswordResetOtpTemplate({
                otp,
                email,
                expiresInMinutes: 10,
            });

            await this.transporter.sendMail({
                from: this.configService.get<string>('mail.from'),
                to: email,
                subject: template.subject,
                text: template.text,
                html: template.html,
            });
            this.logger.log(`Password reset OTP email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send password reset email to ${email}`, error);
            throw new InternalServerErrorException(
                'Unable to send password reset email',
            );
        }
    }
}


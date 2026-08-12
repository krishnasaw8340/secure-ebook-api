import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

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
            await this.transporter.sendMail({
                from: this.configService.get<string>('mail.from'),
                to: email,
                subject: 'Verify your email - Kuroyomi Ebook',
                text: `Your verification code is ${otp}. It expires in 10 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                        <h2 style="color: #333; text-align: center;">Email Verification</h2>
                        <p style="color: #666; font-size: 16px;">Thank you for registering with Kuroyomi Ebook. Your 6-digit verification code is:</p>
                        <div style="background-color: #f4f4f5; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4F46E5;">${otp}</span>
                        </div>
                        <p style="color: #666; font-size: 14px;">This code is valid for <strong>10 minutes</strong>. If you did not request this code, please ignore this email.</p>
                    </div>
                `,
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
            await this.transporter.sendMail({
                from: this.configService.get<string>('mail.from'),
                to: email,
                subject: 'Reset your password - Kuroyomi Ebook',
                text: `Your password reset code is ${otp}. It expires in 10 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
                        <p style="color: #666; font-size: 16px;">Your password reset verification code is:</p>
                        <div style="background-color: #f4f4f5; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #DC2626;">${otp}</span>
                        </div>
                        <p style="color: #666; font-size: 14px;">This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
                    </div>
                `,
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

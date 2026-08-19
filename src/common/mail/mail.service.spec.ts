import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { renderVerificationOtpTemplate, renderPasswordResetOtpTemplate } from './templates';

describe('MailService Templates', () => {
    let service: MailService;
    let configService: ConfigService;

    const mockConfigService = {
        get: jest.fn((key: string) => {
            const config: Record<string, any> = {
                'mail.host': 'smtp.gmail.com',
                'mail.port': 587,
                'mail.secure': false,
                'mail.username': 'test@example.com',
                'mail.password': 'password123',
                'mail.from': 'Kuroyomi Ebook <noreply@kuroyomi.com>',
            };
            return config[key];
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MailService,
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<MailService>(MailService);
        configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('renderVerificationOtpTemplate', () => {
        it('should render email verification HTML with OTP, Kuroyomi branding and security details', () => {
            const result = renderVerificationOtpTemplate({
                otp: '162533',
                email: 'user@example.com',
                expiresInMinutes: 10,
            });

            expect(result.subject).toBe('Verify your email - Kuroyomi Ebook');
            expect(result.html).toContain('KUROYOMI');
            expect(result.html).toContain('162533');
            expect(result.html).toContain('Expires in 10 minutes');
            expect(result.html).toContain('Verify Your Email Address');
            expect(result.html).toContain('Security Notice');
            expect(result.text).toContain('162533');
        });
    });

    describe('renderPasswordResetOtpTemplate', () => {
        it('should render password reset HTML with OTP, Kuroyomi branding and security alert', () => {
            const result = renderPasswordResetOtpTemplate({
                otp: '984512',
                email: 'user@example.com',
                expiresInMinutes: 10,
            });

            expect(result.subject).toBe('Reset your password - Kuroyomi Ebook');
            expect(result.html).toContain('KUROYOMI');
            expect(result.html).toContain('984512');
            expect(result.html).toContain('Expires in 10 minutes');
            expect(result.html).toContain('Password Reset Request');
            expect(result.html).toContain('Security Alert');
            expect(result.text).toContain('984512');
        });
    });
});

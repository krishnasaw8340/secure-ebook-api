import { renderBaseEmailTemplate } from './base.template';

export interface VerificationOtpTemplateOptions {
  otp: string;
  email?: string;
  expiresInMinutes?: number;
}

/**
 * Generates a modern, responsive HTML email for user email verification OTP.
 */
export function renderVerificationOtpTemplate(options: VerificationOtpTemplateOptions): {
  html: string;
  text: string;
  subject: string;
} {
  const expiresInMinutes = options.expiresInMinutes || 10;
  const subject = 'Verify your email - Kuroyomi Ebook';
  const preheader = `Your 6-digit verification code is ${options.otp}. Valid for ${expiresInMinutes} minutes.`;

  const contentHtml = `
    <!-- Intro text -->
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.6; text-align: center;">
      Thank you for registering with <strong>Kuroyomi Ebook</strong>. To complete your registration and activate your digital reading account, please enter the 6-digit verification code below:
    </p>

    <!-- OTP Code Display Card -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 28px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background: #f8fafc; border: 2px dashed #c7d2fe; border-radius: 12px; padding: 20px 32px; text-align: center;">
            <tr>
              <td align="center">
                <div style="font-size: 11px; font-weight: 700; color: #6366f1; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px;">
                  Your Verification Code
                </div>
                <div class="otp-code" style="font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 36px; font-weight: 800; color: #4338ca; letter-spacing: 8px; line-height: 1.2; padding: 4px 0;">
                  ${options.otp}
                </div>
                <div style="margin-top: 10px;">
                  <span style="display: inline-block; background-color: #e0e7ff; color: #3730a3; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px;">
                    ⏱️ Expires in ${expiresInMinutes} minutes
                  </span>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Security & Advisory Box -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
      <tr>
        <td style="vertical-align: top; width: 24px; padding-right: 10px;">
          <span style="font-size: 16px;">🔒</span>
        </td>
        <td style="vertical-align: middle;">
          <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
            Security Notice
          </div>
          <div style="font-size: 13px; color: #64748b; line-height: 1.5;">
            Never share this verification code with anyone. Kuroyomi representatives will never ask for your code or password.
          </div>
        </td>
      </tr>
    </table>

    <!-- Fallback / Did not request notice -->
    <p style="margin: 24px 0 0 0; font-size: 13px; color: #94a3b8; line-height: 1.5; text-align: center;">
      If you did not register for an account with Kuroyomi Ebook, please safely ignore this email. No account has been verified or activated.
    </p>
  `;

  const html = renderBaseEmailTemplate({
    title: 'Verify Your Email Address',
    preheader,
    badgeText: 'Account Verification',
    badgeIcon: '✉️',
    badgeColor: '#4f46e5',
    badgeBg: '#eef2ff',
    contentHtml,
  });

  const text = `Email Verification - Kuroyomi Ebook

Thank you for registering with Kuroyomi Ebook.

Your 6-digit verification code is:
${options.otp}

This code is valid for ${expiresInMinutes} minutes.

Security Notice: Never share this code with anyone. Kuroyomi will never ask for your verification code.

If you did not request this code, please ignore this email.`;

  return { html, text, subject };
}

import { renderBaseEmailTemplate } from './base.template';

export interface PasswordResetOtpTemplateOptions {
  otp: string;
  email?: string;
  expiresInMinutes?: number;
}

/**
 * Generates a modern, responsive HTML email for password reset OTP.
 */
export function renderPasswordResetOtpTemplate(options: PasswordResetOtpTemplateOptions): {
  html: string;
  text: string;
  subject: string;
} {
  const expiresInMinutes = options.expiresInMinutes || 10;
  const subject = 'Reset your password - Kuroyomi Ebook';
  const preheader = `Your password reset code is ${options.otp}. Valid for ${expiresInMinutes} minutes.`;

  const contentHtml = `
    <!-- Intro text -->
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.6; text-align: center;">
      We received a request to reset the password for your <strong>Kuroyomi Ebook</strong> account. Enter the 6-digit security code below to proceed with setting a new password:
    </p>

    <!-- OTP Code Display Card -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 28px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background: #fff1f2; border: 2px dashed #fecdd3; border-radius: 12px; padding: 20px 32px; text-align: center;">
            <tr>
              <td align="center">
                <div style="font-size: 11px; font-weight: 700; color: #e11d48; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px;">
                  Password Reset Code
                </div>
                <div class="otp-code" style="font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 36px; font-weight: 800; color: #be123c; letter-spacing: 8px; line-height: 1.2; padding: 4px 0;">
                  ${options.otp}
                </div>
                <div style="margin-top: 10px;">
                  <span style="display: inline-block; background-color: #ffe4e6; color: #9f1239; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px;">
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
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 10px; padding: 16px;">
      <tr>
        <td style="vertical-align: top; width: 24px; padding-right: 10px;">
          <span style="font-size: 16px;">⚠️</span>
        </td>
        <td style="vertical-align: middle;">
          <div style="font-size: 13px; font-weight: 700; color: #991b1b; margin-bottom: 4px;">
            Security Alert
          </div>
          <div style="font-size: 13px; color: #7f1d1d; line-height: 1.5;">
            If you did not request this password reset, please ignore this email or review your account security immediately. Your current password remains unchanged.
          </div>
        </td>
      </tr>
    </table>

    <!-- Fallback notice -->
    <p style="margin: 24px 0 0 0; font-size: 13px; color: #94a3b8; line-height: 1.5; text-align: center;">
      Never share this code with anyone. Kuroyomi support will never ask for your verification code.
    </p>
  `;

  const html = renderBaseEmailTemplate({
    title: 'Password Reset Request',
    preheader,
    badgeText: 'Security Code',
    badgeIcon: '🔑',
    badgeColor: '#e11d48',
    badgeBg: '#ffe4e6',
    contentHtml,
  });

  const text = `Password Reset Request - Kuroyomi Ebook

We received a request to reset your password for Kuroyomi Ebook.

Your 6-digit password reset code is:
${options.otp}

This code is valid for ${expiresInMinutes} minutes.

Security Alert: If you did not request a password reset, please ignore this email. Your password will remain unchanged.`;

  return { html, text, subject };
}

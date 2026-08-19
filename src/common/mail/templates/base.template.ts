export interface BaseEmailTemplateOptions {
  preheader?: string;
  badgeText?: string;
  badgeColor?: string;
  badgeBg?: string;
  badgeIcon?: string;
  title: string;
  subtitle?: string;
  contentHtml: string;
}

/**
 * Generates the master responsive HTML email layout for Kuroyomi Ebook.
 * Designed for universal email client compatibility (Gmail, Outlook, Apple Mail, iOS, Android).
 */
export function renderBaseEmailTemplate(options: BaseEmailTemplateOptions): string {
  const currentYear = new Date().getFullYear();
  const preheader = options.preheader || options.title;
  const badgeText = options.badgeText || 'SECURITY NOTIFICATION';
  const badgeColor = options.badgeColor || '#4f46e5';
  const badgeBg = options.badgeBg || '#eef2ff';
  const badgeIcon = options.badgeIcon || '🔒';

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${options.title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    body, table, td, a {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #f1f5f9;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        margin: auto !important;
        border-radius: 0px !important;
      }
      .content-cell {
        padding: 28px 20px !important;
      }
      .header-cell {
        padding: 24px 20px !important;
      }
      .otp-code {
        font-size: 30px !important;
        letter-spacing: 6px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-font-smoothing: antialiased; word-spacing: normal;">
  <!-- Preview Text (Hidden in email client list view) -->
  <div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <!-- Background Wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f1f5f9; width: 100%; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 16px 40px 16px;">
        
        <!-- Main Card Container -->
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="560">
        <tr>
        <td align="center" valign="top" width="560">
        <![endif]-->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="email-container" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04); border: 1px solid #e2e8f0;">
          
          <!-- Modern Dark Header -->
          <tr>
            <td class="header-cell" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); background-color: #0f172a; padding: 32px 36px 28px 36px; text-align: center; border-bottom: 1px solid #312e81;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <!-- Brand Icon Badge -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border-radius: 12px; padding: 10px 12px; text-align: center; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);">
                          <span style="font-size: 22px; line-height: 1; display: inline-block;">📚</span>
                        </td>
                        <td style="padding-left: 12px; text-align: left; vertical-align: middle;">
                          <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; line-height: 1.2; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
                            KUROYOMI
                          </div>
                          <div style="font-size: 11px; font-weight: 600; color: #a5b4fc; letter-spacing: 1.5px; text-transform: uppercase; line-height: 1.2;">
                            Secure Ebook Platform
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td class="content-cell" style="padding: 36px 36px 32px 36px; background-color: #ffffff;">
              
              <!-- Category / Status Pill Badge -->
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; font-size: 12px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; padding: 6px 14px; border-radius: 9999px; border: 1px solid ${badgeBg};">
                  <span style="margin-right: 4px;">${badgeIcon}</span> ${badgeText}
                </span>
              </div>

              <!-- Title -->
              <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #0f172a; text-align: center; letter-spacing: -0.5px; line-height: 1.3;">
                ${options.title}
              </h1>

              <!-- Subtitle if provided -->
              ${
                options.subtitle
                  ? `<p style="margin: 0 0 24px 0; font-size: 15px; color: #64748b; text-align: center; line-height: 1.6;">${options.subtitle}</p>`
                  : ''
              }

              <!-- Body Injected Content -->
              ${options.contentHtml}

            </td>
          </tr>

          <!-- Footer Divider -->
          <tr>
            <td style="padding: 0 36px;">
              <div style="height: 1px; background-color: #f1f5f9; width: 100%;"></div>
            </td>
          </tr>

          <!-- Modern Footer -->
          <tr>
            <td style="padding: 24px 36px 32px 36px; background-color: #fafafa; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <!-- Shield Security Icon -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: #ecfdf5; border-radius: 50%; width: 28px; height: 28px; text-align: center; vertical-align: middle;">
                          <span style="font-size: 14px; line-height: 1;">🛡️</span>
                        </td>
                        <td style="padding-left: 8px; font-size: 12px; font-weight: 600; color: #059669; text-align: left;">
                          End-to-End Secure Digital Reading
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #94a3b8; line-height: 1.6; text-align: center; padding-bottom: 8px;">
                    This is an automated security transmission from <strong>Kuroyomi Ebook</strong>.<br>
                    Please do not reply directly to this email.
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 11px; color: #cbd5e1; text-align: center;">
                    &copy; ${currentYear} Kuroyomi Ebook Platform. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

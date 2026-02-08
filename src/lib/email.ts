// ============================================================
// Email Service - Resend wrapper with bilingual HTML builder
// ============================================================

import { Resend } from 'resend';
import {
  type EmailTemplateName,
  type EmailTemplateContent,
  getEmailTemplate,
  getEnglishTemplate,
} from './email-templates';

// Lazy-initialized Resend client (avoids crash when RESEND_API_KEY is not set at build time)
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const EMAIL_FROM = process.env.EMAIL_FROM || 'Localisio <noreply@localisio.com>';
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://localisio.com').replace(/\/$/, '');

// ============================================================
// Low-level send
// ============================================================

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    if (!resend) {
      console.warn('[Email] RESEND_API_KEY not set — skipping email to', to);
      return { success: false, error: 'RESEND_API_KEY not configured' };
    }

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[Email] Unexpected error:', err);
    return { success: false, error: String(err) };
  }
}

// ============================================================
// HTML builder
// ============================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function textToHtml(text: string): string {
  return escapeHtml(text)
    .split('\n\n')
    .map((paragraph) => {
      // Convert lines starting with "- " to list items
      const lines = paragraph.split('\n');
      const hasListItems = lines.some((l) => l.startsWith('- '));

      if (hasListItems) {
        const items = lines
          .filter((l) => l.startsWith('- '))
          .map((l) => `<li style="margin-bottom:4px;">${l.slice(2)}</li>`)
          .join('');
        const nonListLines = lines.filter((l) => !l.startsWith('- '));
        const prefix = nonListLines.length
          ? `<p style="margin:0 0 8px 0;line-height:1.6;">${nonListLines.join('<br>')}</p>`
          : '';
        return `${prefix}<ul style="margin:0 0 0 20px;padding:0;line-height:1.6;">${items}</ul>`;
      }

      return `<p style="margin:0;line-height:1.6;">${paragraph.replace(/\n/g, '<br>')}</p>`;
    })
    .join('<div style="height:16px;"></div>');
}

function renderSection(template: EmailTemplateContent, ctaUrl: string): string {
  const ctaHtml = template.cta
    ? `<div style="text-align:center;margin:24px 0;">
        <a href="${ctaUrl}" style="display:inline-block;padding:12px 28px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
          ${escapeHtml(template.cta)}
        </a>
      </div>`
    : '';

  return `
    <h2 style="margin:0 0 12px 0;font-size:20px;color:#1e293b;">${escapeHtml(template.greeting)}</h2>
    ${textToHtml(template.body)}
    ${ctaHtml}
    <p style="margin:16px 0 0 0;color:#64748b;">— ${escapeHtml(template.closing)}</p>
  `;
}

function buildHtmlEmail(
  localizedSection: string,
  englishSection: string | null,
  subject: string
): string {
  const englishBlock = englishSection
    ? `
      <tr>
        <td style="padding:0 32px;">
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
          <p style="text-align:center;font-size:12px;color:#94a3b8;margin:0 0 16px 0;">English version / Английская версия</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 32px 32px;font-size:15px;color:#334155;">
          ${englishSection}
        </td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding:24px 32px;background:linear-gradient(135deg,#2563eb,#4f46e5);text-align:center;">
              <h1 style="margin:0;font-size:22px;color:#ffffff;font-weight:700;letter-spacing:-0.5px;">Localisio</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;font-size:15px;color:#334155;">
              ${localizedSection}
            </td>
          </tr>
          ${englishBlock}
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#f8fafc;text-align:center;font-size:12px;color:#94a3b8;">
              <p style="margin:0;">&copy; ${new Date().getFullYear()} Localisio. All rights reserved.</p>
              <p style="margin:4px 0 0 0;">
                <a href="${APP_URL}" style="color:#64748b;text-decoration:none;">localisio.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================
// Public API
// ============================================================

/**
 * Build and send a bilingual email.
 * If the user's locale is English, only the English version is shown.
 * Otherwise: localized version first, then English duplicate below a divider.
 */
export async function sendProviderEmail(
  to: string,
  templateName: EmailTemplateName,
  locale: string,
  ctaPath?: string
): Promise<{ success: boolean; error?: string }> {
  const ctaUrl = ctaPath ? `${APP_URL}${ctaPath}` : `${APP_URL}/dashboard`;

  const localizedTemplate = getEmailTemplate(templateName, locale);
  const localizedSection = renderSection(localizedTemplate, ctaUrl);

  // If locale is already English, no need for a duplicate
  let englishSection: string | null = null;
  if (locale !== 'en') {
    const englishTemplate = getEnglishTemplate(templateName);
    englishSection = renderSection(englishTemplate, ctaUrl);
  }

  const html = buildHtmlEmail(localizedSection, englishSection, localizedTemplate.subject);

  // Use localized subject, with English in parentheses for non-English
  const enTemplate = getEnglishTemplate(templateName);
  const subject =
    locale === 'en'
      ? enTemplate.subject
      : `${localizedTemplate.subject} (${enTemplate.subject})`;

  console.log(`[Email] Sending "${templateName}" to ${to} (locale: ${locale})`);
  return sendEmail({ to, subject, html });
}

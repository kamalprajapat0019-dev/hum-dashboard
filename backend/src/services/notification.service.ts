import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export interface DispatchChannelResult {
  sent: boolean;
  recipient: string;
  status: 'sent' | 'failed' | 'not_configured';
  messageId?: string;
  error?: string;
  provider?: string;
}

export interface DispatchResult {
  email: DispatchChannelResult;
  whatsapp: DispatchChannelResult;
}

export interface SignUpLinkPayload {
  centreName: string;
  email: string;
  whatsappNumber: string;
  token: string;
  registrationUrl: string;
  expiresAt: Date;
}

/**
 * Format mobile number to valid Indian E.164 without leading '+' (e.g., 91XXXXXXXXXX)
 */
export function formatWhatsAppNumber(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
}

export class NotificationService {
  /**
   * Resolve absolute frontend registration URL
   */
  static getFullRegistrationUrl(registrationUrl: string): string {
    if (registrationUrl.startsWith('http://') || registrationUrl.startsWith('https://')) {
      return registrationUrl;
    }
    const baseUrl = (env.FRONTEND_URL || env.CORS_ORIGIN || 'http://localhost:5173').replace(/\/+$/, '');
    const path = registrationUrl.startsWith('/') ? registrationUrl : `/${registrationUrl}`;
    return `${baseUrl}${path}`;
  }

  /**
   * Dispatch 72-hour sign-up link to both Email and WhatsApp
   */
  static async dispatchSignUpLink(payload: SignUpLinkPayload): Promise<DispatchResult> {
    const cleanEmail = payload.email.trim().toLowerCase();
    const formattedPhone = formatWhatsAppNumber(payload.whatsappNumber);
    const fullUrl = this.getFullRegistrationUrl(payload.registrationUrl);
    const centreLabel = payload.centreName.trim() || 'Centre Superintendent / Partner';
    const expiryStr = payload.expiresAt.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const [emailRes, whatsappRes] = await Promise.all([
      this.sendEmail({
        to: cleanEmail,
        centreName: centreLabel,
        fullUrl,
        expiresAtStr: expiryStr,
      }),
      this.sendWhatsApp({
        to: formattedPhone,
        centreName: centreLabel,
        fullUrl,
        expiresAtStr: expiryStr,
      }),
    ]);

    return {
      email: emailRes,
      whatsapp: whatsappRes,
    };
  }

  /**
   * Send Email with HTML + plain text fallback
   */
  private static async sendEmail(params: {
    to: string;
    centreName: string;
    fullUrl: string;
    expiresAtStr: string;
  }): Promise<DispatchChannelResult> {
    const { to, centreName, fullUrl, expiresAtStr } = params;

    // Check if SMTP is configured
    if (!env.SMTP_HOST || !env.SMTP_USER) {
      if (env.NODE_ENV !== 'production') {
        console.log(`[DISPATCH:SIMULATED:EMAIL] Recipient: ${to} | URL: ${fullUrl} | Expiry: ${expiresAtStr}`);
      }
      return {
        sent: false,
        recipient: to,
        status: 'not_configured',
        error: 'SMTP credentials not configured in environment (.env: SMTP_HOST, SMTP_USER, SMTP_PASS)',
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || (env.SMTP_SECURE ? 465 : 587),
        secure: env.SMTP_SECURE || false,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });

      const subject = `Invitation to Register on OECM Portal — 72-Hour Sign-Up Link`;
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OECM Portal Registration Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <tr>
      <td style="background: #1e40af; padding: 24px 32px; text-align: left;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">OECM Portal</h1>
        <p style="color: #bfdbfe; margin: 4px 0 0; font-size: 13px;">Operations & Examination Management Portal</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <h2 style="font-size: 18px; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Dear ${centreName},</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
          You have been invited by the Examination Operations Team to register your centre on the official <strong>OECM Examination Portal</strong>.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
          Please click the button below to complete your registration, setup your password, and verify your account via OTP:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${fullUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
            Complete Centre Registration &rarr;
          </a>
        </div>
        <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; margin: 24px 0;">
          <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
            <strong>Notice (FRD Sec. 4.1):</strong> This registration link is unique and strictly valid for <strong>72 hours</strong>. It will expire automatically on <strong>${expiresAtStr}</strong>.
          </p>
        </div>
        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 24px;">
          If the button above does not work, copy and paste this link into your browser:<br>
          <a href="${fullUrl}" style="color: #2563eb; word-break: break-all;">${fullUrl}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 18px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        OECM Portal &bull; Automated Dispatch Notification &bull; Do not reply to this email
      </td>
    </tr>
  </table>
</body>
</html>`;

      const text = `OECM Examination Portal - 72-Hour Sign-Up Link

Dear ${centreName},

You have been invited by the Examination Operations Team to register your centre on the OECM Examination Management Portal.

Complete your registration using this link:
${fullUrl}

NOTICE: This link is strictly valid for 72 hours and will expire on ${expiresAtStr}.
An OTP will be verified upon registration before first login.

Best regards,
OECM Examination Operations Team`;

      const info = await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        text,
        html,
      });

      return {
        sent: true,
        recipient: to,
        status: 'sent',
        messageId: info.messageId,
        provider: 'smtp',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'SMTP delivery failed';
      console.error(`[DISPATCH:ERROR:EMAIL] Failed to send to ${to}:`, msg);
      return {
        sent: false,
        recipient: to,
        status: 'failed',
        error: msg,
        provider: 'smtp',
      };
    }
  }

  /**
   * Send WhatsApp Message via Meta Cloud API, Twilio, or generic webhook
   */
  private static async sendWhatsApp(params: {
    to: string;
    centreName: string;
    fullUrl: string;
    expiresAtStr: string;
  }): Promise<DispatchChannelResult> {
    const { to, centreName, fullUrl, expiresAtStr } = params;

    const messageText = `*OECM Examination Portal*

Dear *${centreName}*,
You have been invited by the Examination Operations Team to complete centre onboarding.

🔗 *72-Hour Sign-Up Link:*
${fullUrl}

⚠️ *Notice (FRD Sec. 4.1):* This secure link is single-use and expires in 72 hours on *${expiresAtStr}*.
Complete your registration and OTP verification promptly.`;

    // 1. Meta WhatsApp Cloud API
    if (env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID) {
      try {
        const metaUrl = `https://graph.facebook.com/v19.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        const res = await fetch(metaUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { preview_url: true, body: messageText },
          }),
        });

        const data: any = await res.json();
        if (!res.ok) {
          throw new Error(data?.error?.message || `Meta API HTTP ${res.status}`);
        }

        return {
          sent: true,
          recipient: to,
          status: 'sent',
          messageId: data?.messages?.[0]?.id,
          provider: 'meta_cloud_api',
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Meta WhatsApp Cloud API delivery failed';
        console.error(`[DISPATCH:ERROR:WHATSAPP] Failed to send to ${to}:`, msg);
        return {
          sent: false,
          recipient: to,
          status: 'failed',
          error: msg,
          provider: 'meta_cloud_api',
        };
      }
    }

    // 2. Twilio WhatsApp
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_FROM) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const credentials = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const bodyParams = new URLSearchParams();
        bodyParams.append('From', env.TWILIO_WHATSAPP_FROM.startsWith('whatsapp:') ? env.TWILIO_WHATSAPP_FROM : `whatsapp:${env.TWILIO_WHATSAPP_FROM}`);
        bodyParams.append('To', `whatsapp:+${to}`);
        bodyParams.append('Body', messageText);

        const res = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        });

        const data: any = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || `Twilio HTTP ${res.status}`);
        }

        return {
          sent: true,
          recipient: to,
          status: 'sent',
          messageId: data?.sid,
          provider: 'twilio',
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Twilio delivery failed';
        console.error(`[DISPATCH:ERROR:WHATSAPP:TWILIO] Failed to send to ${to}:`, msg);
        return {
          sent: false,
          recipient: to,
          status: 'failed',
          error: msg,
          provider: 'twilio',
        };
      }
    }

    // 3. Generic WhatsApp HTTP Webhook Gateway (Gupshup / Custom)
    if (env.WHATSAPP_API_URL) {
      try {
        const res = await fetch(env.WHATSAPP_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(env.WHATSAPP_API_KEY ? { Authorization: `Bearer ${env.WHATSAPP_API_KEY}` } : {}),
          },
          body: JSON.stringify({
            to,
            phone: to,
            message: messageText,
            url: fullUrl,
            centreName,
          }),
        });

        const data: any = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || `Webhook HTTP ${res.status}`);
        }

        return {
          sent: true,
          recipient: to,
          status: 'sent',
          messageId: data?.id || data?.messageId,
          provider: 'custom_gateway',
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Generic WhatsApp gateway delivery failed';
        console.error(`[DISPATCH:ERROR:WHATSAPP:GATEWAY] Failed to send to ${to}:`, msg);
        return {
          sent: false,
          recipient: to,
          status: 'failed',
          error: msg,
          provider: 'custom_gateway',
        };
      }
    }

    // 4. Not Configured (Log simulation in dev/test)
    if (env.NODE_ENV !== 'production') {
      console.log(`[DISPATCH:SIMULATED:WHATSAPP] Recipient: +${to} | URL: ${fullUrl} | Expiry: ${expiresAtStr}`);
    }

    return {
      sent: false,
      recipient: to,
      status: 'not_configured',
      error: 'WhatsApp provider not configured in environment (.env: WHATSAPP_API_URL, WHATSAPP_TOKEN, or TWILIO_*)',
    };
  }
}

export default NotificationService;

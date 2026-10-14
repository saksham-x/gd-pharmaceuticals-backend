import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config/env.js';

const SENDER_NAME = 'G.D. Pharmaceuticals';
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

let transporter: Transporter | null = null;

function getTransporter(user: string, pass: string): Transporter {
  transporter ??= nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  return transporter;
}

async function sendWithBrevo(apiKey: string, from: string, to: string, subject: string, html: string): Promise<void> {
  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: from },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Brevo responded ${res.status}: ${await res.text()}`);
  }
}

/** Sends an HTML email. Resolves to false (without throwing) when email is not configured. */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const email = config.email;
  if (!email) {
    console.warn(`Email not configured — skipped "${subject}" to ${to}`);
    return false;
  }

  if (email.brevoApiKey) {
    await sendWithBrevo(email.brevoApiKey, email.user, to, subject, html);
  } else if (email.pass) {
    await getTransporter(email.user, email.pass).sendMail({
      from: `"${SENDER_NAME}" <${email.user}>`,
      to,
      subject,
      html,
    });
  }
  return true;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Customer-supplied values go into email HTML — escape them. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

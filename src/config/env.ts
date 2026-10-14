import dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';

dotenv.config({ quiet: true });

type JwtExpiresIn = NonNullable<SignOptions['expiresIn']>;

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const optionalUrl = optionalString.pipe(z.url({ error: 'Must be a valid URL' }).optional());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce
    .number({ error: 'PORT is required and must be a number' })
    .int()
    .min(1, { error: 'PORT must be between 1 and 65535' })
    .max(65535, { error: 'PORT must be between 1 and 65535' }),
  MONGO_URI: z.string().trim().min(1, { error: 'MONGO_URI is required' }),
  JWT_SECRET: z.string().min(32, { error: 'JWT_SECRET must be at least 32 characters' }),
  JWT_EXPIRES_IN: z
    .string()
    .trim()
    .regex(/^\d+(ms|s|m|h|d|w|y)?$/, { error: 'JWT_EXPIRES_IN must look like 3600, 15m, 12h or 7d' })
    .transform((value) => value as JwtExpiresIn),
  // Optional, comma-separated. Overrides the DNS servers Node uses for mongodb+srv:// lookups.
  DNS_SERVERS: z
    .string()
    .optional()
    .transform((value) => (value ?? '').split(',').map((server) => server.trim()).filter(Boolean))
    .pipe(z.array(z.union([z.ipv4(), z.ipv6()]), { error: 'DNS_SERVERS must be comma-separated IP addresses' })),

  // Extra browser origins allowed by CORS, on top of the built-in list in app.ts.
  FRONTEND_URL: optionalUrl,
  FRONTEND_WWW_URL: optionalUrl,
  ADMIN_URL: optionalUrl,

  // Image uploads. POST /api/upload answers 503 until all three are set.
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,

  // Sender address for all emails. Emails are skipped unless it is set along with BREVO_API_KEY or EMAIL_PASS.
  EMAIL_USER: optionalString,
  // Brevo sends over HTTPS — required on hosts that block SMTP ports (e.g. Render free tier). Takes priority.
  BREVO_API_KEY: optionalString,
  // Gmail app password, used over SMTP when BREVO_API_KEY is unset (fine for local development).
  EMAIL_PASS: optionalString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.map(String).join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;

const cloudinary =
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
    ? Object.freeze({
        cloudName: env.CLOUDINARY_CLOUD_NAME,
        apiKey: env.CLOUDINARY_API_KEY,
        apiSecret: env.CLOUDINARY_API_SECRET,
      })
    : null;

const email =
  env.EMAIL_USER && (env.BREVO_API_KEY || env.EMAIL_PASS)
    ? Object.freeze({ user: env.EMAIL_USER, brevoApiKey: env.BREVO_API_KEY, pass: env.EMAIL_PASS })
    : null;

export const config = Object.freeze({
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT,
  mongoUri: env.MONGO_URI,
  dnsServers: Object.freeze(env.DNS_SERVERS),
  jwt: Object.freeze({
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  }),
  corsOrigins: Object.freeze(
    [env.FRONTEND_URL, env.FRONTEND_WWW_URL, env.ADMIN_URL].filter((url): url is string => Boolean(url)),
  ),
  /** null when Cloudinary is not configured. */
  cloudinary,
  /** null when email sending is not configured. */
  email,
});

export type Config = typeof config;

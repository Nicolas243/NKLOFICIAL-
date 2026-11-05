import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1),
  DAILY_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_GOOGLE_ADS_VERIFICATION: z.string().min(1).optional(),
  MERCADOPAGO_CLIENT_ID: z.string().min(1).optional(),
  MERCADOPAGO_CLIENT_SECRET: z.string().min(1).optional(),
  MERCADOPAGO_REDIRECT_URI: z.string().url().optional(),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  MERCADOPAGO_REDIRECT_URI:
    parsedEnv.MERCADOPAGO_REDIRECT_URI
    ?? `${parsedEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/api/payments/mp-callback`,
};

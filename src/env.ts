import { z } from 'zod';
import { hasStripeConfiguration } from '@/lib/stripe/config';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  DAILY_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  GUEST_CHECKOUT_ENCRYPTION_KEY: z.string().min(32).optional(),
  EMAIL_DELIVERY_MODE: z.enum(['preview', 'resend']).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  EMAIL_REPLY_TO: z.string().email().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_GOOGLE_ADS_VERIFICATION: z.string().min(1).optional(),
});

const parsedEnv = envSchema.parse(process.env);

if (
  process.env.NODE_ENV === 'production'
  && !hasStripeConfiguration(parsedEnv)
) {
  throw new Error('STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET são obrigatórios em produção.');
}

export const env = {
  ...parsedEnv,
};

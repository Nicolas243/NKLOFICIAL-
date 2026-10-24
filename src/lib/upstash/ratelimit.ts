import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const WINDOW_LIMIT = 5;
const WINDOW_DURATION = '1 m';

let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit {
  if (limiter) {
    return limiter;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Rate limiting indisponível: configure as variáveis do Upstash Redis.');
  }

  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(WINDOW_LIMIT, WINDOW_DURATION),
    analytics: true,
    prefix: 'portal-nkl:public-actions',
  });

  return limiter;
}

export async function enforcePublicRateLimit(
  action: string,
  identifier: string,
): Promise<void> {
  const result = await getLimiter().limit(`${action}:${identifier}`);

  if (!result.success) {
    throw new Error('Muitas tentativas. Aguarde um minuto antes de tentar novamente.');
  }
}

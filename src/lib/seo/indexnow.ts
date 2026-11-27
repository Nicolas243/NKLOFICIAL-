import { SITE_URL, absoluteSiteUrl } from '@/lib/site';

export const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY?.trim() || 'a7f4c92e1b8d40539e6c1a2f8b4d7e03';

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

const MAX_INDEXNOW_URLS = 10000;
const INDEXNOW_TIMEOUT_MS = 8000;

export type IndexNowPayload = {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
};

export type IndexNowSubmitResult = {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  submittedCount: number;
  error?: string;
};

/**
 * Normaliza, valida o host, deduplica e limita a 10.000 URLs para envio ao IndexNow.
 */
export function buildIndexNowPayload(urls: string[]): IndexNowPayload {
  const siteOrigin = new URL(SITE_URL);
  const host = siteOrigin.host;
  const keyLocation = `${SITE_URL}/${INDEXNOW_KEY}.txt`;
  const deduplicated = new Set<string>();

  for (const rawEntry of urls) {
    if (deduplicated.size >= MAX_INDEXNOW_URLS) break;

    const trimmed = rawEntry.trim();
    if (!trimmed) continue;

    const candidate = /^https?:\/\//u.test(trimmed)
      ? trimmed
      : absoluteSiteUrl(trimmed);

    try {
      const parsed = new URL(candidate);
      if (parsed.host !== host) continue;
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') continue;
      deduplicated.add(parsed.toString());
    } catch {
      continue;
    }
  }

  return {
    host,
    key: INDEXNOW_KEY,
    keyLocation,
    urlList: Array.from(deduplicated),
  };
}

/**
 * Envia URLs atualizadas para o endpoint IndexNow sem lançar exceções em falhas de rede.
 */
export async function submitIndexNowUrls(
  urls: string[],
  options?: { force?: boolean },
): Promise<IndexNowSubmitResult> {
  const payload = buildIndexNowPayload(urls);

  if (payload.urlList.length === 0) {
    return { ok: true, skipped: true, submittedCount: 0 };
  }

  if (!options?.force && process.env.NODE_ENV !== 'production') {
    return { ok: true, skipped: true, submittedCount: 0 };
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(INDEXNOW_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        submittedCount: payload.urlList.length,
        error: `HTTP ${response.status}`,
      };
    }

    return {
      ok: true,
      status: response.status,
      submittedCount: payload.urlList.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao enviar IndexNow.';
    return {
      ok: false,
      submittedCount: payload.urlList.length,
      error: message,
    };
  }
}

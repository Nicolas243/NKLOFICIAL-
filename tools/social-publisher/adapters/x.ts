import type { AdapterPublishPayload, AdapterPublishResult } from "../types";
import { composePostText } from "../validators";

export interface XCredentials {
  accessToken: string;
  mediaId?: string;
}

const X_TWEETS_ENDPOINT = "https://api.x.com/2/tweets";

export async function publishToX(
  payload: AdapterPublishPayload,
  credentials: XCredentials,
  fetchImpl: typeof fetch = fetch,
): Promise<AdapterPublishResult> {
  if (payload.dryRun) {
    return {
      ok: true,
      channel: "x",
      dryRun: true,
      requestPlan: {
        method: "POST",
        endpoints: [X_TWEETS_ENDPOINT],
        summary: "Publicar post na X API v2 (/2/tweets) com OAuth 2.0 User Context e media_ids opcional.",
      },
    };
  }

  if (!credentials.accessToken?.trim()) {
    return {
      ok: false,
      channel: "x",
      error: "Credencial X ausente: configure X_ACCESS_TOKEN.",
    };
  }

  try {
    const text = composePostText(payload.caption, payload.hashtags);
    const body: Record<string, unknown> = { text };
    if (credentials.mediaId?.trim()) {
      body.media = { media_ids: [credentials.mediaId.trim()] };
    }

    const response = await fetchImpl(X_TWEETS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return {
        ok: false,
        channel: "x",
        error: `Falha ao publicar no X API v2 (HTTP ${response.status}).`,
      };
    }

    const data = (await response.json()) as { data?: { id?: string } };
    const id = data.data?.id;
    return {
      ok: true,
      channel: "x",
      externalId: id,
      externalUrl: id ? `https://x.com/i/web/status/${id}` : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      channel: "x",
      error: error instanceof Error ? error.message : "Erro inesperado na API do X.",
    };
  }
}

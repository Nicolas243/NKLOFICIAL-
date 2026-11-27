import { createHmac } from "node:crypto";
import type { AdapterPublishPayload, AdapterPublishResult } from "../types";
import { composePostText } from "../validators";

export interface PostizCredentials {
  apiUrl: string;
  apiKey: string;
}

export interface WebhookCredentials {
  webhookUrl: string;
  webhookSecret?: string;
}

function normalizePostizEndpoint(apiUrl?: string): string {
  const base = (apiUrl?.trim() || "http://localhost:4007/api").replace(/\/+$/, "");
  return base.endsWith("/public/v1/posts") ? base : `${base}/public/v1/posts`;
}

export async function publishToPostiz(
  payload: AdapterPublishPayload,
  credentials: PostizCredentials,
  fetchImpl: typeof fetch = fetch,
): Promise<AdapterPublishResult> {
  const endpoint = normalizePostizEndpoint(credentials.apiUrl);

  if (payload.dryRun) {
    return {
      ok: true,
      channel: payload.channel,
      dryRun: true,
      requestPlan: {
        method: "POST",
        endpoints: [endpoint],
        summary: "Enviar pacote agendado/imediato para Postiz Public API v1 (Kwai, Pinterest, LinkedIn, Reddit, Telegram).",
      },
    };
  }

  if (!credentials.apiUrl?.trim() || !credentials.apiKey?.trim()) {
    return {
      ok: false,
      channel: payload.channel,
      error: "Credenciais Postiz ausentes: configure POSTIZ_API_URL e POSTIZ_API_KEY.",
    };
  }

  try {
    const content = composePostText(payload.caption, payload.hashtags);
    const targets =
      payload.targetPlatforms && payload.targetPlatforms.length > 0
        ? payload.targetPlatforms
        : [payload.channel === "postiz" ? "kwai" : payload.channel];

    const body = {
      type: payload.scheduledAt ? "schedule" : "now",
      date: payload.scheduledAt ?? new Date().toISOString(),
      shortLink: false,
      tags: [],
      posts: targets.map((platform) => ({
        integration: { id: platform },
        value: [
          {
            content,
            ...(payload.videoUrl ? { image: [{ path: payload.videoUrl }] } : {}),
          },
        ],
        settings: {
          title: payload.title ?? payload.topic,
        },
      })),
      metadata: {
        jobId: payload.jobId,
        idempotencyKey: payload.idempotencyKey,
        targetUrl: payload.targetUrl,
      },
    };

    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Authorization: credentials.apiKey.trim(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return {
        ok: false,
        channel: payload.channel,
        error: `Falha ao publicar via Postiz (HTTP ${response.status}).`,
      };
    }

    const data = (await response.json().catch(() => ({}))) as {
      id?: string;
      postId?: string;
    };
    return {
      ok: true,
      channel: payload.channel,
      externalId: data.id ?? data.postId ?? payload.idempotencyKey,
    };
  } catch (error) {
    return {
      ok: false,
      channel: payload.channel,
      error: error instanceof Error ? error.message : "Erro inesperado na API do Postiz.",
    };
  }
}

export async function publishToWebhook(
  payload: AdapterPublishPayload,
  credentials: WebhookCredentials,
  fetchImpl: typeof fetch = fetch,
): Promise<AdapterPublishResult> {
  const endpoint = credentials.webhookUrl?.trim() || "https://example.invalid/webhook";

  if (payload.dryRun) {
    return {
      ok: true,
      channel: payload.channel,
      dryRun: true,
      requestPlan: {
        method: "POST",
        endpoints: [endpoint],
        summary: "Enviar JSON para ponte Webhook (n8n/Make) com assinatura opcional X-NKL-Signature HMAC-SHA256.",
      },
    };
  }

  if (!credentials.webhookUrl?.trim()) {
    return {
      ok: false,
      channel: payload.channel,
      error: "URL de Webhook ausente: configure SOCIAL_WEBHOOK_URL.",
    };
  }

  try {
    const bodyObject = {
      jobId: payload.jobId,
      idempotencyKey: payload.idempotencyKey,
      channel: payload.channel,
      topic: payload.topic,
      title: payload.title,
      caption: composePostText(payload.caption, payload.hashtags),
      hashtags: payload.hashtags,
      targetUrl: payload.targetUrl,
      navboostKeyword: payload.navboostKeyword,
      videoPath: payload.videoPath,
      verticalVideoPath: payload.verticalVideoPath,
      videoUrl: payload.videoUrl,
      scheduledAt: payload.scheduledAt,
      targetPlatforms:
        payload.targetPlatforms && payload.targetPlatforms.length > 0
          ? payload.targetPlatforms
          : ["kwai", "pinterest", "linkedin", "reddit", "telegram"],
    };

    const bodyText = JSON.stringify(bodyObject);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-NKL-Idempotency-Key": payload.idempotencyKey,
    };

    if (credentials.webhookSecret?.trim()) {
      const signature = createHmac("sha256", credentials.webhookSecret.trim())
        .update(bodyText)
        .digest("hex");
      headers["X-NKL-Signature"] = `sha256=${signature}`;
    }

    const response = await fetchImpl(credentials.webhookUrl.trim(), {
      method: "POST",
      headers,
      body: bodyText,
    });

    if (!response.ok) {
      return {
        ok: false,
        channel: payload.channel,
        error: `Falha ao enviar para Webhook (HTTP ${response.status}).`,
      };
    }

    const data = (await response.json().catch(() => ({}))) as {
      id?: string;
      executionId?: string;
    };
    return {
      ok: true,
      channel: payload.channel,
      externalId: data.id ?? data.executionId ?? payload.idempotencyKey,
    };
  } catch (error) {
    return {
      ok: false,
      channel: payload.channel,
      error: error instanceof Error ? error.message : "Erro inesperado no Webhook bridge.",
    };
  }
}

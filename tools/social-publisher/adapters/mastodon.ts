import { existsSync, readFileSync, statSync } from "node:fs";
import type { AdapterPublishPayload, AdapterPublishResult } from "../types";
import { composePostText } from "../validators";

export interface MastodonCredentials {
  instanceUrl: string;
  accessToken: string;
}

function normalizeInstanceUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return "https://mastodon.social";
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export async function publishToMastodon(
  payload: AdapterPublishPayload,
  credentials: MastodonCredentials,
  fetchImpl: typeof fetch = fetch,
): Promise<AdapterPublishResult> {
  const baseUrl = normalizeInstanceUrl(credentials.instanceUrl || "");
  const mediaEndpoint = `${baseUrl}/api/v2/media`;
  const statusEndpoint = `${baseUrl}/api/v1/statuses`;

  if (payload.dryRun) {
    return {
      ok: true,
      channel: "mastodon",
      dryRun: true,
      requestPlan: {
        method: "POST",
        endpoints: [mediaEndpoint, statusEndpoint],
        summary: "Enviar vídeo opcional via /api/v2/media e publicar status com Idempotency-Key em /api/v1/statuses.",
      },
    };
  }

  if (!credentials.instanceUrl?.trim() || !credentials.accessToken?.trim()) {
    return {
      ok: false,
      channel: "mastodon",
      error: "Credenciais Mastodon ausentes: configure MASTODON_INSTANCE_URL e MASTODON_ACCESS_TOKEN.",
    };
  }

  try {
    const token = credentials.accessToken.trim();
    const mediaIds: string[] = [];
    const localVideo = [payload.verticalVideoPath, payload.videoPath].find(
      (candidate) => candidate && existsSync(candidate) && statSync(candidate).isFile(),
    );

    if (localVideo) {
      const form = new FormData();
      const buffer = readFileSync(localVideo);
      form.append("file", new Blob([buffer], { type: "video/mp4" }), "video.mp4");
      form.append("description", payload.topic);

      const mediaRes = await fetchImpl(mediaEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (!mediaRes.ok) {
        return {
          ok: false,
          channel: "mastodon",
          error: `Falha ao enviar mídia no Mastodon (HTTP ${mediaRes.status}).`,
        };
      }

      const mediaData = (await mediaRes.json()) as { id?: string };
      if (mediaData.id) {
        mediaIds.push(mediaData.id);
      }
    }

    const statusText = composePostText(payload.caption, payload.hashtags);
    const statusRes = await fetchImpl(statusEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": payload.idempotencyKey,
      },
      body: JSON.stringify({
        status: statusText,
        visibility: payload.visibility ?? "public",
        language: "pt",
        ...(mediaIds.length > 0 ? { media_ids: mediaIds } : {}),
        ...(payload.scheduledAt ? { scheduled_at: payload.scheduledAt } : {}),
      }),
    });

    if (!statusRes.ok) {
      return {
        ok: false,
        channel: "mastodon",
        error: `Falha ao publicar status no Mastodon (HTTP ${statusRes.status}).`,
      };
    }

    const statusData = (await statusRes.json()) as { id?: string; url?: string };
    return {
      ok: true,
      channel: "mastodon",
      externalId: statusData.id,
      externalUrl: statusData.url,
    };
  } catch (error) {
    return {
      ok: false,
      channel: "mastodon",
      error: error instanceof Error ? error.message : "Erro inesperado na API do Mastodon.",
    };
  }
}

import { existsSync, readFileSync, statSync } from "node:fs";
import type { AdapterPublishPayload, AdapterPublishResult } from "../types";
import { composePostText } from "../validators";

export interface YoutubeCredentials {
  accessToken?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

const YOUTUBE_RESUMABLE_ENDPOINT =
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";
const GOOGLE_OAUTH_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

async function resolveYoutubeAccessToken(
  credentials: YoutubeCredentials,
  fetchImpl: typeof fetch,
): Promise<string | null> {
  if (credentials.accessToken?.trim()) {
    return credentials.accessToken.trim();
  }
  if (
    !credentials.clientId?.trim() ||
    !credentials.clientSecret?.trim() ||
    !credentials.refreshToken?.trim()
  ) {
    return null;
  }

  const body = new URLSearchParams({
    client_id: credentials.clientId.trim(),
    client_secret: credentials.clientSecret.trim(),
    refresh_token: credentials.refreshToken.trim(),
    grant_type: "refresh_token",
  });

  const tokenRes = await fetchImpl(GOOGLE_OAUTH_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!tokenRes.ok) {
    throw new Error(`Falha ao renovar OAuth YouTube (HTTP ${tokenRes.status}).`);
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  return tokenData.access_token?.trim() || null;
}

export async function publishToYoutube(
  payload: AdapterPublishPayload,
  credentials: YoutubeCredentials,
  fetchImpl: typeof fetch = fetch,
): Promise<AdapterPublishResult> {
  if (payload.dryRun) {
    return {
      ok: true,
      channel: "youtube",
      dryRun: true,
      requestPlan: {
        method: "POST",
        endpoints: [YOUTUBE_RESUMABLE_ENDPOINT],
        summary: "Iniciar sessão resumable na YouTube Data API v3 e enviar bytes MP4 quando o arquivo existir localmente.",
      },
    };
  }

  try {
    const token = await resolveYoutubeAccessToken(credentials, fetchImpl);
    if (!token) {
      return {
        ok: false,
        channel: "youtube",
        error:
          "Credenciais YouTube ausentes: configure YOUTUBE_ACCESS_TOKEN ou OAuth (YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN).",
      };
    }

    const title = (payload.title?.trim() || payload.topic).slice(0, 100);
    const description = composePostText(payload.caption, payload.hashtags);
    const tags = payload.hashtags.map((tag) => tag.replace(/^#+/, "")).filter(Boolean);

    const localVideo = [payload.videoPath, payload.verticalVideoPath].find(
      (candidate) => candidate && existsSync(candidate) && statSync(candidate).isFile(),
    );
    const videoBytes = localVideo ? readFileSync(localVideo) : undefined;

    const initHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": "video/mp4",
    };
    if (videoBytes) {
      initHeaders["X-Upload-Content-Length"] = String(videoBytes.byteLength);
    }

    const initRes = await fetchImpl(YOUTUBE_RESUMABLE_ENDPOINT, {
      method: "POST",
      headers: initHeaders,
      body: JSON.stringify({
        snippet: {
          title,
          description,
          tags,
          defaultLanguage: "pt-BR",
          categoryId: "27",
        },
        status: {
          privacyStatus: payload.visibility ?? "public",
          ...(payload.scheduledAt ? { publishAt: payload.scheduledAt } : {}),
        },
      }),
    });

    if (!initRes.ok) {
      return {
        ok: false,
        channel: "youtube",
        error: `Falha ao iniciar upload resumable no YouTube (HTTP ${initRes.status}).`,
      };
    }

    const uploadLocation = initRes.headers.get("location");
    if (uploadLocation && videoBytes) {
      const putRes = await fetchImpl(uploadLocation, {
        method: "PUT",
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": String(videoBytes.byteLength),
        },
        body: videoBytes,
      });

      if (!putRes.ok) {
        return {
          ok: false,
          channel: "youtube",
          error: `Falha ao enviar vídeo no YouTube PUT resumable (HTTP ${putRes.status}).`,
        };
      }

      const uploaded = (await putRes.json()) as { id?: string };
      return {
        ok: true,
        channel: "youtube",
        externalId: uploaded.id,
        externalUrl: uploaded.id ? `https://www.youtube.com/watch?v=${uploaded.id}` : undefined,
      };
    }

    const initData = (await initRes.json().catch(() => ({}))) as { id?: string };
    return {
      ok: true,
      channel: "youtube",
      externalId: initData.id ?? payload.idempotencyKey,
      externalUrl: initData.id ? `https://www.youtube.com/watch?v=${initData.id}` : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      channel: "youtube",
      error: error instanceof Error ? error.message : "Erro inesperado na API do YouTube.",
    };
  }
}

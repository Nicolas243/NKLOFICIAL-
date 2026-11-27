import { existsSync, readFileSync, statSync } from "node:fs";
import type { AdapterPublishPayload, AdapterPublishResult } from "../types";
import { composePostText } from "../validators";

export interface TiktokCredentials {
  accessToken: string;
}

const TIKTOK_INIT_ENDPOINT = "https://open.tiktokapis.com/v2/post/publish/video/init/";

function mapPrivacyLevel(visibility?: "public" | "unlisted" | "private"): string {
  if (visibility === "private") {
    return "SELF_ONLY";
  }
  if (visibility === "unlisted") {
    return "MUTUAL_FOLLOW_FRIENDS";
  }
  return "PUBLIC_TO_EVERYONE";
}

export async function publishToTiktok(
  payload: AdapterPublishPayload,
  credentials: TiktokCredentials,
  fetchImpl: typeof fetch = fetch,
): Promise<AdapterPublishResult> {
  if (payload.dryRun) {
    return {
      ok: true,
      channel: "tiktok",
      dryRun: true,
      requestPlan: {
        method: "POST",
        endpoints: [TIKTOK_INIT_ENDPOINT],
        summary: "Inicializar publicação na TikTok Content Posting API v2 via PULL_FROM_URL ou FILE_UPLOAD.",
      },
    };
  }

  if (!credentials.accessToken?.trim()) {
    return {
      ok: false,
      channel: "tiktok",
      error: "Credencial TikTok ausente: configure TIKTOK_ACCESS_TOKEN.",
    };
  }

  try {
    const title = composePostText(payload.caption, payload.hashtags).slice(0, 2200);
    const localVideo = [payload.verticalVideoPath, payload.videoPath].find(
      (candidate) => candidate && existsSync(candidate) && statSync(candidate).isFile(),
    );
    const videoBytes = localVideo ? readFileSync(localVideo) : undefined;

    if (!payload.videoUrl && !videoBytes) {
      return {
        ok: false,
        channel: "tiktok",
        error: "TikTok exige videoUrl pública ou arquivo MP4 local válido.",
      };
    }

    const sourceInfo = payload.videoUrl
      ? {
          source: "PULL_FROM_URL",
          video_url: payload.videoUrl,
        }
      : {
          source: "FILE_UPLOAD",
          video_size: videoBytes!.byteLength,
          chunk_size: videoBytes!.byteLength,
          total_chunk_count: 1,
        };

    const initRes = await fetchImpl(TIKTOK_INIT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken.trim()}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title,
          privacy_level: mapPrivacyLevel(payload.visibility),
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: sourceInfo,
      }),
    });

    if (!initRes.ok) {
      return {
        ok: false,
        channel: "tiktok",
        error: `Falha ao inicializar publicação no TikTok (HTTP ${initRes.status}).`,
      };
    }

    const initData = (await initRes.json()) as {
      data?: { publish_id?: string; upload_url?: string };
      error?: { code?: string; message?: string };
    };

    if (initData.error?.code && initData.error.code !== "ok") {
      return {
        ok: false,
        channel: "tiktok",
        error: initData.error.message || `Erro TikTok: ${initData.error.code}`,
      };
    }

    const uploadUrl = initData.data?.upload_url;
    if (uploadUrl && videoBytes) {
      const uploadRes = await fetchImpl(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "video/mp4",
          "Content-Range": `bytes 0-${videoBytes.byteLength - 1}/${videoBytes.byteLength}`,
        },
        body: videoBytes,
      });

      if (!uploadRes.ok) {
        return {
          ok: false,
          channel: "tiktok",
          error: `Falha ao enviar bytes no TikTok upload_url (HTTP ${uploadRes.status}).`,
        };
      }
    }

    return {
      ok: true,
      channel: "tiktok",
      externalId: initData.data?.publish_id,
    };
  } catch (error) {
    return {
      ok: false,
      channel: "tiktok",
      error: error instanceof Error ? error.message : "Erro inesperado na API do TikTok.",
    };
  }
}

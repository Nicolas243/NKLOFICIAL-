import type { AdapterPublishPayload, AdapterPublishResult } from "../types";
import { composePostText } from "../validators";

export interface InstagramCredentials {
  igUserId: string;
  accessToken: string;
}

export interface FacebookCredentials {
  pageId: string;
  accessToken: string;
}

const META_GRAPH_BASE = "https://graph.facebook.com/v21.0";

export async function publishToInstagram(
  payload: AdapterPublishPayload,
  credentials: InstagramCredentials,
  fetchImpl: typeof fetch = fetch,
): Promise<AdapterPublishResult> {
  const igUserId = credentials.igUserId?.trim() || "{igUserId}";
  const containerEndpoint = `${META_GRAPH_BASE}/${encodeURIComponent(igUserId)}/media`;
  const publishEndpoint = `${META_GRAPH_BASE}/${encodeURIComponent(igUserId)}/media_publish`;

  if (payload.dryRun) {
    return {
      ok: true,
      channel: "instagram",
      dryRun: true,
      requestPlan: {
        method: "POST",
        endpoints: [containerEndpoint, publishEndpoint],
        summary: "Criar container REELS na Meta Graph API v21.0 e publicar via media_publish.",
      },
    };
  }

  if (!credentials.igUserId?.trim() || !credentials.accessToken?.trim()) {
    return {
      ok: false,
      channel: "instagram",
      error: "Credenciais Instagram ausentes: configure META_IG_USER_ID e META_ACCESS_TOKEN.",
    };
  }

  if (!payload.videoUrl) {
    return {
      ok: false,
      channel: "instagram",
      error: "Instagram Graph API exige videoUrl pública (HTTPS) para publicar Reels.",
    };
  }

  try {
    const caption = composePostText(payload.caption, payload.hashtags);
    const containerParams = new URLSearchParams({
      media_type: "REELS",
      video_url: payload.videoUrl,
      caption,
      access_token: credentials.accessToken.trim(),
    });

    const containerRes = await fetchImpl(containerEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: containerParams.toString(),
    });

    if (!containerRes.ok) {
      return {
        ok: false,
        channel: "instagram",
        error: `Falha ao criar container Reels no Instagram (HTTP ${containerRes.status}).`,
      };
    }

    const containerData = (await containerRes.json()) as { id?: string };
    if (!containerData.id) {
      return {
        ok: false,
        channel: "instagram",
        error: "Meta Graph API não retornou creation_id para o Reels.",
      };
    }

    const publishParams = new URLSearchParams({
      creation_id: containerData.id,
      access_token: credentials.accessToken.trim(),
    });

    const publishRes = await fetchImpl(publishEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: publishParams.toString(),
    });

    if (!publishRes.ok) {
      return {
        ok: false,
        channel: "instagram",
        error: `Falha ao publicar Reels no Instagram (HTTP ${publishRes.status}).`,
      };
    }

    const publishData = (await publishRes.json()) as { id?: string };
    return {
      ok: true,
      channel: "instagram",
      externalId: publishData.id ?? containerData.id,
    };
  } catch (error) {
    return {
      ok: false,
      channel: "instagram",
      error: error instanceof Error ? error.message : "Erro inesperado na API do Instagram.",
    };
  }
}

export async function publishToFacebook(
  payload: AdapterPublishPayload,
  credentials: FacebookCredentials,
  fetchImpl: typeof fetch = fetch,
): Promise<AdapterPublishResult> {
  const pageId = credentials.pageId?.trim() || "{pageId}";
  const endpoint = `${META_GRAPH_BASE}/${encodeURIComponent(pageId)}/videos`;

  if (payload.dryRun) {
    return {
      ok: true,
      channel: "facebook",
      dryRun: true,
      requestPlan: {
        method: "POST",
        endpoints: [endpoint],
        summary: "Publicar vídeo na Página do Facebook via Meta Graph API v21.0.",
      },
    };
  }

  if (!credentials.pageId?.trim() || !credentials.accessToken?.trim()) {
    return {
      ok: false,
      channel: "facebook",
      error: "Credenciais Facebook ausentes: configure META_FB_PAGE_ID e META_ACCESS_TOKEN.",
    };
  }

  if (!payload.videoUrl) {
    return {
      ok: false,
      channel: "facebook",
      error: "Facebook Page Videos API exige videoUrl pública (HTTPS) neste fluxo.",
    };
  }

  try {
    const description = composePostText(payload.caption, payload.hashtags);
    const params = new URLSearchParams({
      file_url: payload.videoUrl,
      title: (payload.title?.trim() || payload.topic).slice(0, 120),
      description,
      access_token: credentials.accessToken.trim(),
    });

    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      return {
        ok: false,
        channel: "facebook",
        error: `Falha ao publicar vídeo no Facebook (HTTP ${response.status}).`,
      };
    }

    const data = (await response.json()) as { id?: string };
    return {
      ok: true,
      channel: "facebook",
      externalId: data.id,
      externalUrl: data.id ? `https://www.facebook.com/${pageId}/videos/${data.id}` : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      channel: "facebook",
      error: error instanceof Error ? error.message : "Erro inesperado na API do Facebook.",
    };
  }
}

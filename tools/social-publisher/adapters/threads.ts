import type { AdapterPublishPayload, AdapterPublishResult } from "../types";
import { composePostText } from "../validators";

export interface ThreadsCredentials {
  userId: string;
  accessToken: string;
}

const THREADS_GRAPH_BASE = "https://graph.threads.net/v1.0";

export async function publishToThreads(
  payload: AdapterPublishPayload,
  credentials: ThreadsCredentials,
  fetchImpl: typeof fetch = fetch,
): Promise<AdapterPublishResult> {
  const userId = credentials.userId?.trim() || "{userId}";
  const createEndpoint = `${THREADS_GRAPH_BASE}/${encodeURIComponent(userId)}/threads`;
  const publishEndpoint = `${THREADS_GRAPH_BASE}/${encodeURIComponent(userId)}/threads_publish`;

  if (payload.dryRun) {
    return {
      ok: true,
      channel: "threads",
      dryRun: true,
      requestPlan: {
        method: "POST",
        endpoints: [createEndpoint, publishEndpoint],
        summary: payload.videoUrl
          ? "Criar container VIDEO na Threads Graph API v1.0 e publicar via threads_publish."
          : "Criar container TEXT na Threads Graph API v1.0 e publicar via threads_publish.",
      },
    };
  }

  if (!credentials.userId?.trim() || !credentials.accessToken?.trim()) {
    return {
      ok: false,
      channel: "threads",
      error: "Credenciais Threads ausentes: configure THREADS_USER_ID e THREADS_ACCESS_TOKEN.",
    };
  }

  try {
    const text = composePostText(payload.caption, payload.hashtags);
    const createParams = new URLSearchParams({
      media_type: payload.videoUrl ? "VIDEO" : "TEXT",
      text,
      access_token: credentials.accessToken.trim(),
    });
    if (payload.videoUrl) {
      createParams.set("video_url", payload.videoUrl);
    }

    const createRes = await fetchImpl(createEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: createParams.toString(),
    });

    if (!createRes.ok) {
      return {
        ok: false,
        channel: "threads",
        error: `Falha ao criar container no Threads (HTTP ${createRes.status}).`,
      };
    }

    const createData = (await createRes.json()) as { id?: string };
    if (!createData.id) {
      return {
        ok: false,
        channel: "threads",
        error: "Threads Graph API não retornou creation_id.",
      };
    }

    const publishParams = new URLSearchParams({
      creation_id: createData.id,
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
        channel: "threads",
        error: `Falha ao publicar container no Threads (HTTP ${publishRes.status}).`,
      };
    }

    const publishData = (await publishRes.json()) as { id?: string };
    return {
      ok: true,
      channel: "threads",
      externalId: publishData.id ?? createData.id,
    };
  } catch (error) {
    return {
      ok: false,
      channel: "threads",
      error: error instanceof Error ? error.message : "Erro inesperado na API do Threads.",
    };
  }
}

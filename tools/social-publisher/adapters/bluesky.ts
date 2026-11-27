import { existsSync, readFileSync, statSync } from "node:fs";
import type { AdapterPublishPayload, AdapterPublishResult } from "../types";
import { composePostText } from "../validators";

export interface BlueskyCredentials {
  handle: string;
  appPassword: string;
  pdsUrl?: string;
}

function normalizePdsUrl(pdsUrl?: string): string {
  const base = pdsUrl?.trim() || "https://bsky.social";
  return base.replace(/\/+$/, "");
}

function resolveVideoPath(payload: AdapterPublishPayload): string | undefined {
  const candidate = payload.verticalVideoPath || payload.videoPath;
  if (!candidate) {
    return undefined;
  }
  return existsSync(candidate) && statSync(candidate).isFile() ? candidate : undefined;
}

export async function publishToBluesky(
  payload: AdapterPublishPayload,
  credentials: BlueskyCredentials,
  fetchImpl: typeof fetch = fetch,
): Promise<AdapterPublishResult> {
  const pdsUrl = normalizePdsUrl(credentials.pdsUrl);
  const endpoints = [
    `${pdsUrl}/xrpc/com.atproto.server.createSession`,
    `${pdsUrl}/xrpc/com.atproto.repo.uploadBlob`,
    `${pdsUrl}/xrpc/com.atproto.repo.createRecord`,
  ];

  if (payload.dryRun) {
    return {
      ok: true,
      channel: "bluesky",
      dryRun: true,
      requestPlan: {
        method: "POST",
        endpoints,
        summary: "Autenticar via AT Protocol App Password, enviar vídeo opcional via uploadBlob e criar app.bsky.feed.post.",
      },
    };
  }

  if (!credentials.handle?.trim() || !credentials.appPassword?.trim()) {
    return {
      ok: false,
      channel: "bluesky",
      error: "Credenciais Bluesky ausentes: configure BLUESKY_HANDLE e BLUESKY_APP_PASSWORD.",
    };
  }

  try {
    const sessionRes = await fetchImpl(endpoints[0], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: credentials.handle.trim(),
        password: credentials.appPassword.trim(),
      }),
    });

    if (!sessionRes.ok) {
      return {
        ok: false,
        channel: "bluesky",
        error: `Falha ao autenticar no Bluesky (HTTP ${sessionRes.status}).`,
      };
    }

    const sessionData = (await sessionRes.json()) as {
      accessJwt?: string;
      did?: string;
      handle?: string;
    };
    if (!sessionData.accessJwt || !sessionData.did) {
      return {
        ok: false,
        channel: "bluesky",
        error: "Resposta de sessão Bluesky sem accessJwt ou did.",
      };
    }

    let embed: Record<string, unknown> | undefined;
    const localVideo = resolveVideoPath(payload);
    if (localVideo) {
      const videoBytes = readFileSync(localVideo);
      const blobRes = await fetchImpl(endpoints[1], {
        method: "POST",
        headers: {
          "Content-Type": "video/mp4",
          Authorization: `Bearer ${sessionData.accessJwt}`,
        },
        body: videoBytes,
      });

      if (!blobRes.ok) {
        return {
          ok: false,
          channel: "bluesky",
          error: `Falha ao enviar vídeo para Bluesky uploadBlob (HTTP ${blobRes.status}).`,
        };
      }

      const blobData = (await blobRes.json()) as { blob?: unknown };
      if (blobData.blob) {
        embed = {
          $type: "app.bsky.embed.video",
          video: blobData.blob,
          alt: payload.topic,
        };
      }
    }

    const text = composePostText(payload.caption, payload.hashtags);
    const recordRes = await fetchImpl(endpoints[2], {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.accessJwt}`,
      },
      body: JSON.stringify({
        repo: sessionData.did,
        collection: "app.bsky.feed.post",
        record: {
          $type: "app.bsky.feed.post",
          text,
          langs: ["pt"],
          createdAt: new Date().toISOString(),
          ...(embed ? { embed } : {}),
        },
      }),
    });

    if (!recordRes.ok) {
      return {
        ok: false,
        channel: "bluesky",
        error: `Falha ao publicar no Bluesky createRecord (HTTP ${recordRes.status}).`,
      };
    }

    const recordData = (await recordRes.json()) as { uri?: string; cid?: string };
    const rkey = recordData.uri?.split("/").at(-1);
    const handle = sessionData.handle || credentials.handle.trim();
    const externalUrl = rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : undefined;

    return {
      ok: true,
      channel: "bluesky",
      externalId: recordData.uri ?? recordData.cid,
      externalUrl,
    };
  } catch (error) {
    return {
      ok: false,
      channel: "bluesky",
      error: error instanceof Error ? error.message : "Erro inesperado na API do Bluesky.",
    };
  }
}

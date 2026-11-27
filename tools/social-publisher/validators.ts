import { z } from "zod";
import {
  SOCIAL_CHANNELS,
  type ChannelConnectionMode,
  type ChannelConnectionStatus,
  type ChannelLimits,
  type PostValidationInput,
  type PostValidationResult,
  type SocialChannel,
  type SocialPublishJob,
} from "./types";

export const CHANNEL_LIMITS: Record<SocialChannel, ChannelLimits> = {
  bluesky: { maxChars: 300, maxVideoSeconds: 60, maxFileMb: 50 },
  threads: { maxChars: 500, maxVideoSeconds: 300, maxFileMb: 1024 },
  mastodon: { maxChars: 500, maxVideoSeconds: 300, maxFileMb: 40 },
  x: { maxChars: 280, maxVideoSeconds: 140, maxFileMb: 512 },
  youtube: { maxTitle: 100, maxChars: 5000, maxVideoSeconds: 43200 },
  tiktok: { maxChars: 2200, maxVideoSeconds: 600 },
  instagram: { maxChars: 2200, maxVideoSeconds: 900 },
  facebook: { maxChars: 2200, maxVideoSeconds: 14400 },
  bilibili: { maxTitle: 80, maxChars: 2000 },
  kwai: { maxChars: 2200 },
  postiz: { maxChars: 2200 },
  webhook: { maxChars: 2200 },
};

export interface ChannelMetadata {
  label: string;
  description: string;
  mode: ChannelConnectionMode;
  docsUrl: string;
}

export const CHANNEL_METADATA: Record<SocialChannel, ChannelMetadata> = {
  youtube: {
    label: "YouTube",
    description: "YouTube Data API v3 (Shorts e vídeos longos com upload resumable).",
    mode: "native_api",
    docsUrl: "https://developers.google.com/youtube/v3/docs/videos/insert",
  },
  tiktok: {
    label: "TikTok",
    description: "TikTok Content Posting API v2 (PULL_FROM_URL ou FILE_UPLOAD).",
    mode: "native_api",
    docsUrl: "https://developers.tiktok.com/doc/content-posting-api-get-started",
  },
  instagram: {
    label: "Instagram Reels",
    description: "Meta Graph API v21.0 (container REELS + media_publish).",
    mode: "native_api",
    docsUrl: "https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/content-publishing",
  },
  facebook: {
    label: "Facebook Página",
    description: "Meta Graph API v21.0 para vídeos e Reels em Página oficial.",
    mode: "native_api",
    docsUrl: "https://developers.facebook.com/docs/video-api/guides/publishing",
  },
  bilibili: {
    label: "Bilibili",
    description: "Publicação via ponte (Postiz ou Webhook n8n/Make) ou token dedicado.",
    mode: "bridge",
    docsUrl: "https://openhome.bilibili.com/",
  },
  bluesky: {
    label: "Bluesky (AT Protocol)",
    description: "AT Protocol oficial com App Password (createSession + uploadBlob + createRecord).",
    mode: "native_api",
    docsUrl: "https://docs.bsky.app/docs/tutorials/creating-a-post",
  },
  threads: {
    label: "Meta Threads",
    description: "Threads Graph API v1.0 oficial (container + threads_publish).",
    mode: "native_api",
    docsUrl: "https://developers.facebook.com/docs/threads/posts",
  },
  mastodon: {
    label: "Mastodon (Fediverse)",
    description: "API oficial v2/media + v1/statuses compatível com instâncias Mastodon.",
    mode: "native_api",
    docsUrl: "https://docs.joinmastodon.org/methods/statuses/",
  },
  x: {
    label: "X (Twitter)",
    description: "X API v2 (/2/tweets) com OAuth 2.0 User Context e mídia opcional.",
    mode: "native_api",
    docsUrl: "https://developer.x.com/en/docs/x-api/tweets/manage-tweets/api-reference/post-tweets",
  },
  kwai: {
    label: "Kwai",
    description: "Distribuído via Postiz ou Webhook (n8n/Make) junto com Pinterest, LinkedIn, Reddit e Telegram.",
    mode: "bridge",
    docsUrl: "https://docs.postiz.com/public-api",
  },
  postiz: {
    label: "Postiz (Multi-Redes)",
    description: "Instância própria do Postiz para agendar Kwai, Pinterest, LinkedIn, Reddit e Telegram.",
    mode: "bridge",
    docsUrl: "https://docs.postiz.com/public-api",
  },
  webhook: {
    label: "Webhook (n8n / Make)",
    description: "Ponte HTTP assinada com HMAC-SHA256 para fluxos em n8n, Make ou Zapier.",
    mode: "bridge",
    docsUrl: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/",
  },
};

const isoDateStringSchema = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  { message: "Data ISO inválida." },
);

export const socialChannelSchema = z.enum(SOCIAL_CHANNELS);

export const platformPostOverrideSchema = z.object({
  enabled: z.boolean().optional(),
  caption: z.string().trim().max(5000).optional(),
  title: z.string().trim().max(200).optional(),
  hashtags: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  scheduledAt: isoDateStringSchema.optional(),
  visibility: z.enum(["public", "unlisted", "private"]).optional(),
  videoUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  targetPlatforms: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
});

export const socialPublishJobSchema = z.object({
  id: z.string().trim().min(1).max(120),
  topic: z.string().trim().min(1).max(300),
  videoPath: z.string().trim().min(1).optional(),
  verticalVideoPath: z.string().trim().min(1).optional(),
  mediaSha256: z.string().trim().regex(/^[a-f0-9]{64}$/i).optional(),
  language: z.literal("pt-BR").default("pt-BR"),
  targetUrl: z.string().url().default("https://nkloficial.com.br"),
  navboostKeyword: z.string().trim().min(1).max(160).optional(),
  platforms: z.partialRecord(socialChannelSchema, platformPostOverrideSchema),
  createdAt: isoDateStringSchema,
});

const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

const BANNED_JARGON_PATTERNS = [
  /\bdiagn[oó]stico\b/i,
  /\bmapa editorial\b/i,
  /\becossistemas principais\b/i,
  /\bplataforma multidisciplinar\b/i,
  /\barquitetura\b/i,
  /\bsolu[cç][oõ]es integradas\b/i,
];

export function containsEmoji(value: string): boolean {
  return EMOJI_REGEX.test(value);
}

export function normalizeHashtag(tag: string): string {
  const cleaned = tag.trim().replace(/^#+/, "").replace(/\s+/g, "");
  return cleaned ? `#${cleaned}` : "";
}

export function composePostText(caption: string, hashtags: string[] = []): string {
  const base = caption.trim();
  const normalizedTags = hashtags
    .map(normalizeHashtag)
    .filter((tag) => Boolean(tag) && !base.toLowerCase().includes(tag.toLowerCase()));

  if (normalizedTags.length === 0) {
    return base;
  }
  return base ? `${base}\n\n${normalizedTags.join(" ")}` : normalizedTags.join(" ");
}

export function validatePostForChannel(
  channel: SocialChannel,
  post: PostValidationInput,
): PostValidationResult {
  const limits = CHANNEL_LIMITS[channel];
  const errors: string[] = [];
  const warnings: string[] = [];

  const caption = post.caption?.trim() ?? "";
  const title = post.title?.trim() ?? "";
  const fullText = composePostText(caption, post.hashtags ?? []);
  const remainingChars = limits.maxChars - fullText.length;

  if (!caption) {
    errors.push(`Texto da legenda obrigatório para ${CHANNEL_METADATA[channel].label}.`);
  }

  if (fullText.length > limits.maxChars) {
    errors.push(
      `Texto excede o limite de ${limits.maxChars} caracteres em ${Math.abs(remainingChars)} caracteres.`,
    );
  } else if (caption && remainingChars <= 20) {
    warnings.push(`Texto próximo do limite de ${limits.maxChars} caracteres.`);
  }

  if (limits.maxTitle !== undefined) {
    if (title.length > limits.maxTitle) {
      errors.push(`Título excede o limite de ${limits.maxTitle} caracteres.`);
    } else if (!title) {
      warnings.push(`Título não informado para ${CHANNEL_METADATA[channel].label}; será derivado do tópico.`);
    }
  }

  if (containsEmoji(fullText) || containsEmoji(title)) {
    errors.push("Emojis não são permitidos pela diretriz editorial do Portal NKL.");
  }

  for (const pattern of BANNED_JARGON_PATTERNS) {
    if (pattern.test(fullText) || pattern.test(title)) {
      warnings.push("Evite jargão corporativo; prefira linguagem direta e humana.");
      break;
    }
  }

  if (
    post.videoDurationSeconds !== undefined &&
    limits.maxVideoSeconds !== undefined &&
    post.videoDurationSeconds > limits.maxVideoSeconds
  ) {
    errors.push(
      `Duração de ${post.videoDurationSeconds}s excede o máximo de ${limits.maxVideoSeconds}s para ${CHANNEL_METADATA[channel].label}.`,
    );
  }

  if (
    post.fileSizeMb !== undefined &&
    limits.maxFileMb !== undefined &&
    post.fileSizeMb > limits.maxFileMb
  ) {
    errors.push(
      `Arquivo de ${post.fileSizeMb} MB excede o limite de ${limits.maxFileMb} MB para ${CHANNEL_METADATA[channel].label}.`,
    );
  }

  if (post.scheduledAt !== undefined && Number.isNaN(Date.parse(post.scheduledAt))) {
    errors.push("scheduledAt deve estar em formato ISO-8601 válido.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    remainingChars,
  };
}

export function validateSocialPublishJob(input: unknown): SocialPublishJob {
  return socialPublishJobSchema.parse(input);
}

/**
 * Synchronous pure-TS SHA-256 implementation (FIPS 180-4) so validators.ts
 * stays isomorphic without importing node:crypto into client bundles.
 */
function sha256Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const bitLen = bytes.length * 8;
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);

  const w = new Uint32Array(64);
  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + s1 + ch + k[i] + w[i]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      hh = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
    h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0;
    h[7] = (h[7] + hh) >>> 0;
  }

  return h.map((word) => word.toString(16).padStart(8, "0")).join("");
}

function rotr(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

export function buildIdempotencyKey(
  jobId: string,
  channel: SocialChannel,
  mediaHash: string,
): string {
  return sha256Hex(`${jobId}:${channel}:${mediaHash}`);
}

type EnvRecord = Record<string, string | undefined>;

function hasEnv(env: EnvRecord, name: string): boolean {
  return Boolean(env[name]?.trim());
}

function missingFrom(env: EnvRecord, names: readonly string[]): string[] {
  return names.filter((name) => !hasEnv(env, name));
}

export function getChannelConnectionStatus(
  env: EnvRecord = typeof process !== "undefined" ? process.env : {},
): ChannelConnectionStatus[] {
  const postizMissing = missingFrom(env, ["POSTIZ_API_URL", "POSTIZ_API_KEY"]);
  const webhookMissing = missingFrom(env, ["SOCIAL_WEBHOOK_URL"]);
  const bridgeReady = postizMissing.length === 0 || webhookMissing.length === 0;

  return SOCIAL_CHANNELS.map((channel): ChannelConnectionStatus => {
    const meta = CHANNEL_METADATA[channel];

    if (channel === "youtube") {
      const hasDirectToken = hasEnv(env, "YOUTUBE_ACCESS_TOKEN");
      const oauthMissing = missingFrom(env, [
        "YOUTUBE_CLIENT_ID",
        "YOUTUBE_CLIENT_SECRET",
        "YOUTUBE_REFRESH_TOKEN",
      ]);
      const connected = hasDirectToken || oauthMissing.length === 0;
      const missingEnvVars = connected
        ? []
        : oauthMissing.length < 3
          ? oauthMissing
          : ["YOUTUBE_ACCESS_TOKEN"];
      return { channel, label: meta.label, mode: meta.mode, connected, missingEnvVars, docsUrl: meta.docsUrl };
    }

    if (channel === "kwai") {
      return {
        channel,
        label: meta.label,
        mode: meta.mode,
        connected: bridgeReady,
        missingEnvVars: bridgeReady ? [] : [...postizMissing, ...webhookMissing],
        docsUrl: meta.docsUrl,
      };
    }

    if (channel === "bilibili") {
      const hasDirectToken = hasEnv(env, "BILIBILI_ACCESS_TOKEN");
      const connected = hasDirectToken || bridgeReady;
      return {
        channel,
        label: meta.label,
        mode: meta.mode,
        connected,
        missingEnvVars: connected ? [] : [...postizMissing, ...webhookMissing],
        docsUrl: meta.docsUrl,
      };
    }

    const requiredEnvMap: Record<
      Exclude<SocialChannel, "youtube" | "kwai" | "bilibili">,
      readonly string[]
    > = {
      tiktok: ["TIKTOK_ACCESS_TOKEN"],
      instagram: ["META_IG_USER_ID", "META_ACCESS_TOKEN"],
      facebook: ["META_FB_PAGE_ID", "META_ACCESS_TOKEN"],
      bluesky: ["BLUESKY_HANDLE", "BLUESKY_APP_PASSWORD"],
      threads: ["THREADS_USER_ID", "THREADS_ACCESS_TOKEN"],
      mastodon: ["MASTODON_INSTANCE_URL", "MASTODON_ACCESS_TOKEN"],
      x: ["X_ACCESS_TOKEN"],
      postiz: ["POSTIZ_API_URL", "POSTIZ_API_KEY"],
      webhook: ["SOCIAL_WEBHOOK_URL"],
    };

    const missingEnvVars = missingFrom(env, requiredEnvMap[channel]);
    return {
      channel,
      label: meta.label,
      mode: meta.mode,
      connected: missingEnvVars.length === 0,
      missingEnvVars,
      docsUrl: meta.docsUrl,
    };
  });
}

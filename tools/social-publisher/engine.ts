import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { publishToBluesky } from "./adapters/bluesky";
import { publishToFacebook, publishToInstagram } from "./adapters/meta-video";
import { publishToMastodon } from "./adapters/mastodon";
import { publishToPostiz, publishToWebhook } from "./adapters/postiz-webhook";
import { publishToThreads } from "./adapters/threads";
import { publishToTiktok } from "./adapters/tiktok";
import { publishToX } from "./adapters/x";
import { publishToYoutube } from "./adapters/youtube";
import {
  SOCIAL_CHANNELS,
  type AdapterPublishPayload,
  type AdapterPublishResult,
  type JobChannelExecutionResult,
  type JobExecutionReport,
  type PublishLedgerEntry,
  type SocialChannel,
  type SocialPublishJob,
} from "./types";
import {
  buildIdempotencyKey,
  validatePostForChannel,
  validateSocialPublishJob,
} from "./validators";

export interface PublishJobOptions {
  dryRun?: boolean;
  force?: boolean;
  channels?: SocialChannel[];
  cwd?: string;
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
}

export function getSocialPublisherRoot(cwd = process.cwd()): string {
  return join(cwd, "workspace", "social-publisher");
}

export function getJobsDirectory(cwd = process.cwd()): string {
  return join(getSocialPublisherRoot(cwd), "jobs");
}

export function sanitizeJobId(jobId: string): string {
  const safe = jobId.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!safe) {
    throw new Error("ID de job inválido.");
  }
  return safe;
}

export function getJobPath(jobId: string, cwd = process.cwd()): string {
  return join(getJobsDirectory(cwd), `${sanitizeJobId(jobId)}.json`);
}

export function getLedgerPath(cwd = process.cwd()): string {
  return join(getSocialPublisherRoot(cwd), "ledger.json");
}

export function computeFileSha256(filePath: string): string | undefined {
  const absolutePath = resolve(filePath);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    return undefined;
  }
  return createHash("sha256").update(readFileSync(absolutePath)).digest("hex");
}

export function resolveMediaHash(job: SocialPublishJob): string {
  if (job.mediaSha256?.trim()) {
    return job.mediaSha256.trim().toLowerCase();
  }
  const candidate = [job.videoPath, job.verticalVideoPath].find(
    (path) => path && existsSync(path) && statSync(path).isFile(),
  );
  if (candidate) {
    const fileHash = computeFileSha256(candidate);
    if (fileHash) {
      return fileHash;
    }
  }
  return createHash("sha256")
    .update(`${job.topic}|${job.targetUrl}|${job.videoPath ?? ""}|${job.verticalVideoPath ?? ""}`)
    .digest("hex");
}

export function saveJob(job: SocialPublishJob, cwd = process.cwd()): SocialPublishJob {
  const validated = validateSocialPublishJob(job);
  const jobsDir = getJobsDirectory(cwd);
  mkdirSync(jobsDir, { recursive: true });
  writeFileSync(getJobPath(validated.id, cwd), `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  return validated;
}

export function loadJob(jobIdOrPath: string, cwd = process.cwd()): SocialPublishJob {
  const directPath = resolve(cwd, jobIdOrPath);
  const targetPath = existsSync(directPath) && statSync(directPath).isFile()
    ? directPath
    : getJobPath(jobIdOrPath, cwd);

  if (!existsSync(targetPath)) {
    throw new Error(`Job não encontrado: ${jobIdOrPath}`);
  }
  const parsed: unknown = JSON.parse(readFileSync(targetPath, "utf8"));
  return validateSocialPublishJob(parsed);
}

export function listJobs(cwd = process.cwd()): SocialPublishJob[] {
  const jobsDir = getJobsDirectory(cwd);
  if (!existsSync(jobsDir)) {
    return [];
  }
  return readdirSync(jobsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => loadJob(join(jobsDir, entry.name), cwd))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function readLedger(cwd = process.cwd()): Record<string, PublishLedgerEntry> {
  const ledgerPath = getLedgerPath(cwd);
  if (!existsSync(ledgerPath)) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(ledgerPath, "utf8"));
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, PublishLedgerEntry>)
      : {};
  } catch {
    return {};
  }
}

export function writeLedger(
  ledger: Record<string, PublishLedgerEntry>,
  cwd = process.cwd(),
): void {
  const root = getSocialPublisherRoot(cwd);
  mkdirSync(root, { recursive: true });
  writeFileSync(getLedgerPath(cwd), `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
}

export async function dispatchToChannel(
  payload: AdapterPublishPayload,
  env: Record<string, string | undefined>,
  fetchImpl: typeof fetch = fetch,
): Promise<AdapterPublishResult> {
  switch (payload.channel) {
    case "bluesky":
      return publishToBluesky(
        payload,
        {
          handle: env.BLUESKY_HANDLE ?? "",
          appPassword: env.BLUESKY_APP_PASSWORD ?? "",
          pdsUrl: env.BLUESKY_PDS_URL,
        },
        fetchImpl,
      );
    case "threads":
      return publishToThreads(
        payload,
        {
          userId: env.THREADS_USER_ID ?? "",
          accessToken: env.THREADS_ACCESS_TOKEN ?? "",
        },
        fetchImpl,
      );
    case "mastodon":
      return publishToMastodon(
        payload,
        {
          instanceUrl: env.MASTODON_INSTANCE_URL ?? "",
          accessToken: env.MASTODON_ACCESS_TOKEN ?? "",
        },
        fetchImpl,
      );
    case "youtube":
      return publishToYoutube(
        payload,
        {
          accessToken: env.YOUTUBE_ACCESS_TOKEN,
          clientId: env.YOUTUBE_CLIENT_ID,
          clientSecret: env.YOUTUBE_CLIENT_SECRET,
          refreshToken: env.YOUTUBE_REFRESH_TOKEN,
        },
        fetchImpl,
      );
    case "tiktok":
      return publishToTiktok(
        payload,
        { accessToken: env.TIKTOK_ACCESS_TOKEN ?? "" },
        fetchImpl,
      );
    case "instagram":
      return publishToInstagram(
        payload,
        {
          igUserId: env.META_IG_USER_ID ?? "",
          accessToken: env.META_ACCESS_TOKEN ?? "",
        },
        fetchImpl,
      );
    case "facebook":
      return publishToFacebook(
        payload,
        {
          pageId: env.META_FB_PAGE_ID ?? "",
          accessToken: env.META_ACCESS_TOKEN ?? "",
        },
        fetchImpl,
      );
    case "x":
      return publishToX(
        payload,
        {
          accessToken: env.X_ACCESS_TOKEN ?? "",
          mediaId: env.X_MEDIA_ID,
        },
        fetchImpl,
      );
    case "postiz":
      return publishToPostiz(
        payload,
        {
          apiUrl: env.POSTIZ_API_URL ?? "",
          apiKey: env.POSTIZ_API_KEY ?? "",
        },
        fetchImpl,
      );
    case "webhook":
      return publishToWebhook(
        payload,
        {
          webhookUrl: env.SOCIAL_WEBHOOK_URL ?? "",
          webhookSecret: env.SOCIAL_WEBHOOK_SECRET,
        },
        fetchImpl,
      );
    case "kwai":
    case "bilibili":
      if (env.POSTIZ_API_URL?.trim() && env.POSTIZ_API_KEY?.trim()) {
        return publishToPostiz(
          payload,
          {
            apiUrl: env.POSTIZ_API_URL,
            apiKey: env.POSTIZ_API_KEY,
          },
          fetchImpl,
        );
      }
      return publishToWebhook(
        payload,
        {
          webhookUrl: env.SOCIAL_WEBHOOK_URL ?? "",
          webhookSecret: env.SOCIAL_WEBHOOK_SECRET,
        },
        fetchImpl,
      );
  }
}

export async function publishJob(
  jobInput: SocialPublishJob,
  options: PublishJobOptions = {},
): Promise<JobExecutionReport> {
  const job = validateSocialPublishJob(jobInput);
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const dryRun = options.dryRun ?? true;
  const force = options.force ?? false;

  const mediaHash = resolveMediaHash(job);
  const ledger = readLedger(cwd);

  const configuredChannels = SOCIAL_CHANNELS.filter((channel) => {
    if (options.channels && !options.channels.includes(channel)) {
      return false;
    }
    const override = job.platforms[channel];
    return Boolean(override && override.enabled !== false);
  });

  const results: JobChannelExecutionResult[] = [];

  for (const channel of configuredChannels) {
    const override = job.platforms[channel]!;
    const idempotencyKey = buildIdempotencyKey(job.id, channel, mediaHash);
    const existing = ledger[idempotencyKey];

    if (!dryRun && !force && existing?.status === "published") {
      results.push({
        ok: true,
        channel,
        idempotencyKey,
        externalId: existing.externalId,
        externalUrl: existing.externalUrl,
        skippedAsDuplicate: true,
      });
      continue;
    }

    const validation = validatePostForChannel(channel, {
      caption: override.caption,
      title: override.title,
      hashtags: override.hashtags,
      scheduledAt: override.scheduledAt,
    });

    if (!validation.valid) {
      const errorMsg = validation.errors.join(" ");
      results.push({
        ok: false,
        channel,
        idempotencyKey,
        dryRun,
        error: errorMsg,
      });
      if (!dryRun) {
        ledger[idempotencyKey] = {
          idempotencyKey,
          jobId: job.id,
          channel,
          status: "failed",
          error: errorMsg,
          updatedAt: new Date().toISOString(),
        };
      }
      continue;
    }

    const payload: AdapterPublishPayload = {
      jobId: job.id,
      idempotencyKey,
      channel,
      topic: job.topic,
      caption: override.caption ?? "",
      title: override.title,
      hashtags: override.hashtags ?? [],
      targetUrl: override.linkUrl ?? job.targetUrl,
      navboostKeyword: job.navboostKeyword,
      videoPath: job.videoPath,
      verticalVideoPath: job.verticalVideoPath,
      videoUrl: override.videoUrl,
      scheduledAt: override.scheduledAt,
      visibility: override.visibility,
      targetPlatforms: override.targetPlatforms,
      dryRun,
    };

    try {
      const adapterResult = await dispatchToChannel(payload, env, fetchImpl);
      results.push({
        ...adapterResult,
        idempotencyKey,
      });

      if (!dryRun) {
        ledger[idempotencyKey] = {
          idempotencyKey,
          jobId: job.id,
          channel,
          status: adapterResult.ok ? "published" : "failed",
          externalId: adapterResult.externalId,
          externalUrl: adapterResult.externalUrl,
          error: adapterResult.error,
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro isolado no canal.";
      results.push({
        ok: false,
        channel,
        idempotencyKey,
        error: errorMsg,
      });
      if (!dryRun) {
        ledger[idempotencyKey] = {
          idempotencyKey,
          jobId: job.id,
          channel,
          status: "failed",
          error: errorMsg,
          updatedAt: new Date().toISOString(),
        };
      }
    }
  }

  if (!dryRun) {
    writeLedger(ledger, cwd);
  }

  return {
    jobId: job.id,
    mode: dryRun ? "dry_run" : "live",
    executedAt: new Date().toISOString(),
    results,
  };
}

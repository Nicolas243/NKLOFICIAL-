export const SOCIAL_CHANNELS = [
  "youtube",
  "tiktok",
  "instagram",
  "facebook",
  "bilibili",
  "bluesky",
  "threads",
  "mastodon",
  "x",
  "kwai",
  "postiz",
  "webhook",
] as const;

export type SocialChannel = (typeof SOCIAL_CHANNELS)[number];

export interface ChannelLimits {
  maxChars: number;
  maxTitle?: number;
  maxVideoSeconds?: number;
  maxFileMb?: number;
}

export type ChannelConnectionMode = "native_api" | "bridge";

export interface ChannelConnectionStatus {
  channel: SocialChannel;
  label: string;
  mode: ChannelConnectionMode;
  connected: boolean;
  missingEnvVars: string[];
  docsUrl: string;
}

export type PostVisibility = "public" | "unlisted" | "private";

export interface PlatformPostOverride {
  enabled?: boolean;
  caption?: string;
  title?: string;
  hashtags?: string[];
  scheduledAt?: string;
  visibility?: PostVisibility;
  videoUrl?: string;
  linkUrl?: string;
  targetPlatforms?: string[];
}

export interface SocialPublishJob {
  id: string;
  topic: string;
  videoPath?: string;
  verticalVideoPath?: string;
  mediaSha256?: string;
  language: "pt-BR";
  targetUrl: string;
  navboostKeyword?: string;
  platforms: Partial<Record<SocialChannel, PlatformPostOverride>>;
  createdAt: string;
}

export interface PostValidationInput {
  caption?: string;
  title?: string;
  hashtags?: string[];
  videoDurationSeconds?: number;
  fileSizeMb?: number;
  scheduledAt?: string;
}

export interface PostValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  remainingChars: number;
}

export interface AdapterPublishPayload {
  jobId: string;
  idempotencyKey: string;
  channel: SocialChannel;
  topic: string;
  caption: string;
  title?: string;
  hashtags: string[];
  targetUrl: string;
  navboostKeyword?: string;
  videoPath?: string;
  verticalVideoPath?: string;
  videoUrl?: string;
  scheduledAt?: string;
  visibility?: PostVisibility;
  targetPlatforms?: string[];
  dryRun?: boolean;
}

export interface AdapterRequestPlan {
  method: string;
  endpoints: string[];
  summary: string;
}

export interface AdapterPublishResult {
  ok: boolean;
  channel: SocialChannel;
  externalId?: string;
  externalUrl?: string;
  dryRun?: boolean;
  error?: string;
  requestPlan?: AdapterRequestPlan;
}

export interface PublishLedgerEntry {
  idempotencyKey: string;
  jobId: string;
  channel: SocialChannel;
  status: "published" | "failed" | "dry_run";
  externalId?: string;
  externalUrl?: string;
  error?: string;
  updatedAt: string;
}

export interface JobChannelExecutionResult extends AdapterPublishResult {
  idempotencyKey: string;
  skippedAsDuplicate?: boolean;
}

export interface JobExecutionReport {
  jobId: string;
  mode: "dry_run" | "live";
  executedAt: string;
  results: JobChannelExecutionResult[];
}

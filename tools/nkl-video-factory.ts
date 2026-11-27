import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { SOCIAL_CHANNELS, type SocialChannel } from "./social-publisher/types.js";

export const videoRunStatuses = [
  "draft",
  "generated",
  "needs_review",
  "approved",
  "scheduled",
  "publishing",
  "published",
  "failed",
  "cancelled",
] as const;

export type VideoRunStatus = (typeof videoRunStatuses)[number];

export const videoManifestSchema = z.object({
  title: z.string().trim().min(1).max(120),
  objective: z.string().trim().min(1).max(500),
  audience: z.string().trim().min(1).max(200),
  sources: z.array(
    z.object({
      url: z.string().url(),
      title: z.string().trim().min(1).max(200).optional(),
      verified: z.boolean().default(false),
    }),
  ).min(1),
  durationSeconds: z.number().int().min(30).max(3600).default(180),
  formats: z.array(z.enum(["horizontal", "vertical"])).min(1).max(2),
  language: z.literal("pt-BR").default("pt-BR"),
  prohibitedClaims: z.array(z.string()).default([]),
  callToAction: z.string().trim().max(300).optional(),
  rightsConfirmed: z.boolean(),
  channels: z.array(z.enum(SOCIAL_CHANNELS)).default([]),
  scheduledAt: z.string().datetime().optional(),
});

export type VideoManifest = z.infer<typeof videoManifestSchema>;

export interface VideoRunHistory {
  status: VideoRunStatus;
  at: string;
  note?: string;
}

export interface VideoRun {
  id: string;
  status: VideoRunStatus;
  manifest: VideoManifest;
  manifestSha256: string;
  createdAt: string;
  updatedAt: string;
  history: VideoRunHistory[];
  artifacts: {
    video?: string;
    transcript?: string;
    captions?: string;
  };
  review?: {
    content: boolean;
    clip: boolean;
    metadata: boolean;
    reviewedBy: string;
    reviewedAt: string;
  };
  publications: Array<{
    channel: SocialChannel;
    idempotencyKey: string;
    state: "planned" | "published" | "failed";
    externalId?: string;
  }>;
}

const allowedTransitions: Record<VideoRunStatus, VideoRunStatus[]> = {
  draft: ["generated", "needs_review", "failed", "cancelled"],
  generated: ["needs_review", "failed", "cancelled"],
  needs_review: ["approved", "draft", "failed", "cancelled"],
  approved: ["scheduled", "publishing", "failed", "cancelled"],
  scheduled: ["publishing", "cancelled", "failed"],
  publishing: ["published", "failed", "cancelled"],
  published: [],
  failed: ["draft", "cancelled"],
  cancelled: [],
};

export function getWorkspaceRoot(cwd = process.cwd()): string {
  return join(cwd, "workspace", "video-factory");
}

export function getRunDirectory(runId: string, cwd = process.cwd()): string {
  return join(getWorkspaceRoot(cwd), "runs", runId);
}

export function validateManifest(input: unknown): VideoManifest {
  return videoManifestSchema.parse(input);
}

export function readManifest(filePath: string): VideoManifest {
  const absolutePath = resolve(filePath);
  const raw = readFileSync(absolutePath, "utf8");
  return validateManifest(JSON.parse(raw));
}

export function hashManifest(manifest: VideoManifest): string {
  return hashText(JSON.stringify(manifest));
}

export function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function transitionStatus(
  run: VideoRun,
  nextStatus: VideoRunStatus,
  note?: string,
): VideoRun {
  if (!allowedTransitions[run.status].includes(nextStatus)) {
    throw new Error(`Invalid transition: ${run.status} -> ${nextStatus}`);
  }
  const now = new Date().toISOString();
  return {
    ...run,
    status: nextStatus,
    updatedAt: now,
    history: [...run.history, { status: nextStatus, at: now, ...(note ? { note } : {}) }],
  };
}

export function createRun(
  manifest: VideoManifest,
  cwd = process.cwd(),
  runId = randomUUID(),
): VideoRun {
  if (!manifest.rightsConfirmed) {
    throw new Error("rightsConfirmed must be true before creating a video run");
  }
  const now = new Date().toISOString();
  const run: VideoRun = {
    id: runId,
    status: "draft",
    manifest,
    manifestSha256: hashManifest(manifest),
    createdAt: now,
    updatedAt: now,
    history: [{ status: "draft", at: now }],
    artifacts: {},
    publications: [],
  };
  const runDirectory = getRunDirectory(runId, cwd);
  mkdirSync(runDirectory, { recursive: true });
  writeFileSync(
    join(runDirectory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(join(runDirectory, "run.json"), `${JSON.stringify(run, null, 2)}\n`, "utf8");
  return run;
}

export function readRun(runId: string, cwd = process.cwd()): VideoRun {
  const runPath = join(getRunDirectory(runId, cwd), "run.json");
  if (!existsSync(runPath)) {
    throw new Error(`Run not found: ${runId}`);
  }
  return JSON.parse(readFileSync(runPath, "utf8")) as VideoRun;
}

export function saveRun(run: VideoRun, cwd = process.cwd()): void {
  const runDirectory = getRunDirectory(run.id, cwd);
  mkdirSync(runDirectory, { recursive: true });
  writeFileSync(join(runDirectory, "run.json"), `${JSON.stringify(run, null, 2)}\n`, "utf8");
}

export function addArtifact(
  run: VideoRun,
  type: "video" | "transcript" | "captions",
  filePath: string,
  cwd = process.cwd(),
): VideoRun {
  const absolutePath = resolve(filePath);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    throw new Error(`Artifact not found: ${absolutePath}`);
  }
  const updated = {
    ...run,
    artifacts: { ...run.artifacts, [type]: absolutePath },
  };
  saveRun(updated, cwd);
  return updated;
}

export function approveRun(
  run: VideoRun,
  reviewedBy: string,
  review = { content: true, clip: true, metadata: true },
  cwd = process.cwd(),
): VideoRun {
  if (!review.content || !review.clip || !review.metadata) {
    throw new Error("All three reviews—content, clip and metadata—must be approved");
  }
  if (!reviewedBy.trim()) {
    throw new Error("reviewedBy must not be empty");
  }
  let updated = transitionStatus(run, "needs_review", "Waiting for complete human review");
  updated = transitionStatus(updated, "approved", "Human review completed");
  updated = {
    ...updated,
    review: {
      ...review,
      reviewedBy: reviewedBy.trim(),
      reviewedAt: new Date().toISOString(),
    },
  };
  saveRun(updated, cwd);
  return updated;
}

export function planPublication(
  run: VideoRun,
  channel: SocialChannel,
  clipId: string,
  cwd = process.cwd(),
): VideoRun {
  if (run.status !== "approved" && run.status !== "scheduled") {
    throw new Error(`Publication requires approved status; current status is ${run.status}`);
  }
  if (!run.manifest.channels.includes(channel)) {
    throw new Error(`Channel ${channel} was not declared in the manifest`);
  }
  const idempotencyKey = hashText(`${run.id}:${channel}:${clipId}`);
  const existing = run.publications.find(
    (publication) => publication.idempotencyKey === idempotencyKey,
  );
  if (existing) {
    return run;
  }
  const updated = {
    ...run,
    status: run.status === "approved" ? ("scheduled" as VideoRunStatus) : run.status,
    publications: [
      ...run.publications,
      { channel, idempotencyKey, state: "planned" as const },
    ],
  };
  saveRun(updated, cwd);
  return updated;
}

export function listRuns(cwd = process.cwd()): VideoRun[] {
  const runsDirectory = join(getWorkspaceRoot(cwd), "runs");
  if (!existsSync(runsDirectory)) {
    return [];
  }
  return readdirSync(runsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readRun(entry.name, cwd))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface DoctorResult {
  node: boolean;
  nlm: boolean;
  ffmpeg: boolean;
  chrome: boolean;
  workspaceWritable: boolean;
  issues: string[];
}

export function commandExists(command: string): boolean {
  const checker = process.platform === "win32" ? "where" : "which";
  return spawnSync(checker, [command], { stdio: "ignore", shell: false }).status === 0;
}

export function runDoctor(cwd = process.cwd(), env = process.env): DoctorResult {
  const node = typeof process.versions.node === "string";
  const nlm = commandExists("nlm");
  const ffmpeg = commandExists("ffmpeg");
  const chrome =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        ].some((path) => existsSync(path))
      : commandExists("google-chrome") || commandExists("chromium");
  const workspace = getWorkspaceRoot(cwd);
  let workspaceWritable = false;
  try {
    mkdirSync(workspace, { recursive: true });
    const probe = join(workspace, ".write-test");
    writeFileSync(probe, "ok", "utf8");
    workspaceWritable = statSync(probe).isFile();
  } catch {
    workspaceWritable = false;
  }
  const issues: string[] = [];
  if (!node) issues.push("Node.js not detected");
  if (!nlm) issues.push("nlm is missing; install notebooklm-mcp-cli");
  if (!ffmpeg) issues.push("FFmpeg is missing");
  if (!chrome) issues.push("Google Chrome or Chromium is missing");
  if (!workspaceWritable) issues.push(`Workspace is not writable: ${workspace}`);
  if (env.NINE_ROUTER_API_KEY) {
    issues.push("Detected a provider key in the process environment; do not paste it into manifest files");
  }
  return { node, nlm, ffmpeg, chrome, workspaceWritable, issues };
}

function usage(): string {
  return [
    "NKL Video Factory",
    "",
    "Commands:",
    "  create --manifest <path>",
    "  doctor",
    "  status [run-id]",
    "  approve --run <run-id> --by <name>",
    `  publish --run <run-id> --channel <${SOCIAL_CHANNELS.join("|")}> [--clip <id>] [--dry-run]`,
  ].join("\n");
}

function readOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

export async function main(argv = process.argv.slice(2), cwd = process.cwd(), env = process.env): Promise<number> {
  const command = argv[0];
  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  if (command === "doctor") {
    const doctor = runDoctor(cwd, env);
    process.stdout.write(`${JSON.stringify(doctor, null, 2)}\n`);
    return doctor.issues.some((issue) => /missing|not writable|not detected/i.test(issue)) ? 1 : 0;
  }
  if (command === "create") {
    const manifestPath = readOption(argv, "--manifest");
    if (!manifestPath) throw new Error("Missing --manifest <path>");
    const manifest = readManifest(resolve(cwd, manifestPath));
    const run = createRun(manifest, cwd);
    process.stdout.write(`${JSON.stringify({ id: run.id, status: run.status, directory: getRunDirectory(run.id, cwd) }, null, 2)}\n`);
    return 0;
  }
  if (command === "status") {
    const runId = argv[1];
    const runs = runId ? [readRun(runId, cwd)] : listRuns(cwd);
    process.stdout.write(`${JSON.stringify(runs, null, 2)}\n`);
    return 0;
  }
  if (command === "approve") {
    const runId = readOption(argv, "--run");
    const reviewedBy = readOption(argv, "--by");
    if (!runId || !reviewedBy) throw new Error("Missing --run <run-id> and/or --by <name>");
    const run = approveRun(readRun(runId, cwd), reviewedBy, undefined, cwd);
    process.stdout.write(`${JSON.stringify({ id: run.id, status: run.status, review: run.review }, null, 2)}\n`);
    return 0;
  }
  if (command === "publish") {
    const runId = readOption(argv, "--run");
    const channel = readOption(argv, "--channel");
    const clipId = readOption(argv, "--clip") ?? "main";
    if (!runId || !channel) throw new Error("Missing --run <run-id> and/or --channel <channel>");
    if (!(SOCIAL_CHANNELS as readonly string[]).includes(channel)) {
      throw new Error("Invalid channel");
    }
    if (!argv.includes("--dry-run")) {
      throw new Error("Live publishing is not implemented in this MVP; use --dry-run");
    }
    const run = planPublication(
      readRun(runId, cwd),
      channel as SocialChannel,
      clipId,
      cwd,
    );
    process.stdout.write(`${JSON.stringify({
      id: run.id,
      status: run.status,
      channel,
      mode: "dry_run",
      publication: run.publications.at(-1),
      externalUpload: false,
    }, null, 2)}\n`);
    return 0;
  }
  throw new Error(`Unknown command: ${command}\n\n${usage()}`);
}

function isEntrypoint(): boolean {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint && import.meta.url === pathToFileURL(entrypoint).href);
}

if (isEntrypoint()) {
  main().then((code) => {
    process.exitCode = code;
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unexpected video factory error";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}

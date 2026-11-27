import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { generateSocialCopyForChannels, normalizeTargetUrl } from "./ai-copy-generator";
import {
  computeFileSha256,
  getJobPath,
  listJobs,
  loadJob,
  publishJob,
  readLedger,
  saveJob,
} from "./engine";
import {
  SOCIAL_CHANNELS,
  type PlatformPostOverride,
  type SocialChannel,
  type SocialPublishJob,
} from "./types";
import {
  getChannelConnectionStatus,
  validatePostForChannel,
} from "./validators";

function usage(): string {
  return [
    "Portal NKL - Publicador Multiplataforma de Vídeos",
    "",
    "Comandos:",
    "  doctor",
    "  draft --topic <tema> [--url <destino>] [--video <path>] [--vertical-video <path>] [--navboost <termo>] [--channels c1,c2] [--ai] [--out <path>]",
    "  validate --job <path-ou-id>",
    "  publish --job <path-ou-id> [--dry-run | --live] [--force] [--channels c1,c2]",
    "  status [job-id]",
  ].join("\n");
}

function readOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index < 0 || index + 1 >= args.length) {
    return undefined;
  }
  return args[index + 1];
}

function parseChannelsArg(raw: string | undefined): SocialChannel[] {
  if (!raw?.trim()) {
    return [...SOCIAL_CHANNELS];
  }
  const requested = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const invalid = requested.filter(
    (item) => !(SOCIAL_CHANNELS as readonly string[]).includes(item),
  );
  if (invalid.length > 0) {
    throw new Error(`Canais inválidos: ${invalid.join(", ")}`);
  }
  return requested as SocialChannel[];
}

export async function main(
  argv = process.argv.slice(2),
  cwd = process.cwd(),
  env: Record<string, string | undefined> = process.env,
): Promise<number> {
  const command = argv[0];
  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }

  if (command === "doctor") {
    const statuses = getChannelConnectionStatus(env);
    process.stdout.write(`${JSON.stringify({ channels: statuses }, null, 2)}\n`);
    return 0;
  }

  if (command === "draft") {
    const topic = readOption(argv, "--topic");
    if (!topic?.trim()) {
      throw new Error("Parâmetro obrigatório ausente: --topic <tema>");
    }

    const url = normalizeTargetUrl(readOption(argv, "--url"));
    const videoPath = readOption(argv, "--video");
    const verticalVideoPath = readOption(argv, "--vertical-video");
    const navboostKeyword = readOption(argv, "--navboost");
    const channels = parseChannelsArg(readOption(argv, "--channels"));
    const useAi = argv.includes("--ai");
    const outPath = readOption(argv, "--out");
    const jobId = readOption(argv, "--id") ?? `pub-${randomUUID().slice(0, 8)}`;

    const generated = await generateSocialCopyForChannels({
      topic,
      targetUrl: url,
      navboostKeyword,
      channels,
      useAi,
      env,
    });

    const platforms: Partial<Record<SocialChannel, PlatformPostOverride>> = {};
    for (const channel of channels) {
      const item = generated[channel];
      if (!item) continue;
      platforms[channel] = {
        enabled: true,
        caption: item.caption,
        ...(item.title ? { title: item.title } : {}),
        hashtags: item.hashtags,
      };
    }

    const mediaSha256 =
      (videoPath ? computeFileSha256(resolve(cwd, videoPath)) : undefined) ??
      (verticalVideoPath ? computeFileSha256(resolve(cwd, verticalVideoPath)) : undefined);

    const job: SocialPublishJob = {
      id: jobId,
      topic: topic.trim(),
      ...(videoPath ? { videoPath } : {}),
      ...(verticalVideoPath ? { verticalVideoPath } : {}),
      ...(mediaSha256 ? { mediaSha256 } : {}),
      language: "pt-BR",
      targetUrl: url,
      ...(navboostKeyword ? { navboostKeyword } : {}),
      platforms,
      createdAt: new Date().toISOString(),
    };

    if (outPath) {
      const resolvedOut = resolve(cwd, outPath);
      mkdirSync(dirname(resolvedOut), { recursive: true });
      writeFileSync(resolvedOut, `${JSON.stringify(job, null, 2)}\n`, "utf8");
      process.stdout.write(
        `${JSON.stringify({ id: job.id, path: resolvedOut, channels }, null, 2)}\n`,
      );
      return 0;
    }

    const saved = saveJob(job, cwd);
    process.stdout.write(
      `${JSON.stringify({ id: saved.id, path: getJobPath(saved.id, cwd), channels }, null, 2)}\n`,
    );
    return 0;
  }

  if (command === "validate") {
    const jobArg = readOption(argv, "--job");
    if (!jobArg) {
      throw new Error("Parâmetro obrigatório ausente: --job <path-ou-id>");
    }
    const job = loadJob(jobArg, cwd);
    const checks = SOCIAL_CHANNELS.filter(
      (channel) => job.platforms[channel] && job.platforms[channel]!.enabled !== false,
    ).map((channel) => {
      const override = job.platforms[channel]!;
      return {
        channel,
        ...validatePostForChannel(channel, {
          caption: override.caption,
          title: override.title,
          hashtags: override.hashtags,
          scheduledAt: override.scheduledAt,
        }),
      };
    });

    const allValid = checks.every((item) => item.valid);
    process.stdout.write(
      `${JSON.stringify({ jobId: job.id, valid: allValid, checks }, null, 2)}\n`,
    );
    return allValid ? 0 : 1;
  }

  if (command === "publish") {
    const jobArg = readOption(argv, "--job");
    if (!jobArg) {
      throw new Error("Parâmetro obrigatório ausente: --job <path-ou-id>");
    }
    const job = loadJob(jobArg, cwd);
    const live = argv.includes("--live");
    const dryRun = !live;
    const force = argv.includes("--force");
    const rawChannels = readOption(argv, "--channels");
    const channels = rawChannels ? parseChannelsArg(rawChannels) : undefined;

    const report = await publishJob(job, {
      dryRun,
      force,
      channels,
      cwd,
      env,
    });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return report.results.every((item) => item.ok) ? 0 : 1;
  }

  if (command === "status") {
    const jobId = argv[1];
    const ledger = readLedger(cwd);
    if (jobId) {
      const job = loadJob(jobId, cwd);
      const entries = Object.values(ledger).filter((entry) => entry.jobId === job.id);
      process.stdout.write(`${JSON.stringify({ job, ledger: entries }, null, 2)}\n`);
      return 0;
    }

    const jobs = listJobs(cwd);
    process.stdout.write(
      `${JSON.stringify(
        {
          jobs: jobs.map((item) => ({
            id: item.id,
            topic: item.topic,
            createdAt: item.createdAt,
            channels: Object.keys(item.platforms),
          })),
          ledgerCount: Object.keys(ledger).length,
        },
        null,
        2,
      )}\n`,
    );
    return 0;
  }

  throw new Error(`Comando desconhecido: ${command}\n\n${usage()}`);
}

function isEntrypoint(): boolean {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint && import.meta.url === pathToFileURL(entrypoint).href);
}

if (isEntrypoint()) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Erro inesperado no publicador social.";
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    });
}

import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  buildDeterministicChannelCopy,
  generateSocialCopyForChannels,
  sanitizeGeneratedCopy,
} from "./ai-copy-generator";
import { publishToBluesky } from "./adapters/bluesky";
import { publishToMastodon } from "./adapters/mastodon";
import { publishToFacebook, publishToInstagram } from "./adapters/meta-video";
import { publishToPostiz, publishToWebhook } from "./adapters/postiz-webhook";
import { publishToThreads } from "./adapters/threads";
import { publishToTiktok } from "./adapters/tiktok";
import { publishToX } from "./adapters/x";
import { publishToYoutube } from "./adapters/youtube";
import { main as runCli } from "./cli";
import { loadJob, publishJob, readLedger, saveJob } from "./engine";
import { SOCIAL_CHANNELS, type AdapterPublishPayload, type SocialPublishJob } from "./types";
import {
  buildIdempotencyKey,
  CHANNEL_LIMITS,
  getChannelConnectionStatus,
  validatePostForChannel,
  validateSocialPublishJob,
} from "./validators";

function makePayload(overrides: Partial<AdapterPublishPayload> = {}): AdapterPublishPayload {
  return {
    jobId: "job-001",
    idempotencyKey: "a".repeat(64),
    channel: "bluesky",
    topic: "Guia rápido de IA prática",
    caption: "Veja como aplicar hoje em https://nkloficial.com.br/ia/oferta",
    title: "Guia rápido de IA prática",
    hashtags: ["#PortalNKL"],
    targetUrl: "https://nkloficial.com.br/ia/oferta",
    navboostKeyword: "portal nkl ia na pratica",
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

test("CHANNEL_LIMITS defines exact limits for all 12 SOCIAL_CHANNELS", () => {
  assert.equal(SOCIAL_CHANNELS.length, 12);
  assert.deepEqual(CHANNEL_LIMITS.bluesky, { maxChars: 300, maxVideoSeconds: 60, maxFileMb: 50 });
  assert.deepEqual(CHANNEL_LIMITS.threads, { maxChars: 500, maxVideoSeconds: 300, maxFileMb: 1024 });
  assert.deepEqual(CHANNEL_LIMITS.mastodon, { maxChars: 500, maxVideoSeconds: 300, maxFileMb: 40 });
  assert.deepEqual(CHANNEL_LIMITS.x, { maxChars: 280, maxVideoSeconds: 140, maxFileMb: 512 });
  assert.deepEqual(CHANNEL_LIMITS.youtube, { maxTitle: 100, maxChars: 5000, maxVideoSeconds: 43200 });
  assert.deepEqual(CHANNEL_LIMITS.tiktok, { maxChars: 2200, maxVideoSeconds: 600 });
  assert.deepEqual(CHANNEL_LIMITS.instagram, { maxChars: 2200, maxVideoSeconds: 900 });
  assert.deepEqual(CHANNEL_LIMITS.facebook, { maxChars: 2200, maxVideoSeconds: 14400 });
  assert.deepEqual(CHANNEL_LIMITS.bilibili, { maxTitle: 80, maxChars: 2000 });
  assert.deepEqual(CHANNEL_LIMITS.kwai, { maxChars: 2200 });
  assert.deepEqual(CHANNEL_LIMITS.postiz, { maxChars: 2200 });
  assert.deepEqual(CHANNEL_LIMITS.webhook, { maxChars: 2200 });
});

test("validatePostForChannel enforces character, emoji, duration and file size limits", () => {
  const ok = validatePostForChannel("x", {
    caption: "Guia direto do Portal NKL https://nkloficial.com.br/programas",
    videoDurationSeconds: 60,
    fileSizeMb: 40,
  });
  assert.equal(ok.valid, true);
  assert.ok(ok.remainingChars > 0);

  const tooLong = validatePostForChannel("x", {
    caption: "a".repeat(290),
  });
  assert.equal(tooLong.valid, false);
  assert.ok(tooLong.remainingChars < 0);

  const withEmoji = validatePostForChannel("bluesky", {
    caption: "Texto com simbolo proibido \u{1F680}",
  });
  assert.equal(withEmoji.valid, false);
  assert.ok(withEmoji.errors.some((item) => /Emojis/i.test(item)));

  const overDuration = validatePostForChannel("bluesky", {
    caption: "Vídeo curto",
    videoDurationSeconds: 90,
    fileSizeMb: 55,
  });
  assert.equal(overDuration.valid, false);
  assert.equal(overDuration.errors.length, 2);
});

test("buildIdempotencyKey matches node:crypto SHA-256 hex digest", () => {
  const expected = createHash("sha256").update("job-42:youtube:deadbeef").digest("hex");
  assert.equal(buildIdempotencyKey("job-42", "youtube", "deadbeef"), expected);
});

test("getChannelConnectionStatus never leaks secret values and flags missing env vars", () => {
  const secretToken = "super-secret-value-99999";
  const statuses = getChannelConnectionStatus({
    BLUESKY_HANDLE: "nkl.bsky.social",
    BLUESKY_APP_PASSWORD: secretToken,
    X_ACCESS_TOKEN: secretToken,
  });

  const serialized = JSON.stringify(statuses);
  assert.equal(serialized.includes(secretToken), false);
  assert.equal(serialized.includes("nkl.bsky.social"), false);

  const bsky = statuses.find((item) => item.channel === "bluesky");
  const xStatus = statuses.find((item) => item.channel === "x");
  const threads = statuses.find((item) => item.channel === "threads");

  assert.equal(bsky?.connected, true);
  assert.deepEqual(bsky?.missingEnvVars, []);
  assert.equal(xStatus?.connected, true);
  assert.equal(threads?.connected, false);
  assert.deepEqual(threads?.missingEnvVars, ["THREADS_USER_ID", "THREADS_ACCESS_TOKEN"]);
});

test("ai-copy-generator works deterministically offline, strips emojis/hype, and uses 9router when configured", async () => {
  assert.equal(
    sanitizeGeneratedCopy("Renda garantida \u{1F525} com diagnóstico"),
    "novas fontes de renda com análise prática",
  );

  const offline = await generateSocialCopyForChannels({
    topic: "Estude inglês com áudio",
    targetUrl: "/idiomas",
    navboostKeyword: "portal nkl idiomas",
    channels: ["bluesky", "youtube", "x"],
    useAi: true,
    env: {},
  });

  assert.equal(offline.bluesky?.source, "fallback");
  assert.ok(offline.bluesky?.caption.includes("https://nkloficial.com.br/idiomas"));
  assert.ok(offline.youtube?.caption.includes('Pesquise "portal nkl idiomas" no Google.'));
  assert.equal(validatePostForChannel("x", {
    caption: offline.x?.caption,
    hashtags: offline.x?.hashtags,
  }).valid, true);

  let calledModel = "";
  const mocked9Router = await generateSocialCopyForChannels({
    topic: "Bússola de Negócios",
    targetUrl: "/ofertas/bussola-negocios",
    navboostKeyword: "bussola de negocios nkl",
    channels: ["x"],
    useAi: true,
    env: {
      NINE_ROUTER_BASE_URL: "http://127.0.0.1:20128/v1",
      NINE_ROUTER_API_KEY: "test-key",
    },
    fetchImpl: async (_url, init) => {
      const parsed = JSON.parse(String(init?.body)) as { model?: string };
      calledModel = parsed.model ?? "";
      return jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                items: [
                  {
                    channel: "x",
                    caption: "Renda garantida \u{1F680} descubra seu próximo passo em https://nkloficial.com.br/ofertas/bussola-negocios",
                    hashtags: ["#PortalNKL"],
                  },
                ],
              }),
            },
          },
        ],
      });
    },
  });

  assert.equal(calledModel, "NKL-OPERARIOS");
  assert.equal(mocked9Router.x?.source, "9router");
  assert.equal(/Renda garantida/i.test(mocked9Router.x?.caption ?? ""), false);
  assert.equal(/\p{Extended_Pictographic}/u.test(mocked9Router.x?.caption ?? ""), false);
});

test("official adapters return dryRun plans without network and call documented endpoints in live mode", async () => {
  const dryBluesky = await publishToBluesky(makePayload({ dryRun: true }), {
    handle: "",
    appPassword: "",
  });
  assert.equal(dryBluesky.ok, true);
  assert.equal(dryBluesky.dryRun, true);
  assert.ok(dryBluesky.requestPlan?.endpoints[0].includes("com.atproto.server.createSession"));

  const seenUrls: string[] = [];

  const bskyRes = await publishToBluesky(
    makePayload({ channel: "bluesky" }),
    { handle: "nkl.bsky.social", appPassword: "app-pw" },
    async (url) => {
      seenUrls.push(String(url));
      if (String(url).includes("createSession")) {
        return jsonResponse({ accessJwt: "jwt", did: "did:plc:123", handle: "nkl.bsky.social" });
      }
      return jsonResponse({ uri: "at://did:plc:123/app.bsky.feed.post/abc", cid: "cid1" });
    },
  );
  assert.equal(bskyRes.ok, true);
  assert.equal(bskyRes.externalUrl, "https://bsky.app/profile/nkl.bsky.social/post/abc");

  const threadsRes = await publishToThreads(
    makePayload({ channel: "threads", videoUrl: "https://cdn.nkl.test/v.mp4" }),
    { userId: "99", accessToken: "tok" },
    async (url) => {
      seenUrls.push(String(url));
      return jsonResponse({ id: String(url).includes("threads_publish") ? "th_pub" : "th_cnt" });
    },
  );
  assert.equal(threadsRes.ok, true);
  assert.equal(threadsRes.externalId, "th_pub");

  const mastodonRes = await publishToMastodon(
    makePayload({ channel: "mastodon" }),
    { instanceUrl: "https://mastodon.social", accessToken: "mtok" },
    async (url) => {
      seenUrls.push(String(url));
      return jsonResponse({ id: "m1", url: "https://mastodon.social/@nkl/1" });
    },
  );
  assert.equal(mastodonRes.ok, true);

  const ytRes = await publishToYoutube(
    makePayload({ channel: "youtube" }),
    { accessToken: "ytok" },
    async (url) => {
      seenUrls.push(String(url));
      return jsonResponse({ id: "yt123" });
    },
  );
  assert.equal(ytRes.ok, true);
  assert.equal(ytRes.externalUrl, "https://www.youtube.com/watch?v=yt123");

  const ttRes = await publishToTiktok(
    makePayload({ channel: "tiktok", videoUrl: "https://cdn.nkl.test/v.mp4" }),
    { accessToken: "ttok" },
    async (url) => {
      seenUrls.push(String(url));
      return jsonResponse({ data: { publish_id: "tt_1" }, error: { code: "ok" } });
    },
  );
  assert.equal(ttRes.ok, true);

  const igRes = await publishToInstagram(
    makePayload({ channel: "instagram", videoUrl: "https://cdn.nkl.test/v.mp4" }),
    { igUserId: "ig1", accessToken: "mt" },
    async (url) => {
      seenUrls.push(String(url));
      return jsonResponse({ id: "ig_post_1" });
    },
  );
  assert.equal(igRes.ok, true);

  const fbRes = await publishToFacebook(
    makePayload({ channel: "facebook", videoUrl: "https://cdn.nkl.test/v.mp4" }),
    { pageId: "pg1", accessToken: "mt" },
    async (url) => {
      seenUrls.push(String(url));
      return jsonResponse({ id: "fb_vid_1" });
    },
  );
  assert.equal(fbRes.ok, true);

  const xRes = await publishToX(
    makePayload({ channel: "x" }),
    { accessToken: "xtok" },
    async (url) => {
      seenUrls.push(String(url));
      return jsonResponse({ data: { id: "x_999" } });
    },
  );
  assert.equal(xRes.ok, true);
  assert.equal(xRes.externalUrl, "https://x.com/i/web/status/x_999");

  const postizRes = await publishToPostiz(
    makePayload({ channel: "postiz", targetPlatforms: ["kwai", "pinterest"] }),
    { apiUrl: "http://localhost:4007/api", apiKey: "pkey" },
    async (url) => {
      seenUrls.push(String(url));
      return jsonResponse({ id: "pz_1" });
    },
  );
  assert.equal(postizRes.ok, true);

  let observedSignature = "";
  let observedBody = "";
  const webhookSecret = "wh-secret";
  const whRes = await publishToWebhook(
    makePayload({ channel: "webhook" }),
    { webhookUrl: "https://n8n.nkl.test/webhook", webhookSecret },
    async (url, init) => {
      seenUrls.push(String(url));
      const headers = init?.headers as Record<string, string>;
      observedSignature = headers["X-NKL-Signature"] ?? "";
      observedBody = String(init?.body ?? "");
      return jsonResponse({ id: "wh_1" });
    },
  );
  assert.equal(whRes.ok, true);
  const expectedSig = `sha256=${createHmac("sha256", webhookSecret).update(observedBody).digest("hex")}`;
  assert.equal(observedSignature, expectedSig);

  assert.ok(seenUrls.some((u) => u.includes("graph.threads.net/v1.0")));
  assert.ok(seenUrls.some((u) => u.includes("googleapis.com/upload/youtube/v3/videos")));
  assert.ok(seenUrls.some((u) => u.includes("open.tiktokapis.com/v2/post/publish/video/init/")));
  assert.ok(seenUrls.some((u) => u.includes("graph.facebook.com/v21.0")));
  assert.ok(seenUrls.some((u) => u.includes("api.x.com/2/tweets")));
});

test("engine enforces idempotency, isolates channel errors, and persists jobs", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "nkl-social-engine-"));
  try {
    const xCopy = buildDeterministicChannelCopy("x", "IA prática", "/ia/oferta");
    const bskyCopy = buildDeterministicChannelCopy("bluesky", "IA prática", "/ia/oferta");

    const job: SocialPublishJob = validateSocialPublishJob({
      id: "job-idemp-1",
      topic: "IA prática",
      mediaSha256: "b".repeat(64),
      language: "pt-BR",
      targetUrl: "https://nkloficial.com.br/ia/oferta",
      platforms: {
        x: { enabled: true, caption: xCopy.caption, hashtags: xCopy.hashtags },
        bluesky: { enabled: true, caption: bskyCopy.caption, hashtags: bskyCopy.hashtags },
      },
      createdAt: new Date().toISOString(),
    });

    saveJob(job, cwd);
    const loaded = loadJob("job-idemp-1", cwd);
    assert.equal(loaded.id, "job-idemp-1");

    const dryReport = await publishJob(loaded, { dryRun: true, cwd });
    assert.equal(dryReport.mode, "dry_run");
    assert.equal(dryReport.results.every((item) => item.ok && item.dryRun), true);

    let liveCalls = 0;
    const firstLive = await publishJob(loaded, {
      dryRun: false,
      cwd,
      env: {
        X_ACCESS_TOKEN: "x-token",
        // Bluesky deliberately missing to verify per-channel error isolation
      },
      fetchImpl: async () => {
        liveCalls += 1;
        return jsonResponse({ data: { id: "tweet-1" } });
      },
    });

    assert.equal(liveCalls, 1);
    const xFirst = firstLive.results.find((r) => r.channel === "x");
    const bskyFirst = firstLive.results.find((r) => r.channel === "bluesky");
    assert.equal(xFirst?.ok, true);
    assert.equal(bskyFirst?.ok, false);

    // Second live run must skip already-published X due to idempotency ledger
    const secondLive = await publishJob(loaded, {
      dryRun: false,
      cwd,
      env: { X_ACCESS_TOKEN: "x-token" },
      fetchImpl: async () => {
        liveCalls += 1;
        return jsonResponse({ data: { id: "tweet-2" } });
      },
    });

    assert.equal(liveCalls, 1);
    const xSecond = secondLive.results.find((r) => r.channel === "x");
    assert.equal(xSecond?.skippedAsDuplicate, true);
    assert.ok(Object.keys(readLedger(cwd)).length >= 2);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("CLI commands doctor, draft, validate, publish --dry-run, and status execute cleanly", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "nkl-social-cli-"));
  try {
    const videoFile = join(cwd, "sample.mp4");
    writeFileSync(videoFile, "fake-video-bytes", "utf8");
    const jobOut = join(cwd, "draft-job.json");

    assert.equal(await runCli(["doctor"], cwd, {}), 0);
    assert.equal(
      await runCli(
        [
          "draft",
          "--topic",
          "Como aprender inglês no Portal NKL",
          "--url",
          "/idiomas",
          "--video",
          videoFile,
          "--channels",
          "youtube,bluesky,x",
          "--out",
          jobOut,
        ],
        cwd,
        {},
      ),
      0,
    );

    const drafted = JSON.parse(readFileSync(jobOut, "utf8")) as SocialPublishJob;
    assert.equal(drafted.mediaSha256?.length, 64);

    assert.equal(await runCli(["validate", "--job", jobOut], cwd, {}), 0);
    assert.equal(await runCli(["publish", "--job", jobOut, "--dry-run"], cwd, {}), 0);
    assert.equal(await runCli(["status"], cwd, {}), 0);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

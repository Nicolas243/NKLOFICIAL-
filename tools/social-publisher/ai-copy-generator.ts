import {
  SOCIAL_CHANNELS,
  type SocialChannel,
} from "./types";
import {
  CHANNEL_LIMITS,
  CHANNEL_METADATA,
  composePostText,
} from "./validators";

export interface GeneratedChannelCopy {
  channel: SocialChannel;
  title?: string;
  caption: string;
  hashtags: string[];
  source: "9router" | "fallback";
}

export interface GenerateCopyOptions {
  topic: string;
  targetUrl?: string;
  navboostKeyword?: string;
  channels?: readonly SocialChannel[];
  useAi?: boolean;
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const DEFAULT_ROUTER_MODEL = "NKL-OPERARIOS";
const DEFAULT_TARGET_URL = "https://nkloficial.com.br";
const DEFAULT_TIMEOUT_MS = 12_000;

const HYPE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\brenda garantida\b/gi, "novas fontes de renda"],
  [/\blucro garantido\b/gi, "resultado consistente"],
  [/\bganho garantido\b/gi, "oportunidade real"],
  [/\b100%\s*garantido\b/gi, "com método prático"],
  [/\bfique rico\b/gi, "construa resultados"],
  [/\bdinheiro f[aá]cil\b/gi, "renda com trabalho estruturado"],
  [/\bdiagn[oó]stico\b/gi, "análise prática"],
  [/\bmapa editorial\b/gi, "roteiro de conteúdo"],
  [/\becossistemas principais\b/gi, "frentes do portal"],
  [/\bplataforma multidisciplinar\b/gi, "portal completo"],
  [/\bsolu[cç][oõ]es integradas\b/gi, "ferramentas práticas"],
  [/\barquitetura\b/gi, "estrutura"],
];

function normalizeChatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions")
    ? trimmed
    : `${trimmed}/chat/completions`;
}

export function normalizeTargetUrl(input?: string): string {
  const raw = input?.trim();
  if (!raw) {
    return DEFAULT_TARGET_URL;
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${DEFAULT_TARGET_URL}${path}`;
}

export function sanitizeGeneratedCopy(text: string): string {
  let clean = text.replace(/\p{Extended_Pictographic}/gu, "");
  for (const [pattern, replacement] of HYPE_REPLACEMENTS) {
    clean = clean.replace(pattern, replacement);
  }
  return clean.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function fitTextWithinLimit(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  const slice = text.slice(0, Math.max(0, maxChars - 3));
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > maxChars * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}...`;
}

function enforceRequiredBlocks(
  channel: SocialChannel,
  rawCaption: string,
  targetUrl: string,
  navboostKeyword: string | undefined,
  hashtags: string[],
): string {
  const limits = CHANNEL_LIMITS[channel];
  const cleanUrl = normalizeTargetUrl(targetUrl);
  const navboostLine = navboostKeyword?.trim()
    ? `Pesquise "${sanitizeGeneratedCopy(navboostKeyword)}" no Google.`
    : "";

  let caption = sanitizeGeneratedCopy(rawCaption);
  if (!caption.includes(cleanUrl)) {
    caption = caption ? `${caption}\n\nAcesse: ${cleanUrl}` : `Acesse: ${cleanUrl}`;
  }
  if (navboostLine && !caption.toLowerCase().includes("pesquise ")) {
    caption = `${caption}\n${navboostLine}`;
  }

  const hashtagText = composePostText("", hashtags);
  const reservedForTags = hashtagText ? hashtagText.length + 2 : 0;
  const maxCaptionChars = Math.max(80, limits.maxChars - reservedForTags);

  if (caption.length <= maxCaptionChars) {
    return caption;
  }

  // Preserve URL and Navboost prompt when truncating longer copy for short networks (X, Bluesky).
  const suffixParts = [cleanUrl, navboostLine].filter(Boolean);
  const suffix = suffixParts.join("\n");
  if (suffix.length + 20 < maxCaptionChars) {
    const bodyBudget = maxCaptionChars - suffix.length - 2;
    const strippedBody = sanitizeGeneratedCopy(
      rawCaption
        .replace(cleanUrl, "")
        .replace(navboostLine, "")
        .replace(/\bAcesse:\s*/gi, ""),
    );
    const shortBody = fitTextWithinLimit(strippedBody, bodyBudget);
    return shortBody ? `${shortBody}\n\n${suffix}` : fitTextWithinLimit(suffix, maxCaptionChars);
  }

  return fitTextWithinLimit(caption, maxCaptionChars);
}

function defaultHashtagsForChannel(channel: SocialChannel): string[] {
  if (channel === "x" || channel === "bluesky") {
    return ["#PortalNKL", "#EducacaoPratica"];
  }
  if (channel === "youtube" || channel === "bilibili") {
    return ["#PortalNKL", "#Tutoriais", "#Brasil"];
  }
  return ["#PortalNKL", "#AprendizadoPratico", "#ConteudoBrasil"];
}

export function buildDeterministicChannelCopy(
  channel: SocialChannel,
  topic: string,
  targetUrl?: string,
  navboostKeyword?: string,
): GeneratedChannelCopy {
  const cleanTopic = sanitizeGeneratedCopy(topic) || "Conteudo pratico do Portal NKL";
  const cleanUrl = normalizeTargetUrl(targetUrl);
  const navboost = navboostKeyword?.trim() ? sanitizeGeneratedCopy(navboostKeyword) : undefined;
  const limits = CHANNEL_LIMITS[channel];
  const hashtags = defaultHashtagsForChannel(channel);

  let rawBody = "";
  let title: string | undefined;

  if (channel === "youtube" || channel === "bilibili") {
    title = fitTextWithinLimit(
      `${cleanTopic} | Passo a passo no Portal NKL`,
      limits.maxTitle ?? 100,
    );
    rawBody = [
      `${cleanTopic}: veja na prática como aplicar este passo a passo sem enrolação.`,
      "Neste vídeo você acompanha os pontos essenciais para colocar o conteúdo em ação ainda hoje.",
      `Guia completo e recursos: ${cleanUrl}`,
      navboost ? `Pesquise "${navboost}" no Google.` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  } else if (channel === "x" || channel === "bluesky") {
    rawBody = [
      `${cleanTopic} — guia direto ao ponto para aplicar hoje.`,
      cleanUrl,
      navboost ? `Pesquise "${navboost}" no Google.` : "",
    ]
      .filter(Boolean)
      .join("\n");
  } else if (channel === "threads" || channel === "mastodon") {
    rawBody = [
      `${cleanTopic}: resumo direto para quem quer aplicar sem perder tempo.`,
      `Veja os detalhes em ${cleanUrl}`,
      navboost ? `Pesquise "${navboost}" no Google.` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  } else {
    rawBody = [
      `${cleanTopic} explicado de forma clara e objetiva.`,
      "Salve este vídeo para consultar os passos sempre que precisar.",
      `Acesse o conteúdo completo em ${cleanUrl}`,
      navboost ? `Pesquise "${navboost}" no Google.` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  const caption = enforceRequiredBlocks(channel, rawBody, cleanUrl, navboost, hashtags);

  return {
    channel,
    ...(title ? { title } : {}),
    caption,
    hashtags,
    source: "fallback",
  };
}

interface RouterJsonItem {
  channel?: unknown;
  title?: unknown;
  caption?: unknown;
  hashtags?: unknown;
}

function parseRouterCopyJson(
  rawText: string,
  channels: readonly SocialChannel[],
  topic: string,
  targetUrl: string,
  navboostKeyword?: string,
): Partial<Record<SocialChannel, GeneratedChannelCopy>> | null {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const items = Array.isArray((parsed as { items?: unknown }).items)
    ? ((parsed as { items: RouterJsonItem[] }).items)
    : Object.entries(parsed as Record<string, RouterJsonItem>).map(([channel, value]) => ({
        ...value,
        channel,
      }));

  const result: Partial<Record<SocialChannel, GeneratedChannelCopy>> = {};
  for (const channel of channels) {
    const match = items.find((item) => item?.channel === channel);
    if (!match || typeof match.caption !== "string" || !match.caption.trim()) {
      result[channel] = buildDeterministicChannelCopy(
        channel,
        topic,
        targetUrl,
        navboostKeyword,
      );
      continue;
    }

    const hashtags = Array.isArray(match.hashtags)
      ? match.hashtags
          .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
          .slice(0, 6)
      : defaultHashtagsForChannel(channel);

    const limits = CHANNEL_LIMITS[channel];
    const title =
      limits.maxTitle && typeof match.title === "string" && match.title.trim()
        ? fitTextWithinLimit(sanitizeGeneratedCopy(match.title), limits.maxTitle)
        : limits.maxTitle
          ? fitTextWithinLimit(`${sanitizeGeneratedCopy(topic)} | Portal NKL`, limits.maxTitle)
          : undefined;

    result[channel] = {
      channel,
      ...(title ? { title } : {}),
      caption: enforceRequiredBlocks(
        channel,
        match.caption,
        targetUrl,
        navboostKeyword,
        hashtags,
      ),
      hashtags,
      source: "9router",
    };
  }

  return result;
}

export async function generateSocialCopyForChannels(
  options: GenerateCopyOptions,
): Promise<Partial<Record<SocialChannel, GeneratedChannelCopy>>> {
  const channels = options.channels && options.channels.length > 0
    ? options.channels
    : SOCIAL_CHANNELS;
  const targetUrl = normalizeTargetUrl(options.targetUrl);
  const env = options.env ?? (typeof process !== "undefined" ? process.env : {});
  const fetchImpl = options.fetchImpl ?? fetch;

  const fallbackResult: Partial<Record<SocialChannel, GeneratedChannelCopy>> = {};
  for (const channel of channels) {
    fallbackResult[channel] = buildDeterministicChannelCopy(
      channel,
      options.topic,
      targetUrl,
      options.navboostKeyword,
    );
  }

  const baseUrl = env.NINE_ROUTER_BASE_URL?.trim();
  const apiKey = env.NINE_ROUTER_API_KEY?.trim();
  if (options.useAi === false || !baseUrl || !apiKey) {
    return fallbackResult;
  }

  const model =
    env.NINE_ROUTER_MODEL?.trim() ||
    env.NINE_ROUTER_WORKER_MODEL?.trim() ||
    DEFAULT_ROUTER_MODEL;

  const channelSpec = channels.map((channel) => ({
    channel,
    label: CHANNEL_METADATA[channel].label,
    maxChars: CHANNEL_LIMITS[channel].maxChars,
    ...(CHANNEL_LIMITS[channel].maxTitle ? { maxTitle: CHANNEL_LIMITS[channel].maxTitle } : {}),
  }));

  const prompt = [
    "Gere textos em pt-BR para publicação de vídeo do Portal NKL.",
    `Tema: ${sanitizeGeneratedCopy(options.topic)}`,
    `Link obrigatório: ${targetUrl}`,
    options.navboostKeyword
      ? `Prompt de busca obrigatório: Pesquise "${sanitizeGeneratedCopy(options.navboostKeyword)}" no Google.`
      : "",
    "Regras absolutas: ZERO emojis, ZERO promessas de ganho garantido ou dinheiro fácil, tom humano e direto.",
    `Canais e limites: ${JSON.stringify(channelSpec)}`,
    'Responda SOMENTE JSON válido no formato {"items":[{"channel":"...","title":"opcional","caption":"...","hashtags":["#PortalNKL"]}]}.',
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetchImpl(normalizeChatCompletionsUrl(baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "Você escreve legendas objetivas em português do Brasil para redes sociais do Portal NKL. Nunca use emojis nem jargão corporativo.",
          },
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });

    if (!response.ok) {
      return fallbackResult;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const rawContent = payload.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string" || !rawContent.trim()) {
      return fallbackResult;
    }

    return (
      parseRouterCopyJson(
        rawContent,
        channels,
        options.topic,
        targetUrl,
        options.navboostKeyword,
      ) ?? fallbackResult
    );
  } catch {
    return fallbackResult;
  }
}

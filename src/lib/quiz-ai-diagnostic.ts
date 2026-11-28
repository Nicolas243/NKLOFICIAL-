import { z } from 'zod';
import type { BusinessProfile } from '@/lib/quiz-engine';
import type { QuizResult } from '@/lib/quiz-result';

const aiDiagnosticSchema = z.object({
  archetype: z.string().trim().min(3).max(90),
  diagnostic_headline: z.string().trim().min(8).max(180).optional(),
  analysis: z.string().trim().min(30).max(1200),
  strengths: z.array(z.string().trim().min(6).max(240)).min(2).max(4).optional(),
  watchouts: z.array(z.string().trim().min(6).max(240)).min(1).max(3).optional(),
  first_week_focus: z.string().trim().min(12).max(360).optional(),
  top_3_businesses: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(140),
        why_it_fits: z.string().trim().min(8).max(280).optional(),
        action_plan_3_steps: z.array(z.string().trim().min(8).max(320)).length(3),
      }),
    )
    .min(1)
    .max(3),
});

const DEFAULT_ROUTER_MODEL = 'NKL-OPERARIOS';
const DEFAULT_TIMEOUT_MS = 10_000;

const HYPE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\brenda garantida\b/gi, 'potencial consistente'],
  [/\blucro garantido\b/gi, 'resultado estruturado'],
  [/\bganho garantido\b/gi, 'oportunidade real'],
  [/\b100%\s*garantido\b/gi, 'com método prático'],
  [/\bfique rico\b/gi, 'construa resultado sólido'],
  [/\bdinheiro f[aá]cil\b/gi, 'execução estruturada'],
];

function sanitizeText(value: string): string {
  let clean = value.replace(/\p{Extended_Pictographic}/gu, '');
  for (const [pattern, replacement] of HYPE_REPLACEMENTS) {
    clean = clean.replace(pattern, replacement);
  }
  return clean.replace(/[ \t]{2,}/g, ' ').trim();
}

function normalizeChatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/chat/completions')
    ? trimmed
    : `${trimmed}/chat/completions`;
}

function extractJsonObject(rawText: string): string | null {
  const match = rawText.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

export type EnhanceQuizOptions = {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

async function requestDiagnosticFromEndpoint(params: {
  endpointUrl: string;
  apiKey: string;
  model: string;
  result: QuizResult;
  businesses: BusinessProfile[];
  fetchImpl: typeof fetch;
  timeoutMs: number;
  useResponseFormatJson: boolean;
}): Promise<z.infer<typeof aiDiagnosticSchema>> {
  const systemPrompt = [
    'Você é o consultor sênior da Bússola de Negócios IA do Portal NKL.',
    'Gere um diagnóstico personalizado, inspirador e realista em português do Brasil (pt-BR).',
    'Regras absolutas:',
    '1) ZERO emojis.',
    '2) NUNCA prometa ganho garantido, lucro certo ou dinheiro fácil.',
    '3) NUNCA invente negócios fora da lista fornecida em "businesses". Use exatamente os nomes em "businesses".',
    '4) Responda SOMENTE JSON válido seguindo exatamente o formato solicitado.',
  ].join('\n');

  const userPayload = {
    profile_scores_1_to_5: params.result.profile,
    matched_businesses: params.businesses.map((business) => ({
      name: business.name,
      minCapitalBrl: business.minCapital,
      minTimeHoursPerWeek: business.minTimeHours,
      techLevel: business.techLevel,
      riskLevel: business.riskLevel,
    })),
    required_json_shape: {
      archetype: 'Nome curto do perfil (2 a 4 palavras em pt-BR)',
      diagnostic_headline: 'Frase executiva personalizada ligando o momento do usuário ao 1º negócio',
      analysis: 'Análise personalizada em 3 a 4 frases claras explicando os 5 eixos e por que esse caminho combina',
      strengths: ['Ponto forte 1', 'Ponto forte 2', 'Ponto forte 3'],
      watchouts: ['Ponto de atenção 1', 'Ponto de atenção 2'],
      first_week_focus: 'Orientação objetiva do que focar nos próximos 7 dias',
      top_3_businesses: [
        {
          name: 'Nome exato de um negócio de matched_businesses',
          why_it_fits: '1 frase explicando o encaixe para este perfil',
          action_plan_3_steps: ['Passo 1 prático', 'Passo 2 prático', 'Passo 3 prático'],
        },
      ],
    },
  };

  const bodyPayload: Record<string, unknown> = {
    model: params.model,
    temperature: 0.35,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(userPayload) },
    ],
  };

  if (params.useResponseFormatJson) {
    bodyPayload.response_format = { type: 'json_object' };
  }

  const response = await params.fetchImpl(params.endpointUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
    signal: AbortSignal.timeout(params.timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const rawBody: unknown = await response.json();
  const content = z
    .object({
      choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
    })
    .parse(rawBody).choices[0].message.content;

  const jsonString = extractJsonObject(content);
  if (!jsonString) {
    throw new Error('JSON ausente na resposta da IA.');
  }

  return aiDiagnosticSchema.parse(JSON.parse(jsonString));
}

function mapVerifiedAiDiagnostic(
  baseResult: QuizResult,
  businesses: BusinessProfile[],
  parsed: z.infer<typeof aiDiagnosticSchema>,
  source: '9router' | 'openai',
): QuizResult {
  const allowedByName = new Map(
    businesses.map((business) => [business.name.trim().toLocaleLowerCase('pt-BR'), business.name]),
  );

  const sanitizedTop3 = parsed.top_3_businesses
    .map((item) => {
      const canonicalName = allowedByName.get(item.name.trim().toLocaleLowerCase('pt-BR'));
      if (!canonicalName) return null;
      return {
        name: canonicalName,
        whyItFits: item.why_it_fits ? sanitizeText(item.why_it_fits) : undefined,
        actionPlan3Steps: [
          sanitizeText(item.action_plan_3_steps[0]),
          sanitizeText(item.action_plan_3_steps[1]),
          sanitizeText(item.action_plan_3_steps[2]),
        ] as [string, string, string],
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (sanitizedTop3.length === 0) {
    return baseResult;
  }

  return {
    ...baseResult,
    archetype: sanitizeText(parsed.archetype),
    diagnosticTitle: 'Diagnóstico Personalizado com IA · Bússola de Negócios IA',
    diagnosticHeadline: parsed.diagnostic_headline
      ? sanitizeText(parsed.diagnostic_headline)
      : baseResult.diagnosticHeadline,
    diagnosticSource: source,
    analysis: sanitizeText(parsed.analysis),
    strengths: parsed.strengths?.map(sanitizeText) ?? baseResult.strengths,
    watchouts: parsed.watchouts?.map(sanitizeText) ?? baseResult.watchouts,
    firstWeekFocus: parsed.first_week_focus
      ? sanitizeText(parsed.first_week_focus)
      : baseResult.firstWeekFocus,
    top3Businesses: sanitizedTop3,
  };
}

export async function enhanceQuizResultWithNineRouter(
  baseResult: QuizResult,
  businesses: BusinessProfile[],
  options: EnhanceQuizOptions = {},
): Promise<QuizResult> {
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const routerBaseUrl = env.NINE_ROUTER_BASE_URL?.trim();
  const routerApiKey = env.NINE_ROUTER_API_KEY?.trim();

  if (routerBaseUrl && routerApiKey) {
    const model =
      env.NINE_ROUTER_WORKER_MODEL?.trim() ||
      env.NINE_ROUTER_ORQUESTRADOR_MODEL?.trim() ||
      env.NINE_ROUTER_ORCHESTRATOR_MODEL?.trim() ||
      DEFAULT_ROUTER_MODEL;
    try {
      const parsed = await requestDiagnosticFromEndpoint({
        endpointUrl: normalizeChatCompletionsUrl(routerBaseUrl),
        apiKey: routerApiKey,
        model,
        result: baseResult,
        businesses,
        fetchImpl,
        timeoutMs,
        useResponseFormatJson: false,
      });
      return mapVerifiedAiDiagnostic(baseResult, businesses, parsed, '9router');
    } catch (error) {
      console.warn(
        '[PROCESS_QUIZ] 9router indisponível; ativando fallback seguro:',
        error instanceof Error ? error.message : 'erro desconhecido',
      );
    }
  }

  const openAiKey = env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    try {
      const parsed = await requestDiagnosticFromEndpoint({
        endpointUrl: 'https://api.openai.com/v1/chat/completions',
        apiKey: openAiKey,
        model: env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
        result: baseResult,
        businesses,
        fetchImpl,
        timeoutMs,
        useResponseFormatJson: true,
      });
      return mapVerifiedAiDiagnostic(baseResult, businesses, parsed, 'openai');
    } catch (error) {
      console.warn(
        '[PROCESS_QUIZ] OpenAI indisponível; usando diagnóstico estruturado:',
        error instanceof Error ? error.message : 'erro desconhecido',
      );
    }
  }

  return baseResult;
}

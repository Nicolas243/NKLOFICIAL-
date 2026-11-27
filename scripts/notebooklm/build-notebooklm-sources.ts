import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Browser, type Page } from 'playwright';
import postgres from 'postgres';
import sharp from 'sharp';
import { AI_COURSE_MODULES, type AiCourseModule } from '../../src/lib/ai-course';
import { videoManifestSchema, type VideoManifest } from '../../tools/nkl-video-factory';

loadEnv({ path: path.join(process.cwd(), '.env.local'), quiet: true });

export const SITE_BASE_URL = 'https://nkloficial.com.br';
export const OUTPUT_PACKS_RELATIVE_DIR = path.join('private-assets', 'notebooklm-packs');

export type PackCategory = 'ai-course' | 'language-guide' | 'flagship-income' | 'flagship-compass';

export interface PackPillar {
  value: string;
  label: string;
}

export interface PackDescriptor {
  order: number;
  slug: string;
  title: string;
  subtitle: string;
  category: PackCategory;
  categoryLabel: string;
  targetRoute: string;
  audience: string;
  objective: string;
  durationSeconds: number;
  pillars: readonly [PackPillar, PackPillar, PackPillar];
  sourceMarkdown: string;
}

export interface LanguageGuideConfig {
  slug: string;
  title: string;
  subtitle: string;
  targetRoute: string;
  audience: string;
  objective: string;
  pillars: readonly [PackPillar, PackPillar, PackPillar];
}

export interface ProgramSummary {
  slug: string;
  name: string;
  category: string;
  difficulty: string;
  shortDescription: string;
  longDescription: string;
  earningPotential: string | null;
  zeroInvestmentRequired: boolean;
  editorialRating: number;
  pros: string[];
  cons: string[];
  requirements: string[];
  paymentMethods: string[];
}

export interface BusinessProfileSummary {
  name: string;
  minCapital: string;
  minTimeHours: number;
  techLevel: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
}

export const LANGUAGE_GUIDE_CONFIGS: readonly LanguageGuideConfig[] = [
  {
    slug: 'ingles-para-ganhar-dinheiro',
    title: 'Inglês para Ganhar Dinheiro',
    subtitle: 'Comunicação prática em inglês para trabalho remoto, clientes e rotina profissional.',
    targetRoute: '/ofertas/ebook-ingles',
    audience: 'Brasileiros que querem destravar leitura, conversa e trabalho em inglês',
    objective:
      'Explicar como estruturar o aprendizado funcional de inglês com frases reais, segurança digital e prática diária.',
    pillars: [
      { value: '100+', label: 'Frases de uso real' },
      { value: '30d', label: 'Plano de revisão' },
      { value: 'IA', label: 'Prompts de treino' },
    ],
  },
  {
    slug: 'italiano-para-ganhar-possibilidades',
    title: 'Italiano para Ganhar Possibilidades',
    subtitle: 'Frases cotidianas, atendimento, turismo e prática guiada com IA em 90 dias.',
    targetRoute: '/guias/italiano',
    audience: 'Estudantes e profissionais interessados em italiano prático para viagens e serviços',
    objective:
      'Apresentar o roteiro prático de italiano com diálogos do dia a dia, guia de IA e planner de 90 dias.',
    pillars: [
      { value: '90d', label: 'Planner visual' },
      { value: 'IA', label: 'Prática por idade' },
      { value: 'PT-IT', label: 'Frases diretas' },
    ],
  },
  {
    slug: 'frances-para-ganhar-possibilidades',
    title: 'Francês para Ganhar Possibilidades',
    subtitle: 'Expressões úteis, exercícios curtos e treino de conversa em francês com apoio de IA.',
    targetRoute: '/guias/frances',
    audience: 'Pessoas que buscam autonomia básica e profissional em língua francesa',
    objective:
      'Resumir os blocos essenciais de francês funcional, leitura guiada e exercícios práticos do guia.',
    pillars: [
      { value: '90d', label: 'Roteiro de treino' },
      { value: 'A1-B1', label: 'Base comunicativa' },
      { value: 'IA', label: 'Simulação de fala' },
    ],
  },
  {
    slug: 'alemao-para-ganhar-possibilidades',
    title: 'Alemão para Ganhar Possibilidades',
    subtitle: 'Vocabulário por situações reais, estrutura clara e prompts práticos de alemão.',
    targetRoute: '/guias/alemao',
    audience: 'Brasileiros iniciando no alemão para estudo, carreira técnica ou viagens',
    objective:
      'Organizar os fundamentos do guia de alemão com frases de sobrevivência, trabalho e revisão espaçada.',
    pillars: [
      { value: '90d', label: 'Rotina em blocos' },
      { value: 'DE', label: 'Situações reais' },
      { value: 'IA', label: 'Correção guiada' },
    ],
  },
  {
    slug: 'espanhol-para-ganhar-possibilidades',
    title: 'Espanhol para Ganhar Possibilidades',
    subtitle: 'Leitura, conversa cotidiana e comunicação clara em espanhol para negócios e viagens.',
    targetRoute: '/guias/espanhol',
    audience: 'Profissionais e viajantes que querem sair do portunhol com clareza',
    objective:
      'Destacar falsos cognatos, frases de atendimento e métodos de prática diária presentes no guia de espanhol.',
    pillars: [
      { value: '90d', label: 'Consistência diária' },
      { value: 'ES', label: 'Sem portunhol' },
      { value: 'IA', label: 'Diálogos ativos' },
    ],
  },
  {
    slug: 'chines-para-ganhar-possibilidades',
    title: 'Chinês para Ganhar Possibilidades',
    subtitle: 'Tons, pinyin, frases essenciais e prática guiada de mandarim com IA.',
    targetRoute: '/guias/chines',
    audience: 'Iniciantes em mandarim que buscam base segura em tons, pinyin e negócios',
    objective:
      'Desmistificar tons, pinyin e cumprimentos essenciais do guia de chinês com exercícios progressivos.',
    pillars: [
      { value: '4', label: 'Tons explicados' },
      { value: 'Pinyin', label: 'Base fonética' },
      { value: '90d', label: 'Plano guiado' },
    ],
  },
];

const DEFAULT_BUSINESS_PROFILES: readonly BusinessProfileSummary[] = [
  { name: 'Avaliação de IA e Anotação de Dados', minCapital: '0', minTimeHours: 6, techLevel: 'medium', riskLevel: 'low' },
  { name: 'Testes de Usabilidade e QA Digital', minCapital: '0', minTimeHours: 5, techLevel: 'medium', riskLevel: 'low' },
  { name: 'Microtarefas e Pesquisa Estruturada', minCapital: '0', minTimeHours: 6, techLevel: 'low', riskLevel: 'low' },
  { name: 'Freelancer de Texto, Revisão e Tradução', minCapital: '0', minTimeHours: 8, techLevel: 'low', riskLevel: 'low' },
  { name: 'Edição de Vídeos Curtos e Cortes', minCapital: '0', minTimeHours: 10, techLevel: 'medium', riskLevel: 'low' },
  { name: 'Gestão de Conteúdo para Negócios Locais', minCapital: '0', minTimeHours: 10, techLevel: 'medium', riskLevel: 'low' },
  { name: 'Criação de UGC para Marcas', minCapital: '0', minTimeHours: 8, techLevel: 'low', riskLevel: 'low' },
  { name: 'Publicação Independente Kindle KDP', minCapital: '0', minTimeHours: 10, techLevel: 'medium', riskLevel: 'low' },
  { name: 'Produtos Digitais e Guias Práticos', minCapital: '150', minTimeHours: 12, techLevel: 'medium', riskLevel: 'medium' },
  { name: 'Curadoria de Afiliados com Conteúdo', minCapital: '0', minTimeHours: 10, techLevel: 'medium', riskLevel: 'low' },
  { name: 'Assistência Virtual e Back-office Remoto', minCapital: '0', minTimeHours: 12, techLevel: 'low', riskLevel: 'low' },
  { name: 'Aulas Particulares e Mentoria 1 para 1', minCapital: '0', minTimeHours: 8, techLevel: 'low', riskLevel: 'low' },
  { name: 'Automação de Fluxos com IA para PMEs', minCapital: '200', minTimeHours: 15, techLevel: 'high', riskLevel: 'medium' },
  { name: 'Criação de Sites e Páginas Locais', minCapital: '200', minTimeHours: 12, techLevel: 'high', riskLevel: 'medium' },
  { name: 'Operação de Tráfego Pago Local', minCapital: '500', minTimeHours: 12, techLevel: 'medium', riskLevel: 'medium' },
  { name: 'Comércio de Produtos sob Demanda', minCapital: '500', minTimeHours: 14, techLevel: 'medium', riskLevel: 'medium' },
  { name: 'Serviços Especializados de Áudio e Música', minCapital: '300', minTimeHours: 10, techLevel: 'medium', riskLevel: 'low' },
  { name: 'Microagência de Conteúdo e Captação', minCapital: '500', minTimeHours: 20, techLevel: 'medium', riskLevel: 'medium' },
];

const BANNED_TERM_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bDiagnóstico\b/g, 'Análise'],
  [/\bdiagnóstico\b/g, 'análise'],
];

const LEVEL_PT_BR: Record<'low' | 'medium' | 'high', string> = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
};

function decodeBasicHtmlEntities(value: string): string {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&mdash;', '—')
    .replaceAll('&ndash;', '–')
    .replaceAll('&bull;', '-')
    .replace(/&#(\d+);/g, (_match, dec: string) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    });
}

export function stripEmojis(input: string): string {
  return input
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\uFE0E\uFE0F\u200D]/gu, '');
}

export function stripHtmlAndEmojis(input: string): string {
  const withoutBlocks = input
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<head[\s\S]*?<\/head>/gi, ' ');

  const withLineBreaks = withoutBlocks
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|blockquote|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ');

  const withoutTags = withLineBreaks.replace(/<[^>]+>/g, ' ');
  const decoded = decodeBasicHtmlEntities(withoutTags);
  const emojiFree = stripEmojis(decoded);

  return emojiFree
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function sanitizeNotebookLmText(input: string): string {
  let cleaned = stripHtmlAndEmojis(input);
  for (const [pattern, replacement] of BANNED_TERM_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  return cleaned;
}

export function buildModuleSourceMarkdown(courseModule: AiCourseModule, index: number): string {
  const moduleNumber = String(index + 1).padStart(2, '0');
  const lines: string[] = [
    `# Curso IA na Prática — Módulo ${moduleNumber}: ${courseModule.title}`,
    '',
    `Rota no Portal NKL: /ia/curso/${courseModule.slug}`,
    `Liberação no curso: Dia ${courseModule.unlockAfterDays}`,
    '',
    '## Resumo do módulo',
    courseModule.summary,
    '',
    '## Compromisso editorial',
    'Este conteúdo ensina uso prático e verificável de inteligência artificial no trabalho e nos estudos, sem promessas irreais e com revisão humana obrigatória.',
    '',
  ];

  courseModule.lessons.forEach((lesson, lessonIndex) => {
    lines.push(`## Lição ${lessonIndex + 1}: ${lesson.title}`);
    lines.push('');
    lines.push(`- **Objetivo:** ${lesson.objective}`);
    lines.push(`- **Explicação:** ${lesson.explanation}`);
    lines.push('');
    lines.push('### Comparação prática');
    lines.push(`- **Evite:** ${lesson.exampleBad}`);
    lines.push(`- **Melhor:** ${lesson.exampleBetter}`);
    lines.push('');
    lines.push('### Exercício sugerido');
    lines.push(lesson.exercise);
    lines.push('');
    lines.push('### Checklist de aplicação');
    for (const item of lesson.checklist) {
      lines.push(`- [ ] ${item}`);
    }
    lines.push('');
  });

  lines.push('## Próximo passo');
  lines.push(`Acesse /ia/curso/${courseModule.slug} no Portal NKL para marcar suas lições concluídas.`);
  lines.push('');

  return sanitizeNotebookLmText(lines.join('\n'));
}

export function buildLanguageGuideSourceMarkdown(
  config: LanguageGuideConfig,
  rawMarkdownContent: string | null,
): string {
  if (rawMarkdownContent && rawMarkdownContent.trim().length > 0) {
    const cleanedBody = sanitizeNotebookLmText(rawMarkdownContent);
    const header = [
      `<!-- Fonte Portal NKL: ${config.targetRoute} -->`,
      `Rota oficial no Portal NKL: ${config.targetRoute}`,
      '',
    ].join('\n');
    return sanitizeNotebookLmText(`${header}${cleanedBody}\n`);
  }

  const fallback = [
    `# ${config.title}`,
    '',
    `Rota oficial no Portal NKL: ${config.targetRoute}`,
    '',
    '## Promessa responsável',
    'Aprender um novo idioma amplia suas opções de trabalho, estudo e comunicação, mas exige prática constante e não garante contratação automática.',
    '',
    '## Foco do guia',
    config.subtitle,
    '',
    '## Como aplicar na rotina',
    '- Reserve 15 a 25 minutos por dia para leitura em voz alta.',
    '- Pratique frases completas ligadas a situações de trabalho, viagem e atendimento.',
    '- Use inteligência artificial apenas como parceira de treino e correção guiada.',
    '- Revise semanalmente o vocabulário acumulado antes de avançar.',
    '',
    '## Checklist semanal',
    '- [ ] Li 5 frases modelo em voz alta',
    '- [ ] Adaptei 2 exemplos para minha rotina real',
    '- [ ] Registrei dúvidas de pronúncia e vocabulário',
    '',
  ].join('\n');

  return sanitizeNotebookLmText(fallback);
}

export function buildRendaExtraSourceMarkdown(
  programs: readonly ProgramSummary[],
  fallbackHtmlText?: string,
): string {
  if (programs.length > 0) {
    const lines: string[] = [
      '# Guia Renda Extra — Dossiê de Programas Publicados no Portal NKL',
      '',
      'Rota oficial no Portal NKL: /ofertas/pacote-renda-extra e /programas',
      `Total de oportunidades publicadas incluídas neste dossiê: ${programs.length}`,
      '',
      '## Critérios editoriais e proteção contra golpes',
      '- Nenhuma plataforma listada promete renda garantida ou enriquecimento rápido.',
      '- Nunca pague taxa antecipada para liberar saque ou cadastro em vagas de trabalho.',
      '- Calcule sempre o ganho líquido por hora considerando câmbio, taxas e tempo de aprovação.',
      '- Comece validando uma oportunidade por 14 dias antes de tentar escalar.',
      '',
      '## Catálogo estruturado por plataforma',
      '',
    ];

    for (const program of programs) {
      lines.push(`### ${program.name}`);
      lines.push(`- **Categoria:** ${program.category}`);
      lines.push(`- **Nível de dificuldade:** ${program.difficulty}`);
      lines.push(`- **Investimento inicial zero:** ${program.zeroInvestmentRequired ? 'Sim' : 'Não'}`);
      lines.push(`- **Nota editorial NKL:** ${program.editorialRating}/10`);
      if (program.earningPotential) {
        lines.push(`- **Potencial informado:** ${program.earningPotential}`);
      }
      lines.push(`- **Resumo:** ${program.shortDescription}`);
      if (program.longDescription) {
        lines.push(`- **Como funciona:** ${program.longDescription}`);
      }
      if (program.pros.length > 0) {
        lines.push(`- **Pontos fortes:** ${program.pros.join('; ')}`);
      }
      if (program.cons.length > 0) {
        lines.push(`- **Cuidados:** ${program.cons.join('; ')}`);
      }
      if (program.requirements.length > 0) {
        lines.push(`- **Requisitos:** ${program.requirements.join('; ')}`);
      }
      if (program.paymentMethods.length > 0) {
        lines.push(`- **Formas de pagamento:** ${program.paymentMethods.join(', ')}`);
      }
      lines.push('');
    }

    lines.push('## Checklist dos primeiros 14 dias');
    lines.push('- [ ] Escolher 1 trilha principal compatível com seu tempo semanal');
    lines.push('- [ ] Configurar conta de recebimento e verificação em duas etapas');
    lines.push('- [ ] Registrar horas dedicadas e valor líquido recebido');
    lines.push('');

    return sanitizeNotebookLmText(lines.join('\n'));
  }

  if (fallbackHtmlText && fallbackHtmlText.trim().length > 0) {
    const cleaned = sanitizeNotebookLmText(fallbackHtmlText);
    const maxChars = 120_000;
    const excerpt = cleaned.length > maxChars ? `${cleaned.slice(0, maxChars)}\n\n[Resumo truncado para limite operacional.]` : cleaned;
    return [
      '# Guia Renda Extra — 57 Formas Práticas (Base Editorial Portal NKL)',
      '',
      'Rota oficial no Portal NKL: /ofertas/pacote-renda-extra',
      '',
      excerpt,
    ].join('\n');
  }

  return sanitizeNotebookLmText(
    [
      '# Guia Renda Extra — 57 Formas Práticas de Construir Renda Extra',
      '',
      'Rota oficial no Portal NKL: /ofertas/pacote-renda-extra e /programas',
      '',
      '## Método de validação em 14 dias',
      '- Escolha plataformas verificadas com regras claras de pagamento.',
      '- Avalie ganho líquido por hora, requisitos técnicos e idioma.',
      '- Proteja seus dados e desconfie de qualquer pedido de depósito prévio.',
      '',
    ].join('\n'),
  );
}

export function buildBussolaSourceMarkdown(profiles: readonly BusinessProfileSummary[]): string {
  const effectiveProfiles = profiles.length > 0 ? profiles : DEFAULT_BUSINESS_PROFILES;
  const lines: string[] = [
    '# Bússola de Negócios — 18 Modelos Reais para Construir no Seu Ritmo',
    '',
    'Rota oficial no Portal NKL: /ofertas/bussola-negocios',
    `Total de modelos catalogados: ${effectiveProfiles.length}`,
    '',
    '## Como funciona a Bússola de Negócios',
    'A Bússola de Negócios avalia cinco dimensões práticas: capital disponível, tempo semanal, afinidade técnica, tolerância a risco e disposição para contato com pessoas.',
    'O objetivo não é prometer resultado automático, e sim reduzir erro de escolha antes de investir tempo ou dinheiro.',
    '',
    '## Os 18 modelos comparados',
    '',
  ];

  effectiveProfiles.forEach((profile, index) => {
    const num = String(index + 1).padStart(2, '0');
    const capitalNum = Number.parseFloat(profile.minCapital);
    const capitalText = Number.isFinite(capitalNum) && capitalNum > 0 ? `R$ ${capitalNum}` : 'R$ 0';
    lines.push(`### ${num}. ${profile.name}`);
    lines.push(`- **Capital mínimo estimado:** ${capitalText}`);
    lines.push(`- **Dedicação mínima sugerida:** ${profile.minTimeHours} horas por semana`);
    lines.push(`- **Exigência técnica:** ${LEVEL_PT_BR[profile.techLevel]}`);
    lines.push(`- **Nível de risco:** ${LEVEL_PT_BR[profile.riskLevel]}`);
    lines.push('');
  });

  lines.push('## Checklist antes de escolher seu modelo');
  lines.push('- [ ] Confirmei quantas horas reais tenho livres por semana');
  lines.push('- [ ] Defini um teto financeiro que não compromete minha reserva essencial');
  lines.push('- [ ] Estruturei uma oferta simples de testar em 7 dias sem anúncios pagos');
  lines.push('');

  return sanitizeNotebookLmText(lines.join('\n'));
}

export function buildNotebookLmPrompt(pack: PackDescriptor): string {
  const lines = [
    `Idioma obrigatório: Português do Brasil (PT-BR).`,
    `Tema central: ${pack.title} — ${pack.subtitle}`,
    `Público-alvo: ${pack.audience}.`,
    `Objetivo do episódio: ${pack.objective}`,
    '',
    'Diretrizes editoriais do Portal NKL:',
    '- Tom humano, claro, direto ao ponto e acolhedor, sem jargões corporativos vazios.',
    '- Zero promessas de dinheiro fácil, ganho garantido ou resultados imediatos.',
    '- Destaque exemplos concretos, passos aplicáveis hoje e um checklist curto de verificação.',
    `- Cite a rota oficial no portal (${pack.targetRoute}) de forma natural durante a explicação.`,
    '- Encerre obrigatoriamente com a chamada final exata: "Para acessar o material completo e as ferramentas atualizadas, pesquise Portal NKL no Google."',
  ];
  return sanitizeNotebookLmText(lines.join('\n'));
}

export function buildVideoManifest(pack: PackDescriptor): VideoManifest {
  const title = pack.title.slice(0, 120);
  const callToAction =
    `Pesquise Portal NKL no Google e acesse ${pack.targetRoute} para conferir o material completo.`.slice(
      0,
      300,
    );

  return videoManifestSchema.parse({
    title,
    objective: pack.objective.slice(0, 500),
    audience: pack.audience.slice(0, 200),
    sources: [
      {
        url: `${SITE_BASE_URL}${pack.targetRoute}`,
        title: `${pack.title} — Portal NKL`,
        verified: true,
      },
    ],
    durationSeconds: pack.durationSeconds,
    formats: ['horizontal', 'vertical'],
    language: 'pt-BR',
    prohibitedClaims: [
      'dinheiro fácil',
      'renda garantida',
      'enriquecimento rápido',
      'aprovação automática',
    ],
    callToAction,
    rightsConfirmed: true,
    channels: ['youtube', 'facebook'],
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderPortalNklCrestSvg(sizePx: number): string {
  return `<svg width="${sizePx}" height="${sizePx}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <polygon points="32,3 53,11 61,32 53,53 32,61 11,53 3,32 11,11" stroke="#f59e0b" stroke-width="2" fill="rgba(8,17,33,0.75)" />
    <polygon points="32,9 49,15 55,32 49,49 32,55 15,49 9,32 15,15" stroke="rgba(249,115,22,0.55)" stroke-width="1" fill="none" />
    <path d="M22 42V22L34 38V22" stroke="#f8fafc" stroke-width="2.4" stroke-linecap="square" stroke-linejoin="miter" />
    <path d="M38 22V42M46 22L38 32L46 42" stroke="#f59e0b" stroke-width="2.4" stroke-linecap="square" stroke-linejoin="miter" />
  </svg>`;
}

export function renderCoverHtml(pack: PackDescriptor, orientation: '16x9' | '9x16'): string {
  const isVertical = orientation === '9x16';
  const width = isVertical ? 1080 : 1920;
  const height = isVertical ? 1920 : 1080;
  const packTag = `PACK ${String(pack.order).padStart(2, '0')}/15`;
  const titleFontSize = pack.title.length > 36 ? (isVertical ? 76 : 74) : (isVertical ? 88 : 88);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: #081121;
      color: #f8fafc;
    }
    .surface {
      position: relative;
      width: 100%;
      height: 100%;
      padding: ${isVertical ? '108px 86px 96px' : '74px 96px 68px'};
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background:
        radial-gradient(circle at 82% 18%, rgba(245, 158, 11, 0.18) 0%, rgba(245, 158, 11, 0) 45%),
        radial-gradient(circle at 18% 85%, rgba(249, 115, 22, 0.14) 0%, rgba(249, 115, 22, 0) 48%),
        linear-gradient(155deg, #081121 0%, #0d1c36 52%, #13294b 100%);
    }
    .grid-overlay {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right, rgba(245, 158, 11, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(245, 158, 11, 0.05) 1px, transparent 1px);
      background-size: 96px 96px;
      pointer-events: none;
    }
    .frame {
      position: absolute;
      inset: ${isVertical ? '38px' : '32px'};
      border: 1px solid rgba(245, 158, 11, 0.28);
      pointer-events: none;
    }
    .top-band {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: ${isVertical ? '34px' : '24px'};
      border-bottom: 1px solid rgba(245, 158, 11, 0.35);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .kicker {
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      font-weight: 700;
      font-size: ${isVertical ? '26px' : '24px'};
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #f59e0b;
      margin: 0;
    }
    .pack-tag {
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      font-weight: 600;
      font-size: ${isVertical ? '22px' : '20px'};
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #cbd5e1;
      margin: 0;
    }
    .center-block {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: ${isVertical ? '36px' : '26px'};
    }
    .rule-bar {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .rule-primary {
      width: 144px;
      height: 6px;
      background: linear-gradient(90deg, #f59e0b 0%, #f97316 100%);
    }
    .rule-secondary {
      height: 1px;
      flex: 1;
      background: rgba(245, 158, 11, 0.35);
    }
    .title {
      font-family: Georgia, "Times New Roman", serif;
      font-weight: 700;
      font-size: ${titleFontSize}px;
      line-height: 1.08;
      color: #fffdf7;
      margin: 0;
      letter-spacing: -0.015em;
    }
    .subtitle {
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      font-weight: 400;
      font-size: ${isVertical ? '36px' : '32px'};
      line-height: 1.38;
      color: #dbe4f0;
      margin: 0;
      max-width: ${isVertical ? '900px' : '1420px'};
    }
    .pillars {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: ${isVertical ? '24px' : '36px'};
      padding: ${isVertical ? '34px 0' : '24px 0'};
      border-top: 1px solid rgba(148, 163, 184, 0.25);
      border-bottom: 1px solid rgba(148, 163, 184, 0.25);
    }
    .pillar {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .pillar-value {
      font-family: Georgia, "Times New Roman", serif;
      font-weight: 700;
      font-size: ${isVertical ? '52px' : '46px'};
      color: #f59e0b;
      line-height: 1.05;
    }
    .pillar-label {
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      font-size: ${isVertical ? '20px' : '18px'};
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .bottom-block {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: ${isVertical ? '28px' : '22px'};
    }
    .badge {
      display: inline-block;
      align-self: flex-start;
      padding: ${isVertical ? '18px 28px' : '14px 24px'};
      border-radius: 6px;
      background: linear-gradient(90deg, rgba(245, 158, 11, 0.18) 0%, rgba(249, 115, 22, 0.18) 100%);
      border: 1px solid rgba(245, 158, 11, 0.72);
      color: #fef3c7;
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      font-weight: 700;
      font-size: ${isVertical ? '24px' : '21px'};
      letter-spacing: 0.05em;
    }
    .footer-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 20px;
      border-top: 1px solid rgba(148, 163, 184, 0.24);
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      font-size: ${isVertical ? '20px' : '18px'};
      color: #94a3b8;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .footer-accent {
      color: #f59e0b;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <main class="surface">
    <div class="grid-overlay"></div>
    <div class="frame"></div>
    <header class="top-band">
      <div class="brand">
        ${renderPortalNklCrestSvg(isVertical ? 60 : 54)}
        <p class="kicker">${escapeHtml(pack.categoryLabel)}</p>
      </div>
      <p class="pack-tag">${escapeHtml(packTag)}</p>
    </header>
    <section class="center-block">
      <div class="rule-bar">
        <div class="rule-primary"></div>
        <div class="rule-secondary"></div>
      </div>
      <h1 class="title">${escapeHtml(pack.title)}</h1>
      <p class="subtitle">${escapeHtml(pack.subtitle)}</p>
      <div class="pillars">
        ${pack.pillars
          .map(
            (pillar) => `<div class="pillar">
          <span class="pillar-value">${escapeHtml(pillar.value)}</span>
          <span class="pillar-label">${escapeHtml(pillar.label)}</span>
        </div>`,
          )
          .join('')}
      </div>
    </section>
    <footer class="bottom-block">
      <div class="badge">PESQUISE PORTAL NKL NO GOOGLE · ${escapeHtml(pack.targetRoute)}</div>
      <div class="footer-meta">
        <span>PORTAL NKL · CONTEÚDO PRÁTICO EM PT-BR</span>
        <span class="footer-accent">NKLOFICIAL.COM.BR</span>
      </div>
    </footer>
  </main>
</body>
</html>`;
}

export function buildIndexMarkdown(packs: readonly PackDescriptor[]): string {
  const lines: string[] = [
    '# Índice de Produção — 15 Pacotes NotebookLM do Portal NKL',
    '',
    'Gerado por `scripts/notebooklm/build-notebooklm-sources.ts`.',
    '',
    '| Ordem | Slug | Título | Rota no Portal | Resumo do Prompt |',
    '| --- | --- | --- | --- | --- |',
  ];

  for (const pack of packs) {
    lines.push(
      `| ${String(pack.order).padStart(2, '0')} | \`${pack.slug}\` | ${pack.title} | \`${pack.targetRoute}\` | ${pack.objective} |`,
    );
  }

  lines.push('');
  lines.push('## Próximo passo');
  lines.push('1. Instale o `notebooklm-py` com `uv tool install notebooklm-py` e autentique via `notebooklm login`.');
  lines.push('2. Execute `powershell -ExecutionPolicy Bypass -File private-assets/notebooklm-packs/run-notebooklm-batch.ps1`.');
  lines.push('3. Finalize vídeos e legendas com `npx tsx scripts/notebooklm/render-deliverable-video.ts --all`.');
  lines.push('');

  return sanitizeNotebookLmText(lines.join('\n'));
}

export function buildBatchPowerShellScript(packs: readonly PackDescriptor[]): string {
  const entries = packs
    .map(
      (pack) =>
        `  @{ Slug = '${pack.slug}'; Title = '${pack.title.replaceAll("'", "''")}'; Route = '${pack.targetRoute}' }`,
    )
    .join('\n');

  return `param(
  [string]$PackSlug = '',
  [switch]$SkipVideoOverview
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command notebooklm -ErrorAction SilentlyContinue)) {
  Write-Host 'CLI "notebooklm" nao encontrado.'
  Write-Host 'Instale com: uv tool install notebooklm-py'
  Write-Host 'Depois autentique com: notebooklm login'
  exit 1
}

$packsRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$packs = @(
${entries}
)

if ($PackSlug) {
  $packs = @($packs | Where-Object { $_.Slug -eq $PackSlug })
  if ($packs.Count -eq 0) {
    throw "Pack nao encontrado: $PackSlug"
  }
}

foreach ($pack in $packs) {
  $packDir = Join-Path $packsRoot $pack.Slug
  $sourcePath = Join-Path $packDir 'source.md'
  $promptPath = Join-Path $packDir 'notebooklm-prompt.txt'
  $audioOut = Join-Path $packDir 'audio.mp3'
  $videoOut = Join-Path $packDir 'notebooklm-video.mp4'

  if (-not (Test-Path $sourcePath)) {
    Write-Warning "Arquivo source.md ausente em $packDir; pulando."
    continue
  }

  $promptText = (Get-Content -Path $promptPath -Raw -Encoding UTF8).Trim()
  $notebookTitle = "Portal NKL - $($pack.Title)"

  Write-Host "=== Processando [$($pack.Slug)] ==="
  $createdOutput = notebooklm create "$notebookTitle" --json | Out-String
  $notebookId = $null
  try {
    $parsed = $createdOutput | ConvertFrom-Json
    $notebookId = $parsed.id
  } catch {
    Write-Host "Aviso: nao foi possivel extrair JSON de notebooklm create; usando notebook ativo."
  }

  if ($notebookId) {
    notebooklm use $notebookId | Out-Null
  }

  notebooklm source add "$sourcePath" --wait
  notebooklm generate audio "$promptText" --language pt --wait
  notebooklm download audio "$audioOut"

  if (-not $SkipVideoOverview) {
    try {
      notebooklm generate video "$promptText" --language pt --wait
      notebooklm download video "$videoOut"
    } catch {
      Write-Host "Video Overview opcional indisponivel ou ignorado para $($pack.Slug); audio.mp3 salvo."
    }
  }

  Write-Host "Concluido: $audioOut"
}

Write-Host 'Lote NotebookLM finalizado. Rode: npx tsx scripts/notebooklm/render-deliverable-video.ts --all'
`;
}

type RawProgramRow = {
  slug: string;
  name: string;
  category: string;
  difficulty: string;
  short_description: string;
  long_description: string;
  earning_potential: string | null;
  zero_investment_required: boolean;
  editorial_rating: number | string;
  pros: string[] | string | null;
  cons: string[] | string | null;
  requirements: string[] | string | null;
  payment_methods: string[] | string | null;
};

type RawBusinessProfileRow = {
  name: string;
  min_capital: string | number;
  min_time_hours: number;
  tech_level: 'low' | 'medium' | 'high';
  risk_level: 'low' | 'medium' | 'high';
};

function normalizeStringArray(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return [value.trim()];
    }
  }
  return [];
}

async function fetchDatabaseFlagshipData(): Promise<{
  programs: ProgramSummary[];
  profiles: BusinessProfileSummary[];
}> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return { programs: [], profiles: [] };
  }

  const sql = postgres(databaseUrl, {
    ssl: databaseUrl.includes('localhost') ? undefined : 'require',
    max: 1,
    connect_timeout: 5,
    idle_timeout: 10,
  });

  try {
    const rawPrograms = await sql<RawProgramRow[]>`
      SELECT
        slug,
        name,
        category,
        difficulty,
        short_description,
        long_description,
        earning_potential,
        zero_investment_required,
        editorial_rating,
        pros,
        cons,
        requirements,
        payment_methods
      FROM partner_programs
      WHERE status = 'published'
      ORDER BY name ASC
    `;

    const rawProfiles = await sql<RawBusinessProfileRow[]>`
      SELECT name, min_capital, min_time_hours, tech_level, risk_level
      FROM business_profiles
      ORDER BY min_capital::numeric ASC, name ASC
    `;

    const programs: ProgramSummary[] = rawPrograms.map((row) => ({
      slug: row.slug,
      name: row.name,
      category: row.category,
      difficulty: row.difficulty,
      shortDescription: row.short_description,
      longDescription: row.long_description,
      earningPotential: row.earning_potential,
      zeroInvestmentRequired: Boolean(row.zero_investment_required),
      editorialRating: Number(row.editorial_rating) || 0,
      pros: normalizeStringArray(row.pros),
      cons: normalizeStringArray(row.cons),
      requirements: normalizeStringArray(row.requirements),
      paymentMethods: normalizeStringArray(row.payment_methods),
    }));

    const profiles: BusinessProfileSummary[] = rawProfiles.map((row) => ({
      name: row.name,
      minCapital: String(row.min_capital),
      minTimeHours: Number(row.min_time_hours) || 0,
      techLevel: row.tech_level,
      riskLevel: row.risk_level,
    }));

    return { programs, profiles };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Aviso: fallback local ativado para flagship packs (${message}).\n`);
    return { programs: [], profiles: [] };
  } finally {
    await sql.end();
  }
}

export function buildAllPacksFromInputs(inputs: {
  modules: readonly AiCourseModule[];
  guideContents: Record<string, string | null>;
  programs: readonly ProgramSummary[];
  profiles: readonly BusinessProfileSummary[];
  rendaExtraFallbackHtml?: string;
}): PackDescriptor[] {
  const packs: PackDescriptor[] = [];
  let order = 1;

  inputs.modules.forEach((courseModule, index) => {
    const prefix = `ia-${String(index + 1).padStart(2, '0')}`;
    const slug = `${prefix}-${courseModule.slug}`;
    packs.push({
      order: order++,
      slug,
      title: `Módulo ${String(index + 1).padStart(2, '0')} — ${courseModule.title}`,
      subtitle: courseModule.summary,
      category: 'ai-course',
      categoryLabel: 'CURSO IA NA PRÁTICA',
      targetRoute: `/ia/curso/${courseModule.slug}`,
      audience: 'Alunos e profissionais aplicando IA no trabalho e nos estudos',
      objective: `Ensinar na prática o módulo "${courseModule.title}": ${courseModule.summary}`,
      durationSeconds: 300,
      pillars: [
        { value: `M${String(index + 1).padStart(2, '0')}`, label: 'Trilha oficial' },
        { value: `${courseModule.lessons.length}`, label: 'Lições práticas' },
        { value: `Dia ${courseModule.unlockAfterDays}`, label: 'Liberação' },
      ],
      sourceMarkdown: buildModuleSourceMarkdown(courseModule, index),
    });
  });

  for (const config of LANGUAGE_GUIDE_CONFIGS) {
    const rawContent = inputs.guideContents[config.slug] ?? null;
    packs.push({
      order: order++,
      slug: config.slug,
      title: config.title,
      subtitle: config.subtitle,
      category: 'language-guide',
      categoryLabel: 'GUIA DE IDIOMA',
      targetRoute: config.targetRoute,
      audience: config.audience,
      objective: config.objective,
      durationSeconds: 360,
      pillars: config.pillars,
      sourceMarkdown: buildLanguageGuideSourceMarkdown(config, rawContent),
    });
  }

  packs.push({
    order: order++,
    slug: 'guia-renda-extra-57-formas',
    title: 'Guia Renda Extra — 57 Formas Verificadas',
    subtitle: 'Critérios antifraude, cálculo de hora líquida e validação em 14 dias.',
    category: 'flagship-income',
    categoryLabel: 'GUIA RENDA EXTRA',
    targetRoute: '/ofertas/pacote-renda-extra',
    audience: 'Pessoas em busca de renda extra real com avaliação de risco e tempo',
    objective:
      'Explicar como comparar oportunidades reais de renda extra sem cair em promessas falsas e validar uma trilha em 14 dias.',
    durationSeconds: 480,
    pillars: [
      { value: `${inputs.programs.length || 57}`, label: 'Formas analisadas' },
      { value: '14d', label: 'Teste prático' },
      { value: '0', label: 'Promessas falsas' },
    ],
    sourceMarkdown: buildRendaExtraSourceMarkdown(inputs.programs, inputs.rendaExtraFallbackHtml),
  });

  packs.push({
    order: order++,
    slug: 'bussola-negocios-18-modelos',
    title: 'Bússola de Negócios — 18 Modelos Reais',
    subtitle: 'Compare capital, horas semanais, risco e nível técnico antes de começar.',
    category: 'flagship-compass',
    categoryLabel: 'BÚSSOLA DE NEGÓCIOS',
    targetRoute: '/ofertas/bussola-negocios',
    audience: 'Empreendedores iniciantes escolhendo um modelo de negócio compatível com a própria rotina',
    objective:
      'Apresentar os 18 modelos da Bússola de Negócios para ajudar o ouvinte a escolher o próximo passo conforme capital, tempo e risco.',
    durationSeconds: 420,
    pillars: [
      { value: `${inputs.profiles.length || 18}`, label: 'Modelos reais' },
      { value: '5', label: 'Eixos avaliados' },
      { value: '7d', label: 'Validação inicial' },
    ],
    sourceMarkdown: buildBussolaSourceMarkdown(inputs.profiles),
  });

  return packs;
}

async function renderCoverPair(
  page16x9: Page,
  page9x16: Page,
  pack: PackDescriptor,
  packDir: string,
): Promise<void> {
  const html16x9 = renderCoverHtml(pack, '16x9');
  await page16x9.setContent(html16x9, { waitUntil: 'load' });
  const png16x9 = await page16x9.screenshot({ type: 'png' });
  await sharp(png16x9)
    .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
    .toFile(path.join(packDir, 'cover-16x9.jpg'));

  const html9x16 = renderCoverHtml(pack, '9x16');
  await page9x16.setContent(html9x16, { waitUntil: 'load' });
  const png9x16 = await page9x16.screenshot({ type: 'png' });
  await sharp(png9x16)
    .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
    .toFile(path.join(packDir, 'cover-9x16.jpg'));
}

export async function runBuildPipeline(cwd = process.cwd()): Promise<{
  packCount: number;
  coversGenerated: number;
  outputRoot: string;
}> {
  const guiasDir = path.join(cwd, 'private-assets', 'guias');
  const guideContents: Record<string, string | null> = {};

  for (const config of LANGUAGE_GUIDE_CONFIGS) {
    const filePath = path.join(guiasDir, `${config.slug}.md`);
    guideContents[config.slug] = existsSync(filePath) ? readFileSync(filePath, 'utf8') : null;
  }

  const bookHtmlPath = path.join(cwd, 'private-assets', 'amazon-book', '57-formas-renda-extra-kindle.html');
  const rendaExtraFallbackHtml = existsSync(bookHtmlPath) ? readFileSync(bookHtmlPath, 'utf8') : undefined;

  const { programs, profiles } = await fetchDatabaseFlagshipData();

  const packs = buildAllPacksFromInputs({
    modules: AI_COURSE_MODULES,
    guideContents,
    programs,
    profiles,
    rendaExtraFallbackHtml,
  });

  const outputRoot = path.join(cwd, OUTPUT_PACKS_RELATIVE_DIR);
  mkdirSync(outputRoot, { recursive: true });

  let browser: Browser | undefined;
  let coversGenerated = 0;

  try {
    browser = await chromium.launch({ headless: true });
    const context16x9 = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const context9x16 = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const page16x9 = await context16x9.newPage();
    const page9x16 = await context9x16.newPage();

    for (const pack of packs) {
      const packDir = path.join(outputRoot, pack.slug);
      mkdirSync(packDir, { recursive: true });

      writeFileSync(path.join(packDir, 'source.md'), pack.sourceMarkdown, 'utf8');
      writeFileSync(path.join(packDir, 'notebooklm-prompt.txt'), `${buildNotebookLmPrompt(pack)}\n`, 'utf8');
      const manifest = buildVideoManifest(pack);
      writeFileSync(path.join(packDir, 'video-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

      await renderCoverPair(page16x9, page9x16, pack, packDir);
      coversGenerated += 2;
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  writeFileSync(path.join(outputRoot, 'INDEX-PRODUCAO.md'), buildIndexMarkdown(packs), 'utf8');
  writeFileSync(path.join(outputRoot, 'run-notebooklm-batch.ps1'), buildBatchPowerShellScript(packs), 'utf8');

  return {
    packCount: packs.length,
    coversGenerated,
    outputRoot,
  };
}

function isEntrypoint(): boolean {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint && import.meta.url === pathToFileURL(entrypoint).href);
}

if (isEntrypoint()) {
  runBuildPipeline()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`NOTEBOOKLM_SOURCES_BUILD_FAILED: ${message}\n`);
      process.exitCode = 1;
    });
}

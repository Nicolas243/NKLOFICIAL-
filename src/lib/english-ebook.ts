import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type EnglishEbookLesson = {
  number: number;
  title: string;
  paragraphs: string[];
  bullets: string[];
};

export function splitEnglishExample(example: string): { english: string; portuguese: string | null } {
  const match = example.match(/^(.*?)\s+\((.+)\)$/u);
  return match ? { english: match[1]!.trim(), portuguese: match[2]!.trim() } : { english: example, portuguese: null };
}

export type ExampleToken = {
  text: string;
  colorIndex: number;
  isWord: boolean;
};

const NON_HAN_WORD_PATTERN = /^[\p{L}\d]/u;
const HAN_CHAR_PATTERN = /\p{Script=Han}/u;
const SEGMENT_PATTERN = /(\p{Script=Han}+|[^\p{Script=Han}\s]+(?:\s+|$)|\s+)/gu;
const LATIN_TOKEN_PATTERN = /([^\p{Script=Han}\p{L}\d\s]+|\p{L}+(?:['’−-]\p{L}+)?|\d+|\s+)/gu;
const COLOR_COUNT = 6;

const CJK_LEXICON = new Set([
  '我叫',
  '给我',
  '一杯',
  '咖啡',
  '再说',
  '一遍',
  '好吗',
  '在家',
  '工作',
  '每天',
  '学习',
  '我是',
  '我有',
  '喜欢',
  '明白',
  '不明白',
  '怎么',
  '谢谢',
  '再见',
  '你好',
  '请问',
  '什么',
  '哪里',
  '现在',
  '今天',
  '明天',
  '可以',
  '不能',
  '对不起',
]);

export const BILINGUAL_COLOR_CLASSES = [
  'text-blue-700 dark:text-sky-300',
  'text-orange-700 dark:text-orange-300',
  'text-emerald-700 dark:text-emerald-300',
  'text-purple-700 dark:text-purple-300',
  'text-amber-700 dark:text-amber-300',
  'text-rose-700 dark:text-rose-300',
] as const;

export const BILINGUAL_PRINT_COLORS = [
  '#1d4ed8',
  '#c2410c',
  '#047857',
  '#7e22ce',
  '#b45309',
  '#be123c',
] as const;

const PHRASE_ALIGNMENTS: ReadonlyArray<readonly [string, readonly string[]]> = [
  // Inglês
  ['wake up', ['acordo', 'acordar']],
  ['did not', ['nao']],
  ['do not', ['nao']],
  ['does not', ['nao']],
  ['let me', ['deixe-me', 'deixe']],
  ['going to', ['vou', 'vai', 'vamos']],
  ['a lot', ['muito']],
  ['next to', ['ao lado']],
  ['carry-on', ['de mao']],
  ['in writing', ['por escrito']],
  ['safely', ['com seguranca']],
  ['need', ['preciso de', 'precisa de', 'precisamos de', 'preciso', 'precisa', 'precisamos']],
  ['what', ['do que', 'o que', 'que', 'qual']],
  ['mean', ['quer dizer', 'significa']],
  ['again', ['de novo', 'novamente', 'novo']],
  ['welcome', ['bem-vindo', 'bem-vinda']],
  ['everyone', ['pessoal', 'todos']],
  ['nearby', ['perto']],
  // Italiano
  ['mi chiamo', ['meu nome e']],
  ['vorrei', ['eu gostaria de', 'eu gostaria']],
  ['per favore', ['por favor']],
  ['puoi', ['voce pode', 'pode']],
  ['lavoro', ['eu trabalho', 'trabalho']],
  // Francês
  ["je m'appelle", ['meu nome e']],
  ["s'il vous plait", ['por favor']],
  ['voudrais', ['gostaria de', 'gostaria']],
  ['pouvez-vous', ['voce pode', 'pode']],
  ['a la', ['em', 'a']],
  ['chaque jour', ['todos os dias']],
  // Alemão
  ['ich heisse', ['meu nome e']],
  ['ich heiße', ['meu nome e']],
  ['mochte', ['gostaria de', 'gostaria', 'quero']],
  ['von zu', ['de']],
  ['bitte', ['por favor']],
  // Espanhol
  ['me llamo', ['meu nome e']],
  ['quisiera', ['eu gostaria de', 'eu gostaria']],
  ['por favor', ['por favor']],
  ['puedes', ['voce pode', 'pode']],
  ['trabajo', ['eu trabalho', 'trabalho']],
  ['quiero', ['eu quero', 'quero']],
  // Chinês
  ['我叫', ['meu nome e']],
  ['请', ['por favor']],
  ['给我', ['me de']],
  ['一杯', ['um', 'uma']],
  ['咖啡', ['cafe']],
  ['再说', ['diga', 'falar']],
  ['一遍', ['novamente']],
  ['好吗', ['pode']],
  ['我', ['eu']],
  ['在家', ['em casa']],
  ['工作', ['trabalho']],
  ['想', ['quero']],
  ['每天', ['todos os dias']],
  ['学习', ['estudar']],
];

const translationHints: Record<string, string[]> = {
  // Inglês
  i: ['eu'],
  want: ['quero', 'quer'],
  study: ['estudar', 'estudo'],
  studying: ['estudando', 'aprendendo'],
  studies: ['estuda'],
  online: ['on-line', 'online'],
  learn: ['aprender', 'aprendo'],
  learning: ['aprendendo', 'aprender'],
  english: ['inglês', 'ingles'],
  find: ['encontrar', 'encontro'],
  better: ['melhor'],
  work: ['trabalho', 'trabalhar', 'trabalha'],
  works: ['trabalha'],
  worked: ['trabalhei', 'trabalhou'],
  working: ['trabalhando'],
  speak: ['falar', 'falo', 'fala'],
  clients: ['clientes'],
  to: ['a', 'para', 'em'],
  am: ['sou', 'estou'],
  is: ['é', 'está', 'esta'],
  are: ['são', 'estão', 'é', 'está'],
  was: ['estava', 'era', 'foi'],
  my: ['meu', 'minha', 'meus', 'minhas'],
  name: ['nome'],
  live: ['moro', 'moram', 'vive', 'mora'],
  in: ['em', 'no', 'na'],
  from: ['de', 'da', 'do'],
  with: ['com'],
  you: ['você', 'vocês'],
  your: ['seu', 'sua', 'seus', 'suas'],
  need: ['preciso', 'precisa', 'precisamos'],
  help: ['ajuda', 'ajudar'],
  the: ['o', 'a', 'os', 'as'],
  a: ['um', 'uma'],
  an: ['um', 'uma'],
  this: ['este', 'esta', 'isso', 'disto', 'disso'],
  these: ['estes', 'estas'],
  those: ['aqueles', 'aquelas'],
  that: ['isso', 'aquilo', 'que'],
  have: ['tenho', 'temos', 'tem', 'ter'],
  has: ['tem'],
  had: ['tinha', 'teve'],
  two: ['dois', 'duas'],
  three: ['três'],
  can: ['posso', 'pode', 'podemos', 'consegue'],
  could: ['poderia', 'poderíamos'],
  should: ['deveria', 'deveríamos'],
  will: ['vou', 'vai', 'vamos'],
  not: ['não', 'nao'],
  sorry: ['desculpe'],
  understand: ['entendi', 'entender', 'compreender', 'entende', 'entendo'],
  slowly: ['devagar', 'lentamente'],
  mean: ['significa'],
  let: ['deixe'],
  me: ['me', 'mim', 'eu'],
  try: ['tentar', 'tento'],
  again: ['novamente', 'novo'],
  wake: ['acordo', 'acordar'],
  early: ['cedo'],
  at: ['às', 'as', 'à', 'a', 'em'],
  night: ['noite'],
  ten: ['dez'],
  seven: ['sete'],
  drink: ['tomo', 'bebo', 'tomar'],
  coffee: ['café', 'cafe'],
  sleep: ['durmo', 'dormir'],
  recife: ['recife'],
  sales: ['vendas'],
  file: ['arquivo'],
  files: ['arquivos'],
  send: ['enviar', 'mando'],
  it: ['isso', 'disso', 'ele', 'a', 'o'],
  check: ['verificar', 'checar'],
  read: ['leio', 'ler', 'lê'],
  first: ['primeiro'],
  then: ['depois', 'então'],
  because: ['porque'],
  goal: ['objetivo', 'meta'],
  tired: ['cansado', 'cansada', 'cansados', 'cansadas'],
  but: ['mas'],
  practiced: ['pratiquei', 'praticou'],
  like: ['gosto', 'gosta'],
  so: ['então', 'entao', 'assim'],
  however: ['porém', 'porem', 'contudo'],
  more: ['mais'],
  she: ['ela'],
  he: ['ele'],
  they: ['eles', 'elas'],
  we: ['nós'],
  ready: ['pronto', 'pronta', 'prontos', 'prontas'],
  good: ['bom', 'boa'],
  morning: ['manhã'],
  afternoon: ['tarde'],
  evening: ['noite'],
  hello: ['olá', 'ola'],
  hi: ['oi'],
  nice: ['prazer'],
  meet: ['conhecer'],
  kind: ['gentil'],
  here: ['aqui'],
  daily: ['diariamente'],
  pen: ['caneta'],
  idea: ['ideia'],
  door: ['porta'],
  open: ['aberta', 'aberto'],
  bought: ['comprou'],
  ticket: ['passagem'],
  email: ['e-mail', 'email'],
  arrived: ['chegou'],
  books: ['livros'],
  boxes: ['caixas'],
  useful: ['úteis', 'uteis', 'útil', 'util'],
  children: ['crianças', 'criancas'],
  happy: ['felizes', 'feliz'],
  feet: ['pés', 'pes'],
  how: ['como'],
  what: ['que', 'qual'],
  where: ['onde'],
  when: ['quando'],
  why: ['por', 'porque'],
  who: ['quem'],
  home: ['casa'],
  day: ['dia'],
  time: ['tempo', 'hora'],
  today: ['hoje'],
  tomorrow: ['amanhã'],
  repeat: ['repetir', 'repita'],
  start: ['começamos', 'comecamos', 'começar'],
  safe: ['seguro', 'segurança'],
  travel: ['viajar'],
  use: ['usar', 'uso'],
  // Italiano
  io: ['eu'],
  voglio: ['quero'],
  studiare: ['estudar'],
  posso: ['posso'],
  fare: ['fazer'],
  una: ['uma'],
  un: ['um'],
  domanda: ['pergunta'],
  caffe: ['café', 'cafe'],
  ripetere: ['repetir'],
  lentamente: ['devagar'],
  da: ['em', 'de'],
  casa: ['casa'],
  // Francês
  je: ['eu'],
  veux: ['quero'],
  apprendre: ['aprender'],
  cafe: ['café', 'cafe'],
  repeter: ['repetir'],
  lentement: ['devagar'],
  travaille: ['trabalho'],
  maison: ['casa'],
  // Alemão
  ich: ['eu'],
  mochte: ['quero'],
  heute: ['hoje'],
  uben: ['praticar'],
  konnen: ['pode'],
  sie: ['você', 'voce'],
  das: ['isso'],
  erklaren: ['explicar'],
  einen: ['um'],
  kaffee: ['café', 'cafe'],
  langsam: ['devagar'],
  wiederholen: ['repetir'],
  arbeite: ['trabalho'],
  hause: ['casa'],
  // Espanhol
  quiero: ['quero'],
  practicar: ['praticar'],
  todos: ['todos'],
  los: ['os'],
  dias: ['dias'],
  repetir: ['repetir'],
  despacio: ['devagar'],
  desde: ['de'],
};

function normalizeWord(value: string): string {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/’/gu, "'")
    .replace(/ß/gu, 'ss');
}

function segmentHanRun(run: string): string[] {
  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < run.length) {
    let matched = '';
    for (let len = Math.min(4, run.length - cursor); len >= 2; len -= 1) {
      const candidate = run.slice(cursor, cursor + len);
      if (CJK_LEXICON.has(candidate)) {
        matched = candidate;
        break;
      }
    }
    if (matched) {
      chunks.push(matched);
      cursor += matched.length;
    } else {
      chunks.push(run[cursor]!);
      cursor += 1;
    }
  }
  return chunks;
}

type WordSpan = {
  srcStart: number;
  srcLen: number;
  ptStart: number;
  ptLen: number;
  score: number;
};

function isWordHintMatch(sourceWord: string, portugueseWord: string): number {
  if (sourceWord === portugueseWord) return 80;
  const hintMatch = translationHints[sourceWord]?.some((hint) => {
    const cleanHint = normalizeWord(hint);
    return cleanHint === portugueseWord || portugueseWord.startsWith(`${cleanHint}-`);
  });
  if (hintMatch) return 70;
  if (
    sourceWord.length >= 5
    && portugueseWord.length >= 5
    && sourceWord.slice(0, 4) === portugueseWord.slice(0, 4)
  ) {
    return 50;
  }
  return 0;
}

function collectCandidateSpans(
  sourceNorm: string[],
  portugueseNorm: string[],
): WordSpan[] {
  const candidates: WordSpan[] = [];
  const srcCount = Math.max(sourceNorm.length, 1);
  const ptCount = Math.max(portugueseNorm.length, 1);

  for (const [rawSrcPhrase, rawTargets] of PHRASE_ALIGNMENTS) {
    const srcParts = normalizeWord(rawSrcPhrase).split(/\s+/u).filter(Boolean);
    for (let i = 0; i <= sourceNorm.length - srcParts.length; i += 1) {
      const srcSliceMatches = srcParts.every((part, offset) => sourceNorm[i + offset] === part);
      if (!srcSliceMatches) continue;
      for (const rawTarget of rawTargets) {
        const ptParts = normalizeWord(rawTarget).split(/\s+/u).filter(Boolean);
        for (let j = 0; j <= portugueseNorm.length - ptParts.length; j += 1) {
          const ptSliceMatches = ptParts.every((part, offset) => portugueseNorm[j + offset] === part);
          if (!ptSliceMatches) continue;
          const distPenalty = Math.abs(i / srcCount - j / ptCount);
          candidates.push({
            srcStart: i,
            srcLen: srcParts.length,
            ptStart: j,
            ptLen: ptParts.length,
            score: 100 + srcParts.length * 10 + ptParts.length * 10 - distPenalty,
          });
        }
      }
    }
  }

  for (let i = 0; i < sourceNorm.length; i += 1) {
    for (let j = 0; j < portugueseNorm.length; j += 1) {
      const baseScore = isWordHintMatch(sourceNorm[i]!, portugueseNorm[j]!);
      if (baseScore > 0) {
        const distPenalty = Math.abs(i / srcCount - j / ptCount);
        candidates.push({
          srcStart: i,
          srcLen: 1,
          ptStart: j,
          ptLen: 1,
          score: baseScore - distPenalty,
        });
      }
    }
  }

  return candidates.sort((a, b) => (
    b.score - a.score
    || a.srcStart - b.srcStart
    || a.ptStart - b.ptStart
  ));
}

function selectDisjointSpans(candidates: WordSpan[]): WordSpan[] {
  const usedSrc = new Set<number>();
  const usedPt = new Set<number>();
  const accepted: WordSpan[] = [];

  for (const span of candidates) {
    let conflict = false;
    for (let s = span.srcStart; s < span.srcStart + span.srcLen; s += 1) {
      if (usedSrc.has(s)) {
        conflict = true;
        break;
      }
    }
    if (conflict) continue;
    for (let p = span.ptStart; p < span.ptStart + span.ptLen; p += 1) {
      if (usedPt.has(p)) {
        conflict = true;
        break;
      }
    }
    if (conflict) continue;

    for (let s = span.srcStart; s < span.srcStart + span.srcLen; s += 1) usedSrc.add(s);
    for (let p = span.ptStart; p < span.ptStart + span.ptLen; p += 1) usedPt.add(p);
    accepted.push(span);
  }

  return accepted.sort((a, b) => a.srcStart - b.srcStart || a.ptStart - b.ptStart);
}

function fillUnmatchedColors(
  wordCount: number,
  colorByWord: Map<number, number>,
  preferPrevious: boolean,
): void {
  const alignedEntries = [...colorByWord.entries()].sort((a, b) => a[0] - b[0]);
  for (let index = 0; index < wordCount; index += 1) {
    if (colorByWord.has(index)) continue;
    const prev = [...alignedEntries].reverse().find(([idx]) => idx < index);
    const next = alignedEntries.find(([idx]) => idx > index);
    const fallback = preferPrevious
      ? (prev ? prev[1] : next ? next[1] : index % COLOR_COUNT)
      : (next ? next[1] : prev ? prev[1] : index % COLOR_COUNT);
    colorByWord.set(index, fallback);
  }
}

export function tokenizeBilingualExample(english: string, portuguese: string): { english: ExampleToken[]; portuguese: ExampleToken[] } {
  const englishTokens = tokenizeExample(english);
  const portugueseTokens = tokenizeExample(portuguese);
  const englishNorm = englishTokens.filter((t) => t.isWord).map((t) => normalizeWord(t.text));
  const portugueseNorm = portugueseTokens.filter((t) => t.isWord).map((t) => normalizeWord(t.text));

  const accepted = selectDisjointSpans(collectCandidateSpans(englishNorm, portugueseNorm));

  const englishColorByWord = new Map<number, number>();
  const portugueseColorByWord = new Map<number, number>();

  accepted.forEach((span, groupIndex) => {
    const color = groupIndex % COLOR_COUNT;
    for (let s = span.srcStart; s < span.srcStart + span.srcLen; s += 1) {
      englishColorByWord.set(s, color);
    }
    for (let p = span.ptStart; p < span.ptStart + span.ptLen; p += 1) {
      portugueseColorByWord.set(p, color);
    }
  });

  fillUnmatchedColors(englishNorm.length, englishColorByWord, false);
  fillUnmatchedColors(portugueseNorm.length, portugueseColorByWord, true);

  const addColors = (tokens: ExampleToken[], colors: Map<number, number>): ExampleToken[] => {
    let index = 0;
    return tokens.map((token) => {
      if (!token.isWord) return token;
      const colorIndex = colors.get(index) ?? 0;
      index += 1;
      return { ...token, colorIndex };
    });
  };

  return {
    english: addColors(englishTokens, englishColorByWord),
    portuguese: addColors(portugueseTokens, portugueseColorByWord),
  };
}

export function tokenizeExample(text: string): ExampleToken[] {
  const rawParts: string[] = [];
  if (HAN_CHAR_PATTERN.test(text)) {
    const segments = text.match(SEGMENT_PATTERN) ?? [text];
    for (const seg of segments) {
      if (HAN_CHAR_PATTERN.test(seg)) {
        rawParts.push(...segmentHanRun(seg));
      } else {
        rawParts.push(...(seg.match(LATIN_TOKEN_PATTERN) ?? [seg]));
      }
    }
  } else {
    rawParts.push(...(text.match(LATIN_TOKEN_PATTERN) ?? [text]));
  }

  let wordIndex = 0;
  return rawParts.map((part) => {
    const isWord = NON_HAN_WORD_PATTERN.test(part);
    const token = { text: part, colorIndex: wordIndex % COLOR_COUNT, isWord };
    if (isWord) wordIndex += 1;
    return token;
  });
}

const SOURCE_PATH = path.join(process.cwd(), 'src', 'content', 'guias', 'ingles-para-ganhar-dinheiro.md');
const LESSON_HEADING = /^##\s+(\d+)\.\s+(.+)$/u;

export async function readEnglishEbookLessons(): Promise<EnglishEbookLesson[]> {
  const markdown = await readFile(SOURCE_PATH, 'utf8');
  const lessons: EnglishEbookLesson[] = [];
  let current: EnglishEbookLesson | null = null;
  let paragraphLines: string[] = [];

  const flushParagraph = (): void => {
    if (!current || paragraphLines.length === 0) return;
    const paragraph = paragraphLines.join(' ').trim();
    if (paragraph) current.paragraphs.push(paragraph);
    paragraphLines = [];
  };

  for (const rawLine of markdown.split(/\r?\n/u)) {
    const line = rawLine.trim();
    const heading = line.match(LESSON_HEADING);
    if (heading) {
      flushParagraph();
      current = {
        number: Number(heading[1]),
        title: heading[2],
        paragraphs: [],
        bullets: [],
      };
      lessons.push(current);
      continue;
    }

    if (!current || !line || line.startsWith('#')) {
      flushParagraph();
      continue;
    }

    if (/^[-*]\s+/u.test(line)) {
      flushParagraph();
      const bullet = line.replace(/^[-*]\s+/u, '');
      if (!splitEnglishExample(bullet).portuguese) {
        throw new Error(`Exemplo sem tradução na lição ${current.number}.`);
      }
      current.bullets.push(bullet);
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  return lessons;
}

export const ENGLISH_EBOOK_SAMPLE_LESSON_COUNT = 5;

export type EnglishEbookLockedLessonSummary = {
  number: number;
  title: string;
};

export type EnglishEbookPublicSample = {
  sampleLessons: EnglishEbookLesson[];
  lockedLessons: EnglishEbookLockedLessonSummary[];
  totalLessons: number;
  totalExamples: number;
};

export async function readEnglishEbookPublicSample(): Promise<EnglishEbookPublicSample> {
  const lessons = await readEnglishEbookLessons();
  const sampleLessons = lessons.slice(0, ENGLISH_EBOOK_SAMPLE_LESSON_COUNT);
  const lockedLessons = lessons
    .slice(ENGLISH_EBOOK_SAMPLE_LESSON_COUNT)
    .map((lesson) => ({
      number: lesson.number,
      title: lesson.title,
    }));

  return {
    sampleLessons,
    lockedLessons,
    totalLessons: lessons.length,
    totalExamples: lessons.reduce((total, lesson) => total + Math.min(lesson.bullets.length, 5), 0),
  };
}

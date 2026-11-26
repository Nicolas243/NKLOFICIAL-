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

const TOKEN_PATTERN = /(\p{L}+(?:['’−-]\p{L}+)?|\d+|[^\p{L}\d\s]+|\s+)/gu;
const COLOR_COUNT = 6;

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

const translationHints: Record<string, string[]> = {
  i: ['eu'],
  want: ['quero', 'quer'],
  study: ['estudar', 'estudo'],
  studying: ['estudando', 'aprendendo'],
  online: ['on-line', 'online'],
  learn: ['aprender', 'aprendo'],
  learning: ['aprendendo', 'aprender'],
  english: ['inglês', 'ingles'],
  find: ['encontrar', 'encontro'],
  better: ['melhor'],
  work: ['trabalho', 'trabalhar', 'trabalha'],
  worked: ['trabalhei', 'trabalhou'],
  working: ['trabalhando'],
  speak: ['falar', 'falo', 'fala'],
  clients: ['clientes'],
  to: ['a', 'para', 'de'],
  am: ['sou', 'estou'],
  is: ['é', 'está', 'esta'],
  are: ['são', 'estão'],
  was: ['estava', 'era', 'foi'],
  my: ['meu', 'minha'],
  name: ['nome'],
  live: ['moro', 'vive', 'mora'],
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
  did: ['não', 'fez', 'entendi'],
  do: ['faz', 'fala', 'fazemos', 'voce', 'você'],
  does: ['significa', 'faz'],
  not: ['não', 'nao'],
  sorry: ['desculpe'],
  understand: ['entendi', 'entender', 'compreender'],
  slowly: ['devagar', 'lentamente'],
  mean: ['significa', 'quer', 'dizer'],
  let: ['deixe', 'deixe-me'],
  me: ['me', 'mim', 'eu'],
  try: ['tentar', 'tento'],
  again: ['novo', 'novamente'],
  wake: ['acordo', 'acordar'],
  up: ['cedo', 'acima'],
  early: ['cedo'],
  at: ['às', 'as', 'à', 'a', 'em'],
  night: ['noite'],
  ten: ['dez'],
  drink: ['tomo', 'bebo', 'tomar'],
  coffee: ['café', 'cafe'],
  sleep: ['durmo', 'dormir'],
  recife: ['recife'],
  sales: ['vendas'],
  file: ['arquivo'],
  send: ['enviar', 'mando'],
  it: ['isso', 'ele', 'a', 'o', 'enviar'],
  check: ['verificar', 'checar'],
  read: ['leio', 'ler', 'lê'],
  first: ['primeiro'],
  then: ['depois', 'então'],
  because: ['porque'],
  goal: ['objetivo', 'meta'],
  tired: ['cansado', 'cansada'],
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
  ready: ['pronto', 'pronta'],
  good: ['bom', 'boa'],
  morning: ['manhã'],
  afternoon: ['tarde'],
  evening: ['noite'],
  how: ['como'],
  what: ['o', 'que', 'qual'],
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
  safely: ['segurança'],
  travel: ['viajar'],
  use: ['usar', 'uso'],
};

function normalizeWord(value: string): string {
  return value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{M}/gu, '');
}

function wordTokens(text: string): ExampleToken[] {
  return tokenizeExample(text).filter((token) => token.isWord);
}

function isLikelyMatch(english: string, portuguese: string): boolean {
  const englishWord = normalizeWord(english);
  const portugueseWord = normalizeWord(portuguese);
  const hintMatch = translationHints[englishWord]?.some((hint) => {
    const cleanHint = normalizeWord(hint);
    return cleanHint === portugueseWord
      || portugueseWord.startsWith(`${cleanHint}-`)
      || cleanHint.split(/\s+/u).includes(portugueseWord);
  });
  return englishWord === portugueseWord
    || Boolean(hintMatch)
    || (englishWord.length >= 4 && portugueseWord.length >= 4
      && (englishWord.slice(0, 4) === portugueseWord.slice(0, 4)
        || englishWord.slice(0, 5) === portugueseWord.slice(0, 5)));
}

export function tokenizeBilingualExample(english: string, portuguese: string): { english: ExampleToken[]; portuguese: ExampleToken[] } {
  const englishTokens = tokenizeExample(english);
  const portugueseTokens = tokenizeExample(portuguese);
  const englishWords = wordTokens(english);
  const portugueseWords = wordTokens(portuguese);
  const alignments = new Map<number, number>();
  let portugueseIndex = 0;

  for (let englishIndex = 0; englishIndex < englishWords.length; englishIndex += 1) {
    const englishWord = englishWords[englishIndex]!.text;
    const directMatch = portugueseWords.findIndex((candidate, index) => index >= portugueseIndex && isLikelyMatch(englishWord, candidate.text));
    if (directMatch >= 0) {
      alignments.set(englishIndex, directMatch);
      portugueseIndex = directMatch + 1;
    }
  }

  let colorGroup = 0;
  const englishColorByWord = new Map<number, number>();
  const portugueseColorByWord = new Map<number, number>();
  for (let englishIndex = 0; englishIndex < englishWords.length; englishIndex += 1) {
    const alignedPortugueseIndex = alignments.get(englishIndex);
    if (alignedPortugueseIndex !== undefined) {
      const color = colorGroup % COLOR_COUNT;
      englishColorByWord.set(englishIndex, color);
      portugueseColorByWord.set(alignedPortugueseIndex, color);
      colorGroup += 1;
    }
  }

  for (let englishIndex = 0; englishIndex < englishWords.length; englishIndex += 1) {
    if (!englishColorByWord.has(englishIndex)) {
      const nextAligned = [...alignments.entries()].find(([index]) => index > englishIndex);
      const previousAligned = [...alignments.entries()].reverse().find(([index]) => index < englishIndex);
      englishColorByWord.set(
        englishIndex,
        nextAligned
          ? englishColorByWord.get(nextAligned[0])!
          : previousAligned
            ? englishColorByWord.get(previousAligned[0])!
            : englishIndex % COLOR_COUNT,
      );
    }
  }

  for (let ptIndex = 0; ptIndex < portugueseWords.length; ptIndex += 1) {
    if (!portugueseColorByWord.has(ptIndex)) {
      const fallbackColor = ptIndex > 0 ? portugueseColorByWord.get(ptIndex - 1)! : ptIndex % COLOR_COUNT;
      portugueseColorByWord.set(ptIndex, fallbackColor);
    }
  }

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
  let wordIndex = 0;
  return (text.match(TOKEN_PATTERN) ?? [text]).map((part) => {
    const isWord = /[\p{L}\d]/u.test(part);
    const token = { text: part, colorIndex: isWord ? wordIndex % COLOR_COUNT : wordIndex % COLOR_COUNT, isWord };
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

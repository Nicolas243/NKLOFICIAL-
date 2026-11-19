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

const translationHints: Record<string, string[]> = {
  i: ['eu'], want: ['quero', 'quer'], study: ['estudar', 'estudo'], online: ['on-line', 'online'],
  learn: ['aprender', 'aprendo'], english: ['inglês'], find: ['encontrar', 'encontro'], better: ['melhor'],
  work: ['trabalho', 'trabalhar', 'trabalha'], speak: ['falar', 'fala'], clients: ['clientes'],
  to: [], am: ['sou', 'estou'], is: ['é', 'está'], are: ['são', 'estão'], my: ['meu', 'minha'],
  name: ['nome'], live: ['moro', 'vive'], in: ['em', 'no', 'na'], from: ['de'], with: ['com'],
  you: ['você', 'vocês'], need: ['preciso', 'precisa', 'precisamos'], help: ['ajuda', 'ajudar'],
  the: ['o', 'a', 'os', 'as'], a: ['um', 'uma'], an: ['um', 'uma'], this: ['este', 'esta', 'isso'],
  that: ['isso', 'aquilo'], have: ['tenho', 'temos', 'tem'], two: ['dois', 'duas'], three: ['três'],
  can: ['posso', 'pode', 'podemos', 'consegue'], could: ['poderia', 'poderíamos'], should: ['deveria', 'deveríamos'],
  she: ['ela'], he: ['ele'], they: ['eles', 'elas'], we: ['nós'], it: ['isso'], ready: ['pronto', 'pronta'],
  good: ['bom', 'boa'], morning: ['manhã'], afternoon: ['tarde'], evening: ['noite'], how: ['como'],
  what: ['o que', 'qual'], where: ['onde'], when: ['quando'], why: ['por que'], who: ['quem'],
  home: ['casa'], day: ['dia'], night: ['noite'], time: ['tempo', 'hora'],
  today: ['hoje'], tomorrow: ['amanhã'], safe: ['seguro', 'segurança'],
  safely: ['segurança'], travel: ['viajar'], use: ['usar', 'uso'],
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
  return englishWord === portugueseWord
    || translationHints[englishWord]?.some((hint) => normalizeWord(hint) === portugueseWord)
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
      englishColorByWord.set(englishIndex, nextAligned ? englishColorByWord.get(nextAligned[0])! : englishColorByWord.get(previousAligned?.[0] ?? 0) ?? 0);
    }
  }

  for (let portugueseIndex = 0; portugueseIndex < portugueseWords.length; portugueseIndex += 1) {
    if (!portugueseColorByWord.has(portugueseIndex)) {
      portugueseColorByWord.set(portugueseIndex, portugueseIndex > 0 ? portugueseColorByWord.get(portugueseIndex - 1)! : 0);
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

import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { buildFoundationChapters } from './amazon-book/chapters-foundation';
import { buildEncyclopediaChapters } from './amazon-book/dossier-enricher';
import { buildScaleChapters } from './amazon-book/chapters-scale';
import { buildKindleEpub } from './amazon-book/epub-builder';
import {
  renderKindleCoverJpg,
  renderPaperbackFullWrapCoverPdf,
  renderPaperbackInteriorPdf,
} from './amazon-book/covers-and-pdf';
import {
  countHtmlWords,
  type BookBusinessProfileRow,
  type BookProgramRow,
  type GeneratedBookPayload,
} from './amazon-book/types';

loadEnv({ path: path.join(process.cwd(), '.env.local'), quiet: true });

const BOOK_TITLE = '57 Formas Práticas de Construir Renda Extra';
const BOOK_SUBTITLE =
  'Do Zero ao Negócio Próprio: Critérios Antifraude, 57 Dossiês Reais, 18 Modelos da Bússola, 25 Prompts de IA e Caderno de Execução';
const BOOK_AUTHOR = 'NKL_OFICIAL';
const BOOK_PUBLISHER = 'Portal NKL';
const SITE_URL = 'https://nkloficial.com.br';

type RawProgramDbRow = {
  slug: string;
  name: string;
  category: string;
  difficulty: string;
  short_description: string;
  long_description: string;
  tags: string[] | string | null;
  website_url: string;
  affiliate_url: string | null;
  editorial_rating: number | string;
  editorial_source: string;
  pros: string[] | string | null;
  cons: string[] | string | null;
  requirements: string[] | string | null;
  payment_methods: string[] | string | null;
  earning_potential: string | null;
  zero_investment_required: boolean;
};

type RawBusinessProfileDbRow = {
  id: string;
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

function buildMetadataGuide(stats: {
  wordCountKindle: number;
  wordCountPrint: number;
  programCount: number;
  profileCount: number;
  pageCount: number;
  spineInches: number;
  wrapWidthInches: number;
  wrapHeightInches: number;
}): string {
  return [
    '# Guia de Metadados e Publicação na Amazon KDP — Edição Completa Portal NKL',
    '',
    'Todos os arquivos finais desta pasta estão prontos para upload direto na Amazon KDP (eBook Kindle e Livro Físico Paperback 6x9").',
    '',
    '## Arquivos Prontos em `private-assets/amazon-book/`',
    '- **eBook Digital (Kindle / KDP):** `57-formas-renda-extra-kindle.epub` (padrão EPUB 3.0 + NCX, capa embutida)',
    '- **Capa do eBook Kindle:** `capa-kindle-1600x2560.jpg` (1600x2560 px RGB JPEG)',
    '- **Prévia HTML do eBook:** `57-formas-renda-extra-kindle.html` (conferência visual rápida no navegador)',
    `- **Miolo do Livro Físico (Paperback 6x9"):** \`57-formas-renda-extra-paperback-6x9.pdf\` (${stats.pageCount} páginas, margens espelhadas com gutter KDP e fichas pautadas para preenchimento à caneta)`,
    `- **Capa Completa do Livro Físico (Frente + Lombada + Verso):** \`capa-paperback-6x9-completa.pdf\` (${stats.wrapWidthInches}" x ${stats.wrapHeightInches}" com sangria de 0.125", lombada exata de ${stats.spineInches}" para papel branco e reserva de código de barras ISBN)`,
    '',
    '## Estatísticas da Edição Gerada',
    `- **Palavras (Versão Digital / Kindle):** ${stats.wordCountKindle.toLocaleString('pt-BR')}`,
    `- **Palavras (Versão Física 6x9"):** ${stats.wordCountPrint.toLocaleString('pt-BR')}`,
    `- **Oportunidades com Dossiê Completo:** ${stats.programCount}`,
    `- **Modelos da Bússola de Negócios:** ${stats.profileCount}`,
    '- **Prompts de IA Prontos:** 25 (Capítulo 11) + prompts por categoria (Capítulos 4–9)',
    '',
    '## Campos para Preencher no Painel Amazon KDP',
    '- **Idioma:** Português',
    `- **Título do Livro:** ${BOOK_TITLE}`,
    `- **Subtítulo:** ${BOOK_SUBTITLE}`,
    `- **Autor:** ${BOOK_AUTHOR}`,
    `- **Editora / Selo (Publisher):** ${BOOK_PUBLISHER}`,
    '',
    '### Descrição / Sinopse (HTML pronto para colar no KDP)',
    '```html',
    '<p><strong>Muito além de uma lista de links: um manual completo de execução para gerar renda extra com critérios reais e evoluir até um negócio próprio.</strong></p>',
    '<p>Este livro reúne o método completo do <b>Portal NKL</b> em uma edição extensa, prática e sem promessas milagrosas. Em vez de dicas genéricas, você recebe o passo a passo matemático, financeiro, antifraude e operacional para testar oportunidades reais de ganho em reais, dólar e euro.</p>',
    '<ul>',
    `<li><b>Matemática da Hora Líquida & Infraestrutura Brasil:</b> contas globais (Wise/Payoneer), redução de spread, segurança digital e organização fiscal (Carnê-Leão e MEI).</li>`,
    '<li><b>Método de Validação em 14 Dias e Escudo Anti-Golpe:</b> 12 sinais objetivos para evitar armadilhas e matriz prática para decidir entre parar, ajustar ou escalar.</li>',
    `<li><b>Enciclopédia com ${stats.programCount} Dossiês Verificados:</b> como funciona, roteiro do primeiro saque (dias 1 a 14), pontos fortes vs. cuidados, erros que geram reprovação/banimento e ferramentas de apoio em IA, QA/UX, UGC, freelancing, afiliados, KDP e modelos com investimento.</li>`,
    `<li><b>Do Extra ao Negócio Próprio:</b> os ${stats.profileCount} modelos da Bússola com oferta em 3 opções + biblioteca com 25 prompts de IA + roteiro de inglês funcional + plano de 30, 60 e 90 dias.</li>`,
    '</ul>',
    '<p><em>Na edição impressa, cada capítulo conta ainda com diários de campo e planilhas pautadas para registro diário à caneta.</em></p>',
    '```',
    '',
    '### 7 Palavras-Chave KDP (máximo 50 caracteres cada)',
    '1. `renda extra online trabalho remoto brasil`',
    '2. `ganhar dinheiro internet inteligencia artificial`',
    '3. `testes aplicativos ux freelance em dolar`',
    '4. `negocios digitais renda extra investimento zero`',
    '5. `marketing afiliados ugc criacao conteudo`',
    '6. `independencia financeira trabalho em casa guia`',
    '7. `prompts ia produtividade negocios locais`',
    '',
    '### 3 Categorias Recomendadas na Amazon',
    '1. `Negócios e Economia > Empreendedorismo`',
    '2. `Negócios e Economia > Finanças Pessoais > Renda e Orçamento`',
    '3. `Informática e Tecnologia > Internet > Trabalho Remoto e Carreira Digital`',
    '',
    '### Sugestão de Preços e Royalties',
    '- **eBook Kindle (Amazon.com.br):** R$ 24,90 a R$ 34,90 (faixa de 70% de royalties via KDP Select/Brasil; ou US$ 5.99 a US$ 7.99 global).',
    '- **Livro Físico Paperback 6x9" (Amazon.com / Global):** Papel Branco, Tinta Preto e Branco padrão, Capa Fosca (Matte), Sem Sangria (No Bleed) para o miolo e Capa Completa em PDF enviada acima (sugestão: US$ 14.99 a US$ 19.99 conforme custo de impressão calculado pelo KDP).',
    '',
    '### Passo a Passo de Upload na KDP',
    '1. Acesse `https://kdp.amazon.com` -> **Criar** -> **eBook Kindle**.',
    '2. Cole título, subtítulo, sinopse, 7 palavras-chave e categorias acima.',
    '3. Em **Conteúdo do eBook Kindle**, faça upload de `57-formas-renda-extra-kindle.epub` e da capa `capa-kindle-1600x2560.jpg`, e confira no **Pré-visualizador do Kindle** online.',
    '4. Após publicar o eBook, clique em **Criar livro com capa comum (Paperback)** vinculado ao mesmo título.',
    '5. Selecione: **Papel branco**, tamanho de corte **6 x 9 pol.**, **Sem sangria** no miolo -> faça upload de `57-formas-renda-extra-paperback-6x9.pdf`.',
    '6. Na capa, escolha **Carregar uma capa que você já tem (PDF pronto para impressão)** -> faça upload de `capa-paperback-6x9-completa.pdf` (a caixa branca de código de barras já está reservada na contracapa).',
    '',
  ].join('\n');
}

async function loadDataFromDatabase(): Promise<{
  programs: BookProgramRow[];
  profiles: BookBusinessProfileRow[];
}> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL nao configurada em .env.local.');
  }

  const sql = postgres(databaseUrl, {
    ssl: databaseUrl.includes('localhost') ? undefined : 'require',
    max: 1,
    idle_timeout: 15,
  });

  try {
    const rawPrograms = await sql<RawProgramDbRow[]>`
      SELECT
        slug,
        name,
        category,
        difficulty,
        short_description,
        long_description,
        tags,
        website_url,
        affiliate_url,
        editorial_rating,
        editorial_source,
        pros,
        cons,
        requirements,
        payment_methods,
        earning_potential,
        zero_investment_required
      FROM partner_programs
      WHERE status = 'published'
      ORDER BY name ASC
    `;

    const rawProfiles = await sql<RawBusinessProfileDbRow[]>`
      SELECT id, name, min_capital, min_time_hours, tech_level, risk_level
      FROM business_profiles
      ORDER BY min_capital::numeric ASC, name ASC
    `;

    const programs: BookProgramRow[] = rawPrograms.map((row) => ({
      slug: row.slug,
      name: row.name,
      category: row.category,
      difficulty: row.difficulty,
      shortDescription: row.short_description,
      longDescription: row.long_description,
      tags: normalizeStringArray(row.tags),
      websiteUrl: row.website_url,
      affiliateUrl: row.affiliate_url,
      editorialRating: Number(row.editorial_rating) || 0,
      editorialSource: row.editorial_source,
      pros: normalizeStringArray(row.pros),
      cons: normalizeStringArray(row.cons),
      requirements: normalizeStringArray(row.requirements),
      paymentMethods: normalizeStringArray(row.payment_methods),
      earningPotential: row.earning_potential,
      zeroInvestmentRequired: Boolean(row.zero_investment_required),
    }));

    const profiles: BookBusinessProfileRow[] = rawProfiles.map((row) => ({
      id: row.id,
      name: row.name,
      minCapital: String(row.min_capital),
      minTimeHours: Number(row.min_time_hours) || 0,
      techLevel: row.tech_level,
      riskLevel: row.risk_level,
    }));

    return { programs, profiles };
  } finally {
    await sql.end();
  }
}

async function main(): Promise<void> {
  const outDir = path.join(process.cwd(), 'private-assets', 'amazon-book');
  mkdirSync(outDir, { recursive: true });

  const { programs, profiles } = await loadDataFromDatabase();
  const chapters = [
    ...buildFoundationChapters(),
    ...buildEncyclopediaChapters(programs),
    ...buildScaleChapters(profiles),
  ];

  const payload: GeneratedBookPayload = {
    title: BOOK_TITLE,
    subtitle: BOOK_SUBTITLE,
    author: BOOK_AUTHOR,
    publisher: BOOK_PUBLISHER,
    siteUrl: SITE_URL,
    chapters,
  };

  const wordCountKindle = chapters.reduce(
    (sum, chapter) => sum + countHtmlWords(chapter.htmlKindle),
    0,
  );
  const wordCountPrint = chapters.reduce(
    (sum, chapter) => sum + countHtmlWords(chapter.htmlPrint),
    0,
  );

  const kindleCoverPath = path.join(outDir, 'capa-kindle-1600x2560.jpg');
  const epubPath = path.join(outDir, '57-formas-renda-extra-kindle.epub');
  const kindleHtmlPath = path.join(outDir, '57-formas-renda-extra-kindle.html');
  const printHtmlPath = path.join(outDir, '57-formas-renda-extra-paperback-6x9.html');
  const printPdfPath = path.join(outDir, '57-formas-renda-extra-paperback-6x9.pdf');
  const printCoverPdfPath = path.join(outDir, 'capa-paperback-6x9-completa.pdf');
  const metadataPath = path.join(outDir, 'KDP-METADADOS-E-PUBLICACAO.md');

  const coverJpg = await renderKindleCoverJpg(BOOK_TITLE, BOOK_SUBTITLE, kindleCoverPath);
  const epubResult = await buildKindleEpub(payload, coverJpg, epubPath, kindleHtmlPath);
  const printResult = await renderPaperbackInteriorPdf(payload, printHtmlPath, printPdfPath);
  const wrapCoverResult = await renderPaperbackFullWrapCoverPdf(
    printResult.pageCount,
    BOOK_TITLE,
    BOOK_SUBTITLE,
    printCoverPdfPath,
  );

  const metadataGuide = buildMetadataGuide({
    wordCountKindle,
    wordCountPrint,
    programCount: programs.length,
    profileCount: profiles.length,
    pageCount: printResult.pageCount,
    spineInches: wrapCoverResult.spineInches,
    wrapWidthInches: wrapCoverResult.widthInches,
    wrapHeightInches: wrapCoverResult.heightInches,
  });
  writeFileSync(metadataPath, metadataGuide, 'utf8');

  console.log(
    JSON.stringify({
      programsCount: programs.length,
      profilesCount: profiles.length,
      chaptersCount: chapters.length,
      wordCountKindle,
      wordCountPrint,
      kindleCoverBytes: coverJpg.byteLength,
      epubBytes: epubResult.epubBytes,
      kindleHtmlBytes: epubResult.htmlBytes,
      paperbackPages: printResult.pageCount,
      paperbackPdfBytes: printResult.bytes,
      wrapCoverInches: `${wrapCoverResult.widthInches}x${wrapCoverResult.heightInches}`,
      spineInches: wrapCoverResult.spineInches,
      wrapCoverPdfBytes: wrapCoverResult.bytes,
    }),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('AMAZON_BOOK_BUILD_FAILED:', message);
  process.exit(1);
});

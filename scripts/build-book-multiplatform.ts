import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { buildFoundationChapters } from './amazon-book/chapters-foundation';
import { buildEncyclopediaChapters } from './amazon-book/dossier-enricher';
import { buildScaleChapters } from './amazon-book/chapters-scale';
import { buildKindleEpub } from './amazon-book/epub-builder';
import { renderKindleCoverJpg } from './amazon-book/covers-and-pdf';
import {
  computeBrazilianPaperbackSpineMm,
  renderDigitalScreenPdf,
  renderWidePaperback16x23Pdf,
  renderWideWrapCover16x23Pdf,
  sanitizeForWideDistribution,
} from './amazon-book/multiplatform-export';
import {
  countHtmlWords,
  type BookBusinessProfileRow,
  type BookChapterPayload,
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

type BuildStats = {
  programCount: number;
  profileCount: number;
  wordCountEpub: number;
  wordCountPrint: number;
  paperbackPageCount: number;
  spineMm90g: number;
  spineMm80g: number;
  wrapWidthMm: number;
  wrapHeightMm: number;
  digitalScreenPageCount: number;
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
    connect_timeout: 15,
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Falha ao consultar partner_programs e business_profiles no PostgreSQL (${message}). Verifique DATABASE_URL em .env.local e acesso de rede.`,
    );
  } finally {
    await sql.end();
  }
}

function buildSanitizedChapters(
  programs: BookProgramRow[],
  profiles: BookBusinessProfileRow[],
): BookChapterPayload[] {
  const rawChapters = [
    ...buildFoundationChapters(),
    ...buildEncyclopediaChapters(programs),
    ...buildScaleChapters(profiles),
  ];

  return rawChapters.map((chapter) => ({
    ...chapter,
    htmlKindle: sanitizeForWideDistribution(chapter.htmlKindle),
    htmlPrint: sanitizeForWideDistribution(chapter.htmlPrint),
  }));
}

function buildSynopsisPlain(stats: BuildStats): string {
  return [
    'Muito alem de listas rasas de links na internet: um manual pratico e direto para construir renda extra com criterios financeiros reais, evitar armadilhas e evoluir ate um negocio proprio.',
    '',
    `Nesta edicao completa do Portal NKL, voce encontra ${stats.programCount} dossies verificados de plataformas e frentes de ganho em reais, dolar e euro, alem de ${stats.profileCount} modelos da Bussola de Negocios e 25 prompts de inteligencia artificial prontos para aplicar.`,
    '',
    'O que voce vai dominar neste livro:',
    '- Matematica da Hora Liquida Real: como descontar tempo ocioso, spread cambial, taxas de saque e impostos (Carne-Leao e MEI) antes de escolher onde investir suas horas.',
    '- Metodo de Validacao em 14 Dias e Escudo Antifraude: 12 sinais objetivos para detectar golpes e matriz pratica para decidir entre parar, ajustar ou escalar.',
    `- Enciclopedia com ${stats.programCount} Dossies Reais: como funciona, roteiro do primeiro saque (dias 1 a 14), pontos fortes, cuidados, erros que geram bloqueio e ferramentas de apoio em IA, testes de UX/QA, UGC, freelancing, afiliados, autopublicacao e modelos com investimento.`,
    `- Do Extra ao Negocio Proprio: ${stats.profileCount} modelos comparados por capital, risco e tempo semanal, roteiro de ingles funcional e plano de 30, 60 e 90 dias.`,
    '',
    'Na versao impressa, os capitulos contam ainda com fichas pautadas e diarios de campo para preenchimento a caneta.',
  ].join('\n');
}

function buildUiclapMetadataMd(stats: BuildStats): string {
  return [
    '# Guia de Publicação Física na UICLAP — Portal NKL',
    '',
    '## AVISO CRITICO DE DIREITOS E EXCLUSIVIDADE',
    '**LIVRO FISICO NAO TEM EXCLUSIVIDADE NO KDP SELECT — PODE SUBIR HOJE.**',
    'Mesmo que o e-book esteja inscrito no KDP Select da Amazon, o contrato do KDP Select aplica-se exclusivamente ao formato digital (e-book). A edição impressa (capa comum) pode ser publicada imediatamente na UICLAP sem qualquer conflito contratual.',
    '',
    '## Arquivos Prontos Nesta Pasta',
    '- Miolo PDF: `57-formas-renda-extra-uiclap-16x23cm.pdf`',
    '- Capa Completa PDF (frente + lombada + verso, sem caixa de codigo KDP): `capa-uiclap-16x23cm-completa.pdf`',
    '',
    '## Especificações Técnicas do Impresso',
    `- **Dimensões de corte:** 16 x 23 cm (160 x 230 mm)`,
    `- **Quantidade de páginas do miolo:** ${stats.paperbackPageCount} páginas (miolo P&B)`,
    '- **Papel selecionado na capa gerada:** Pólen Soft 90g (recomendado para leitura confortável)',
    `- **Cálculo da lombada (Pólen 90g):** ${stats.spineMm90g} mm (${(stats.spineMm90g / 10).toFixed(2)} cm) — base: ${Math.ceil(stats.paperbackPageCount / 2)} folhas x 0,115 mm + 1,2 mm de cola/capa`,
    `- **Referência alternativa (Offset 80g):** ${stats.spineMm80g} mm (${(stats.spineMm80g / 10).toFixed(2)} cm) — caso escolha Offset 80g na UICLAP, regenere a capa passando paperGsm 80`,
    `- **Medida total do PDF da capa (com 5 mm de sangria em todas as bordas):** ${stats.wrapWidthMm} x ${stats.wrapHeightMm} mm`,
    '- **Acabamento sugerido:** Capa comum com laminação fosca (matte)',
    '',
    '## Metadados para Preencher no Painel UICLAP',
    `- **Título:** ${BOOK_TITLE}`,
    `- **Subtítulo:** ${BOOK_SUBTITLE}`,
    `- **Autor:** ${BOOK_AUTHOR}`,
    `- **Selo / Editora:** ${BOOK_PUBLISHER}`,
    '- **Idioma:** Português (Brasil)',
    '',
    '### Sinopse Pronta',
    '```text',
    buildSynopsisPlain(stats),
    '```',
    '',
    '### Categorias / BISAC Recomendadas',
    '- `BUS025000` — Negócios e Economia / Empreendedorismo',
    '- `BUS050000` — Negócios e Economia / Finanças Pessoais / Gestão de Dinheiro',
    '- `BUS048000` — Negócios e Economia / Trabalho Autônomo e Freelancing',
    '',
    '## Sugestão de Preço e Margem',
    '- **Faixa de preço recomendada (16 x 23 cm, ~400+ páginas Pólen):** R$ 79,90 a R$ 99,90.',
    '- Confira o custo de produção exibido na calculadora da UICLAP após o upload do miolo e ajuste seu ganho líquido desejado (sugestão: R$ 18,00 a R$ 28,00 por exemplar vendido).',
    '- **ISBN:** A UICLAP oferece registro opcional ou você pode informar ISBN próprio emitido via CBL (`cblservicos.org.br`). Como a contracapa foi gerada limpa sem caixa fixa da Amazon, o código de barras da UICLAP encaixa normalmente no canto inferior.',
    '',
  ].join('\n');
}

function buildClubeDeAutoresMetadataMd(stats: BuildStats): string {
  return [
    '# Guia de Publicação no Clube de Autores — Portal NKL',
    '',
    '## Regra de Exclusividade KDP Select (Físico vs. Digital)',
    '- **Edição Impressa (16 x 23 cm):** LIVRO FÍSICO NÃO TEM EXCLUSIVIDADE NO KDP SELECT — PODE SUBIR HOJE.',
    '- **Edição Digital (EPUB):** se o e-book estiver ativo no KDP Select da Amazon, aguarde o fim do ciclo de 90 dias (com renovação automática desmarcada) antes de habilitar a venda do e-book no Clube de Autores.',
    '',
    '## Arquivos Prontos Nesta Pasta',
    '- **Miolo Físico 16 x 23 cm:** `57-formas-renda-extra-clube-16x23cm.pdf`',
    '- **Capa Completa Físico 16 x 23 cm:** `capa-clube-16x23cm-completa.pdf`',
    '- **Capa Frontal Digital:** `capa-frente-1600x2560.jpg`',
    '- **eBook Amplo (EPUB 3.0):** `57-formas-renda-extra-edicao-ampla.epub`',
    '',
    '## Especificações do Livro Impresso',
    '- **Tamanho:** 16 x 23 cm',
    '- **Miolo:** Preto e Branco',
    '- **Papel:** Pólen 90g (padrão desta capa) ou Offset 80g',
    `- **Páginas:** ${stats.paperbackPageCount}`,
    `- **Lombada (Pólen 90g):** ${stats.spineMm90g} mm | **Lombada (Offset 80g):** ${stats.spineMm80g} mm`,
    `- **Capa completa com sangria 5 mm:** ${stats.wrapWidthMm} x ${stats.wrapHeightMm} mm`,
    '',
    '## Metadados',
    `- **Título:** ${BOOK_TITLE}`,
    `- **Subtítulo:** ${BOOK_SUBTITLE}`,
    `- **Autor:** ${BOOK_AUTHOR}`,
    `- **Editora / Selo:** ${BOOK_PUBLISHER}`,
    '',
    '### Sinopse',
    '```text',
    buildSynopsisPlain(stats),
    '```',
    '',
    '## Passo a Passo para Ativar Distribuição Física nos Marketplaces Parceiros',
    '1. Acesse `https://clubedeautores.com.br`, crie/acesse sua conta e clique em **Publicar Livro**.',
    '2. Cadastre título, subtítulo, autor, sinopse e selecione **Administração / Negócios / Finanças Pessoais**.',
    '3. Escolha o formato impresso **16 x 23 cm**, miolo **Preto e Branco**, papel **Pólen** (ou Offset) e envie `57-formas-renda-extra-clube-16x23cm.pdf`.',
    '4. No envio de capa, selecione **Enviar capa completa pronta (PDF)** e carregue `capa-clube-16x23cm-completa.pdf`.',
    '5. Na etapa de **Canais de Distribuição e Marketplaces**, mantenha habilitados todos os canais físicos parceiros:',
    '   - **Loja Clube de Autores**',
    '   - **Mercado Livre** (vitrine oficial de livros sob demanda)',
    '   - **Estante Virtual**',
    '   - **Americanas / Submarino / Shoptime (B2W)**',
    '   - **Amazon Marketplace (livro físico no Brasil)**',
    '6. Defina seus direitos autorais líquidos (sugestão de preço final entre R$ 84,90 e R$ 104,90 considerando a comissão dos marketplaces) e aprove a pré-visualização.',
    '7. **Atenção:** deixe a opção de **e-book digital** desmarcada enquanto o livro estiver no KDP Select da Amazon.',
    '',
  ].join('\n');
}

function buildGooglePlayMetadataMd(stats: BuildStats): string {
  return [
    '# Guia de Publicação no Google Play Livros — Portal NKL',
    '',
    '## AVISO OBRIGATORIO: REGRA DE 90 DIAS DO KDP SELECT',
    '**NAO PUBLIQUE ESTE E-BOOK NO GOOGLE PLAY LIVROS ENQUANTO ELE ESTIVER INSCRITO NO KDP SELECT.**',
    'O programa KDP Select exige exclusividade digital mundial por ciclos de 90 dias. Antes de ativar a venda digital no Google Play Livros:',
    '1. Acesse o painel Amazon KDP -> Gerenciar inscrição no KDP Select.',
    '2. Desmarque **Renovar automaticamente minha inscrição por mais 90 dias**.',
    '3. Aguarde a data exata de encerramento do ciclo de 90 dias antes de colocar o e-book a venda no Google Play Livros.',
    '',
    '## Arquivos Prontos Nesta Pasta',
    '- **eBook EPUB 3.0 (sem travas Kindle):** `57-formas-renda-extra-edicao-ampla.epub`',
    '- **Capa Frontal RGB:** `capa-frente-1600x2560.jpg` (1600 x 2560 px)',
    '',
    '## Metadados para Google Play Books Partner Center',
    `- **Título:** ${BOOK_TITLE}`,
    `- **Subtítulo:** ${BOOK_SUBTITLE}`,
    `- **Autor:** ${BOOK_AUTHOR}`,
    `- **Editora:** ${BOOK_PUBLISHER}`,
    '- **Idioma:** Português (Brasil) — `pt-BR`',
    `- **Extensão aproximada:** ${stats.wordCountEpub.toLocaleString('pt-BR')} palavras`,
    '',
    '### Descrição / Sinopse',
    '```text',
    buildSynopsisPlain(stats),
    '```',
    '',
    '### Categorias BISAC Recomendadas',
    '- `BUS025000` — BUSINESS & ECONOMICS / Entrepreneurship',
    '- `BUS050000` — BUSINESS & ECONOMICS / Personal Finance / Money Management',
    '- `COM060000` — COMPUTERS / Internet / General',
    '',
    '### Preço Sugerido e Configurações',
    '- **Brasil (BRL):** R$ 29,90 a R$ 39,90 (Google Play paga 70% de receita na maioria dos territórios, inclusive Brasil).',
    '- **Internacional (USD):** US$ 6.99 a US$ 8.99.',
    '- **DRM:** opcional (recomendado desativar DRM para reduzir atrito do leitor, ou manter conforme política do selo).',
    '- **ID do Livro:** caso não possua ISBN próprio da CBL para o formato digital, o Google Play permite usar identificador `GGKEY` gerado gratuitamente pela própria plataforma.',
    '',
  ].join('\n');
}

function buildDraft2DigitalMetadataMd(stats: BuildStats): string {
  return [
    '# Guia de Publicação Global via Draft2Digital — Portal NKL',
    '',
    '## AVISO OBRIGATORIO: REGRA DE 90 DIAS DO KDP SELECT',
    '**NAO HABILITE DISTRIBUICAO DIGITAL NA DRAFT2DIGITAL ENQUANTO O E-BOOK ESTIVER NO KDP SELECT.**',
    'Desative a renovação automática do KDP Select na Amazon e aguarde o término completo do ciclo de 90 dias antes de clicar em Publish na Draft2Digital.',
    '',
    '## Lojas e Bibliotecas Alcançadas em Um Único Upload',
    'Ao subir o arquivo `57-formas-renda-extra-edicao-ampla.epub` na Draft2Digital, selecione todas as lojas externas desejadas (deixe **Amazon** desmarcada se voce ja gerencia a Amazon diretamente pelo painel KDP):',
    '- **Apple Books** (iPhone, iPad, Mac em dezenas de países)',
    '- **Kobo** (inclusive parceria Livraria Cultura / Rakuten)',
    '- **Barnes & Noble (NOOK)**',
    '- **Everand (antigo Scribd)**',
    '- **Tolino** (rede europeia)',
    '- **OverDrive / Libby, Hoopla, Bibliotheca, Palace Marketplace** (bibliotecas públicas e universitárias)',
    '- **Smashwords Store** e **Vivlio**',
    '',
    '## Arquivos Prontos Nesta Pasta',
    '- **eBook EPUB 3.0:** `57-formas-renda-extra-edicao-ampla.epub`',
    '- **Capa Frontal:** `capa-frente-1600x2560.jpg`',
    '',
    '## Metadados para Preencher na Draft2Digital',
    `- **Book Title:** ${BOOK_TITLE}`,
    `- **Subtitle:** ${BOOK_SUBTITLE}`,
    `- **Author / Contributors:** ${BOOK_AUTHOR}`,
    `- **Publisher / Imprint:** ${BOOK_PUBLISHER}`,
    '- **Language:** Portuguese (pt-BR)',
    `- **Word Count:** ~${stats.wordCountEpub.toLocaleString('pt-BR')} palavras`,
    '- **ISBN:** você pode aceitar o ISBN gratuito da Draft2Digital ou inserir ISBN próprio emitido pela CBL (`cblservicos.org.br`).',
    '',
    '### Sinopse',
    '```text',
    buildSynopsisPlain(stats),
    '```',
    '',
    '### Termos de Busca / Keywords (até 7)',
    '1. `renda extra`',
    '2. `empreendedorismo digital`',
    '3. `trabalho remoto`',
    '4. `financas pessoais`',
    '5. `inteligencia artificial`',
    '6. `freelancer em dolar`',
    '7. `negocio proprio`',
    '',
    '### Preço Sugerido',
    '- **Base USD:** US$ 6.99 (ou US$ 7.99) com conversão automática de moeda para Apple Books, Kobo e Tolino.',
    '',
    '## Preenchimento Fiscal W-8BEN (Autor Brasileiro sem Bitributação)',
    'A Draft2Digital é uma empresa sediada nos EUA e exige entrevista fiscal no menu **My Account -> Tax Information** antes de liberar pagamentos:',
    '1. Escolha **Individual / Pessoa Física** (ou entidade caso opere via PJ, usando W-8BEN-E; para autor pessoa física brasileira, selecione **W-8BEN**).',
    '2. Informe nome completo exatamente como consta no documento e CPF.',
    '3. País de cidadania e residência fiscal: **Brazil**.',
    '4. No campo **Foreign Tax Identifying Number (FTIN)**: informe seu **CPF** (somente números).',
    '5. Sobre retenção nos EUA: o Brasil **não possui tratado de isenção tributária de royalties com os EUA** (a retenção na fonte americana sobre vendas feitas dentro dos EUA é de **30%** para pessoas físicas brasileiras; vendas fora dos EUA não sofrem essa retenção de 30% quando o W-8BEN está validado corretamente).',
    '6. **Para evitar bitributação no Brasil:** guarde os demonstrativos mensais de pagamento e retenção da Draft2Digital (e informe 1099/1042-S recebidos anualmente). No Brasil, declare os recebimentos vindos do exterior no **Carnê-Leão Web** e compense o imposto já retido na fonte nos EUA dentro das regras de reciprocidade/crédito fiscal aplicáveis com apoio do seu contador.',
    '7. Configure o recebimento internacional via **Payoneer** ou transferência bancária internacional (Wise / conta global em dólar compatível com ACH americano).',
    '',
  ].join('\n');
}

function buildDirectSalesCopyMd(stats: BuildStats): string {
  return [
    '# Kit de Venda Direta (Hotmart / Kiwify / Eduzz / Portal NKL)',
    '',
    '## Lembrete KDP Select (Regra de 90 Dias para E-book)',
    'Enquanto o e-book estiver inscrito no **KDP Select** da Amazon, a venda ou distribuição digital do mesmo livro em plataformas próprias ou marketplaces de terceiros (Hotmart, Kiwify, Eduzz, Portal NKL) **não é permitida** pelas regras de exclusividade digital de 90 dias da Amazon.',
    '- **Como liberar:** desmarque a renovação automática do KDP Select na Amazon KDP, aguarde o encerramento do ciclo de 90 dias e então ative o checkout direto na Hotmart / Kiwify / Portal NKL.',
    '- **Alternativa imediata:** se quiser vender hoje no checkout direto sem sair do KDP Select, comercialize na Hotmart/Portal NKL os **bônus separados** (planilhas, prompts, trilhas ou acesso ao Portal NKL) sem entregar o arquivo integral do e-book listado no KDP Select.',
    '',
    '## Arquivos Prontos Nesta Pasta',
    `- **PDF Colorido para Tela (A5 Tablet/Desktop):** \`57-formas-renda-extra-tela-digital.pdf\` (${stats.digitalScreenPageCount} páginas, sem bordas extras de impressão)`,
    '- **eBook EPUB 3.0 (Kindle externo, Apple Books, Kobo, celulares):** `57-formas-renda-extra-edicao-ampla.epub`',
    '- **Capa Oficial 1600x2560:** `capa-frente-1600x2560.jpg`',
    '',
    '## Lista de Entregáveis para Cadastrar no Produto',
    '1. Manual Completo em PDF Leitura em Tela (`57-formas-renda-extra-tela-digital.pdf`)',
    '2. Versão EPUB para leitores digitais e celulares (`57-formas-renda-extra-edicao-ampla.epub`)',
    `3. Enciclopédia com ${stats.programCount} Dossiês Verificados de plataformas reais (com roteiro de 14 dias e sinais antifraude)`,
    `4. Guia com ${stats.profileCount} Modelos da Bússola de Negócios e Biblioteca com 25 Prompts de IA`,
    '',
    '## Copy Pronta para Página de Vendas / Checkout',
    '',
    '### Headline Principal',
    `**${BOOK_TITLE}**`,
    '',
    '### Subheadline',
    'Pare de perder noites testando aplicativos que não pagam. Use um método prático com matemática da Hora Líquida, critérios antifraude, 57 dossiês reais e plano de transição para o seu negócio próprio.',
    '',
    '### Bullets de Benefício',
    '- **Filtro antifraude em 2 minutos:** 12 sinais objetivos para fugir de golpes e tarefas sem retorno.',
    '- **Matemática real do seu tempo:** saiba quanto sobra no bolso em reais depois de taxas de câmbio, tempo ocioso e imposto.',
    `- **${stats.programCount} dossiês completos:** o que é, quanto paga, o que fazer nos primeiros 14 dias e erros que geram bloqueio.`,
    `- **${stats.profileCount} modelos da Bússola de Negócios:** transforme sua renda extra inicial em serviço estruturado ou ativo digital.`,
    '- **25 prompts de IA prontos para copiar:** acelere entregas, roteiros, propostas e textos em português ou inglês.',
    '- **Plano de 30, 60 e 90 dias:** passo a passo organizado para quem tem poucas horas por semana.',
    '',
    '### Sugestão de Preço e Oferta (Ticket Direto)',
    '- **Preço base sugerido:** R$ 47,00 a R$ 67,00 (com margem superior a 88% na Hotmart/Kiwify/Stripe frente aos 70% de lojas tradicionais).',
    '- **Order bump sugerido:** Planilha da Hora Líquida + Pack de Prompts Editáveis (+ R$ 19,90).',
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  const baseOutDir = path.join(process.cwd(), 'private-assets', 'book-multiplatform');
  const previewsDir = path.join(baseOutDir, '_previews');
  const dirUiclap = path.join(baseOutDir, '01-uiclap-fisico');
  const dirClube = path.join(baseOutDir, '02-clube-de-autores');
  const dirGoogle = path.join(baseOutDir, '03-google-play-livros');
  const dirD2d = path.join(baseOutDir, '04-draft2digital-apple-kobo-global');
  const dirDirect = path.join(baseOutDir, '05-venda-direta-hotmart-portal-nkl');

  [
    baseOutDir,
    previewsDir,
    dirUiclap,
    dirClube,
    dirGoogle,
    dirD2d,
    dirDirect,
  ].forEach((dir) => mkdirSync(dir, { recursive: true }));

  const { programs, profiles } = await loadDataFromDatabase();
  const chapters = buildSanitizedChapters(programs, profiles);

  const payload: GeneratedBookPayload = {
    title: BOOK_TITLE,
    subtitle: BOOK_SUBTITLE,
    author: BOOK_AUTHOR,
    publisher: BOOK_PUBLISHER,
    siteUrl: SITE_URL,
    chapters,
  };

  const wordCountEpub = chapters.reduce((sum, ch) => sum + countHtmlWords(ch.htmlKindle), 0);
  const wordCountPrint = chapters.reduce((sum, ch) => sum + countHtmlWords(ch.htmlPrint), 0);

  const frontCoverPath = path.join(dirClube, 'capa-frente-1600x2560.jpg');
  const wideEpubPath = path.join(dirClube, '57-formas-renda-extra-edicao-ampla.epub');
  const epubPreviewHtmlPath = path.join(previewsDir, '57-formas-renda-extra-edicao-ampla.html');

  const uiclapInteriorPdfPath = path.join(dirUiclap, '57-formas-renda-extra-uiclap-16x23cm.pdf');
  const uiclapInteriorHtmlPath = path.join(previewsDir, '57-formas-renda-extra-16x23cm.html');
  const uiclapCoverPdfPath = path.join(dirUiclap, 'capa-uiclap-16x23cm-completa.pdf');

  const clubeInteriorPdfPath = path.join(dirClube, '57-formas-renda-extra-clube-16x23cm.pdf');
  const clubeCoverPdfPath = path.join(dirClube, 'capa-clube-16x23cm-completa.pdf');

  const digitalScreenPdfPath = path.join(dirDirect, '57-formas-renda-extra-tela-digital.pdf');
  const digitalScreenHtmlPath = path.join(previewsDir, '57-formas-renda-extra-tela-digital.html');

  const coverJpg = await renderKindleCoverJpg(BOOK_TITLE, BOOK_SUBTITLE, frontCoverPath);
  const epubResult = await buildKindleEpub(
    payload,
    coverJpg,
    wideEpubPath,
    epubPreviewHtmlPath,
  );

  const paperbackResult = await renderWidePaperback16x23Pdf(
    payload,
    uiclapInteriorHtmlPath,
    uiclapInteriorPdfPath,
  );

  const wrapCoverResult = await renderWideWrapCover16x23Pdf({
    pageCount: paperbackResult.pageCount,
    paperGsm: 90,
    title: BOOK_TITLE,
    subtitle: BOOK_SUBTITLE,
    outPath: uiclapCoverPdfPath,
  });

  const digitalScreenResult = await renderDigitalScreenPdf(
    payload,
    digitalScreenHtmlPath,
    digitalScreenPdfPath,
  );

  // Distribute identical verified binaries across the remaining folders
  copyFileSync(uiclapInteriorPdfPath, clubeInteriorPdfPath);
  copyFileSync(uiclapCoverPdfPath, clubeCoverPdfPath);

  copyFileSync(wideEpubPath, path.join(dirGoogle, '57-formas-renda-extra-edicao-ampla.epub'));
  copyFileSync(frontCoverPath, path.join(dirGoogle, 'capa-frente-1600x2560.jpg'));

  copyFileSync(wideEpubPath, path.join(dirD2d, '57-formas-renda-extra-edicao-ampla.epub'));
  copyFileSync(frontCoverPath, path.join(dirD2d, 'capa-frente-1600x2560.jpg'));

  copyFileSync(wideEpubPath, path.join(dirDirect, '57-formas-renda-extra-edicao-ampla.epub'));
  copyFileSync(frontCoverPath, path.join(dirDirect, 'capa-frente-1600x2560.jpg'));

  const stats: BuildStats = {
    programCount: programs.length,
    profileCount: profiles.length,
    wordCountEpub,
    wordCountPrint,
    paperbackPageCount: paperbackResult.pageCount,
    spineMm90g: wrapCoverResult.spineMm,
    spineMm80g: computeBrazilianPaperbackSpineMm(paperbackResult.pageCount, 80),
    wrapWidthMm: wrapCoverResult.widthMm,
    wrapHeightMm: wrapCoverResult.heightMm,
    digitalScreenPageCount: digitalScreenResult.pageCount,
  };

  writeFileSync(path.join(dirUiclap, 'METADADOS-UICLAP.md'), buildUiclapMetadataMd(stats), 'utf8');
  writeFileSync(
    path.join(dirClube, 'METADADOS-CLUBE-DE-AUTORES.md'),
    buildClubeDeAutoresMetadataMd(stats),
    'utf8',
  );
  writeFileSync(
    path.join(dirGoogle, 'METADADOS-GOOGLE-PLAY.md'),
    buildGooglePlayMetadataMd(stats),
    'utf8',
  );
  writeFileSync(
    path.join(dirD2d, 'METADADOS-DRAFT2DIGITAL.md'),
    buildDraft2DigitalMetadataMd(stats),
    'utf8',
  );
  writeFileSync(
    path.join(dirDirect, 'COPY-VENDA-DIRETA.md'),
    buildDirectSalesCopyMd(stats),
    'utf8',
  );

  console.log(
    JSON.stringify({
      programsCount: programs.length,
      profilesCount: profiles.length,
      chaptersCount: chapters.length,
      wordCountEpub,
      wordCountPrint,
      frontCoverBytes: coverJpg.byteLength,
      epubBytes: epubResult.epubBytes,
      paperback16x23Pages: paperbackResult.pageCount,
      paperback16x23Bytes: paperbackResult.bytes,
      wrapCover16x23Mm: `${wrapCoverResult.widthMm}x${wrapCoverResult.heightMm}`,
      spineMm90g: wrapCoverResult.spineMm,
      spineMm80g: stats.spineMm80g,
      wrapCover16x23Bytes: wrapCoverResult.bytes,
      digitalScreenPages: digitalScreenResult.pageCount,
      digitalScreenBytes: digitalScreenResult.bytes,
    }),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('MULTIPLATFORM_BOOK_BUILD_FAILED:', message);
  process.exit(1);
});

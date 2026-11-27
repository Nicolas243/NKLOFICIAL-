import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { escapeHtml, type GeneratedBookPayload } from './types';

const WIDE_COVER_BADGE_TEXT =
  'Edição Completa · 57 Formas Verificadas + 18 Modelos + 25 Prompts IA';

export type WidePaperbackRenderResult = {
  pageCount: number;
  bytes: number;
};

export type WideWrapCoverOptions = {
  pageCount: number;
  paperGsm?: 80 | 90;
  title: string;
  subtitle: string;
  outPath: string;
};

export type WideWrapCoverResult = {
  spineMm: number;
  widthMm: number;
  heightMm: number;
  bytes: number;
};

const WIDE_DISTRIBUTION_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/Edição digital Kindle/gu, 'Edição digital'],
  [/edição digital Kindle/gu, 'edição digital'],
  [/Como ler e aplicar na edição Kindle/gu, 'Como ler e aplicar na edição digital'],
  [/Edição Kindle/gu, 'Edição digital'],
  [/edição Kindle/gu, 'edição digital'],
  [/\(Versão Kindle\)/gu, '(Versão Digital)'],
  [/Versão Kindle/gu, 'Versão Digital'],
  [
    /Na leitura digital em e-reader ou aplicativo Kindle/gu,
    'Na leitura digital em e-reader ou aplicativo de leitura',
  ],
  [/aplicativo Kindle/gu, 'aplicativo de leitura'],
  [/Como o Kindle não permite escrita livre/gu, 'Como o leitor digital não permite escrita livre'],
  [/recurso de grifo do Kindle/gu, 'recurso de grifo do seu leitor digital'],
  [/Publicada na Amazon KDP/gu, 'Publicada de forma independente'],
  [/publicada na Amazon KDP/gu, 'publicada de forma independente'],
  [/Publicado na Amazon KDP/gu, 'Publicado de forma independente'],
  [/publicado na Amazon KDP/gu, 'publicado de forma independente'],
  [/Publicada exclusivamente na Amazon KDP/gu, 'Publicada de forma independente'],
  [/publicada exclusivamente na Amazon KDP/gu, 'publicada de forma independente'],
  [/exclusivo no Kindle Unlimited/gu, 'disponível em edição digital ampla'],
  [/exclusivo na Amazon KDP/gu, 'em edição independente'],
  [/exclusiva da Amazon/gu, 'independente'],
  [/Padrão KDP/gu, 'Padrão Portal NKL'],
  [/padrão KDP/gu, 'padrão Portal NKL'],
  [/Selo KDP/gu, 'Selo Portal NKL'],
  [/selo KDP/gu, 'selo Portal NKL'],
  [/Imprint KDP/gu, 'Portal NKL'],
  [/Edição KDP/gu, 'Edição Portal NKL'],
  [/edição KDP/gu, 'edição Portal NKL'],
  [/Espaço reservado para código de barras KDP/gu, 'Área limpa de contracapa'],
];

/**
 * Adapts store-specific front-matter, colophon, and reading-instruction phrasing
 * from the Amazon KDP edition so Apple Books, Google Play Livros, Kobo, UICLAP,
 * and Clube de Autores accept the files without rejecting store-exclusivity mentions,
 * while preserving educational sections that teach publishing on Amazon KDP.
 */
export function sanitizeForWideDistribution(html: string): string {
  let sanitized = html;
  for (const [pattern, replacement] of WIDE_DISTRIBUTION_REPLACEMENTS) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  return sanitized;
}

/**
 * Computes realistic Brazilian POD paperback spine width in millimeters:
 * - 80g offset: ~0.10mm per leaf (2 pages)
 * - 90g pólen soft: ~0.115mm per leaf (2 pages)
 * Plus 1.2mm cover board and glue allowance, rounded to 2 decimal places.
 */
export function computeBrazilianPaperbackSpineMm(
  pageCount: number,
  paperGsm: 80 | 90 = 90,
): number {
  if (!Number.isFinite(pageCount) || pageCount <= 0) {
    throw new RangeError('pageCount deve ser um numero positivo.');
  }
  const thicknessPerLeafMm = paperGsm === 80 ? 0.1 : 0.115;
  const leaves = Math.ceil(pageCount / 2);
  const spineMm = leaves * thicknessPerLeafMm + 1.2;
  return Number(spineMm.toFixed(2));
}

async function withChromiumPage<T>(
  viewport: { width: number; height: number; deviceScaleFactor?: number },
  task: (page: Page) => Promise<T>,
): Promise<T> {
  let browser: Browser | undefined;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
    });
    const page = await context.newPage();
    return await task(page);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function renderPortalNklCrestSvg(sizePx: number): string {
  return `<svg width="${sizePx}" height="${sizePx}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <polygon points="32,3 53,11 61,32 53,53 32,61 11,53 3,32 11,11" stroke="#f59e0b" stroke-width="2" fill="rgba(8,17,33,0.75)" />
    <polygon points="32,9 49,15 55,32 49,49 32,55 15,49 9,32 15,15" stroke="rgba(249,115,22,0.55)" stroke-width="1" fill="none" />
    <path d="M22 42V22L34 38V22" stroke="#f8fafc" stroke-width="2.4" stroke-linecap="square" stroke-linejoin="miter" />
    <path d="M38 22V42M46 22L38 32L46 42" stroke="#f59e0b" stroke-width="2.4" stroke-linecap="square" stroke-linejoin="miter" />
  </svg>`;
}

function buildWidePaperback16x23Html(payload: GeneratedBookPayload): string {
  const safeTitle = escapeHtml(payload.title);
  const safeSubtitle = escapeHtml(payload.subtitle);
  const safeAuthor = escapeHtml(payload.author);
  const safePublisher = escapeHtml(payload.publisher);
  const safeSiteUrl = escapeHtml(payload.siteUrl);

  const tocRows = payload.chapters
    .map((chapter, index) => {
      const num = String(index + 1).padStart(2, '0');
      const label = escapeHtml(chapter.tocLabel || chapter.title);
      const sub = chapter.subtitle ? `<span class="toc-sub">${escapeHtml(chapter.subtitle)}</span>` : '';
      return `        <li class="toc-item">
          <span class="toc-num">${num}</span>
          <span class="toc-text">
            <span class="toc-title">${label}</span>
            ${sub}
          </span>
        </li>`;
    })
    .join('\n');

  const chaptersMarkup = payload.chapters
    .map((chapter, index) => {
      const num = String(index + 1).padStart(2, '0');
      const title = escapeHtml(chapter.title);
      const subtitle = chapter.subtitle ? escapeHtml(chapter.subtitle) : '';
      return `    <section class="print-chapter" id="${escapeHtml(chapter.id)}">
      <header class="print-chapter-header">
        <p class="print-chapter-kicker">Capítulo ${num}</p>
        <h1 class="print-chapter-title">${title}</h1>
        ${subtitle ? `<p class="print-chapter-subtitle">${subtitle}</p>` : ''}
      </header>
      <div class="print-chapter-body">
        ${chapter.htmlPrint}
      </div>
    </section>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle} - Edição Impressa 16x23cm</title>
  <style>
    @page {
      size: 160mm 230mm;
      margin: 19mm 16mm 20mm 22mm;
    }

    @page :left {
      margin: 19mm 22mm 20mm 16mm;
    }

    @page :right {
      margin: 19mm 16mm 20mm 22mm;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111111;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 10pt;
      line-height: 1.52;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .front-page {
      page-break-after: always;
      break-after: page;
    }

    .half-title-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: 184mm;
      padding: 12mm 6mm;
    }

    .half-title-rule {
      width: 28mm;
      height: 1.5pt;
      background: #111111;
      margin: 5.5mm auto;
    }

    .half-title-text {
      font-size: 18pt;
      font-weight: 700;
      line-height: 1.25;
      margin: 0;
      color: #111111;
    }

    .half-title-brand {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #333333;
      margin-top: 5mm;
    }

    .verso-page {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      min-height: 184mm;
      padding-bottom: 10mm;
    }

    .verso-note {
      font-size: 8.5pt;
      color: #444444;
      border-top: 0.5pt solid #bbbbbb;
      padding-top: 8pt;
      margin: 0;
    }

    .full-title-page {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 184mm;
      text-align: center;
      padding: 10mm 4mm;
    }

    .full-title-kicker {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #222222;
      margin: 0;
    }

    .full-title-main {
      margin: auto 0;
    }

    .full-title-h1 {
      font-size: 22pt;
      font-weight: 700;
      line-height: 1.18;
      margin: 0 0 12pt 0;
      color: #111111;
    }

    .full-title-sub {
      font-size: 11pt;
      line-height: 1.45;
      color: #2c2c2c;
      margin: 0 auto 18pt;
      max-width: 106mm;
    }

    .full-title-author {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 10pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #111111;
      margin: 14pt 0 0 0;
    }

    .full-title-imprint {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 8.5pt;
      color: #333333;
      border-top: 0.75pt solid #111111;
      padding-top: 10pt;
      margin: 0;
    }

    .copyright-page {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      min-height: 184mm;
      font-size: 8.5pt;
      line-height: 1.48;
      color: #262626;
    }

    .copyright-box {
      border-top: 0.75pt solid #222222;
      padding-top: 12pt;
    }

    .copyright-box p {
      margin: 0 0 7pt 0;
    }

    .toc-page {
      page-break-after: always;
      break-after: page;
    }

    .toc-heading {
      font-size: 16pt;
      font-weight: 700;
      margin: 0 0 12pt 0;
      padding-bottom: 6pt;
      border-bottom: 1.25pt solid #111111;
    }

    .toc-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .toc-item {
      display: flex;
      align-items: baseline;
      gap: 10pt;
      padding: 4.5pt 0;
      border-bottom: 0.5pt dotted #aaaaaa;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .toc-num {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      min-width: 18pt;
      color: #222222;
    }

    .toc-text {
      display: flex;
      flex-direction: column;
    }

    .toc-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: #111111;
    }

    .toc-sub {
      font-size: 8.2pt;
      font-style: italic;
      color: #444444;
    }

    .print-chapter {
      page-break-before: always;
      break-before: page;
    }

    .print-chapter-header {
      margin: 0 0 14pt 0;
      padding: 0 0 8pt 0;
      border-bottom: 1.25pt solid #111111;
      page-break-after: avoid;
      break-after: avoid;
    }

    .print-chapter-kicker {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #333333;
      margin: 0 0 4pt 0;
    }

    .print-chapter-title {
      font-size: 15.5pt;
      line-height: 1.2;
      font-weight: 700;
      margin: 0;
      color: #111111;
    }

    .print-chapter-subtitle {
      font-size: 9.5pt;
      font-style: italic;
      color: #333333;
      margin: 4pt 0 0 0;
    }

    .print-chapter-body h2 {
      font-size: 12pt;
      font-weight: 700;
      line-height: 1.25;
      margin: 14pt 0 5pt 0;
      color: #111111;
      page-break-after: avoid;
      break-after: avoid;
    }

    .print-chapter-body h3 {
      font-size: 10.5pt;
      font-weight: 700;
      line-height: 1.3;
      margin: 10pt 0 4pt 0;
      color: #1a1a1a;
      page-break-after: avoid;
      break-after: avoid;
    }

    .print-chapter-body p {
      margin: 0 0 7pt 0;
      text-align: justify;
      hyphens: auto;
      orphans: 2;
      widows: 2;
    }

    .print-chapter-body ul,
    .print-chapter-body ol {
      margin: 4pt 0 8pt 16pt;
      padding: 0;
    }

    .print-chapter-body li {
      margin: 0 0 3.5pt 0;
    }

    .print-chapter-body blockquote,
    .print-chapter-body .callout,
    .print-chapter-body .box {
      margin: 9pt 0;
      padding: 8pt 10pt;
      border: 0.75pt solid #333333;
      border-left: 2.5pt solid #111111;
      background: #f6f6f6;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .print-chapter-body .dossier {
      margin: 10pt 0;
      padding: 9pt 11pt;
      border: 0.9pt solid #222222;
      background: #fafafa;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .print-chapter-body .worksheet {
      margin: 11pt 0;
      padding: 10pt 12pt;
      border: 1pt solid #111111;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .print-chapter-body .write-line {
      height: 19pt;
      border-bottom: 0.75pt solid #444444;
      margin: 4pt 0;
    }

    .print-chapter-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 9pt 0;
      font-size: 8.8pt;
    }

    .print-chapter-body tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .print-chapter-body th,
    .print-chapter-body td {
      border: 0.6pt solid #333333;
      padding: 4.5pt 5.5pt;
      text-align: left;
      vertical-align: top;
    }

    .print-chapter-body th {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 8.2pt;
      font-weight: 700;
      background: #ececec;
      color: #111111;
    }

    .print-chapter-body .worksheet td,
    .print-chapter-body table.ruled td {
      height: 20pt;
    }

    .print-chapter-body pre,
    .print-chapter-body code {
      font-family: "Courier New", Courier, monospace;
      font-size: 8.5pt;
    }

    .print-chapter-body pre {
      white-space: pre-wrap;
      word-break: break-word;
      padding: 7pt 9pt;
      border: 0.6pt solid #555555;
      background: #f5f5f5;
    }

    .print-chapter-body hr {
      border: 0;
      border-top: 0.6pt solid #777777;
      margin: 11pt 0;
    }
  </style>
</head>
<body>
  <section class="front-page half-title-page">
    <div>
      <div class="half-title-rule"></div>
      <h1 class="half-title-text">${safeTitle}</h1>
      <div class="half-title-rule"></div>
      <p class="half-title-brand">${safePublisher}</p>
    </div>
  </section>

  <section class="front-page verso-page">
    <p class="verso-note">
      Edição Impressa em Português (Brasil) · Formato 16 × 23 cm · ${safePublisher} · ${safeSiteUrl}
    </p>
  </section>

  <section class="front-page full-title-page">
    <p class="full-title-kicker">${safePublisher} · Coleção Prática</p>
    <div class="full-title-main">
      <h1 class="full-title-h1">${safeTitle}</h1>
      <p class="full-title-sub">${safeSubtitle}</p>
      <div class="half-title-rule"></div>
      <p class="full-title-author">${safeAuthor}</p>
    </div>
    <p class="full-title-imprint">${safePublisher} · Brasil · 2026</p>
  </section>

  <section class="front-page copyright-page">
    <div class="copyright-box">
      <p><strong>${safeTitle}</strong></p>
      <p>${safeSubtitle}</p>
      <p>Copyright © 2026 ${safeAuthor} / ${safePublisher}. Todos os direitos reservados.</p>
      <p>Publicação independente oficial: ${safePublisher} (${safeSiteUrl}) · Brasil, 2026.</p>
      <p>
        Nenhuma parte desta publicação pode ser reproduzida, armazenada ou transmitida por qualquer meio
        sem autorização prévia por escrito, exceto trechos curtos para resenha ou estudo pessoal.
      </p>
      <p>
        <strong>Nota Editorial:</strong> As informações, valores de referência, requisitos e métodos
        descritos neste livro foram compilados para fins educacionais e de apoio à decisão prática.
        Condições de plataformas, regras fiscais e termos de parceiros podem mudar ao longo do tempo;
        confirme sempre os termos vigentes diretamente nos canais oficiais antes de assumir compromissos.
      </p>
      <p>Especificação gráfica: Formato 16 × 23 cm · Miolo P&amp;B · Edição Nacional ${safePublisher}.</p>
    </div>
  </section>

  <section class="toc-page">
    <h2 class="toc-heading">Sumário Completo</h2>
    <ol class="toc-list">
${tocRows}
    </ol>
  </section>

  <main>
${chaptersMarkup}
  </main>
</body>
</html>
`;
}

/**
 * Renders the 16x23cm Brazilian POD paperback interior HTML and PDF with mirrored margins,
 * running headers, automatic page numbering skipping front matter, and pdf-lib verification.
 */
export async function renderWidePaperback16x23Pdf(
  payload: GeneratedBookPayload,
  htmlOutPath: string,
  pdfOutPath: string,
): Promise<WidePaperbackRenderResult> {
  await Promise.all([
    fs.mkdir(path.dirname(htmlOutPath), { recursive: true }),
    fs.mkdir(path.dirname(pdfOutPath), { recursive: true }),
  ]);

  const htmlContent = buildWidePaperback16x23Html(payload);
  await fs.writeFile(htmlOutPath, htmlContent, 'utf8');

  const rawPdfBytes = await withChromiumPage(
    { width: 605, height: 869, deviceScaleFactor: 1 },
    async (page) => {
      await page.setContent(htmlContent, { waitUntil: 'load' });
      return page.pdf({
        width: '160mm',
        height: '230mm',
        printBackground: true,
        preferCSSPageSize: true,
      });
    },
  );

  const pdfDoc = await PDFDocument.load(rawPdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const pageCount = pages.length;

  const pageNumberFontSize = 8.5;
  const headerFontSize = 7.5;
  const numberColor = rgb(0.26, 0.26, 0.26);
  const headerColor = rgb(0.4, 0.4, 0.4);
  const ruleColor = rgb(0.78, 0.78, 0.78);
  const outerMarginPt = (16 / 25.4) * 72;
  const innerMarginPt = (22 / 25.4) * 72;

  const versoRunningTitle = payload.title.toUpperCase();
  const rectoRunningBrand = `${payload.publisher.toUpperCase()} · MANUAL DE EXECUÇÃO`;

  for (let i = 4; i < pageCount; i += 1) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const displayPageNumber = i + 1;
    const isRecto = displayPageNumber % 2 === 1;

    const label = String(displayPageNumber);
    const labelWidth = helvetica.widthOfTextAtSize(label, pageNumberFontSize);
    const pageNumX = isRecto ? width - outerMarginPt - labelWidth : outerMarginPt;

    page.drawText(label, {
      x: pageNumX,
      y: 26,
      size: pageNumberFontSize,
      font: helvetica,
      color: numberColor,
    });

    const headerText = isRecto ? rectoRunningBrand : versoRunningTitle;
    const headerWidth = helvetica.widthOfTextAtSize(headerText, headerFontSize);
    const headerX = isRecto ? width - outerMarginPt - headerWidth : outerMarginPt;
    const lineLeft = isRecto ? innerMarginPt : outerMarginPt;
    const lineRight = isRecto ? width - outerMarginPt : width - innerMarginPt;

    page.drawText(headerText, {
      x: headerX,
      y: height - 30,
      size: headerFontSize,
      font: helvetica,
      color: headerColor,
    });

    page.drawLine({
      start: { x: lineLeft, y: height - 35 },
      end: { x: lineRight, y: height - 35 },
      thickness: 0.4,
      color: ruleColor,
    });
  }

  const finalPdfBytes = await pdfDoc.save();
  await fs.writeFile(pdfOutPath, finalPdfBytes);

  return {
    pageCount,
    bytes: finalPdfBytes.length,
  };
}

function buildWideWrapCover16x23Html(params: {
  pageCount: number;
  spineMm: number;
  widthMm: number;
  heightMm: number;
  title: string;
  subtitle: string;
}): string {
  const { pageCount, spineMm, widthMm, heightMm, title, subtitle } = params;
  const safeTitle = escapeHtml(title);
  const safeSubtitle = escapeHtml(subtitle);
  const safeBadge = escapeHtml(WIDE_COVER_BADGE_TEXT);
  const showSpineText = pageCount >= 79 && spineMm >= 5.5;
  const spineFontPt = Number(Math.min(9.5, Math.max(6.2, spineMm * 0.85)).toFixed(2));
  const sidePanelWidthMm = 165;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <style>
    @page {
      size: ${widthMm}mm ${heightMm}mm;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      overflow: hidden;
      background: #081121;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .wrap-canvas {
      display: flex;
      flex-direction: row;
      width: ${widthMm}mm;
      height: ${heightMm}mm;
    }

    .back-cover {
      position: relative;
      width: ${sidePanelWidthMm}mm;
      height: ${heightMm}mm;
      background:
        radial-gradient(circle at 20% 20%, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0) 48%),
        linear-gradient(160deg, #07101e 0%, #0d1c36 60%, #112444 100%);
      color: #e2e8f0;
      padding: 21mm 16mm 20mm 20mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-right: 0.5pt solid rgba(245, 158, 11, 0.22);
    }

    .back-kicker {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #f59e0b;
      margin: 0 0 12pt 0;
    }

    .back-lead {
      font-family: "Playfair Display", Georgia, "Times New Roman", serif;
      font-size: 13.5pt;
      font-weight: 700;
      line-height: 1.38;
      color: #fffdf7;
      margin: 0 0 18pt 0;
    }

    .back-rule {
      width: 24mm;
      height: 2.5pt;
      background: linear-gradient(90deg, #f59e0b 0%, #f97316 100%);
      margin: 0 0 18pt 0;
    }

    .back-bullets {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 10pt;
      font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      font-size: 9.2pt;
      line-height: 1.44;
      color: #cbd5e1;
    }

    .back-bullets li {
      position: relative;
      padding-left: 14pt;
    }

    .back-bullets li::before {
      content: "";
      position: absolute;
      left: 0;
      top: 5pt;
      width: 5pt;
      height: 5pt;
      background: #f59e0b;
    }

    .back-footer {
      display: flex;
      flex-direction: column;
      gap: 6pt;
    }

    .back-site {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 9.5pt;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #f59e0b;
      margin: 0;
    }

    .back-imprint {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 7.8pt;
      color: #94a3b8;
      margin: 0;
    }

    .spine-panel {
      position: relative;
      width: ${spineMm}mm;
      height: ${heightMm}mm;
      background: #081121;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .spine-text-rotator {
      transform: rotate(-90deg);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 14pt;
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: ${spineFontPt}pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #f8fafc;
      max-width: 192mm;
    }

    .spine-brand {
      color: #f59e0b;
      letter-spacing: 0.16em;
    }

    .front-panel {
      width: ${sidePanelWidthMm}mm;
      height: ${heightMm}mm;
      border-left: 0.5pt solid rgba(245, 158, 11, 0.22);
    }

    .front-cover-surface {
      position: relative;
      width: 100%;
      height: 100%;
      background:
        radial-gradient(circle at 78% 18%, rgba(245, 158, 11, 0.16) 0%, rgba(245, 158, 11, 0) 44%),
        radial-gradient(circle at 22% 84%, rgba(249, 115, 22, 0.14) 0%, rgba(249, 115, 22, 0) 48%),
        linear-gradient(155deg, #081121 0%, #0d1c36 52%, #13294b 100%);
      color: #f8fafc;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 18mm 18mm 17mm 14mm;
    }

    .cover-grid-overlay {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right, rgba(245, 158, 11, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(245, 158, 11, 0.05) 1px, transparent 1px);
      background-size: 96px 96px;
      pointer-events: none;
    }

    .cover-accent-frame {
      position: absolute;
      top: 10mm;
      bottom: 10mm;
      left: 8mm;
      right: 11mm;
      border: 1px solid rgba(245, 158, 11, 0.28);
      pointer-events: none;
    }

    .cover-top-band {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(245, 158, 11, 0.35);
      padding-bottom: 11pt;
    }

    .cover-brand-lockup {
      display: flex;
      align-items: center;
      gap: 8pt;
    }

    .cover-kicker {
      font-family: "Helvetica Neue", "Segoe UI", Arial, sans-serif;
      font-weight: 700;
      text-transform: uppercase;
      color: #f59e0b;
      margin: 0;
      font-size: 9pt;
      letter-spacing: 0.2em;
    }

    .cover-series-tag {
      font-family: "Helvetica Neue", "Segoe UI", Arial, sans-serif;
      font-weight: 600;
      text-transform: uppercase;
      color: #cbd5e1;
      letter-spacing: 0.14em;
      margin: 0;
      font-size: 7.5pt;
    }

    .cover-center-block {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 14pt;
      margin: 12pt 0;
    }

    .cover-rule-bar {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .cover-rule-primary {
      width: 17mm;
      height: 3pt;
      background: linear-gradient(90deg, #f59e0b 0%, #f97316 100%);
    }

    .cover-rule-secondary {
      height: 1px;
      flex: 1;
      background: rgba(245, 158, 11, 0.35);
    }

    .cover-title {
      font-family: "Playfair Display", Georgia, "Times New Roman", serif;
      font-weight: 700;
      color: #fffdf7;
      margin: 0;
      letter-spacing: -0.015em;
      font-size: 29pt;
      line-height: 1.09;
    }

    .cover-subtitle {
      font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      font-weight: 400;
      color: #dbe4f0;
      margin: 0;
      font-size: 11.2pt;
      line-height: 1.38;
    }

    .cover-pillars {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      border-top: 1px solid rgba(148, 163, 184, 0.25);
      border-bottom: 1px solid rgba(148, 163, 184, 0.25);
      gap: 12pt;
      padding: 12pt 0;
      margin-top: 4pt;
    }

    .cover-pillar-item {
      display: flex;
      flex-direction: column;
      gap: 3pt;
    }

    .cover-pillar-num {
      font-family: "Playfair Display", Georgia, serif;
      font-weight: 700;
      color: #f59e0b;
      line-height: 1.05;
      font-size: 20pt;
    }

    .cover-pillar-label {
      font-family: "Helvetica Neue", "Segoe UI", Arial, sans-serif;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 6.8pt;
      line-height: 1.25;
    }

    .cover-bottom-block {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 13pt;
    }

    .cover-badge {
      display: inline-block;
      align-self: flex-start;
      background: linear-gradient(90deg, rgba(245, 158, 11, 0.18) 0%, rgba(249, 115, 22, 0.18) 100%);
      border: 1px solid rgba(245, 158, 11, 0.72);
      color: #fef3c7;
      font-family: "Helvetica Neue", "Segoe UI", Arial, sans-serif;
      font-weight: 700;
      letter-spacing: 0.04em;
      padding: 7pt 10pt;
      font-size: 8.2pt;
      border-radius: 3pt;
    }

    .cover-footer-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: "Helvetica Neue", "Segoe UI", Arial, sans-serif;
      color: #94a3b8;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-size: 7.2pt;
      padding-top: 8pt;
      border-top: 0.6pt solid rgba(148, 163, 184, 0.25);
    }

    .cover-footer-accent {
      color: #f59e0b;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="wrap-canvas">
    <section class="back-cover">
      <div>
        <p class="back-kicker">Portal NKL · Edição de Execução</p>
        <p class="back-lead">
          O guia definitivo para sair do zero sem cair em armadilhas — com 57 dossiês verificados, 18 modelos de negócio e caderno de execução
        </p>
        <div class="back-rule"></div>
        <ul class="back-bullets">
          <li><strong>57 formas verificadas</strong> de gerar renda online e offline com prós, contras, requisitos reais e alertas práticos.</li>
          <li><strong>18 modelos de negócio</strong> comparados por capital inicial, tempo semanal, curva de risco e margem potencial.</li>
          <li><strong>25 prompts prontos de IA</strong> para validar ideias, estruturar ofertas, acelerar entregas e evitar bloqueios.</li>
          <li><strong>Caderno pautado de execução</strong> com planilhas de metas, checklist semanal e Bússola de Negócios passo a passo.</li>
        </ul>
      </div>

      <div class="back-footer">
        <p class="back-site">nkloficial.com.br</p>
        <p class="back-imprint">Portal NKL · Edição Impressa 16 × 23 cm · Brasil 2026</p>
      </div>
    </section>

    <section class="spine-panel">
      ${
        showSpineText
          ? `<div class="spine-text-rotator">
              <span>${safeTitle}</span>
              <span class="spine-brand">PORTAL NKL</span>
            </div>`
          : ''
      }
    </section>

    <section class="front-panel">
      <div class="front-cover-surface">
        <div class="cover-grid-overlay"></div>
        <div class="cover-accent-frame"></div>

        <div class="cover-top-band">
          <div class="cover-brand-lockup">
            ${renderPortalNklCrestSvg(24)}
            <p class="cover-kicker">Portal NKL</p>
          </div>
          <p class="cover-series-tag">Edição Oficial Brasil</p>
        </div>

        <div class="cover-center-block">
          <div class="cover-rule-bar">
            <div class="cover-rule-primary"></div>
            <div class="cover-rule-secondary"></div>
          </div>
          <h1 class="cover-title">${safeTitle}</h1>
          <p class="cover-subtitle">${safeSubtitle}</p>
          <div class="cover-pillars">
            <div class="cover-pillar-item">
              <span class="cover-pillar-num">57</span>
              <span class="cover-pillar-label">Dossiês Verificados</span>
            </div>
            <div class="cover-pillar-item">
              <span class="cover-pillar-num">18</span>
              <span class="cover-pillar-label">Modelos de Negócio</span>
            </div>
            <div class="cover-pillar-item">
              <span class="cover-pillar-num">25</span>
              <span class="cover-pillar-label">Prompts de IA</span>
            </div>
          </div>
        </div>

        <div class="cover-bottom-block">
          <div class="cover-badge">${safeBadge}</div>
          <div class="cover-footer-meta">
            <span>PORTAL NKL · EDIÇÃO 2026</span>
            <span class="cover-footer-accent">NKLOFICIAL.COM.BR</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</body>
</html>`;
}

/**
 * Renders the full-wrap 16x23cm cover PDF (back cover without Amazon KDP barcode box,
 * exact Brazilian POD spine width, front cover, and 5mm outer bleeds).
 */
export async function renderWideWrapCover16x23Pdf(
  options: WideWrapCoverOptions,
): Promise<WideWrapCoverResult> {
  const paperGsm = options.paperGsm ?? 90;
  const spineMm = computeBrazilianPaperbackSpineMm(options.pageCount, paperGsm);
  const widthMm = Number((5 + 160 + spineMm + 160 + 5).toFixed(2));
  const heightMm = 240;

  await fs.mkdir(path.dirname(options.outPath), { recursive: true });

  const wrapHtml = buildWideWrapCover16x23Html({
    pageCount: options.pageCount,
    spineMm,
    widthMm,
    heightMm,
    title: options.title,
    subtitle: options.subtitle,
  });

  const pxWidth = Math.max(900, Math.round((widthMm / 25.4) * 96));
  const pxHeight = Math.max(700, Math.round((heightMm / 25.4) * 96));

  const pdfBuffer = await withChromiumPage(
    { width: pxWidth, height: pxHeight, deviceScaleFactor: 1 },
    async (page) => {
      await page.setContent(wrapHtml, { waitUntil: 'load' });
      return page.pdf({
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      });
    },
  );

  await fs.writeFile(options.outPath, pdfBuffer);

  return {
    spineMm,
    widthMm,
    heightMm,
    bytes: pdfBuffer.length,
  };
}

function buildDigitalScreenHtml(payload: GeneratedBookPayload): string {
  const safeTitle = escapeHtml(payload.title);
  const safeSubtitle = escapeHtml(payload.subtitle);
  const safeAuthor = escapeHtml(payload.author);
  const safePublisher = escapeHtml(payload.publisher);
  const safeSiteUrl = escapeHtml(payload.siteUrl);

  const tocItems = payload.chapters
    .map((chapter, index) => {
      const num = String(index + 1).padStart(2, '0');
      const label = escapeHtml(chapter.tocLabel || chapter.title);
      const sub = chapter.subtitle ? `<span class="toc-sub">${escapeHtml(chapter.subtitle)}</span>` : '';
      return `        <li class="toc-item">
          <a href="#${escapeHtml(chapter.id)}" class="toc-link">
            <span class="toc-num">${num}</span>
            <span class="toc-text">
              <span class="toc-title">${label}</span>
              ${sub}
            </span>
          </a>
        </li>`;
    })
    .join('\n');

  const chaptersMarkup = payload.chapters
    .map((chapter, index) => {
      const num = String(index + 1).padStart(2, '0');
      const title = escapeHtml(chapter.title);
      const subtitle = chapter.subtitle ? escapeHtml(chapter.subtitle) : '';
      return `    <section class="digital-chapter" id="${escapeHtml(chapter.id)}">
      <header class="digital-chapter-header">
        <p class="digital-chapter-kicker">Capítulo ${num}</p>
        <h1 class="digital-chapter-title">${title}</h1>
        ${subtitle ? `<p class="digital-chapter-subtitle">${subtitle}</p>` : ''}
      </header>
      <div class="digital-chapter-body">
        ${chapter.htmlKindle}
      </div>
    </section>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle} - Edição Digital</title>
  <style>
    @page {
      size: 148mm 210mm;
      margin: 14mm 14mm 16mm 14mm;
    }

    @page :first {
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      font-size: 9.6pt;
      line-height: 1.56;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .digital-cover {
      width: 148mm;
      height: 210mm;
      background:
        radial-gradient(circle at 80% 18%, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0) 45%),
        linear-gradient(155deg, #081121 0%, #0d1c36 52%, #13294b 100%);
      color: #f8fafc;
      padding: 18mm 16mm 16mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
    }

    .cover-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(245, 158, 11, 0.4);
      padding-bottom: 10pt;
    }

    .cover-brand {
      display: flex;
      align-items: center;
      gap: 8pt;
      font-weight: 700;
      font-size: 9pt;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #f59e0b;
    }

    .cover-tag {
      font-size: 7.5pt;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #cbd5e1;
    }

    .cover-main h1 {
      font-family: "Playfair Display", Georgia, serif;
      font-size: 26pt;
      line-height: 1.1;
      color: #fffdf7;
      margin: 0 0 12pt 0;
    }

    .cover-rule {
      width: 22mm;
      height: 3pt;
      background: linear-gradient(90deg, #f59e0b 0%, #f97316 100%);
      margin: 0 0 14pt 0;
    }

    .cover-sub {
      font-size: 10.5pt;
      line-height: 1.42;
      color: #dbe4f0;
      margin: 0 0 18pt 0;
    }

    .cover-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10pt;
      padding: 11pt 0;
      border-top: 1px solid rgba(148, 163, 184, 0.25);
      border-bottom: 1px solid rgba(148, 163, 184, 0.25);
    }

    .cover-stat-num {
      display: block;
      font-family: Georgia, serif;
      font-size: 18pt;
      font-weight: 700;
      color: #f59e0b;
    }

    .cover-stat-label {
      display: block;
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #cbd5e1;
    }

    .cover-foot {
      border-top: 1px solid rgba(148, 163, 184, 0.25);
      padding-top: 9pt;
      display: flex;
      justify-content: space-between;
      font-size: 7.8pt;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #94a3b8;
    }

    .cover-foot-accent {
      color: #f59e0b;
      font-weight: 700;
    }

    .digital-colophon {
      padding: 8pt 12pt;
      margin: 0 0 14pt 0;
      border-radius: 6pt;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 3pt solid #0d1c36;
      font-size: 8.2pt;
      line-height: 1.46;
      color: #334155;
    }

    .digital-colophon p {
      margin: 0 0 5pt 0;
    }

    .digital-colophon p:last-child {
      margin-bottom: 0;
    }

    .toc-section {
      page-break-after: always;
      break-after: page;
    }

    .toc-heading {
      font-size: 14.5pt;
      font-weight: 700;
      color: #081121;
      margin: 0 0 10pt 0;
      padding-bottom: 5pt;
      border-bottom: 2pt solid #f59e0b;
    }

    .toc-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .toc-item {
      border-bottom: 0.5pt solid #e2e8f0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .toc-link {
      display: flex;
      align-items: baseline;
      gap: 9pt;
      padding: 4.5pt 0;
      text-decoration: none;
      color: inherit;
    }

    .toc-num {
      font-size: 8.2pt;
      font-weight: 700;
      color: #d97706;
      min-width: 17pt;
    }

    .toc-text {
      display: flex;
      flex-direction: column;
    }

    .toc-title {
      font-size: 9.2pt;
      font-weight: 700;
      color: #0f172a;
    }

    .toc-sub {
      font-size: 7.8pt;
      color: #475569;
    }

    .digital-chapter {
      page-break-before: always;
      break-before: page;
    }

    .digital-chapter-header {
      margin: 0 0 12pt 0;
      padding: 9pt 11pt;
      border-radius: 5pt;
      background: linear-gradient(135deg, #081121 0%, #13294b 100%);
      color: #f8fafc;
      page-break-after: avoid;
      break-after: avoid;
    }

    .digital-chapter-kicker {
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #f59e0b;
      margin: 0 0 3pt 0;
    }

    .digital-chapter-title {
      font-family: Georgia, serif;
      font-size: 14.5pt;
      line-height: 1.2;
      font-weight: 700;
      margin: 0;
      color: #ffffff;
    }

    .digital-chapter-subtitle {
      font-size: 8.8pt;
      color: #cbd5e1;
      margin: 4pt 0 0 0;
    }

    .digital-chapter-body h2 {
      font-size: 11.5pt;
      font-weight: 700;
      color: #0d1c36;
      margin: 13pt 0 5pt 0;
      padding-bottom: 2.5pt;
      border-bottom: 1pt solid #e2e8f0;
      page-break-after: avoid;
      break-after: avoid;
    }

    .digital-chapter-body h3 {
      font-size: 10pt;
      font-weight: 700;
      color: #1e293b;
      margin: 9pt 0 4pt 0;
      page-break-after: avoid;
      break-after: avoid;
    }

    .digital-chapter-body p {
      margin: 0 0 7pt 0;
      orphans: 2;
      widows: 2;
    }

    .digital-chapter-body ul,
    .digital-chapter-body ol {
      margin: 4pt 0 8pt 15pt;
      padding: 0;
    }

    .digital-chapter-body li {
      margin: 0 0 3.5pt 0;
    }

    .digital-chapter-body blockquote,
    .digital-chapter-body .callout,
    .digital-chapter-body .box {
      margin: 9pt 0;
      padding: 8pt 10pt;
      border-radius: 4pt;
      border: 0.75pt solid #fde68a;
      border-left: 3pt solid #f59e0b;
      background: #fffbeb;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .digital-chapter-body .dossier {
      margin: 9pt 0;
      padding: 9pt 11pt;
      border-radius: 5pt;
      border: 0.9pt solid #cbd5e1;
      border-top: 2.5pt solid #0d1c36;
      background: #f8fafc;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .digital-chapter-body .worksheet {
      margin: 10pt 0;
      padding: 9pt 11pt;
      border-radius: 5pt;
      border: 1pt solid #94a3b8;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .digital-chapter-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 9pt 0;
      font-size: 8.5pt;
    }

    .digital-chapter-body tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .digital-chapter-body th,
    .digital-chapter-body td {
      border: 0.6pt solid #cbd5e1;
      padding: 4.5pt 5.5pt;
      text-align: left;
      vertical-align: top;
    }

    .digital-chapter-body th {
      font-size: 8pt;
      font-weight: 700;
      background: #0d1c36;
      color: #ffffff;
    }

    .digital-chapter-body pre,
    .digital-chapter-body code {
      font-family: "Courier New", Courier, monospace;
      font-size: 8.3pt;
    }

    .digital-chapter-body pre {
      white-space: pre-wrap;
      word-break: break-word;
      padding: 7pt 9pt;
      border-radius: 4pt;
      border: 0.6pt solid #cbd5e1;
      background: #f1f5f9;
      color: #0f172a;
    }

    .digital-chapter-body hr {
      border: 0;
      border-top: 0.8pt solid #cbd5e1;
      margin: 10pt 0;
    }

    .digital-chapter-body a {
      color: #b45309;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <section class="digital-cover">
    <div class="cover-top">
      <div class="cover-brand">
        ${renderPortalNklCrestSvg(24)}
        <span>${safePublisher}</span>
      </div>
      <span class="cover-tag">Edição Digital Interativa</span>
    </div>

    <div class="cover-main">
      <div class="cover-rule"></div>
      <h1>${safeTitle}</h1>
      <p class="cover-sub">${safeSubtitle}</p>
      <div class="cover-stats">
        <div>
          <span class="cover-stat-num">57</span>
          <span class="cover-stat-label">Dossiês Verificados</span>
        </div>
        <div>
          <span class="cover-stat-num">18</span>
          <span class="cover-stat-label">Modelos de Negócio</span>
        </div>
        <div>
          <span class="cover-stat-num">25</span>
          <span class="cover-stat-label">Prompts de IA</span>
        </div>
      </div>
    </div>

    <div class="cover-foot">
      <span>${safeAuthor} · BRASIL 2026</span>
      <span class="cover-foot-accent">${safeSiteUrl}</span>
    </div>
  </section>

  <section class="toc-section">
    <div class="digital-colophon">
      <p><strong>${safeTitle}</strong> · ${safeAuthor} / ${safePublisher}</p>
      <p>Edição Digital em Tela (A5 Tablet &amp; Desktop) · Distribuição direta oficial (${safeSiteUrl}).</p>
      <p>Direitos reservados © 2026. Uso pessoal intransferível.</p>
    </div>

    <h2 class="toc-heading">Sumário Interativo</h2>
    <ol class="toc-list">
${tocItems}
    </ol>
  </section>

  <main>
${chaptersMarkup}
  </main>
</body>
</html>
`;
}

/**
 * Renders a screen-friendly A5 color PDF without forced odd/even print padding
 * for direct digital delivery (Hotmart, Kiwify, Eduzz, Portal NKL).
 */
export async function renderDigitalScreenPdf(
  payload: GeneratedBookPayload,
  htmlOutPath: string,
  pdfOutPath: string,
): Promise<WidePaperbackRenderResult> {
  await Promise.all([
    fs.mkdir(path.dirname(htmlOutPath), { recursive: true }),
    fs.mkdir(path.dirname(pdfOutPath), { recursive: true }),
  ]);

  const htmlContent = buildDigitalScreenHtml(payload);
  await fs.writeFile(htmlOutPath, htmlContent, 'utf8');

  const rawPdfBytes = await withChromiumPage(
    { width: 559, height: 794, deviceScaleFactor: 1 },
    async (page) => {
      await page.setContent(htmlContent, { waitUntil: 'load' });
      return page.pdf({
        width: '148mm',
        height: '210mm',
        printBackground: true,
        preferCSSPageSize: true,
      });
    },
  );

  const pdfDoc = await PDFDocument.load(rawPdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const pageCount = pages.length;
  const fontSize = 8;
  const mutedColor = rgb(0.39, 0.45, 0.55);
  const sideMarginPt = (14 / 25.4) * 72;

  for (let i = 1; i < pageCount; i += 1) {
    const page = pages[i];
    const { width } = page.getSize();
    const pageLabel = `${i + 1} / ${pageCount}`;
    const labelWidth = helvetica.widthOfTextAtSize(pageLabel, fontSize);

    page.drawText(`${payload.publisher} · nkloficial.com.br`, {
      x: sideMarginPt,
      y: 22,
      size: fontSize,
      font: helvetica,
      color: mutedColor,
    });

    page.drawText(pageLabel, {
      x: width - sideMarginPt - labelWidth,
      y: 22,
      size: fontSize,
      font: helvetica,
      color: mutedColor,
    });
  }

  const finalPdfBytes = await pdfDoc.save();
  await fs.writeFile(pdfOutPath, finalPdfBytes);

  return {
    pageCount,
    bytes: finalPdfBytes.length,
  };
}

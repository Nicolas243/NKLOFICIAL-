import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import sharp from 'sharp';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { escapeHtml, type GeneratedBookPayload } from './types';

const COVER_BADGE_TEXT =
  'Edição Completa · 57 Formas Verificadas + 18 Modelos + 25 Prompts IA';

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

function buildSharedFrontCoverStyles(): string {
  return `
    .front-cover-surface {
      position: relative;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      background:
        radial-gradient(circle at 78% 18%, rgba(245, 158, 11, 0.16) 0%, rgba(245, 158, 11, 0) 44%),
        radial-gradient(circle at 22% 84%, rgba(249, 115, 22, 0.14) 0%, rgba(249, 115, 22, 0) 48%),
        linear-gradient(155deg, #081121 0%, #0d1c36 52%, #13294b 100%);
      color: #f8fafc;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
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
    }

    .cover-brand-lockup {
      display: flex;
      align-items: center;
    }

    .cover-kicker {
      font-family: "Helvetica Neue", "Segoe UI", Arial, sans-serif;
      font-weight: 700;
      text-transform: uppercase;
      color: #f59e0b;
      margin: 0;
    }

    .cover-series-tag {
      font-family: "Helvetica Neue", "Segoe UI", Arial, sans-serif;
      font-weight: 600;
      text-transform: uppercase;
      color: #cbd5e1;
      letter-spacing: 0.14em;
      margin: 0;
    }

    .cover-center-block {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .cover-rule-bar {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .cover-rule-primary {
      height: 4px;
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
    }

    .cover-subtitle {
      font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      font-weight: 400;
      color: #dbe4f0;
      margin: 0;
    }

    .cover-pillars {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      border-top: 1px solid rgba(148, 163, 184, 0.25);
      border-bottom: 1px solid rgba(148, 163, 184, 0.25);
    }

    .cover-pillar-item {
      display: flex;
      flex-direction: column;
    }

    .cover-pillar-num {
      font-family: "Playfair Display", Georgia, serif;
      font-weight: 700;
      color: #f59e0b;
      line-height: 1.05;
    }

    .cover-pillar-label {
      font-family: "Helvetica Neue", "Segoe UI", Arial, sans-serif;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .cover-bottom-block {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
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
    }

    .cover-footer-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: "Helvetica Neue", "Segoe UI", Arial, sans-serif;
      color: #94a3b8;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .cover-footer-accent {
      color: #f59e0b;
      font-weight: 700;
    }
  `;
}

function buildFrontCoverInnerHtml(
  title: string,
  subtitle: string,
  crestSizePx: number,
): string {
  const safeTitle = escapeHtml(title);
  const safeSubtitle = escapeHtml(subtitle);
  const safeBadge = escapeHtml(COVER_BADGE_TEXT);

  return `
    <div class="cover-grid-overlay"></div>
    <div class="cover-accent-frame"></div>

    <div class="cover-top-band">
      <div class="cover-brand-lockup">
        ${renderPortalNklCrestSvg(crestSizePx)}
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
  `;
}

function buildKindleCoverHtml(title: string, subtitle: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 1600px;
      height: 2560px;
      overflow: hidden;
      background: #081121;
    }
    ${buildSharedFrontCoverStyles()}
    .front-cover-surface {
      padding: 132px 124px 120px;
    }
    .cover-accent-frame {
      inset: 52px;
    }
    .cover-top-band {
      padding-bottom: 42px;
    }
    .cover-brand-lockup {
      gap: 24px;
    }
    .cover-kicker {
      font-size: 30px;
      letter-spacing: 0.22em;
    }
    .cover-series-tag {
      font-size: 24px;
    }
    .cover-center-block {
      gap: 48px;
      margin: 40px 0;
    }
    .cover-rule-primary {
      width: 168px;
      height: 8px;
    }
    .cover-title {
      font-size: 118px;
      line-height: 1.07;
    }
    .cover-subtitle {
      font-size: 44px;
      line-height: 1.38;
      max-width: 1260px;
    }
    .cover-pillars {
      gap: 36px;
      padding: 42px 0;
      margin-top: 12px;
    }
    .cover-pillar-item {
      gap: 10px;
    }
    .cover-pillar-num {
      font-size: 72px;
    }
    .cover-pillar-label {
      font-size: 23px;
      line-height: 1.3;
    }
    .cover-bottom-block {
      gap: 42px;
    }
    .cover-badge {
      padding: 24px 36px;
      font-size: 29px;
      border-radius: 6px;
    }
    .cover-footer-meta {
      font-size: 23px;
      padding-top: 24px;
      border-top: 1px solid rgba(148, 163, 184, 0.24);
    }
  </style>
</head>
<body>
  <main class="front-cover-surface">
    ${buildFrontCoverInnerHtml(title, subtitle, 72)}
  </main>
</body>
</html>`;
}

/**
 * Renders the 1600x2560 Kindle eBook cover JPEG (quality 94, sRGB) via headless Chromium and sharp.
 */
export async function renderKindleCoverJpg(
  title: string,
  subtitle: string,
  outputPath: string,
): Promise<Buffer> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const coverHtml = buildKindleCoverHtml(title, subtitle);

  const pngBuffer = await withChromiumPage(
    { width: 1600, height: 2560, deviceScaleFactor: 1 },
    async (page) => {
      await page.setContent(coverHtml, { waitUntil: 'load' });
      return page.screenshot({ type: 'png', fullPage: false });
    },
  );

  const jpgBuffer = await sharp(pngBuffer)
    .resize(1600, 2560, { fit: 'cover' })
    .flatten({ background: '#081121' })
    .toColorspace('srgb')
    .jpeg({ quality: 94, mozjpeg: true })
    .toBuffer();

  await fs.writeFile(outputPath, jpgBuffer);
  return jpgBuffer;
}

function buildPaperbackInteriorHtml(payload: GeneratedBookPayload): string {
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
  <title>${safeTitle} - Edição Impressa 6x9</title>
  <style>
    @page {
      size: 6in 9in;
      margin: 0.72in 0.62in 0.75in 0.85in;
    }

    @page :left {
      margin: 0.72in 0.85in 0.75in 0.62in;
    }

    @page :right {
      margin: 0.72in 0.62in 0.75in 0.85in;
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
      min-height: 7.2in;
      padding: 0.5in 0.25in;
    }

    .half-title-rule {
      width: 1.1in;
      height: 1.5pt;
      background: #111111;
      margin: 0.22in auto;
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
      margin-top: 0.2in;
    }

    .verso-page {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      min-height: 7.2in;
      padding-bottom: 0.4in;
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
      min-height: 7.2in;
      text-align: center;
      padding: 0.4in 0.15in;
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
      max-width: 4.1in;
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
      min-height: 7.2in;
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
  <!-- Página 1: Folha de Rosto Simplificada -->
  <section class="front-page half-title-page">
    <div>
      <div class="half-title-rule"></div>
      <h1 class="half-title-text">${safeTitle}</h1>
      <div class="half-title-rule"></div>
      <p class="half-title-brand">${safePublisher}</p>
    </div>
  </section>

  <!-- Página 2: Verso / Nota de Edição -->
  <section class="front-page verso-page">
    <p class="verso-note">
      Edição Impressa em Português (Brasil) · Formato 6 × 9 polegadas · ${safePublisher} · ${safeSiteUrl}
    </p>
  </section>

  <!-- Página 3: Folha de Rosto Completa -->
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

  <!-- Página 4: Ficha Técnica / Direitos Autorais / Nota Editorial -->
  <section class="front-page copyright-page">
    <div class="copyright-box">
      <p><strong>${safeTitle}</strong></p>
      <p>${safeSubtitle}</p>
      <p>Copyright © 2026 ${safeAuthor} / ${safePublisher}. Todos os direitos reservados.</p>
      <p>Publicação oficial: ${safePublisher} (${safeSiteUrl}) · Brasil, 2026.</p>
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
      <p>Especificação de impressão: Papel branco 6 × 9 pol. · Miolo P&amp;B · Padrão KDP.</p>
    </div>
  </section>

  <!-- Página 5+: Sumário Completo -->
  <section class="toc-page">
    <h2 class="toc-heading">Sumário Completo</h2>
    <ol class="toc-list">
${tocRows}
    </ol>
  </section>

  <!-- Miolo -->
  <main>
${chaptersMarkup}
  </main>
</body>
</html>
`;
}

/**
 * Renders the 6x9 inch KDP interior paperback HTML and PDF with gutter margins
 * and post-processed page numbers starting on page 5 (index 4).
 */
export async function renderPaperbackInteriorPdf(
  payload: GeneratedBookPayload,
  htmlOutputPath: string,
  pdfOutputPath: string,
): Promise<{ pageCount: number; bytes: number }> {
  await Promise.all([
    fs.mkdir(path.dirname(htmlOutputPath), { recursive: true }),
    fs.mkdir(path.dirname(pdfOutputPath), { recursive: true }),
  ]);

  const htmlContent = buildPaperbackInteriorHtml(payload);
  await fs.writeFile(htmlOutputPath, htmlContent, 'utf8');

  const rawPdfBytes = await withChromiumPage(
    { width: 576, height: 864, deviceScaleFactor: 1 },
    async (page) => {
      await page.setContent(htmlContent, { waitUntil: 'load' });
      return page.pdf({
        width: '6in',
        height: '9in',
        printBackground: true,
        preferCSSPageSize: true,
      });
    },
  );

  const pdfDoc = await PDFDocument.load(rawPdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const pageCount = pages.length;
  const fontSize = 8.5;
  const textColor = rgb(0.28, 0.28, 0.28);
  const outerMarginPt = 0.62 * 72;

  for (let i = 4; i < pageCount; i += 1) {
    const page = pages[i];
    const { width } = page.getSize();
    const displayPageNumber = i + 1;
    const label = String(displayPageNumber);
    const textWidth = helvetica.widthOfTextAtSize(label, fontSize);
    const isRecto = displayPageNumber % 2 === 1;
    const x = isRecto ? width - outerMarginPt - textWidth : outerMarginPt;

    page.drawText(label, {
      x,
      y: 28,
      size: fontSize,
      font: helvetica,
      color: textColor,
    });
  }

  const finalPdfBytes = await pdfDoc.save();
  await fs.writeFile(pdfOutputPath, finalPdfBytes);

  return {
    pageCount,
    bytes: finalPdfBytes.length,
  };
}

function buildFullWrapCoverHtml(params: {
  pageCount: number;
  spineInches: number;
  widthInches: number;
  heightInches: number;
  title: string;
  subtitle: string;
}): string {
  const { pageCount, spineInches, widthInches, heightInches, title, subtitle } = params;
  const safeTitle = escapeHtml(title);
  const showSpineText = pageCount >= 79;
  const spineFontPt = Number(Math.min(9.5, Math.max(6.2, spineInches * 22)).toFixed(2));
  const backPanelWidthInches = 6.125;
  const frontPanelWidthInches = 6.125;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <style>
    @page {
      size: ${widthInches}in ${heightInches}in;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: ${widthInches}in;
      height: ${heightInches}in;
      overflow: hidden;
      background: #081121;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .wrap-canvas {
      display: flex;
      flex-direction: row;
      width: ${widthInches}in;
      height: ${heightInches}in;
    }

    /* Left Panel: 0.125in bleed + 6in Back Cover */
    .back-cover {
      position: relative;
      width: ${backPanelWidthInches}in;
      height: ${heightInches}in;
      background:
        radial-gradient(circle at 20% 20%, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0) 48%),
        linear-gradient(160deg, #07101e 0%, #0d1c36 60%, #112444 100%);
      color: #e2e8f0;
      padding: 0.78in 0.56in 0.72in 0.685in;
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
      width: 0.9in;
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
      padding-right: 2.55in;
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

    /* Mandatory KDP barcode white box: 2.0in x 1.2in, 0.375in from spine, 0.5in from bottom trim (+0.125in bleed = 0.625in) */
    .kdp-barcode-box {
      position: absolute;
      right: 0.375in;
      bottom: 0.625in;
      width: 2in;
      height: 1.2in;
      background: #ffffff;
    }

    /* Center Panel: Spine */
    .spine-panel {
      position: relative;
      width: ${spineInches}in;
      height: ${heightInches}in;
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
      max-width: 7.4in;
    }

    .spine-brand {
      color: #f59e0b;
      letter-spacing: 0.16em;
    }

    /* Right Panel: 6in Front Cover + 0.125in bleed */
    .front-panel {
      width: ${frontPanelWidthInches}in;
      height: ${heightInches}in;
      border-left: 0.5pt solid rgba(245, 158, 11, 0.22);
    }

    ${buildSharedFrontCoverStyles()}

    .front-panel .front-cover-surface {
      padding: 0.62in 0.6in 0.58in 0.48in;
    }

    .front-panel .cover-accent-frame {
      top: 0.32in;
      bottom: 0.32in;
      left: 0.26in;
      right: 0.34in;
    }

    .front-panel .cover-top-band {
      padding-bottom: 11pt;
    }

    .front-panel .cover-brand-lockup {
      gap: 8pt;
    }

    .front-panel .cover-kicker {
      font-size: 9pt;
      letter-spacing: 0.2em;
    }

    .front-panel .cover-series-tag {
      font-size: 7.5pt;
    }

    .front-panel .cover-center-block {
      gap: 14pt;
      margin: 12pt 0;
    }

    .front-panel .cover-rule-primary {
      width: 0.65in;
      height: 3pt;
    }

    .front-panel .cover-title {
      font-size: 29pt;
      line-height: 1.09;
    }

    .front-panel .cover-subtitle {
      font-size: 11.2pt;
      line-height: 1.38;
    }

    .front-panel .cover-pillars {
      gap: 12pt;
      padding: 12pt 0;
      margin-top: 4pt;
    }

    .front-panel .cover-pillar-item {
      gap: 3pt;
    }

    .front-panel .cover-pillar-num {
      font-size: 20pt;
    }

    .front-panel .cover-pillar-label {
      font-size: 6.8pt;
      line-height: 1.25;
    }

    .front-panel .cover-bottom-block {
      gap: 13pt;
    }

    .front-panel .cover-badge {
      padding: 7pt 10pt;
      font-size: 8.2pt;
      border-radius: 3pt;
    }

    .front-panel .cover-footer-meta {
      font-size: 7.2pt;
      padding-top: 8pt;
      border-top: 0.6pt solid rgba(148, 163, 184, 0.25);
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
        <p class="back-imprint">Portal NKL · Edição Impressa 6 × 9 pol. · Brasil 2026</p>
      </div>

      <div class="kdp-barcode-box" aria-label="Espaço reservado para código de barras KDP"></div>
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
        ${buildFrontCoverInnerHtml(title, subtitle, 24)}
      </div>
    </section>
  </div>
</body>
</html>`;
}

/**
 * Renders the full-wrap 6x9 inch KDP Paperback cover PDF (back cover, white-paper spine,
 * front cover, 0.125in bleeds, and mandatory KDP barcode placeholder).
 */
export async function renderPaperbackFullWrapCoverPdf(
  pageCount: number,
  title: string,
  subtitle: string,
  outputPath: string,
): Promise<{ spineInches: number; widthInches: number; heightInches: number; bytes: number }> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const spineInches = Number((pageCount * 0.002252).toFixed(4));
  const widthInches = Number((0.125 + 6 + spineInches + 6 + 0.125).toFixed(4));
  const heightInches = 9.25;

  const wrapHtml = buildFullWrapCoverHtml({
    pageCount,
    spineInches,
    widthInches,
    heightInches,
    title,
    subtitle,
  });

  const pdfBuffer = await withChromiumPage(
    {
      width: Math.max(800, Math.round(widthInches * 96)),
      height: Math.max(600, Math.round(heightInches * 96)),
      deviceScaleFactor: 1,
    },
    async (page) => {
      await page.setContent(wrapHtml, { waitUntil: 'load' });
      return page.pdf({
        width: `${widthInches}in`,
        height: `${heightInches}in`,
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0in', right: '0in', bottom: '0in', left: '0in' },
      });
    },
  );

  await fs.writeFile(outputPath, pdfBuffer);

  return {
    spineInches,
    widthInches,
    heightInches,
    bytes: pdfBuffer.length,
  };
}

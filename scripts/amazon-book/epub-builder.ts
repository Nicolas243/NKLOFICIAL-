import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { escapeHtml, type BookChapterPayload, type GeneratedBookPayload } from './types';

type ZipInputEntry = {
  name: string;
  data: Buffer;
  store?: boolean;
};

type CentralDirectoryRecord = {
  nameBuffer: Buffer;
  compressionMethod: number;
  dosTime: number;
  dosDate: number;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
};

const CRC32_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const HTML_NAMED_ENTITY_TO_CODEPOINT: Readonly<Record<string, number>> = {
  nbsp: 160,
  iexcl: 161,
  cent: 162,
  pound: 163,
  curren: 164,
  yen: 165,
  brvbar: 166,
  sect: 167,
  uml: 168,
  copy: 169,
  ordf: 170,
  laquo: 171,
  not: 172,
  shy: 173,
  reg: 174,
  macr: 175,
  deg: 176,
  plusmn: 177,
  sup2: 178,
  sup3: 179,
  acute: 180,
  micro: 181,
  para: 182,
  middot: 183,
  cedil: 184,
  sup1: 185,
  ordm: 186,
  raquo: 187,
  frac14: 188,
  frac12: 189,
  frac34: 190,
  iquest: 191,
  Agrave: 192,
  Aacute: 193,
  Acirc: 194,
  Atilde: 195,
  Auml: 196,
  Aring: 197,
  AElig: 198,
  Ccedil: 199,
  Egrave: 200,
  Eacute: 201,
  Ecirc: 202,
  Euml: 203,
  Igrave: 204,
  Iacute: 205,
  Icirc: 206,
  Iuml: 207,
  Ntilde: 209,
  Ograve: 210,
  Oacute: 211,
  Ocirc: 212,
  Otilde: 213,
  Ouml: 214,
  times: 215,
  Oslash: 216,
  Ugrave: 217,
  Uacute: 218,
  Ucirc: 219,
  Uuml: 220,
  Yacute: 221,
  szlig: 223,
  agrave: 224,
  aacute: 225,
  acirc: 226,
  atilde: 227,
  auml: 228,
  aring: 229,
  aelig: 230,
  ccedil: 231,
  egrave: 232,
  eacute: 233,
  ecirc: 234,
  euml: 235,
  igrave: 236,
  iacute: 237,
  icirc: 238,
  iuml: 239,
  ntilde: 241,
  ograve: 242,
  oacute: 243,
  ocirc: 244,
  otilde: 245,
  ouml: 246,
  divide: 247,
  oslash: 248,
  ugrave: 249,
  uacute: 250,
  ucirc: 251,
  uuml: 252,
  yacute: 253,
  yuml: 255,
  ndash: 8211,
  mdash: 8212,
  lsquo: 8216,
  rsquo: 8217,
  sbquo: 8218,
  ldquo: 8220,
  rdquo: 8221,
  bdquo: 8222,
  dagger: 8224,
  Dagger: 8225,
  bull: 8226,
  hellip: 8230,
  permil: 8240,
  lsaquo: 8249,
  rsaquo: 8250,
  euro: 8364,
  trade: 8482,
  larr: 8592,
  uarr: 8593,
  rarr: 8594,
  darr: 8595,
  harr: 8596,
  check: 10003,
};

const VOID_TAGS_PATTERN =
  /<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s[^>]*?)?\s*\/?>/giu;
const CLOSING_VOID_TAGS_PATTERN =
  /<\/(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\s*>/giu;

function computeCrc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getDosTimestamp(date: Date): { dosTime: number; dosDate: number } {
  const year = Math.max(1980, date.getUTCFullYear());
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = Math.floor(date.getUTCSeconds() / 2);

  const dosTime = ((hours & 0x1f) << 11) | ((minutes & 0x3f) << 5) | (seconds & 0x1f);
  const dosDate = (((year - 1980) & 0x7f) << 9) | ((month & 0x0f) << 5) | (day & 0x1f);
  return { dosTime, dosDate };
}

function buildZipArchive(entries: ZipInputEntry[]): Buffer {
  const { dosTime, dosDate } = getDosTimestamp(new Date());
  const localParts: Buffer[] = [];
  const centralRecords: CentralDirectoryRecord[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, 'utf8');
    const uncompressedSize = entry.data.length;
    const crc32 = computeCrc32(entry.data);
    const useStore = entry.store === true;
    const compressionMethod = useStore ? 0 : 8;
    const payload = useStore ? entry.data : deflateRawSync(entry.data, { level: 9 });
    const compressedSize = payload.length;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(compressionMethod, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc32, 14);
    localHeader.writeUInt32LE(compressedSize, 18);
    localHeader.writeUInt32LE(uncompressedSize, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuffer, payload);

    centralRecords.push({
      nameBuffer,
      compressionMethod,
      dosTime,
      dosDate,
      crc32,
      compressedSize,
      uncompressedSize,
      localHeaderOffset: offset,
    });

    offset += localHeader.length + nameBuffer.length + payload.length;
  }

  const centralDirectoryOffset = offset;
  const centralParts: Buffer[] = [];
  let centralDirectorySize = 0;

  for (const rec of centralRecords) {
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(rec.compressionMethod, 10);
    centralHeader.writeUInt16LE(rec.dosTime, 12);
    centralHeader.writeUInt16LE(rec.dosDate, 14);
    centralHeader.writeUInt32LE(rec.crc32, 16);
    centralHeader.writeUInt32LE(rec.compressedSize, 20);
    centralHeader.writeUInt32LE(rec.uncompressedSize, 24);
    centralHeader.writeUInt16LE(rec.nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(rec.localHeaderOffset, 42);

    centralParts.push(centralHeader, rec.nameBuffer);
    centralDirectorySize += centralHeader.length + rec.nameBuffer.length;
  }

  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(centralRecords.length, 8);
  endRecord.writeUInt16LE(centralRecords.length, 10);
  endRecord.writeUInt32LE(centralDirectorySize, 12);
  endRecord.writeUInt32LE(centralDirectoryOffset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, endRecord]);
}

function sanitizeXmlId(rawId: string, fallback: string): string {
  const cleaned = rawId.replace(/[^A-Za-z0-9._-]/gu, '-');
  if (!cleaned) {
    return fallback;
  }
  return /^[A-Za-z_]/u.test(cleaned) ? cleaned : `sec-${cleaned}`;
}

function sanitizeXmlEntities(html: string): string {
  return html.replace(/&([A-Za-z0-9#]+);|&/gu, (fullMatch, entityName?: string) => {
    if (!entityName) {
      return '&amp;';
    }
    if (
      entityName === 'amp' ||
      entityName === 'lt' ||
      entityName === 'gt' ||
      entityName === 'quot' ||
      entityName === 'apos' ||
      /^#\d+$/u.test(entityName) ||
      /^#x[0-9A-Fa-f]+$/u.test(entityName)
    ) {
      return fullMatch;
    }
    const codePoint = HTML_NAMED_ENTITY_TO_CODEPOINT[entityName];
    if (codePoint !== undefined) {
      return `&#${codePoint};`;
    }
    return `&amp;${entityName};`;
  });
}

function sanitizeHtmlToXhtml(html: string): string {
  const withoutClosingVoid = html.replace(CLOSING_VOID_TAGS_PATTERN, '');
  const selfClosedVoid = withoutClosingVoid.replace(
    VOID_TAGS_PATTERN,
    (_match, tagName: string, rawAttrs?: string) => {
      const attrs = rawAttrs ? rawAttrs.replace(/\/+$/u, '').trimEnd() : '';
      return attrs ? `<${tagName.toLowerCase()}${attrs} />` : `<${tagName.toLowerCase()} />`;
    },
  );
  return sanitizeXmlEntities(selfClosedVoid);
}

function formatChapterFilename(index: number): string {
  return `chapter-${String(index + 1).padStart(2, '0')}.xhtml`;
}

function formatChapterItemId(index: number): string {
  return `chapter-${String(index + 1).padStart(2, '0')}`;
}

function buildReflowableEpubCss(): string {
  return `/* Reflowable EPUB 3 stylesheet compatible with Kindle Light, Sepia and Dark themes */
html, body {
  margin: 0;
  padding: 0;
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.6;
  text-align: left;
  -webkit-hyphens: auto;
  hyphens: auto;
}

body {
  padding: 0.4em 0.5em;
}

.cover-page {
  margin: 0;
  padding: 0;
  text-align: center;
}

.cover-wrap {
  margin: 0 auto;
  padding: 0;
  text-align: center;
}

.cover-wrap img {
  max-width: 100%;
  max-height: 98vh;
  width: auto;
  height: auto;
  display: block;
  margin: 0 auto;
}

.chapter-header {
  margin: 0 0 1.3em 0;
  padding: 0 0 0.7em 0;
  border-bottom: 1px solid rgba(128, 128, 128, 0.35);
}

.chapter-kicker {
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 0.75em;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 0 0 0.35em 0;
  opacity: 0.78;
}

h1 {
  font-size: 1.55em;
  line-height: 1.22;
  font-weight: 700;
  margin: 0 0 0.35em 0;
  page-break-after: avoid;
  break-after: avoid;
}

h2 {
  font-size: 1.25em;
  line-height: 1.28;
  font-weight: 700;
  margin: 1.45em 0 0.45em 0;
  page-break-after: avoid;
  break-after: avoid;
}

h3 {
  font-size: 1.08em;
  line-height: 1.32;
  font-weight: 700;
  margin: 1.15em 0 0.35em 0;
  page-break-after: avoid;
  break-after: avoid;
}

.chapter-subtitle {
  font-size: 0.96em;
  font-style: italic;
  margin: 0.2em 0 0 0;
  opacity: 0.85;
}

p {
  margin: 0 0 0.85em 0;
  orphans: 2;
  widows: 2;
}

ul, ol {
  margin: 0.4em 0 0.95em 1.35em;
  padding: 0;
}

li {
  margin: 0 0 0.38em 0;
}

blockquote, .callout, .box, .dossier, .worksheet {
  margin: 1em 0;
  padding: 0.75em 0.95em;
  border-left: 3px solid rgba(180, 120, 20, 0.75);
  border-top: 1px solid rgba(128, 128, 128, 0.25);
  border-right: 1px solid rgba(128, 128, 128, 0.25);
  border-bottom: 1px solid rgba(128, 128, 128, 0.25);
  page-break-inside: avoid;
  break-inside: avoid;
}

.write-line {
  border-bottom: 1px solid rgba(128, 128, 128, 0.45);
  height: 1.5em;
  margin: 0.4em 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.92em;
}

th, td {
  border: 1px solid rgba(128, 128, 128, 0.35);
  padding: 0.45em 0.55em;
  text-align: left;
  vertical-align: top;
}

th {
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 0.88em;
  font-weight: 700;
}

code, pre {
  font-family: "Courier New", Courier, monospace;
  font-size: 0.88em;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  padding: 0.65em 0.8em;
  border: 1px solid rgba(128, 128, 128, 0.3);
}

hr {
  border: 0;
  border-top: 1px solid rgba(128, 128, 128, 0.35);
  margin: 1.4em 0;
}

nav#toc ol {
  list-style-type: decimal;
  margin-left: 1.4em;
}

nav#toc li {
  margin-bottom: 0.48em;
}

a {
  text-decoration: underline;
}
`;
}

function buildContainerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" />
  </rootfiles>
</container>
`;
}

function buildCoverXhtml(title: string): string {
  const safeTitle = escapeHtml(title);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="pt-BR" lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle} - Capa</title>
  <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body class="cover-page" epub:type="cover">
  <div class="cover-wrap">
    <img src="cover.jpg" alt="Capa de ${safeTitle}" />
  </div>
</body>
</html>
`;
}

function buildChapterXhtml(chapter: BookChapterPayload, index: number): string {
  const safeId = sanitizeXmlId(chapter.id, formatChapterItemId(index));
  const safeTitle = escapeHtml(chapter.title);
  const safeSubtitle = chapter.subtitle ? escapeHtml(chapter.subtitle) : '';
  const bodyContent = sanitizeHtmlToXhtml(chapter.htmlKindle);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="pt-BR" lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle}</title>
  <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body>
  <section id="${safeId}" epub:type="chapter">
    <header class="chapter-header">
      <p class="chapter-kicker">Capítulo ${String(index + 1).padStart(2, '0')}</p>
      <h1>${safeTitle}</h1>
      ${safeSubtitle ? `<p class="chapter-subtitle">${safeSubtitle}</p>` : ''}
    </header>
    ${bodyContent}
  </section>
</body>
</html>
`;
}

function buildNavXhtml(payload: GeneratedBookPayload): string {
  const safeTitle = escapeHtml(payload.title);
  const firstChapterFile = payload.chapters.length > 0 ? formatChapterFilename(0) : 'nav.xhtml';
  const tocItems = payload.chapters
    .map((chapter, index) => {
      const href = formatChapterFilename(index);
      const label = escapeHtml(chapter.tocLabel || chapter.title);
      return `        <li><a href="${href}">${label}</a></li>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="pt-BR" lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Sumário - ${safeTitle}</title>
  <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Sumário</h1>
    <ol>
      <li><a href="cover.xhtml">Capa</a></li>
${tocItems}
    </ol>
  </nav>
  <nav epub:type="landmarks" id="landmarks" hidden="hidden">
    <h2>Pontos de Navegação</h2>
    <ol>
      <li><a epub:type="cover" href="cover.xhtml">Capa</a></li>
      <li><a epub:type="toc" href="nav.xhtml">Sumário</a></li>
      <li><a epub:type="bodymatter" href="${firstChapterFile}">Início da Leitura</a></li>
    </ol>
  </nav>
</body>
</html>
`;
}

function buildTocNcx(payload: GeneratedBookPayload, bookUuid: string): string {
  const safeTitle = escapeHtml(payload.title);
  const safeAuthor = escapeHtml(payload.author);

  const navPoints = [
    `    <navPoint id="navPoint-0" playOrder="1">
      <navLabel><text>Capa</text></navLabel>
      <content src="cover.xhtml" />
    </navPoint>`,
    ...payload.chapters.map((chapter, index) => {
      const playOrder = index + 2;
      const href = formatChapterFilename(index);
      const label = escapeHtml(chapter.tocLabel || chapter.title);
      return `    <navPoint id="navPoint-${index + 1}" playOrder="${playOrder}">
      <navLabel><text>${label}</text></navLabel>
      <content src="${href}" />
    </navPoint>`;
    }),
  ].join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="pt-BR">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${bookUuid}" />
    <meta name="dtb:depth" content="1" />
    <meta name="dtb:totalPageCount" content="0" />
    <meta name="dtb:maxPageNumber" content="0" />
  </head>
  <docTitle>
    <text>${safeTitle}</text>
  </docTitle>
  <docAuthor>
    <text>${safeAuthor}</text>
  </docAuthor>
  <navMap>
${navPoints}
  </navMap>
</ncx>
`;
}

function buildContentOpf(payload: GeneratedBookPayload, bookUuid: string): string {
  const safeTitle = escapeHtml(payload.title);
  const safeSubtitle = escapeHtml(payload.subtitle);
  const safeAuthor = escapeHtml(payload.author);
  const safePublisher = escapeHtml(payload.publisher);
  const modifiedIso = new Date().toISOString().replace(/\.\d{3}Z$/u, 'Z');

  const chapterManifestItems = payload.chapters
    .map((_, index) => {
      const id = formatChapterItemId(index);
      const href = formatChapterFilename(index);
      return `    <item id="${id}" href="${href}" media-type="application/xhtml+xml" />`;
    })
    .join('\n');

  const chapterSpineRefs = payload.chapters
    .map((_, index) => `    <itemref idref="${formatChapterItemId(index)}" />`)
    .join('\n');

  const firstChapterHref = payload.chapters.length > 0 ? formatChapterFilename(0) : 'nav.xhtml';

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="pt-BR">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="book-id">urn:uuid:${bookUuid}</dc:identifier>
    <dc:title>${safeTitle}</dc:title>
    <dc:language>pt-BR</dc:language>
    <dc:creator id="creator">${safeAuthor}</dc:creator>
    <dc:publisher>${safePublisher}</dc:publisher>
    <dc:description>${safeSubtitle}</dc:description>
    <meta property="dcterms:modified">${modifiedIso}</meta>
    <meta name="cover" content="cover-image" />
  </metadata>
  <manifest>
    <item id="cover-image" href="cover.jpg" media-type="image/jpeg" properties="cover-image" />
    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml" />
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />
    <item id="styles" href="styles.css" media-type="text/css" />
${chapterManifestItems}
  </manifest>
  <spine toc="ncx">
    <itemref idref="cover" />
${chapterSpineRefs}
  </spine>
  <guide>
    <reference type="cover" title="Capa" href="cover.xhtml" />
    <reference type="toc" title="Sumário" href="nav.xhtml" />
    <reference type="text" title="Início" href="${firstChapterHref}" />
  </guide>
</package>
`;
}

function buildStandalonePreviewHtml(payload: GeneratedBookPayload): string {
  const safeTitle = escapeHtml(payload.title);
  const safeSubtitle = escapeHtml(payload.subtitle);
  const safeAuthor = escapeHtml(payload.author);
  const safePublisher = escapeHtml(payload.publisher);
  const safeSiteUrl = escapeHtml(payload.siteUrl);

  const tocLinks = payload.chapters
    .map((chapter, index) => {
      const sectionId = sanitizeXmlId(chapter.id, formatChapterItemId(index));
      const label = escapeHtml(chapter.tocLabel || chapter.title);
      return `          <li><a href="#${sectionId}">${label}</a></li>`;
    })
    .join('\n');

  const chaptersHtml = payload.chapters
    .map((chapter, index) => {
      const sectionId = sanitizeXmlId(chapter.id, formatChapterItemId(index));
      const title = escapeHtml(chapter.title);
      const subtitle = chapter.subtitle ? escapeHtml(chapter.subtitle) : '';
      return `      <article id="${sectionId}" class="preview-chapter">
        <header class="chapter-header">
          <p class="chapter-kicker">Capítulo ${String(index + 1).padStart(2, '0')}</p>
          <h2>${title}</h2>
          ${subtitle ? `<p class="chapter-subtitle">${subtitle}</p>` : ''}
        </header>
        ${chapter.htmlKindle}
      </article>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style>
    :root {
      color-scheme: light dark;
    }
    body {
      margin: 0;
      padding: 2rem 1.25rem 4rem;
      font-family: Georgia, "Times New Roman", serif;
      line-height: 1.65;
      max-width: 760px;
      margin-left: auto;
      margin-right: auto;
    }
    .book-hero {
      padding: 1.5rem 0 1.75rem;
      border-bottom: 2px solid rgba(128, 128, 128, 0.35);
      margin-bottom: 2rem;
    }
    .book-publisher {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      opacity: 0.75;
      margin: 0 0 0.6rem 0;
    }
    .book-hero h1 {
      font-size: 2rem;
      line-height: 1.2;
      margin: 0 0 0.6rem 0;
    }
    .book-subtitle {
      font-size: 1.08rem;
      opacity: 0.85;
      margin: 0 0 1rem 0;
    }
    .book-meta {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.88rem;
      opacity: 0.75;
      margin: 0;
    }
    .toc-panel {
      margin: 0 0 2.5rem 0;
      padding: 1.25rem 1.5rem;
      border: 1px solid rgba(128, 128, 128, 0.32);
      border-radius: 6px;
    }
    .toc-panel h2 {
      margin-top: 0;
      font-size: 1.2rem;
    }
    .toc-panel ol {
      margin: 0;
      padding-left: 1.4rem;
    }
    .toc-panel li {
      margin: 0.38rem 0;
    }
    .preview-chapter {
      padding-top: 1.5rem;
      margin-top: 2.5rem;
      border-top: 1px solid rgba(128, 128, 128, 0.3);
    }
    .chapter-header {
      margin-bottom: 1.25rem;
    }
    .chapter-kicker {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      opacity: 0.75;
      margin: 0 0 0.3rem 0;
    }
    .chapter-subtitle {
      font-style: italic;
      opacity: 0.85;
      margin: 0.25rem 0 0 0;
    }
    blockquote, .callout, .box, .dossier, .worksheet {
      margin: 1rem 0;
      padding: 0.85rem 1rem;
      border-left: 3px solid rgba(180, 120, 20, 0.75);
      border-top: 1px solid rgba(128, 128, 128, 0.25);
      border-right: 1px solid rgba(128, 128, 128, 0.25);
      border-bottom: 1px solid rgba(128, 128, 128, 0.25);
    }
    .write-line {
      border-bottom: 1px solid rgba(128, 128, 128, 0.45);
      height: 1.5rem;
      margin: 0.45rem 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 0.94rem;
    }
    th, td {
      border: 1px solid rgba(128, 128, 128, 0.35);
      padding: 0.5rem 0.6rem;
      text-align: left;
      vertical-align: top;
    }
  </style>
</head>
<body>
  <header class="book-hero">
    <p class="book-publisher">${safePublisher}</p>
    <h1>${safeTitle}</h1>
    <p class="book-subtitle">${safeSubtitle}</p>
    <p class="book-meta">${safeAuthor} · ${safeSiteUrl}</p>
  </header>
  <nav class="toc-panel" aria-label="Sumário">
    <h2>Sumário</h2>
    <ol>
${tocLinks}
    </ol>
  </nav>
  <main>
${chaptersHtml}
  </main>
</body>
</html>
`;
}

/**
 * Generates a standalone reflowable HTML preview and a valid EPUB 3.0 archive
 * compatible with Amazon KDP eBook and Kindle Previewer.
 */
export async function buildKindleEpub(
  payload: GeneratedBookPayload,
  coverJpg: Buffer,
  epubOutputPath: string,
  htmlOutputPath: string,
): Promise<{ epubBytes: number; htmlBytes: number; chapterCount: number }> {
  await Promise.all([
    fs.mkdir(path.dirname(epubOutputPath), { recursive: true }),
    fs.mkdir(path.dirname(htmlOutputPath), { recursive: true }),
  ]);

  const standaloneHtml = buildStandalonePreviewHtml(payload);
  await fs.writeFile(htmlOutputPath, standaloneHtml, 'utf8');
  const htmlBytes = Buffer.byteLength(standaloneHtml, 'utf8');

  const bookUuid = crypto.randomUUID();
  const entries: ZipInputEntry[] = [
    {
      name: 'mimetype',
      data: Buffer.from('application/epub+zip', 'ascii'),
      store: true,
    },
    {
      name: 'META-INF/container.xml',
      data: Buffer.from(buildContainerXml(), 'utf8'),
    },
    {
      name: 'OEBPS/styles.css',
      data: Buffer.from(buildReflowableEpubCss(), 'utf8'),
    },
    {
      name: 'OEBPS/cover.jpg',
      data: coverJpg,
    },
    {
      name: 'OEBPS/cover.xhtml',
      data: Buffer.from(buildCoverXhtml(payload.title), 'utf8'),
    },
    {
      name: 'OEBPS/nav.xhtml',
      data: Buffer.from(buildNavXhtml(payload), 'utf8'),
    },
    {
      name: 'OEBPS/toc.ncx',
      data: Buffer.from(buildTocNcx(payload, bookUuid), 'utf8'),
    },
    {
      name: 'OEBPS/content.opf',
      data: Buffer.from(buildContentOpf(payload, bookUuid), 'utf8'),
    },
  ];

  payload.chapters.forEach((chapter, index) => {
    entries.push({
      name: `OEBPS/${formatChapterFilename(index)}`,
      data: Buffer.from(buildChapterXhtml(chapter, index), 'utf8'),
    });
  });

  const epubBuffer = buildZipArchive(entries);
  await fs.writeFile(epubOutputPath, epubBuffer);

  return {
    epubBytes: epubBuffer.length,
    htmlBytes,
    chapterCount: payload.chapters.length,
  };
}

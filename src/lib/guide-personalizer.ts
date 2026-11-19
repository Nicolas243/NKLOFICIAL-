import ExcelJS from 'exceljs';
import { degrees, grayscale, PDFDocument, StandardFonts } from 'pdf-lib';
import { buildPersonalizationLabel } from './guide-personalization';

const PDF_CONTENT_TYPE = 'application/pdf';
const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const HTML_CONTENT_TYPE = 'text/html; charset=utf-8';

export type PersonalizedGuideIdentity = {
  fullName: string;
  cpf: string;
  email: string;
  shortId: string;
};

type GuideAssetForPersonalization = {
  filename: string;
  contentType: string;
};

export type PersonalizedGuideFile = {
  filename: string;
  contentType: string;
  content: Buffer<ArrayBufferLike>;
};

function personalizedFilename(filename: string): string {
  const extensionIndex = filename.lastIndexOf('.');
  if (extensionIndex < 1) return `${filename}-personalizado`;
  return `${filename.slice(0, extensionIndex)}-personalizado${filename.slice(extensionIndex)}`;
}

function asBuffer(bytes: Uint8Array): Buffer {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

async function personalizePdf(
  source: Buffer<ArrayBufferLike>,
  filename: string,
  label: string,
): Promise<PersonalizedGuideFile> {
  const document = await PDFDocument.load(source);
  const font = await document.embedFont(StandardFonts.Helvetica);

  for (const page of document.getPages()) {
    const { width, height } = page.getSize();
    for (let x = -width; x < width * 1.5; x += 150) {
      for (let y = -height; y < height * 1.5; y += 100) {
        page.drawText(label, {
          x,
          y,
          size: 10,
          font,
          color: grayscale(0.55),
          opacity: 0.18,
          rotate: degrees(35),
        });
      }
    }
  }

  return {
    filename: personalizedFilename(filename),
    contentType: PDF_CONTENT_TYPE,
    content: asBuffer(await document.save()),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#039;');
}

function personalizeHtml(
  source: Buffer<ArrayBufferLike>,
  filename: string,
  label: string,
): PersonalizedGuideFile {
  const watermark = escapeHtml(`Material licenciado para ${label}`);
  const sourceHtml = source.toString('utf8');
  const watermarkStyle = `
    <style id="nkl-personalization-watermark">
      .nkl-personalization-watermark {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: grid;
        place-items: center;
        pointer-events: none;
        color: rgba(37, 77, 133, 0.16);
        font: 700 12px/1.4 Arial, sans-serif;
        letter-spacing: 0.04em;
        text-align: center;
        transform: rotate(-32deg);
        white-space: pre-wrap;
      }
    </style>
  `;
  const watermarkMarkup = `<div class="nkl-personalization-watermark" aria-hidden="true">${watermark}</div>`;
  const output = sourceHtml.includes('</head>')
    ? sourceHtml.replace('</head>', `${watermarkStyle}</head>`)
    : `${watermarkStyle}${sourceHtml}`;
  const withMarkup = output.includes('</body>')
    ? output.replace('</body>', `${watermarkMarkup}</body>`)
    : `${output}${watermarkMarkup}`;

  return {
    filename: personalizedFilename(filename),
    contentType: HTML_CONTENT_TYPE,
    content: Buffer.from(withMarkup, 'utf8'),
  };
}

async function personalizeXlsx(
  source: Buffer<ArrayBufferLike>,
  filename: string,
  label: string,
): Promise<PersonalizedGuideFile> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(source as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  for (const worksheet of workbook.worksheets) {
    const markerRow = worksheet.rowCount + 2;
    worksheet.getCell(`A${markerRow}`).value = `Material personalizado: ${label}`;
    worksheet.getCell(`A${markerRow}`).font = {
      bold: true,
      color: { argb: 'FF6B4E16' },
    };
    worksheet.headerFooter = {
      ...(worksheet.headerFooter ?? {}),
      oddHeader: `&C${label}`,
      oddFooter: `&C${label}`,
    };
  }

  const output = await workbook.xlsx.writeBuffer();
  return {
    filename: personalizedFilename(filename),
    contentType: XLSX_CONTENT_TYPE,
    content: Buffer.from(output),
  };
}

export async function personalizeGuideAsset(
  asset: GuideAssetForPersonalization,
  source: Buffer<ArrayBufferLike>,
  identity: PersonalizedGuideIdentity,
): Promise<PersonalizedGuideFile> {
  const label = buildPersonalizationLabel(identity);
  if (asset.contentType === PDF_CONTENT_TYPE) {
    return personalizePdf(source, asset.filename, label);
  }
  if (asset.contentType === XLSX_CONTENT_TYPE) {
    return personalizeXlsx(source, asset.filename, label);
  }
  if (asset.contentType === HTML_CONTENT_TYPE || asset.contentType === 'text/html') {
    return personalizeHtml(source, asset.filename, label);
  }
  throw new Error('Tipo de material não suportado para personalização.');
}

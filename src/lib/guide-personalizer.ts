import ExcelJS from 'exceljs';
import { degrees, grayscale, PDFDocument, StandardFonts } from 'pdf-lib';
import { buildPersonalizationLabel } from './guide-personalization';

const PDF_CONTENT_TYPE = 'application/pdf';
const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

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
  throw new Error('Tipo de material não suportado para personalização.');
}

import assert from 'node:assert/strict';
import test from 'node:test';
import { PDFDocument } from 'pdf-lib';
import ExcelJS from 'exceljs';
import {
  personalizeGuideAsset,
  type PersonalizedGuideIdentity,
} from '../guide-personalizer';

const identity: PersonalizedGuideIdentity = {
  fullName: 'Nicolas da Costa Santos',
  cpf: '52998224725',
  email: 'nicolas@example.com',
  shortId: 'ab12cd34',
};

test('adds identity watermark to every PDF page without mutating the source', async () => {
  const sourceDocument = await PDFDocument.create();
  sourceDocument.addPage([300, 400]);
  sourceDocument.addPage([400, 300]);
  const source = Buffer.from(await sourceDocument.save());

  const personalized = await personalizeGuideAsset(
    { filename: 'guide.pdf', contentType: 'application/pdf' },
    source,
    identity,
  );
  const outputDocument = await PDFDocument.load(personalized.content);

  assert.equal(outputDocument.getPageCount(), 2);
  assert.equal(personalized.filename, 'guide-personalizado.pdf');
  assert.deepEqual(source, Buffer.from(await sourceDocument.save()));
  assert.notDeepEqual(personalized.content, source);
});

test('adds identity markers to every XLSX worksheet and preserves formulas', async () => {
  const workbook = new ExcelJS.Workbook();
  const firstSheet = workbook.addWorksheet('Resumo');
  firstSheet.getCell('A1').value = 'Receita';
  firstSheet.getCell('B1').value = 10;
  firstSheet.getCell('C1').value = { formula: 'B1*2' };
  workbook.addWorksheet('Detalhes').getCell('A1').value = 'Dados';
  const source = Buffer.from(await workbook.xlsx.writeBuffer());

  const personalized = await personalizeGuideAsset(
    {
      filename: 'financeiro.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    source,
    identity,
  );
  const outputWorkbook = new ExcelJS.Workbook();
  await outputWorkbook.xlsx.load(personalized.content as unknown as Parameters<typeof outputWorkbook.xlsx.load>[0]);

  assert.equal(personalized.filename, 'financeiro-personalizado.xlsx');
  assert.equal(outputWorkbook.worksheets.length, 2);
  assert.deepEqual(outputWorkbook.getWorksheet('Resumo')?.getCell('C1').value, { formula: 'B1*2' });
  for (const worksheet of outputWorkbook.worksheets) {
    const values: string[] = [];
    worksheet.eachRow((row) => row.eachCell((cell) => {
      if (typeof cell.value === 'string') values.push(cell.value);
    }));
    assert.ok(values.some((value) => value.includes('Nicolas da Costa Santos')));
    assert.match(worksheet.headerFooter.oddFooter ?? '', /NKL-ab12cd34/);
  }
});

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const GUIDE_ASSET_BUCKET = 'guide-assets-private';
export const GUIDE_SIGNED_URL_TTL_SECONDS = 60;
export const GUIDE_DOWNLOAD_ATTEMPTS_PER_ASSET = 2;

export const GUIDE_ASSET_IDS = [
  'ingles-para-ganhar-dinheiro',
  'italiano-para-ganhar-possibilidades',
  'frances-para-ganhar-possibilidades',
  'alemao-para-ganhar-possibilidades',
  'espanhol-para-ganhar-possibilidades',
  'mandarim-para-ganhar-possibilidades',
  'guia-essencial-renda-extra-2027',
  'escudo-black-friday',
  'dinheiro-para-ontem',
  'raiox-financeiro-mobile',
  'raiox-financeiro-computador',
] as const;

export type GuideAssetId = (typeof GUIDE_ASSET_IDS)[number];

export type GuideAsset = {
  id: GuideAssetId;
  filename: string;
  storagePath: string;
  label: string;
  contentType: string;
};

export const GUIDE_ASSETS: readonly GuideAsset[] = [
  {
    id: 'ingles-para-ganhar-dinheiro',
    filename: 'ingles-para-ganhar-dinheiro.pdf',
    storagePath: 'guides/ingles-para-ganhar-dinheiro/ingles-para-ganhar-dinheiro.pdf',
    label: 'E-book Inglês para ganhar dinheiro',
    contentType: 'application/pdf',
  },
  ...([
    ['italiano-para-ganhar-possibilidades', 'italiano-para-ganhar-possibilidades.pdf', 'italiano', 'E-book Italiano para ganhar possibilidades'],
    ['frances-para-ganhar-possibilidades', 'frances-para-ganhar-possibilidades.pdf', 'frances', 'E-book Francês para ganhar possibilidades'],
    ['alemao-para-ganhar-possibilidades', 'alemao-para-ganhar-possibilidades.pdf', 'alemao', 'E-book Alemão para ganhar possibilidades'],
    ['espanhol-para-ganhar-possibilidades', 'espanhol-para-ganhar-possibilidades.pdf', 'espanhol', 'E-book Espanhol para ganhar possibilidades'],
    ['mandarim-para-ganhar-possibilidades', 'chines-para-ganhar-possibilidades.pdf', 'chines', 'E-book Mandarim para ganhar possibilidades'],
  ] as const).map(([id, filename, slug, label]) => ({
    id,
    filename,
    storagePath: `guides/${slug}-para-ganhar-possibilidades/${filename}`,
    label,
    contentType: 'application/pdf',
  })),
  {
    id: 'guia-essencial-renda-extra-2027',
    filename: 'Guia Essencial Renda Extra 2027 _ Portal NKL.pdf',
    storagePath: 'guides/guia-essencial-renda-extra-2027/Guia Essencial Renda Extra 2027 _ Portal NKL.pdf',
    label: 'Guia Essencial Renda Extra 2027',
    contentType: 'application/pdf',
  },
  {
    id: 'escudo-black-friday',
    filename: 'Escudo de Black Friday.pdf',
    storagePath: 'guides/escudo-black-friday/Escudo de Black Friday.pdf',
    label: 'Escudo de Black Friday',
    contentType: 'application/pdf',
  },
  {
    id: 'dinheiro-para-ontem',
    filename: 'Dinheiro Para Ontem.pdf',
    storagePath: 'guides/dinheiro-para-ontem/Dinheiro Para Ontem.pdf',
    label: 'Dinheiro Para Ontem',
    contentType: 'application/pdf',
  },
  {
    id: 'raiox-financeiro-mobile',
    filename: 'RaioX_Financeiro_Mobile.xlsx',
    storagePath: 'guides/raiox-financeiro-mobile/RaioX_Financeiro_Mobile.xlsx',
    label: 'Raio-X Financeiro Mobile',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  {
    id: 'raiox-financeiro-computador',
    filename: 'RaioX_Financeiro_5_Minutos_computador.xlsx',
    storagePath: 'guides/raiox-financeiro-computador/RaioX_Financeiro_5_Minutos_computador.xlsx',
    label: 'Raio-X Financeiro Computador',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
];

export function getGuideAssetsForOffer(offerVariant: string | null | undefined): readonly GuideAsset[] {
  if (offerVariant === 'english-ebook-sales-page') {
    return GUIDE_ASSETS.filter((asset) => asset.id === 'ingles-para-ganhar-dinheiro');
  }
  const languageAsset = offerVariant?.replace(/-ebook-sales-page$/u, '');
  if (languageAsset && ['italian', 'french', 'german', 'spanish', 'mandarin'].includes(languageAsset)) {
    const assetPrefix = languageAsset === 'italian' ? 'italiano' : languageAsset === 'french' ? 'frances' : languageAsset === 'german' ? 'alemao' : languageAsset === 'spanish' ? 'espanhol' : 'mandarim';
    return GUIDE_ASSETS.filter((asset) => asset.id === `${assetPrefix}-para-ganhar-possibilidades`);
  }
  return GUIDE_ASSETS.filter((asset) => !asset.id.endsWith('-para-ganhar-possibilidades') && asset.id !== 'ingles-para-ganhar-dinheiro');
}

export const GUIDE_MAX_DOWNLOADS = GUIDE_ASSETS.length * GUIDE_DOWNLOAD_ATTEMPTS_PER_ASSET;

export function getGuideAsset(assetId: GuideAssetId): GuideAsset {
  const asset = GUIDE_ASSETS.find((candidate) => candidate.id === assetId);
  if (!asset) {
    throw new Error('Ativo do guia não encontrado.');
  }
  return asset;
}

export type FreeMaterialArea = 'music' | 'income';

export const FREE_MATERIALS: Record<FreeMaterialArea, {
  filename: string;
  versionedRelativePath: readonly string[];
  title: string;
  subtitle: string;
  sections: readonly { heading: string; lines: readonly string[] }[];
}> = {
  income: {
    filename: 'guia-renda-extra-nkl.pdf',
    versionedRelativePath: ['public', 'guias', 'guia-renda-extra-nkl.pdf'],
    title: 'Guia Inicial de Renda Extra (Portal NKL)',
    subtitle: 'Roteiro gratuito de triagem, organizacao e primeiros passos com seguranca.',
    sections: [
      {
        heading: '1. Como avaliar oportunidades sem cair em ciladas',
        lines: [
          '- Desconfie de qualquer promessa de ganho fixo, dinheiro rapido ou deposito antecipado.',
          '- Priorize plataformas e programas com regras claras de pagamento, suporte e reputacao verificavel.',
          '- Nunca compartilhe senhas, codigos de verificacao ou documentos fora de canais oficiais.',
        ],
      },
      {
        heading: '2. Organizacao pratica da primeira semana',
        lines: [
          '- Defina quantas horas reais por semana voce pode dedicar sem comprometer sua rotina principal.',
          '- Escolha apenas uma frente inicial (microtarefas, servicos digitais, afiliados ou ensino) para testar.',
          '- Registre tempo investido, requisitos tecnicos e retorno real ao final de 14 dias.',
        ],
      },
      {
        heading: '3. Proximos passos no Portal NKL',
        lines: [
          '- Consulte o catalogo de programas analisados em nkloficial.com.br/programas.',
          '- Use o Quiz de Negocios em nkloficial.com.br/quiz-negocios para filtrar modelos compativeis.',
        ],
      },
    ],
  },
  music: {
    filename: 'Guia_Rapido_de_Cordas_e_Cuidados_Portal_NKL.pdf',
    versionedRelativePath: ['public', 'guias', 'guia-rapido-cordas-cuidados-nkl.pdf'],
    title: 'Guia Rapido de Cordas e Cuidados com o Instrumento (Portal NKL)',
    subtitle: 'Referencia pratica de escolha de encordoamento, conservacao diaria e revisao preventiva.',
    sections: [
      {
        heading: '1. Escolha do nucleo e tensao das cordas',
        lines: [
          '- Nucleo sintetico: timbre equilibrado, resposta aquecida e estabilizacao rapida para estudo e palco.',
          '- Nucleo de aco: resposta imediata e alta projecao, comum em estudo inicial ou estilos especificos.',
          '- Tensao media e o ponto de partida mais seguro; evite tensao alta sem avaliacao de um luthier.',
        ],
      },
      {
        heading: '2. Rotina diaria de limpeza e conservacao',
        lines: [
          '- Apos tocar, remova o po de breu das cordas, espelho e tampo usando flanela macia e seca.',
          '- Nunca utilize alcool ou solventes no verniz do instrumento.',
          '- Guarde o instrumento no estojo fechado, longe de sol direto, ar-condicionado forte ou umidade extrema.',
        ],
      },
      {
        heading: '3. Sinais de troca e manutencao com luthier',
        lines: [
          '- Troque as cordas ao notar perda de foco sonoro, dificuldade de afinacao (quinta falsa) ou desgaste no revestimento.',
          '- Substitua uma corda por vez para manter a pressao sobre o cavalete e a alma.',
          '- Verifique periodicamente a inclinacao do cavalete, pestana e cravelhas no diretorio de luthiers do Portal NKL.',
        ],
      },
    ],
  },
};

export async function generateFreeMaterialPdf(area: FreeMaterialArea): Promise<Buffer> {
  const spec = FREE_MATERIALS[area];
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const margin = 48;
  let y = 785;

  page.drawText('PORTAL NKL - MATERIAL GRATUITO', {
    x: margin,
    y,
    size: 10,
    font: bold,
    color: rgb(0.84, 0.42, 0.2),
  });
  y -= 26;

  page.drawText(spec.title, {
    x: margin,
    y,
    size: 16,
    font: bold,
    color: rgb(0.08, 0.16, 0.28),
  });
  y -= 20;

  page.drawText(spec.subtitle, {
    x: margin,
    y,
    size: 11,
    font: regular,
    color: rgb(0.28, 0.34, 0.42),
  });
  y -= 32;

  for (const section of spec.sections) {
    page.drawText(section.heading, {
      x: margin,
      y,
      size: 13,
      font: bold,
      color: rgb(0.08, 0.16, 0.28),
    });
    y -= 20;
    for (const line of section.lines) {
      page.drawText(line, {
        x: margin + 6,
        y,
        size: 10.5,
        font: regular,
        color: rgb(0.15, 0.2, 0.28),
      });
      y -= 18;
    }
    y -= 14;
  }

  page.drawText('Portal NKL - Conteudo informativo e educacional gratuito.', {
    x: margin,
    y: 48,
    size: 9,
    font: regular,
    color: rgb(0.45, 0.5, 0.58),
  });

  return Buffer.from(await pdf.save());
}

export async function loadFreeMaterial(
  area: FreeMaterialArea,
  baseDir: string = process.cwd(),
): Promise<{ filename: string; content: Buffer }> {
  const spec = FREE_MATERIALS[area];
  const candidatePath = path.join(baseDir, ...spec.versionedRelativePath);
  try {
    const content = await readFile(candidatePath);
    if (content.byteLength > 0) {
      return { filename: spec.filename, content };
    }
  } catch {
    // Fall back to in-memory PDF generation when versioned file is absent.
  }
  return {
    filename: spec.filename,
    content: await generateFreeMaterialPdf(area),
  };
}

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
    ['mandarim-para-ganhar-possibilidades', 'mandarim-para-ganhar-possibilidades.pdf', 'chines', 'E-book Mandarim para ganhar possibilidades'],
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

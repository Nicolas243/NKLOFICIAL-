export const GUIDE_ASSET_BUCKET = 'guide-assets-private';
export const GUIDE_SIGNED_URL_TTL_SECONDS = 60;
export const GUIDE_DOWNLOAD_ATTEMPTS_PER_ASSET = 2;

export const GUIDE_ASSET_IDS = [
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

export const GUIDE_MAX_DOWNLOADS = GUIDE_ASSETS.length * GUIDE_DOWNLOAD_ATTEMPTS_PER_ASSET;

export function getGuideAsset(assetId: GuideAssetId): GuideAsset {
  const asset = GUIDE_ASSETS.find((candidate) => candidate.id === assetId);
  if (!asset) {
    throw new Error('Ativo do guia não encontrado.');
  }
  return asset;
}

import type { Metadata } from 'next';
import { getStringsCatalog } from '@/actions/strings';
import { absoluteSiteUrl } from '@/lib/site';
import { CompararClient, type StringComparisonItem } from './comparar-client';

export const metadata: Metadata = {
  title: 'Comparador de Cordas',
  description: 'Compare cordas de violino lado a lado por preço, núcleo, resposta, projeção, durabilidade e avaliações da comunidade.',
  alternates: {
    canonical: absoluteSiteUrl('/comparar'),
  },
};

export const dynamic = 'force-dynamic';

export default async function CompararPage() {
  const catalog = await getStringsCatalog({ page: 1, limit: 100 }).catch(() => ({
    data: [] as StringComparisonItem[],
  }));

  const initialItems: StringComparisonItem[] = catalog.data.map((row) => ({
    id: row.id,
    name: row.name,
    coreMaterial: row.coreMaterial,
    qualityLevel: row.qualityLevel,
    realPrice: row.realPrice,
    communityScore: row.communityScore,
    responseSpeed: row.responseSpeed,
    projection: row.projection,
    soundColor: row.soundColor,
    durability: row.durability,
    environment: row.environment,
    climateSensitivity: row.climateSensitivity,
    coating: row.coating,
    fixation: row.fixation,
    arcTolerance: row.arcTolerance,
    affiliateLinks: row.affiliateLinks,
  }));

  return <CompararClient initialItems={initialItems} />;
}

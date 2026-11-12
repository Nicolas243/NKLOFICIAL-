export const BEGINNER_EDITORIAL_TAG = 'Melhor para Começar';
export const BEGINNER_EDITORIAL_RATING = 9;

const BEGINNER_EDITORIAL_SLUGS = new Set([
  'pawns-app',
  'fluencify',
  'apphub',
  'aligner',
  'canal-dark-youtube-notebooklm',
  'quintoandar-indica-ai',
  'utest',
]);

const WITHDRAWAL_TAGS: Record<string, string> = {
  fluencify: '1º saque em 15 dias',
};

export function editorialProgramTags(slug: string, tags: string[]): string[] {
  const withUgc = slug === 'sideshift' && !tags.includes('UGC')
    ? [...tags, 'UGC']
    : tags;
  const withBeginnerTag = BEGINNER_EDITORIAL_SLUGS.has(slug)
    && !withUgc.includes(BEGINNER_EDITORIAL_TAG)
    ? [BEGINNER_EDITORIAL_TAG, ...withUgc]
    : withUgc;
  const withdrawalTag = WITHDRAWAL_TAGS[slug];
  return withdrawalTag && !withBeginnerTag.includes(withdrawalTag)
    ? [...withBeginnerTag, withdrawalTag]
    : withBeginnerTag;
}

export function editorialProgramRating(slug: string, rating: number): number {
  return BEGINNER_EDITORIAL_SLUGS.has(slug) ? BEGINNER_EDITORIAL_RATING : Math.min(9, Math.max(6, rating));
}

export function getReviewedWithdrawalTag(slug: string): string | null {
  return WITHDRAWAL_TAGS[slug] ?? null;
}

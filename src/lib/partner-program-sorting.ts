export type PartnerProgramRelevanceInput = {
  name: string;
  tags: readonly string[];
  finalRating: number;
};

const BEGINNER_EDITORIAL_TAG = 'Melhor para Começar';

export function hasBeginnerEditorialTag(tags: readonly string[]): boolean {
  return tags.includes(BEGINNER_EDITORIAL_TAG);
}

export function comparePartnerProgramRelevance(
  left: PartnerProgramRelevanceInput,
  right: PartnerProgramRelevanceInput,
): number {
  const leftIsBeginner = hasBeginnerEditorialTag(left.tags);
  const rightIsBeginner = hasBeginnerEditorialTag(right.tags);

  if (leftIsBeginner !== rightIsBeginner) {
    return leftIsBeginner ? -1 : 1;
  }

  const ratingDifference = right.finalRating - left.finalRating;
  return ratingDifference !== 0
    ? ratingDifference
    : left.name.localeCompare(right.name, 'pt-BR');
}

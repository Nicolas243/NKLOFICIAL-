export type BookProgramRow = {
  slug: string;
  name: string;
  category: string;
  difficulty: string;
  shortDescription: string;
  longDescription: string;
  tags: string[];
  websiteUrl: string;
  affiliateUrl: string | null;
  editorialRating: number;
  editorialSource: string;
  pros: string[];
  cons: string[];
  requirements: string[];
  paymentMethods: string[];
  earningPotential: string | null;
  zeroInvestmentRequired: boolean;
};

export type BookBusinessProfileRow = {
  id: string;
  name: string;
  minCapital: string;
  minTimeHours: number;
  techLevel: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
};

export type BookChapterPayload = {
  id: string;
  tocLabel: string;
  title: string;
  subtitle?: string;
  htmlKindle: string;
  htmlPrint: string;
};

export type GeneratedBookPayload = {
  title: string;
  subtitle: string;
  author: string;
  publisher: string;
  siteUrl: string;
  chapters: BookChapterPayload[];
};

/** Escapes HTML/XHTML entities cleanly for both EPUB and print PDF output. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Counts visible words in an HTML/XHTML fragment. */
export function countHtmlWords(html: string): number {
  const plain = html.replace(/<[^>]+>/gu, ' ').replace(/\s+/gu, ' ').trim();
  return plain ? plain.split(' ').length : 0;
}

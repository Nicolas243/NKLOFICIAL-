import { LanguageGuideSalesPage, getLanguageGuideMetadata } from '@/components/sales/language-guide-sales-page';
import type { Metadata } from 'next';
export const metadata: Metadata = getLanguageGuideMetadata('alemao');
export default function Page() { return <LanguageGuideSalesPage slug="alemao" comingSoon />; }

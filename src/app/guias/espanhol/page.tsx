import { LanguageGuideSalesPage, getLanguageGuideMetadata } from '@/components/sales/language-guide-sales-page';
import type { Metadata } from 'next';
export const metadata: Metadata = getLanguageGuideMetadata('espanhol');
export default function Page() { return <LanguageGuideSalesPage slug="espanhol" />; }

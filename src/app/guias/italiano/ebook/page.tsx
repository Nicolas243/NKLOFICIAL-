import type { Metadata } from 'next';
import { LanguageEbookPreview, getLanguageEbookPreviewMetadata } from '@/components/language-ebook-preview';

export const metadata: Metadata = getLanguageEbookPreviewMetadata('italiano');

export default function Page() { return <LanguageEbookPreview slug="italiano" />; }

import type { Metadata } from 'next';
import { LanguageEbookPreview, getLanguageEbookPreviewMetadata } from '@/components/language-ebook-preview';

export const metadata: Metadata = getLanguageEbookPreviewMetadata('alemao');

export default function Page() { return <LanguageEbookPreview slug="alemao" />; }

import type { Metadata } from 'next';
import { LanguageEbookPreview, getLanguageEbookPreviewMetadata } from '@/components/language-ebook-preview';

export const metadata: Metadata = getLanguageEbookPreviewMetadata('espanhol');

export default function Page() { return <LanguageEbookPreview slug="espanhol" />; }

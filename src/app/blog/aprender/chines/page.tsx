import type { Metadata } from 'next';
import { LanguageLearningPage } from '@/components/language-learning-page';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = { title: 'Comece mandarim do zero', description: 'Guia gratuito de mandarim com tons, pinyin, frases e plano de 90 dias.', alternates: { canonical: absoluteSiteUrl('/blog/aprender/chines') } };
export default function ChineseLearningPage() { return <LanguageLearningPage slug="chines" />; }

import type { Metadata } from 'next';
import { LanguageLearningPage } from '@/components/language-learning-page';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = { title: 'Aprenda espanhol do zero', description: 'Guia gratuito de espanhol com plano de 90 dias, pronúncia, gramática e prática.', alternates: { canonical: absoluteSiteUrl('/blog/aprender/espanhol') } };
export default function SpanishLearningPage() { return <LanguageLearningPage slug="espanhol" />; }

import type { Metadata } from 'next';
import { LanguageLearningPage } from '@/components/language-learning-page';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = { title: 'Aprenda italiano do zero | Portal NKL', description: 'Guia gratuito de italiano com plano de 90 dias, pronúncia, gramática e prática.', alternates: { canonical: absoluteSiteUrl('/blog/aprender/italiano') } };
export default function ItalianLearningPage() { return <LanguageLearningPage slug="italiano" />; }

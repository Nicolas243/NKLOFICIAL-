import type { Metadata } from 'next';
import { LanguageLearningPage } from '@/components/language-learning-page';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = { title: 'Aprenda alemão do zero | Portal NKL', description: 'Guia gratuito de alemão com plano de 90 dias, pronúncia, gramática e prática.', alternates: { canonical: absoluteSiteUrl('/blog/aprender/alemao') } };
export default function GermanLearningPage() { return <LanguageLearningPage slug="alemao" />; }

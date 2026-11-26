import type { Metadata } from 'next';
import { LanguageLearningPage } from '@/components/language-learning-page';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = { title: 'Aprenda francês do zero', description: 'Guia gratuito de francês com plano de 90 dias, pronúncia, gramática e prática.', alternates: { canonical: absoluteSiteUrl('/blog/aprender/frances') } };
export default function FrenchLearningPage() { return <LanguageLearningPage slug="frances" />; }

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAiLearningAccess } from '@/actions/ai-learning';
import { AiPromptCard } from '@/components/ai/ai-prompt-card';
import { getAiPromptCategories, AI_PROMPTS } from '@/lib/ai-prompts';

export const metadata = { title: 'Biblioteca de prompts | IA na Prática NKL' };

export default async function AiPromptsPage() {
  const access = await getAiLearningAccess();
  if (!access.hasAccess) redirect('/ia/oferta');

  const categories = getAiPromptCategories();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <Link href="/ia/curso" className="text-sm font-semibold text-neon hover:underline">← Voltar ao curso</Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-neon">Biblioteca prática</p>
          <h1 className="mt-2 font-playfair text-4xl font-bold md:text-5xl">Prompts para adaptar, não para copiar cegamente</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed opacity-75">Troque os campos entre chaves pelo seu contexto e use os critérios para revisar a resposta.</p>
        </div>
        <Link href="/ia/ferramentas" className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-neon">Ver ferramentas e checklists</Link>
      </div>
      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Categorias de prompts">
        {categories.map((category) => <a key={category} href={`#${category}`} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-neon hover:text-neon">{category}</a>)}
      </nav>
      <div className="mt-10 space-y-12">
        {categories.map((category) => (
          <section key={category} id={category} className="scroll-mt-8">
            <h2 className="font-playfair text-3xl font-bold capitalize">{category.replace('-', ' ')}</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {AI_PROMPTS.filter((prompt) => prompt.category === category).map((prompt) => <AiPromptCard key={prompt.id} prompt={prompt} />)}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

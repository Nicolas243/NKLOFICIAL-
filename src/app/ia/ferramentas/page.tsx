import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAiLearningAccess } from '@/actions/ai-learning';

export const metadata = { title: 'Ferramentas e checklists | IA na Prática NKL' };

const checklists = [
  {
    title: 'Antes de enviar um prompt',
    items: ['Defina o resultado esperado', 'Remova dados pessoais e segredos', 'Explique público, contexto e limites', 'Peça um formato que possa ser conferido'],
  },
  {
    title: 'Antes de acreditar na resposta',
    items: ['Classifique fato, hipótese e opinião', 'Confira data e fonte primária', 'Avalie o impacto de um erro', 'Peça revisão humana quando necessário'],
  },
  {
    title: 'Antes de publicar ou executar',
    items: ['Revise tom, acessibilidade e direitos', 'Teste um caso pequeno e reversível', 'Confira se a saída não inventou dados', 'Registre a decisão e o próximo passo'],
  },
];

export default async function AiToolsPage() {
  const access = await getAiLearningAccess();
  if (!access.hasAccess) redirect('/ia/oferta');

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/ia/curso" className="text-sm font-semibold text-neon hover:underline">← Voltar ao curso</Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-neon">Aplicação diária</p>
      <h1 className="mt-2 font-playfair text-4xl font-bold md:text-5xl">Ferramentas para manter o bom senso no fluxo</h1>
      <p className="mt-4 max-w-2xl leading-relaxed opacity-75">Use estas listas antes, durante e depois de trabalhar com uma ferramenta de IA. Elas não substituem seu julgamento; tornam o julgamento mais fácil de repetir.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {checklists.map((checklist) => (
          <article key={checklist.title} className="rounded-2xl border border-border bg-surface/70 p-5">
            <h2 className="text-xl font-bold">{checklist.title}</h2>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed opacity-80">
              {checklist.items.map((item) => <li key={item}>□ {item}</li>)}
            </ul>
          </article>
        ))}
      </div>
      <section className="mt-8 rounded-2xl border border-neon/30 bg-neon/5 p-6">
        <h2 className="font-playfair text-3xl font-bold">Uma regra para guardar</h2>
        <p className="mt-3 max-w-3xl leading-relaxed opacity-80">Quanto maior o impacto da decisão, menor deve ser a sua tolerância a respostas sem fonte, sem teste ou sem revisão humana.</p>
      </section>
      <Link href="/ia/prompts" className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-neon px-5 py-3 font-bold text-black">Abrir biblioteca de prompts</Link>
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { AI_ONE_TIME_PRICE_CENTS, AI_SUBSCRIPTION_PRICE_CENTS } from '@/lib/ai-product';
import { getAiCourseModules } from '@/lib/ai-course';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'IA na Prática NKL | Aprenda a usar IA de verdade',
  description: 'Um curso prático para qualquer pessoa aprender a usar inteligência artificial com clareza, segurança e resultado.',
  alternates: { canonical: absoluteSiteUrl('/ia/oferta') },
};

const hardQuestions = [
  {
    number: '01',
    question: 'Por que a IA dá uma resposta tão convincente — mesmo quando está errada?',
    answer: 'Você vai aprender a pedir evidências, separar fato de hipótese e revisar antes de confiar.',
  },
  {
    number: '02',
    question: 'O que eu posso colocar em uma IA sem expor minha vida, meu cliente ou minha empresa?',
    answer: 'Privacidade não é detalhe técnico. O curso mostra o que retirar, anonimizar e nunca compartilhar.',
  },
  {
    number: '03',
    question: 'Como fazer a IA entender exatamente o que eu quero, sem ficar tentando até cansar?',
    answer: 'Você aprende uma estrutura reutilizável para transformar pedidos vagos em instruções claras.',
  },
  {
    number: '04',
    question: 'Como usar IA sem deixar meu texto genérico, minha ideia igual à de todo mundo?',
    answer: 'A ferramenta acelera o rascunho. Você aprende a dar direção, critério e revisão para manter sua voz.',
  },
  {
    number: '05',
    question: 'Como saber se uma ferramenta realmente serve para mim — ou só está na moda?',
    answer: 'Você vai comparar ferramentas por objetivo, risco, custo e qualidade, não por promessa de anúncio.',
  },
  {
    number: '06',
    question: 'Como transformar uma resposta bonita em uma ação que melhora minha rotina?',
    answer: 'Cada módulo termina com um exercício concreto para levar a IA do chat para a vida real.',
  },
];

const audiences = [
  {
    title: 'Para quem cuida da casa e da família',
    text: 'Planeje refeições, organize tarefas, compare opções e aprenda mais rápido sem depender de respostas prontas.',
  },
  {
    title: 'Para jovens e estudantes',
    text: 'Estude com método, prepare trabalhos com responsabilidade e desenvolva uma habilidade que já aparece em toda profissão.',
  },
  {
    title: 'Para profissionais e empreendedores',
    text: 'Escreva melhor, pesquise, organize processos e teste ideias sem entregar decisões importantes para uma caixa-preta.',
  },
  {
    title: 'Para quem acha que “não leva jeito”',
    text: 'Você não precisa programar nem falar inglês. Começamos pelo seu objetivo e avançamos em pequenas práticas.',
  },
];

const includedItems = [
  '7 módulos curtos com exemplos em português',
  'Exercícios para aplicar no mesmo dia',
  'Biblioteca de prompts editáveis por objetivo',
  'Método para pesquisar e verificar respostas',
  'Orientações de privacidade, segurança e limites',
  'Acesso às ferramentas e melhorias editoriais previstas no plano',
];

export default function AiOfferPage() {
  const modules = getAiCourseModules();

  return (
    <main className="overflow-hidden">
      <section className="relative border-b border-border bg-[radial-gradient(circle_at_80%_10%,rgba(190,255,0,0.12),transparent_35%),linear-gradient(180deg,var(--color-income-surface),var(--color-background))]">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 md:pb-28 md:pt-20">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon">IA na Prática NKL · curso + biblioteca</p>
            <h1 className="mt-5 max-w-4xl font-playfair text-5xl font-bold leading-[0.96] md:text-7xl">
              A inteligência artificial já entrou na sua vida. Aprenda a entrar no controle.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed opacity-80 md:text-xl">
              Não é sobre virar especialista em tecnologia. É sobre saber perguntar, conferir, decidir e agir melhor — em casa, nos estudos, no trabalho e nos negócios.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/ia" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-neon px-6 py-3 font-bold text-black transition hover:scale-[1.02]">
                Fazer diagnóstico grátis
              </Link>
              <a href="#perguntas" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border px-6 py-3 font-bold transition hover:border-neon hover:text-neon">
                Ver as perguntas do curso
              </a>
            </div>
            <p className="mt-5 text-xs opacity-60">Sem pré-requisito técnico. Aulas em português. Você começa pelo que precisa resolver agora.</p>
          </div>
          <div className="mt-14 grid gap-3 sm:grid-cols-3">
            {['Mais clareza para pedir', 'Mais critério para conferir', 'Mais autonomia para fazer'].map((item) => (
              <div key={item} className="rounded-xl border border-neon/20 bg-background/40 p-4 text-sm font-bold">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section id="perguntas" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20 sm:px-6 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange">Antes de escolher uma ferramenta</p>
          <h2 className="mt-4 font-playfair text-4xl font-bold leading-tight md:text-6xl">Você sabe responder estas perguntas?</h2>
          <p className="mt-5 text-lg leading-relaxed opacity-75">
            A maioria das pessoas aprende a clicar. Poucas aprendem a pensar com a ferramenta. É essa diferença que separa uma resposta bonita de uma resposta realmente útil.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hardQuestions.map((item) => (
            <article key={item.number} className="flex flex-col rounded-2xl border border-border bg-surface/70 p-5 transition hover:-translate-y-1 hover:border-neon/60">
              <span className="text-sm font-bold text-neon">{item.number}</span>
              <h3 className="mt-4 text-lg font-bold leading-snug">{item.question}</h3>
              <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed opacity-70">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-income-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange">Não é um curso para um tipo só de pessoa</p>
              <h2 className="mt-4 font-playfair text-4xl font-bold leading-tight md:text-5xl">A tecnologia muda. A necessidade de aprender fica.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {audiences.map((audience) => (
                <article key={audience.title} className="rounded-2xl border border-border bg-background/50 p-5">
                  <h3 className="text-lg font-bold">{audience.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed opacity-70">{audience.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="metodo" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20 sm:px-6 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-neon">O método</p>
          <h2 className="mt-4 font-playfair text-4xl font-bold leading-tight md:text-6xl">Do “não sei nem por onde começar” ao “sei o próximo passo”.</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ['01', 'Entender', 'Você aprende o que a IA faz, onde ela falha e como escolher a ferramenta certa para cada tarefa.'],
            ['02', 'Orientar', 'Você aprende a dar contexto, limites, formato e critérios — sem depender de tentativa e erro.'],
            ['03', 'Verificar e agir', 'Você aprende a revisar, proteger seus dados e transformar a resposta em uma decisão ou ação concreta.'],
          ].map(([number, title, text]) => (
            <article key={number} className="rounded-2xl border border-border p-6">
              <span className="text-sm font-bold text-orange">{number}</span>
              <h3 className="mt-5 font-playfair text-3xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed opacity-70">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange">Por dentro do curso</p>
              <h2 className="mt-4 font-playfair text-4xl font-bold md:text-5xl">Uma trilha para usar, não apenas assistir.</h2>
            </div>
            <Link href="/ia" className="font-bold text-neon hover:underline">Fazer diagnóstico gratuito →</Link>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module, index) => (
              <article key={module.slug} className="rounded-2xl border border-border bg-background/60 p-5">
                <span className="text-sm font-bold text-neon">Módulo {String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-3 text-xl font-bold">{module.title}</h3>
                <p className="mt-2 text-sm leading-relaxed opacity-70">{module.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20 sm:px-6 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-neon">Escolha seu ritmo</p>
          <h2 className="mt-4 font-playfair text-4xl font-bold md:text-6xl">Uma habilidade que continua valendo depois do primeiro prompt.</h2>
          <p className="mt-5 leading-relaxed opacity-70">Comece com o acesso que faz sentido para você. Sem promessa de dinheiro fácil, sem prova social inventada e sem esconder o que ainda está em configuração.</p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-surface p-6 md:p-8">
            <p className="text-sm font-bold opacity-60">Compra avulsa</p>
            <p className="mt-3 font-playfair text-6xl font-bold">R$ {(AI_ONE_TIME_PRICE_CENTS / 100).toFixed(0)}</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed opacity-70">Para quem quer aprender a base completa e manter acesso ao conteúdo publicado.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {includedItems.slice(0, 4).map((item) => <li key={item} className="flex gap-3"><span className="text-neon">✓</span>{item}</li>)}
            </ul>
            <button type="button" disabled className="mt-8 min-h-12 w-full rounded-lg bg-neon px-5 py-3 font-bold text-black opacity-60">Checkout em configuração</button>
            <p className="mt-3 text-center text-xs opacity-50">O botão será ativado após a configuração segura do Stripe.</p>
          </article>
          <article className="relative rounded-3xl border-2 border-neon bg-income-surface p-6 shadow-[0_0_40px_rgba(190,255,0,0.08)] md:p-8">
            <span className="absolute right-6 top-6 rounded-full bg-neon px-3 py-1 text-xs font-bold text-black">Para continuar evoluindo</span>
            <p className="text-sm font-bold opacity-60">Assinatura mensal</p>
            <p className="mt-8 font-playfair text-6xl font-bold">R$ {(AI_SUBSCRIPTION_PRICE_CENTS / 100).toFixed(0)}<span className="text-xl">/mês</span></p>
            <p className="mt-3 max-w-md text-sm leading-relaxed opacity-70">Para quem quer acompanhar novas aulas, prompts e melhorias editoriais enquanto a assinatura estiver ativa.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {includedItems.map((item) => <li key={item} className="flex gap-3"><span className="text-neon">✓</span>{item}</li>)}
            </ul>
            <button type="button" disabled className="mt-8 min-h-12 w-full rounded-lg bg-neon px-5 py-3 font-bold text-black opacity-60">Checkout em configuração</button>
            <p className="mt-3 text-center text-xs opacity-50">Sem cobrança até o checkout estar configurado e validado.</p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 md:pb-28">
        <h2 className="font-playfair text-4xl font-bold md:text-5xl">Perguntas honestas antes de começar</h2>
        <div className="mt-8 divide-y divide-border rounded-2xl border border-border">
          <details className="p-5">
            <summary className="cursor-pointer font-bold">Preciso entender de tecnologia?</summary>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed opacity-70">Não. O curso parte de situações do cotidiano e apresenta os conceitos sem exigir programação ou inglês.</p>
          </details>
          <details className="border-t border-border p-5">
            <summary className="cursor-pointer font-bold">A IA vai fazer tudo por mim?</summary>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed opacity-70">Não — e desconfiar dessa promessa é uma das primeiras lições. Você aprende a usar velocidade sem abrir mão de julgamento.</p>
          </details>
          <details className="border-t border-border p-5">
            <summary className="cursor-pointer font-bold">O curso promete renda ou emprego?</summary>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed opacity-70">Não. Ele ensina uma habilidade prática e transferível. Resultados dependem do seu contexto, prática e decisões.</p>
          </details>
          <details className="border-t border-border p-5">
            <summary className="cursor-pointer font-bold">Posso conhecer o método antes?</summary>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed opacity-70">Sim. Faça o diagnóstico gratuito, veja seu primeiro caminho e conheça o conteúdo antes de decidir.</p>
          </details>
        </div>
        <div className="mt-10 rounded-3xl border border-neon/30 bg-neon/5 p-6 text-center md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-neon">Seu primeiro passo</p>
          <h2 className="mt-3 font-playfair text-4xl font-bold">Descubra o que você precisa aprender primeiro.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed opacity-70">Responda oito perguntas e receba uma trilha inicial gratuita, feita para o seu objetivo.</p>
          <Link href="/ia" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-lg bg-neon px-7 py-3 font-bold text-black transition hover:scale-[1.02]">Fazer meu diagnóstico grátis</Link>
        </div>
      </section>
    </main>
  );
}

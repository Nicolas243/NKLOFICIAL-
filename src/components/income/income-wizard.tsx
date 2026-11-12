'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { PartnerProgramCard } from '@/actions/partner-programs';
import { absoluteSiteUrl } from '@/lib/site';

type Props = {
  programs: PartnerProgramCard[];
};

type QuestionId = 'experience' | 'urgency' | 'device' | 'pc' | 'currency' | 'english' | 'video' | 'availability' | 'workType' | 'investment';

type Question = {
  id: QuestionId;
  title: string;
  description: string;
  options: Array<{ value: string; label: string }>;
};

const SAVED_PROGRAMS_KEY = 'nkl-income-wizard-saved';
const WHATSAPP_BASE_URL = 'https://wa.me/?text=';
const QUESTIONS: Question[] = [
  {
    id: 'experience',
    title: 'Como você se considera hoje?',
    description: 'Isso ajuda a equilibrar caminhos simples e oportunidades mais técnicas.',
    options: [
      { value: 'beginner', label: 'Estou começando agora' },
      { value: 'some', label: 'Já fiz algumas coisas' },
      { value: 'experienced', label: 'Tenho experiência' },
    ],
  },
  {
    id: 'urgency',
    title: 'Quando você quer começar?',
    description: 'Não existe promessa de ganho; a resposta só muda a ordem das sugestões.',
    options: [
      { value: 'now', label: 'Quero começar esta semana' },
      { value: 'soon', label: 'Nas próximas semanas' },
      { value: 'explore', label: 'Estou explorando opções' },
    ],
  },
  {
    id: 'device',
    title: 'Você prefere usar qual dispositivo?',
    description: 'Algumas tarefas funcionam melhor em telas maiores.',
    options: [
      { value: 'phone', label: 'Celular' },
      { value: 'computer', label: 'Computador' },
      { value: 'both', label: 'Os dois' },
    ],
  },
  {
    id: 'pc',
    title: 'Você possui computador?',
    description: 'Algumas plataformas exigem uma tela maior ou tarefas que não funcionam bem apenas no celular.',
    options: [
      { value: 'yes', label: 'Sim, tenho acesso' },
      { value: 'shared', label: 'Uso um computador compartilhado' },
      { value: 'no', label: 'Não, só uso celular' },
    ],
  },
  {
    id: 'currency',
    title: 'Você quer receber em qual moeda?',
    description: 'A disponibilidade e as condições dependem da plataforma e da sua região.',
    options: [
      { value: 'brl', label: 'Reais' },
      { value: 'usd', label: 'Dólar' },
      { value: 'either', label: 'Tanto faz' },
    ],
  },
  {
    id: 'english',
    title: 'Você aceita tarefas em inglês?',
    description: 'Você pode começar sem inglês e desenvolver essa habilidade com o tempo.',
    options: [
      { value: 'yes', label: 'Sim' },
      { value: 'some', label: 'Consigo ler um pouco' },
      { value: 'no', label: 'Prefiro português' },
    ],
  },
  {
    id: 'video',
    title: 'Você gosta de aparecer em vídeo?',
    description: 'Há opções de conteúdo sem exposição e outras que dependem de câmera.',
    options: [
      { value: 'yes', label: 'Sim, gosto' },
      { value: 'maybe', label: 'Posso experimentar' },
      { value: 'no', label: 'Prefiro não aparecer' },
    ],
  },
  {
    id: 'availability',
    title: 'Quanto tempo você tem por semana?',
    description: 'Use uma estimativa realista para evitar escolher algo difícil de manter.',
    options: [
      { value: 'short', label: 'Até 3 horas' },
      { value: 'regular', label: 'De 3 a 10 horas' },
      { value: 'flexible', label: 'Mais de 10 horas' },
    ],
  },
  {
    id: 'workType',
    title: 'Que tipo de trabalho combina mais com você?',
    description: 'Você poderá comparar outras categorias depois do resultado.',
    options: [
      { value: 'tasks', label: 'Tarefas e pesquisas' },
      { value: 'services', label: 'Vender serviços' },
      { value: 'content', label: 'Criar conteúdo' },
    ],
  },
  {
    id: 'investment',
    title: 'Você quer começar sem investimento?',
    description: 'Nunca pague para liberar uma promessa; sempre confira as condições oficiais.',
    options: [
      { value: 'only-free', label: 'Sim, apenas sem investimento' },
      { value: 'maybe', label: 'Posso avaliar depois' },
    ],
  },
];

function scoreProgram(program: PartnerProgramCard, answers: Partial<Record<QuestionId, string>>): number {
  const searchText = [...program.tags, ...program.requirements, program.category, program.shortDescription].join(' ').toLocaleLowerCase('pt-BR');
  const earning = program.averageEarning.toLocaleLowerCase('pt-BR');
  let score = program.finalRating;

  if (answers.experience === 'beginner' && program.difficulty === 'fácil') score += 4;
  if (answers.experience === 'experienced' && program.difficulty === 'difícil') score += 2;
  if (answers.urgency === 'now' && program.difficulty !== 'difícil') score += 2;
  if (answers.device === 'phone' && (searchText.includes('celular') || searchText.includes('app'))) score += 3;
  if (answers.device === 'computer' && (searchText.includes('computador') || searchText.includes('software') || searchText.includes('serviço'))) score += 2;
  if (answers.pc === 'yes' && (searchText.includes('software') || searchText.includes('serviço'))) score += 2;
  if (answers.pc === 'no' && (searchText.includes('celular') || searchText.includes('app'))) score += 3;
  if (answers.currency === 'usd' && earning.includes('us$')) score += 4;
  if (answers.currency === 'brl' && !earning.includes('us$')) score += 2;
  if (answers.english === 'no' && program.languages.includes('Português')) score += 3;
  if (answers.english === 'yes' && program.languages.includes('Inglês')) score += 2;
  if (answers.video === 'yes' && (searchText.includes('vídeo') || searchText.includes('ugc') || searchText.includes('conteúdo'))) score += 4;
  if (answers.video === 'no' && !searchText.includes('vídeo')) score += 2;
  if (answers.availability === 'short' && program.difficulty === 'fácil') score += 2;
  if (answers.workType === 'tasks' && (searchText.includes('pesquisa') || searchText.includes('tarefa'))) score += 4;
  if (answers.workType === 'services' && (program.category.includes('freela') || searchText.includes('serviço'))) score += 4;
  if (answers.workType === 'content' && (searchText.includes('conteúdo') || searchText.includes('vídeo'))) score += 4;
  if (answers.investment === 'only-free' && program.zeroInvestmentRequired) score += 6;

  return score;
}

function resultSummary(results: PartnerProgramCard[]): string {
  return [
    'Meu caminho sugerido pelo Guia de Renda Extra NKL:',
    ...results.map((program, index) => `${index + 1}. ${program.name} — ${program.shortDescription}`),
    '',
    `Compare as condições antes de se cadastrar: ${absoluteSiteUrl('/programas')}`,
  ].join('\n');
}

export function IncomeWizard({ programs }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<QuestionId, string>>>({});
  const [results, setResults] = useState<PartnerProgramCard[]>([]);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(SAVED_PROGRAMS_KEY);
    if (!stored) return;
    try {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every((value): value is string => typeof value === 'string')) {
        window.setTimeout(() => setSavedSlugs(parsed), 0);
      }
    } catch (error) {
      console.error('[INCOME_WIZARD] Não foi possível ler oportunidades salvas:', error instanceof Error ? error.message : 'erro desconhecido');
    }
  }, []);

  const question = QUESTIONS[questionIndex];
  const savedPrograms = useMemo(
    () => savedSlugs.map((slug) => programs.find((program) => program.slug === slug)).filter((program): program is PartnerProgramCard => Boolean(program)),
    [programs, savedSlugs],
  );

  function openWizard(): void {
    setIsOpen(true);
    setQuestionIndex(0);
    setAnswers({});
    setResults([]);
    setFeedback(null);
  }

  function closeWizard(): void {
    setIsOpen(false);
    setFeedback(null);
  }

  function chooseAnswer(value: string): void {
    const nextAnswers = { ...answers, [question.id]: value };
    setAnswers(nextAnswers);
    if (questionIndex === QUESTIONS.length - 1) {
      setResults([...programs].sort((left, right) => scoreProgram(right, nextAnswers) - scoreProgram(left, nextAnswers)).slice(0, 3));
      return;
    }
    setQuestionIndex((index) => index + 1);
  }

  function toggleSaved(slug: string): void {
    const nextSlugs = savedSlugs.includes(slug) ? savedSlugs.filter((item) => item !== slug) : [...savedSlugs, slug];
    setSavedSlugs(nextSlugs);
    window.localStorage.setItem(SAVED_PROGRAMS_KEY, JSON.stringify(nextSlugs));
  }

  async function copySummary(): Promise<void> {
    try {
      await navigator.clipboard.writeText(resultSummary(results));
      setFeedback('Resumo copiado.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível copiar o resumo.');
    }
  }

  const isResult = results.length > 0;
  const progress = ((questionIndex + 1) / QUESTIONS.length) * 100;

  return (
    <>
      <button id="income-wizard-trigger" type="button" onClick={openWizard} className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-dark focus-visible:ring-2 focus-visible:ring-orange/40">
        Descubra seu perfil ideal
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="income-wizard-title">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-orange/30 bg-income-surface p-5 text-foreground shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Guia interativo</p>
                <h2 id="income-wizard-title" className="mt-2 font-playfair text-3xl font-bold leading-tight">
                  {isResult ? 'Sua rota inicial' : 'Vamos encontrar um ponto de partida'}
                </h2>
              </div>
              <button type="button" onClick={closeWizard} className="min-h-11 min-w-11 rounded-md border border-border px-3 text-xl opacity-70 hover:bg-accent hover:opacity-100" aria-label="Fechar guia">×</button>
            </div>

            {!isResult ? (
              <>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-accent" aria-label={`Pergunta ${questionIndex + 1} de ${QUESTIONS.length}`}>
                  <div className="h-full rounded-full bg-orange transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-foreground/55">Pergunta {questionIndex + 1} de {QUESTIONS.length}</p>
                <h3 className="mt-5 text-2xl font-bold">{question.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{question.description}</p>
                <div className="mt-6 grid gap-3">
                  {question.options.map((option) => (
                    <button key={option.value} type="button" onClick={() => chooseAnswer(option.value)} className="min-h-12 rounded-lg border border-border bg-income-card px-4 py-3 text-left text-sm font-bold transition hover:border-orange hover:bg-orange/5 focus:outline-none focus:ring-2 focus:ring-orange/40">
                      {option.label}
                    </button>
                  ))}
                </div>
                {questionIndex > 0 && <button type="button" onClick={() => setQuestionIndex((index) => index - 1)} className="mt-5 min-h-11 px-2 text-sm font-bold text-foreground/60 underline hover:text-foreground">Voltar</button>}
              </>
            ) : (
              <div className="mt-6">
                <p className="text-sm leading-relaxed text-foreground/70">Estas são as três opções mais alinhadas às respostas. Leia os detalhes e confirme as condições no site oficial.</p>
                <div className="mt-5 grid gap-3">
                  {results.map((program, index) => (
                    <article key={program.slug} className="rounded-xl border border-border bg-income-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-orange">Opção {index + 1}</p>
                          <h3 className="mt-1 text-lg font-bold">{program.name}</h3>
                        </div>
                        <button type="button" onClick={() => toggleSaved(program.slug)} className="min-h-11 rounded-md border border-border px-3 text-sm font-bold hover:border-orange hover:text-orange">
                          {savedSlugs.includes(program.slug) ? 'Salvo' : 'Salvar'}
                        </button>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/70">{program.shortDescription}</p>
                      <Link href={`/programas/${program.slug}`} onClick={closeWizard} className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-neon hover:underline">Ver detalhes</Link>
                    </article>
                  ))}
                </div>
                {savedPrograms.length > 0 && (
                  <section className="mt-6 rounded-xl border border-orange/25 bg-orange/5 p-4">
                    <h3 className="font-bold">Salvar para depois</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {savedPrograms.map((program) => <Link key={program.slug} href={`/programas/${program.slug}`} onClick={closeWizard} className="rounded-full border border-border px-3 py-2 text-sm font-bold hover:border-orange">{program.name}</Link>)}
                    </div>
                  </section>
                )}
                <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
                  <a href={`${WHATSAPP_BASE_URL}${encodeURIComponent(resultSummary(results))}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#25D366] px-4 py-3 text-sm font-bold text-black hover:brightness-95">Enviar para WhatsApp</a>
                  <button type="button" onClick={() => void copySummary()} className="min-h-11 rounded-md border border-border px-4 py-3 text-sm font-bold hover:border-orange hover:text-orange">Copiar resumo</button>
                </div>
                {feedback && <p className="mt-3 text-sm font-bold text-neon" role="status">{feedback}</p>}
                <button type="button" onClick={openWizard} className="mt-5 min-h-11 text-sm font-bold text-foreground/60 underline hover:text-foreground">Refazer guia</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

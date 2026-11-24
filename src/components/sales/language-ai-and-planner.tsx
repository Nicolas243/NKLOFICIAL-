'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Printer, Sparkles } from 'lucide-react';
import { LANGUAGE_UPSELL_TIERS, formatBrlFromCents } from '@/lib/guide-offer';

export type LanguagePlannerSlug =
  | 'ingles'
  | 'italiano'
  | 'frances'
  | 'alemao'
  | 'espanhol'
  | 'chines';

type AgeGroupId = 'criancas' | 'jovens' | 'adultos' | 'maturidade';

type AgeGroupGuide = {
  id: AgeGroupId;
  label: string;
  ageRange: string;
  routineMinutes: string;
  strategy: string;
  voiceTip: string;
  buildPrompt: (language: string) => string;
};

const AGE_GROUPS: readonly AgeGroupGuide[] = [
  {
    id: 'criancas',
    label: 'Crianças',
    ageRange: '6 a 12 anos',
    routineMinutes: '10 minutos por dia (em dupla com responsável)',
    strategy:
      'Use jogos de associação visual, histórias curtas de 4 frases, músicas e perguntas simples sobre animais, cores, escola e rotina.',
    voiceTip:
      'Peça para a IA falar devagar e elogiar acertos, sem corrigir de forma rígida no meio da história.',
    buildPrompt: (language) =>
      `Atue como professor lúdico de ${language} para uma criança de 8 anos falante de português. Crie um mini-jogo de 5 rodadas com palavras do dia a dia (cores, animais, objetos da casa), usando frases curtas, tradução amigável ao lado e uma pergunta simples por vez. Só avance quando a criança responder.`,
  },
  {
    id: 'jovens',
    label: 'Jovens',
    ageRange: '13 a 24 anos',
    routineMinutes: '15 a 20 minutos por dia',
    strategy:
      'Transforme temas reais (séries, jogos, música, intercâmbio, primeiro emprego) em simulações de chat e role-play por voz.',
    voiceTip:
      'Use o modo de voz da IA no celular simulando conversas de viagem, entrevista ou troca de mensagens com amigos.',
    buildPrompt: (language) =>
      `Atue como tutor prático de ${language} para um jovem falante de português. Vamos simular uma conversa real sobre [viagem / jogos / estágio remoto]. Escreva sempre em ${language} no nível A2-B1 (máximo 3 frases por turno), corrija meus erros com leveza em português e me dê uma expressão mais natural usada por nativos.`,
  },
  {
    id: 'adultos',
    label: 'Adultos',
    ageRange: '25 a 54 anos',
    routineMinutes: '15 minutos objetivos (rotina corrida)',
    strategy:
      'Foque em blocos funcionais: responder e-mails, reuniões curtas, viagens e leitura rápida no celular sem decorar tabelas gramaticais longas.',
    voiceTip:
      'Grave áudios de 30 segundos explicando seu dia em voz alta e peça à IA 3 ajustes diretos de clareza e pronúncia.',
    buildPrompt: (language) =>
      `Atue como treinador executivo de ${language} para adulto com 15 minutos por dia. Meu objetivo atual é [trabalho remoto / viagem / atendimento]. Me faça 1 pergunta prática por vez. Quando eu responder, aponte o erro mais importante, mostre a frase natural e só mude de assunto quando eu repetir a versão corrigida.`,
  },
  {
    id: 'maturidade',
    label: '55+ Anos',
    ageRange: 'Ritmo confortável e claro',
    routineMinutes: '12 a 15 minutos sem pressa',
    strategy:
      'Priorize leitura em letra confortável, repetições calmas, vocabulário de viagem, família, cultura e memória ativa com revisões semanais.',
    voiceTip:
      'Peça comparações com palavras parecidas do português, ritmo pausado e 1 novo tópico por sessão para fixar com tranquilidade.',
    buildPrompt: (language) =>
      `Atue como professor paciente e acolhedor de ${language} para adulto 55+ iniciante. Use explicações em português claro, frases úteis para viagem, restaurante e conversa educada, com pronúncia aproximada entre parênteses. Apresente apenas 3 expressões por aula e faça um pequeno teste gentil no final.`,
  },
] as const;

const NINETY_DAY_WEEKS = [
  { week: 1, phase: 'Base', focus: 'Sons essenciais, saudações e leitura de 5 lições' },
  { week: 2, phase: 'Base', focus: 'Pronúncia diária em voz alta + 15 frases úteis' },
  { week: 3, phase: 'Base', focus: 'Perguntas curtas (onde, quanto, quando, por quê)' },
  { week: 4, phase: 'Base', focus: 'Revisão do mês 1 + primeira conversa guiada com IA' },
  { week: 5, phase: 'Ritmo', focus: 'Rotina de trabalho, casa e descrições simples' },
  { week: 6, phase: 'Ritmo', focus: 'Passado e planos próximos em diálogos curtos' },
  { week: 7, phase: 'Ritmo', focus: 'Leitura no celular (mensagens e e-mails reais)' },
  { week: 8, phase: 'Ritmo', focus: 'Revisão do mês 2 + áudio de 60 segundos sem roteiro' },
  { week: 9, phase: 'Prática', focus: 'Situações de viagem, compras e resolução de imprevistos' },
  { week: 10, phase: 'Prática', focus: 'Vocabulário profissional e apresentação pessoal' },
  { week: 11, phase: 'Prática', focus: 'Simulação cronometrada com IA (15 min sem português)' },
  { week: 12, phase: 'Prática', focus: 'Balanço final dos 90 dias e escolha do próximo nível' },
] as const;

const OTHER_LANGUAGE_LINKS: ReadonlyArray<{ slug: LanguagePlannerSlug; label: string; href: string }> = [
  { slug: 'ingles', label: 'Inglês', href: '/guias/ingles' },
  { slug: 'italiano', label: 'Italiano', href: '/guias/italiano' },
  { slug: 'frances', label: 'Francês', href: '/guias/frances' },
  { slug: 'alemao', label: 'Alemão', href: '/guias/alemao' },
  { slug: 'espanhol', label: 'Espanhol', href: '/guias/espanhol' },
  { slug: 'chines', label: 'Mandarim', href: '/guias/chines' },
];

export function LanguageAiAndPlanner({
  language,
  slug,
}: {
  language: string;
  slug: LanguagePlannerSlug;
}) {
  const [selectedAgeId, setSelectedAgeId] = useState<AgeGroupId>('adultos');
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const storageKey = `nkl_language_planner_v1_${slug}`;

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return;
        const parsed = JSON.parse(raw) as { weeks?: number[]; streak?: number };
        if (Array.isArray(parsed.weeks)) {
          setCompletedWeeks(parsed.weeks.filter((w) => Number.isInteger(w) && w >= 1 && w <= 12));
        }
        if (typeof parsed.streak === 'number' && Number.isFinite(parsed.streak)) {
          setStreakDays(Math.max(0, Math.min(90, Math.round(parsed.streak))));
        }
      } catch {
        // Ignore storage parsing failures in restricted browsers.
      }
    });
    return () => {
      active = false;
    };
  }, [storageKey]);

  function persistPlanner(weeks: number[], streak: number): void {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ weeks, streak }));
    } catch {
      // Ignore quota errors.
    }
  }

  function toggleWeek(week: number): void {
    const next = completedWeeks.includes(week)
      ? completedWeeks.filter((item) => item !== week)
      : [...completedWeeks, week].sort((a, b) => a - b);
    setCompletedWeeks(next);
    persistPlanner(next, streakDays);
  }

  function incrementStreak(delta: number): void {
    const next = Math.max(0, Math.min(90, streakDays + delta));
    setStreakDays(next);
    persistPlanner(completedWeeks, next);
  }

  const activeAgeGuide = useMemo(
    () => AGE_GROUPS.find((group) => group.id === selectedAgeId) ?? AGE_GROUPS[2],
    [selectedAgeId],
  );
  const promptText = useMemo(
    () => activeAgeGuide.buildPrompt(language),
    [activeAgeGuide, language],
  );
  const progressPct = Math.round((completedWeeks.length / NINETY_DAY_WEEKS.length) * 100);

  async function handleCopyPrompt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedPrompt(true);
      window.setTimeout(() => setCopiedPrompt(false), 2200);
    } catch {
      setCopiedPrompt(false);
    }
  }

  return (
    <div className="mt-12 space-y-8">
      <section
        aria-labelledby="ai-language-guide-heading"
        className="rounded-3xl border border-border bg-income-surface/95 p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles size={16} className="text-orange" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">
            Incluído com o estudo de {language} · Guia de IA por Idade
          </p>
        </div>
        <h2
          id="ai-language-guide-heading"
          className="mt-2 font-playfair text-3xl font-bold leading-tight sm:text-4xl"
        >
          Como usar Inteligência Artificial para destravar {language} em qualquer idade
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/75 sm:text-base">
          Em vez de estudar sozinho e travar na pronúncia, escolha abaixo a faixa etária e use um
          roteiro pronto no ChatGPT, Claude ou Gemini para praticar conversação segura no dia a dia.
        </p>

        <div
          role="tablist"
          aria-label="Selecione a faixa etária"
          className="mt-6 flex flex-wrap gap-2"
        >
          {AGE_GROUPS.map((group) => {
            const active = group.id === activeAgeGuide.id;
            return (
              <button
                key={group.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedAgeId(group.id)}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                  active
                    ? 'border-orange bg-orange text-white'
                    : 'border-border bg-background/80 text-foreground/80 hover:border-orange'
                }`}
              >
                {group.label} ({group.ageRange})
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="space-y-4 rounded-2xl border border-border bg-background/70 p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange">
                Ritmo recomendado
              </p>
              <p className="mt-1 text-base font-bold text-foreground">
                {activeAgeGuide.routineMinutes}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                Estratégia prática
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                {activeAgeGuide.strategy}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                Como treinar fala e ouvido
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                {activeAgeGuide.voiceTip}
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-border bg-background/90 p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neon">
                Prompt pronto para copiar ({language} · {activeAgeGuide.label})
              </p>
              <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-income-surface p-4 text-xs leading-relaxed text-foreground/90">
                {promptText}
              </pre>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleCopyPrompt()}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-neon px-4 py-2 text-sm font-bold text-black hover:opacity-90"
              >
                {copiedPrompt ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                <span>{copiedPrompt ? 'Prompt copiado' : `Copiar prompt de ${language}`}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="language-planner-heading"
        className="rounded-3xl border border-border bg-income-surface/95 p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">
              Planner Interativo de 90 Dias · {language}
            </p>
            <h2
              id="language-planner-heading"
              className="mt-2 font-playfair text-3xl font-bold leading-tight"
            >
              Acompanhe suas 12 semanas sem perder o ritmo
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/75">
              Seu progresso fica salvo automaticamente neste navegador. Você também pode imprimir ou
              salvar em PDF para estudar longe da tela.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-bold hover:border-neon"
            >
              <Printer size={16} aria-hidden="true" />
              <span>Imprimir / Salvar Planner PDF</span>
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-foreground/70">
              <span>Progresso das 12 semanas</span>
              <span className="text-neon">{progressPct}% ({completedWeeks.length}/12)</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-neon transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/70 p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                Sequência diária de 15 min
              </p>
              <p className="mt-1 text-xl font-bold text-orange">{streakDays} de 90 dias</p>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={() => incrementStreak(-1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-sm font-bold hover:border-orange"
                aria-label="Diminuir 1 dia concluído"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => incrementStreak(1)}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-orange px-3.5 text-sm font-bold text-white hover:bg-orange-dark"
              >
                +1 dia hoje
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NINETY_DAY_WEEKS.map((item) => {
            const done = completedWeeks.includes(item.week);
            return (
              <button
                key={item.week}
                type="button"
                onClick={() => toggleWeek(item.week)}
                aria-pressed={done}
                className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-colors ${
                  done
                    ? 'border-neon bg-neon/10'
                    : 'border-border bg-background/70 hover:border-neon/60'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange">
                    Semana {String(item.week).padStart(2, '0')} · {item.phase}
                  </span>
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${
                      done
                        ? 'border-neon bg-neon text-black'
                        : 'border-border text-foreground/50'
                    }`}
                  >
                    {done ? '✓' : ''}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">{item.focus}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="language-upsell-heading"
        className="rounded-3xl border border-orange/35 bg-orange/5 p-6 sm:p-8"
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">
          Vantagem progressiva automática no Stripe
        </p>
        <h2 id="language-upsell-heading" className="mt-2 font-playfair text-3xl font-bold">
          Quer estudar mais de um idioma? O desconto aplica sozinho no caixa
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/75">
          Ao comprar usando o mesmo e-mail ou conta do primeiro e-book, o checkout reduz
          automaticamente o valor dos próximos idiomas da coleção:
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-income-surface p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground/60">
              1º Idioma
            </p>
            <p className="mt-1 font-playfair text-2xl font-bold">R$ 47,00</p>
            <p className="mt-1 text-xs text-foreground/70">E-book A5 + Guia de IA + Planner</p>
          </div>
          {LANGUAGE_UPSELL_TIERS.map((tier) => (
            <div
              key={tier.ownedCount}
              className="rounded-2xl border border-orange/40 bg-income-surface p-4"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-orange">
                {tier.label} ({tier.discountPercent}% OFF)
              </p>
              <p className="mt-1 font-playfair text-2xl font-bold">
                {formatBrlFromCents(tier.priceCents)}
              </p>
              <p className="mt-1 text-xs text-foreground/70">Aplicado automaticamente no Stripe</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          {OTHER_LANGUAGE_LINKS.filter((item) => item.slug !== slug).map((item) => (
            <Link
              key={item.slug}
              href={item.href}
              className="inline-flex min-h-10 items-center rounded-full border border-border bg-background px-4 py-2 text-xs font-bold hover:border-orange hover:text-orange"
            >
              Ver e-book de {item.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

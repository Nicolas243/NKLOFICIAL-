'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Lock,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { DecoyPricingGrid, type DecoyTierOption } from '@/components/sales/decoy-pricing-grid';
import { OfferCheckoutCta } from '@/components/funnel/offer-checkout-cta';
import { AdaptiveCtaLink } from '@/components/sales/adaptive-cta-link';
import type { PaidProduct } from '@/config/products';
import type { OfferTier } from '@/lib/guide-offer';

type AreaOption =
  | 'ia-automacoes'
  | 'servicos-digitais'
  | 'produtos-conteudo'
  | 'ecommerce-indicacoes'
  | 'educacao-mentoria'
  | 'descobrir-ia';

type TargetIncomeOption = '1500-3000' | '3000-7000' | '7000-15000' | '15000-plus';
type BudgetOption = 'zero' | 'ate-300' | '300-1500' | 'acima-1500';

type MiniQuizState = {
  area?: AreaOption;
  income?: TargetIncomeOption;
  budget?: BudgetOption;
};

const AREA_CHOICES: ReadonlyArray<{ id: AreaOption; label: string; detail: string }> = [
  {
    id: 'ia-automacoes',
    label: 'Inteligência Artificial e automações',
    detail: 'Assistentes de IA, fluxos automáticos e serviços de alta produtividade.',
  },
  {
    id: 'servicos-digitais',
    label: 'Serviços digitais e freelancing',
    detail: 'Edição, suporte, textos, design ou consultoria remota com clientes.',
  },
  {
    id: 'produtos-conteudo',
    label: 'Produtos digitais, e-books e conteúdo',
    detail: 'Guias práticos, templates, Amazon KDP, UGC ou canais temáticos.',
  },
  {
    id: 'ecommerce-indicacoes',
    label: 'Comércio online, revenda ou indicações',
    detail: 'Afiliados de nicho, print on demand ou arbitragem em marketplaces.',
  },
  {
    id: 'educacao-mentoria',
    label: 'Aulas, mentoria ou consultoria prática',
    detail: 'Transformar o que você já sabe ensinar em sessões ou comunidades.',
  },
  {
    id: 'descobrir-ia',
    label: 'Quero que a IA cruze meu perfil completo',
    detail: 'Deixar a Bússola de Negócios IA comparar os 18 modelos para você.',
  },
];

const INCOME_CHOICES: ReadonlyArray<{ id: TargetIncomeOption; label: string; detail: string }> = [
  {
    id: '1500-3000',
    label: 'R$ 1.500 a R$ 3.000/mês',
    detail: 'Para complementar a renda atual com estabilidade e poucas horas.',
  },
  {
    id: '3000-7000',
    label: 'R$ 3.000 a R$ 7.000/mês',
    detail: 'Para ganhar autonomia financeira e depender menos de terceiros.',
  },
  {
    id: '7000-15000',
    label: 'R$ 7.000 a R$ 15.000/mês',
    detail: 'Para viver do próprio negócio com carteira recorrente ou escala.',
  },
  {
    id: '15000-plus',
    label: 'Acima de R$ 15.000/mês',
    detail: 'Para construir operação escalável, digital e com múltiplas frentes.',
  },
];

const BUDGET_CHOICES: ReadonlyArray<{ id: BudgetOption; label: string; detail: string }> = [
  {
    id: 'zero',
    label: 'R$ 0 — Prefiro começar sem investir dinheiro',
    detail: 'Foco em tempo, habilidade, validação orgânica e plataformas gratuitas.',
  },
  {
    id: 'ate-300',
    label: 'Até R$ 300 para começar mais estruturado',
    detail: 'Orçamento enxuto para ferramentas essenciais ou domínio inicial.',
  },
  {
    id: '300-1500',
    label: 'De R$ 300 a R$ 1.500 para acelerar resultados',
    detail: 'Espaço para testar ferramentas Pro, amostras ou tráfego controlado.',
  },
  {
    id: 'acima-1500',
    label: 'Acima de R$ 1.500 para montar operação sólida',
    detail: 'Capital inicial para estrutura comercial, estoque teste ou automação.',
  },
];

const BUSSOLA_DECOY_OPTIONS: readonly DecoyTierOption<OfferTier>[] = [
  {
    id: 'essential',
    badge: 'Entrada enxuta',
    name: 'Edição Essencial (Guia 2027)',
    priceLabel: 'R$ 19',
    priceSuffix: 'pagamento único',
    subtitle: 'Guia essencial em PDF para dar os primeiros passos sem a ferramenta interativa de IA.',
    valueBrl: 19,
    ctaLabel: 'Escolher Edição Essencial (R$ 19)',
    features: [
      { label: 'Guia Essencial Renda Extra 2027 (PDF com CPF)', included: true },
      { label: 'Bússola de Negócios IA (50 critérios + Diagnóstico IA)', included: false },
      { label: 'App instalável no celular + Plano 7 Dias + Tracker', included: false },
      { label: '6 E-books completos de Idiomas NKL', included: false },
    ],
  },
  {
    id: 'complete',
    badge: 'Mais escolhido',
    name: 'Bússola de Negócios IA Completa',
    priceLabel: 'R$ 39',
    compareAtLabel: 'R$ 97',
    priceSuffix: 'pagamento único',
    subtitle: 'Acesso vitalício à Bússola IA (50 critérios), diagnóstico personalizado por IA, plano de 7 dias e app dedicado.',
    recommended: true,
    valueBrl: 39,
    ctaLabel: 'Desbloquear Bússola IA (R$ 39)',
    features: [
      { label: 'Bússola de Negócios IA (50 critérios + Top 3 negócios)', included: true },
      { label: 'Diagnóstico personalizado gerado por IA + Plano de 7 dias', included: true },
      { label: 'App instalável no celular + Checklist + Tracker semanal', included: true },
      { label: '6 E-books completos de Idiomas NKL', included: false },
    ],
  },
  {
    id: 'vip',
    badge: 'Acervo completo',
    name: 'Acervo Total NKL (11 Materiais + Bússola)',
    priceLabel: 'R$ 247',
    compareAtLabel: 'R$ 379',
    priceSuffix: 'pagamento único',
    subtitle: 'Bússola de Negócios IA + Pacote Renda Extra + todos os 6 E-books de Idiomas liberados na conta.',
    valueBrl: 247,
    ctaLabel: 'Escolher Acervo Total (R$ 247)',
    features: [
      { label: 'Bússola de Negócios IA (50 critérios + Diagnóstico IA)', included: true },
      { label: 'Todos os 5 materiais e planilhas de Renda Extra', included: true },
      { label: 'App instalável no celular + Checklist + Tracker semanal', included: true },
      { label: '6 E-books completos de Idiomas NKL (Inglês a Mandarim)', included: true },
    ],
  },
];

function buildMiniQuizPreview(answers: Required<MiniQuizState>): {
  archetypePreview: string;
  matchedExample: string;
  firstStepTip: string;
  alignmentNote: string;
} {
  const areaSuggestions: Record<AreaOption, { zero: string; paid: string; tip: string }> = {
    'ia-automacoes': {
      zero: 'Avaliação e curadoria de modelos de IA em projetos remotos',
      paid: 'Automação e assistentes de IA para pequenos negócios locais',
      tip: 'Mapeie 1 tarefa repetitiva de atendimento ou triagem que um negócio próximo faria em 5 minutos com apoio de IA.',
    },
    'servicos-digitais': {
      zero: 'Serviços digitais especializados sob demanda (revisão, planilhas ou suporte)',
      paid: 'Edição de vídeos curtos com IA e pacotes mensais para criadores',
      tip: 'Transforme uma habilidade que você já executa hoje em 1 entrega fechada com prazo curto e 2 amostras simples.',
    },
    'produtos-conteudo': {
      zero: 'Publicação de guias práticos e livros digitais na Amazon KDP',
      paid: 'Loja de templates, planilhas e microprodutos digitais (Gumroad / Etsy)',
      tip: 'Escolha um problema prático que você já resolveu e estruture um roteiro de 10 páginas ou planilha modelo.',
    },
    'ecommerce-indicacoes': {
      zero: 'Curadoria de compras e afiliado de nicho em marketplaces brasileiros',
      paid: 'Print on Demand sem estoque ou operação validada de nicho',
      tip: 'Selecione 1 categoria específica que você acompanha de perto e compare 3 opções honestas antes de postar links.',
    },
    'educacao-mentoria': {
      zero: 'Aulas particulares, tutoria ou consultoria prática online',
      paid: 'Comunidade recorrente e materiais guiados para alunos',
      tip: 'Estruture o roteiro de uma primeira sessão de 50 minutos resolvendo o maior bloqueio de quem está começando.',
    },
    'descobrir-ia': {
      zero: 'Combinação de Testes de Usabilidade + Avaliação de IA sem aporte inicial',
      paid: 'Operação digital enxuta combinando automação e produtos digitais',
      tip: 'Na Bússola completa, os 50 critérios cruzam seu tempo semanal, perfil social e risco para eliminar opções fora da sua rotina.',
    },
  };

  const areaConfig = areaSuggestions[answers.area];
  const isZeroBudget = answers.budget === 'zero';
  const matchedExample = isZeroBudget ? areaConfig.zero : areaConfig.paid;

  const archetypePreview = isZeroBudget
    ? 'Construtor Enxuto (Zero Desperdício)'
    : answers.income === '7000-15000' || answers.income === '15000-plus'
      ? 'Estrategista de Escala Guiada'
      : 'Operador Digital Consistente';

  const incomeLabel = INCOME_CHOICES.find((item) => item.id === answers.income)?.label ?? '';
  const budgetLabel = BUDGET_CHOICES.find((item) => item.id === answers.budget)?.label ?? '';

  return {
    archetypePreview,
    matchedExample,
    firstStepTip: areaConfig.tip,
    alignmentNote: `Com meta de ${incomeLabel} e preferência por ${budgetLabel.toLowerCase()}, a IA prioriza modelos de ciclo curto antes de qualquer escala maior.`,
  };
}

export function BussolaSalesFunnel({ product }: { product: PaidProduct }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<MiniQuizState>({});
  const [selectedTier, setSelectedTier] = useState<OfferTier>('complete');

  const isMiniQuizComplete = Boolean(answers.area && answers.income && answers.budget);
  const preview = useMemo(() => {
    if (!answers.area || !answers.income || !answers.budget) return null;
    return buildMiniQuizPreview({
      area: answers.area,
      income: answers.income,
      budget: answers.budget,
    });
  }, [answers.area, answers.budget, answers.income]);

  function scrollToMiniQuiz(): void {
    document.getElementById('mini-quiz-bussola')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function selectArea(area: AreaOption): void {
    setAnswers((prev) => ({ ...prev, area }));
    setStepIndex(1);
  }

  function selectIncome(income: TargetIncomeOption): void {
    setAnswers((prev) => ({ ...prev, income }));
    setStepIndex(2);
  }

  function selectBudget(budget: BudgetOption): void {
    setAnswers((prev) => ({ ...prev, budget }));
    setStepIndex(3);
  }

  function resetMiniQuiz(): void {
    setAnswers({});
    setStepIndex(0);
  }

  const checkoutHrefWithTier = `${product.checkoutRoute}?tier=${selectedTier}`;

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-border bg-surface/90 p-6 shadow-sm backdrop-blur-md sm:p-10">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c2410c]/30 bg-[#c2410c]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#9a3412] dark:border-[#f97316]/35 dark:bg-[#f97316]/15 dark:text-[#fdba74]">
            <Sparkles size={13} aria-hidden="true" />
            <span>Diagnóstico Inteligente com IA</span>
          </span>
          <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground/75">
            Prévia gratuita em 45 segundos
          </span>
        </div>

        <p className="mt-5 text-sm font-bold uppercase tracking-[0.12em] text-foreground/60">
          {product.title}
        </p>
        <h1 className="mt-2 max-w-3xl font-playfair text-3xl font-bold leading-tight text-foreground sm:text-5xl">
          Imagine acordar sabendo exatamente qual negócio próprio construir — e vê-lo funcionando no seu ritmo.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg">
          A maioria das pessoas trava porque tenta copiar ideias que não combinam com seu tempo, dinheiro ou personalidade. Antes de investir horas no caminho errado, faça um teste rápido e receba um gostinho do que a Bússola de Negócios IA desenha para o seu momento.
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Compass,
              title: 'Visão clara do negócio ideal',
              body: 'Visualize um modelo alinhado à sua rotina real, sem depender de palpites ou modinhas passageiras.',
            },
            {
              icon: TrendingUp,
              title: 'Renda no seu próprio ritmo',
              body: 'Comece pequeno com segurança, valide seus primeiros resultados em 7 dias e cresça com método.',
            },
            {
              icon: Target,
              title: 'Diagnóstico personalizado por IA',
              body: 'Nossa IA cruza 50 critérios sobre capital, tempo, tecnologia, risco e perfil social para entregar seus 3 melhores caminhos.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-border bg-background/70 p-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#c2410c]/12 text-[#c2410c] dark:bg-[#f97316]/15 dark:text-[#fb923c]">
                <Icon size={18} aria-hidden="true" />
              </span>
              <h2 className="mt-3 text-base font-bold text-foreground">{title}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground/70">{body}</p>
            </article>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <button
            type="button"
            onClick={scrollToMiniQuiz}
            className="inline-flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#c2410c] px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#9a3412] dark:bg-[#f97316] dark:text-[#090b10] dark:hover:bg-[#fb923c]"
          >
            <span>Testar agora: fazer mini-quiz com IA (grátis)</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <span className="text-xs font-medium text-foreground/65">
            Leva menos de 1 minuto · Sem cadastro para ver sua prévia
          </span>
        </div>
      </header>

      <section
        id="mini-quiz-bussola"
        className="scroll-mt-24 rounded-3xl border border-[#c2410c]/30 bg-surface/95 p-6 shadow-sm backdrop-blur-md dark:border-[#f97316]/35 sm:p-10"
        aria-labelledby="mini-quiz-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c2410c] dark:text-[#fb923c]">
              {isMiniQuizComplete
                ? 'Prévia gerada · Bússola de Negócios IA'
                : `Mini-quiz rápido · Etapa ${Math.min(stepIndex + 1, 3)} de 3`}
            </p>
            <h2 id="mini-quiz-heading" className="mt-1 font-playfair text-2xl font-bold sm:text-4xl">
              {isMiniQuizComplete
                ? 'Aqui está um gostinho do seu negócio ideal'
                : 'Simule o seu caminho em 3 perguntas rápidas'}
            </h2>
          </div>
          {(stepIndex > 0 || isMiniQuizComplete) && (
            <button
              type="button"
              onClick={resetMiniQuiz}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground/75 transition hover:border-[#c2410c] hover:text-[#c2410c] dark:hover:border-[#f97316] dark:hover:text-[#fb923c]"
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Refazer simulação</span>
            </button>
          )}
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-border" aria-hidden="true">
          <div
            className="h-full rounded-full bg-[#c2410c] transition-all duration-300 dark:bg-[#f97316]"
            style={{ width: `${isMiniQuizComplete ? 100 : ((stepIndex + 1) / 3) * 100}%` }}
          />
        </div>

        {!isMiniQuizComplete ? (
          <div className="mt-7">
            {stepIndex === 0 && (
              <div>
                <h3 className="text-xl font-bold sm:text-2xl">
                  1. Em qual área você mais gostaria de atuar no seu negócio próprio?
                </h3>
                <p className="mt-2 text-sm text-foreground/70">
                  Escolha a direção que mais desperta seu interesse hoje.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {AREA_CHOICES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => selectArea(option.id)}
                      className={`flex flex-col rounded-2xl border p-4 text-left transition hover:border-[#c2410c] hover:bg-[#c2410c]/5 dark:hover:border-[#f97316] dark:hover:bg-[#f97316]/10 ${
                        answers.area === option.id
                          ? 'border-[#c2410c] bg-[#c2410c]/10 dark:border-[#f97316] dark:bg-[#f97316]/15'
                          : 'border-border bg-background/75'
                      }`}
                    >
                      <span className="text-sm font-bold text-foreground">{option.label}</span>
                      <span className="mt-1 text-xs leading-relaxed text-foreground/70">{option.detail}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {stepIndex === 1 && (
              <div>
                <h3 className="text-xl font-bold sm:text-2xl">
                  2. Quanto você espera ganhar por mês com o seu negócio dando certo?
                </h3>
                <p className="mt-2 text-sm text-foreground/70">
                  Isso calibra se faz mais sentido começar com serviço rápido, renda complementar ou ativo escalável.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {INCOME_CHOICES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => selectIncome(option.id)}
                      className={`flex flex-col rounded-2xl border p-4 text-left transition hover:border-[#c2410c] hover:bg-[#c2410c]/5 dark:hover:border-[#f97316] dark:hover:bg-[#f97316]/10 ${
                        answers.income === option.id
                          ? 'border-[#c2410c] bg-[#c2410c]/10 dark:border-[#f97316] dark:bg-[#f97316]/15'
                          : 'border-border bg-background/75'
                      }`}
                    >
                      <span className="text-sm font-bold text-foreground">{option.label}</span>
                      <span className="mt-1 text-xs leading-relaxed text-foreground/70">{option.detail}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setStepIndex(0)}
                  className="mt-5 text-xs font-bold text-foreground/70 underline hover:text-foreground"
                >
                  Voltar para pergunta 1
                </button>
              </div>
            )}

            {stepIndex === 2 && (
              <div>
                <h3 className="text-xl font-bold sm:text-2xl">
                  3. Quanto você prefere investir no início para alcançar esse resultado?
                </h3>
                <p className="mt-2 text-sm text-foreground/70">
                  Nunca sugerimos arriscar dinheiro essencial; adaptamos o modelo ao seu limite real.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {BUDGET_CHOICES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => selectBudget(option.id)}
                      className={`flex flex-col rounded-2xl border p-4 text-left transition hover:border-[#c2410c] hover:bg-[#c2410c]/5 dark:hover:border-[#f97316] dark:hover:bg-[#f97316]/10 ${
                        answers.budget === option.id
                          ? 'border-[#c2410c] bg-[#c2410c]/10 dark:border-[#f97316] dark:bg-[#f97316]/15'
                          : 'border-border bg-background/75'
                      }`}
                    >
                      <span className="text-sm font-bold text-foreground">{option.label}</span>
                      <span className="mt-1 text-xs leading-relaxed text-foreground/70">{option.detail}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setStepIndex(1)}
                  className="mt-5 text-xs font-bold text-foreground/70 underline hover:text-foreground"
                >
                  Voltar para pergunta 2
                </button>
              </div>
            )}
          </div>
        ) : preview ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                  Perfil identificado na prévia
                </p>
                <p className="mt-2 font-playfair text-2xl font-bold text-foreground">
                  {preview.archetypePreview}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                  {preview.alignmentNote}
                </p>
              </div>

              <div className="rounded-2xl border border-[#c2410c]/30 bg-background/80 p-5 dark:border-[#f97316]/35">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c2410c] dark:text-[#fb923c]">
                  1ª direção compatível revelada
                </p>
                <p className="mt-2 text-lg font-bold text-foreground">{preview.matchedExample}</p>
                <p className="mt-2 text-xs leading-relaxed text-foreground/75">
                  <strong className="text-foreground">Ação de hoje:</strong> {preview.firstStepTip}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/70 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground/65">
                O que desbloqueia no Diagnóstico Completo por IA
              </p>
              <ul className="mt-3 grid gap-2.5 text-sm text-foreground/85 sm:grid-cols-2">
                {[
                  'Análise dos 5 eixos (Capital, Tempo, Tecnologia, Risco e Perfil Social) em 50 perguntas',
                  'Diagnóstico personalizado gerado por IA conectando seus pontos fortes e alertas',
                  'Os 3 modelos exatos mais compatíveis com passo a passo de 7 dias cada',
                  'Checklist anti-reprovação + Tracker semanal + App instalável no celular',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </section>

      {isMiniQuizComplete ? (
        <div id="bussola-planos" className="scroll-mt-24 space-y-6">
          <DecoyPricingGrid
            funnel="bussola-negocios"
            eyebrow="Diagnóstico pronto para desbloquear"
            heading="Escolha como quer liberar sua Bússola de Negócios IA"
            subheading="Compare as 3 opções abaixo. O acesso completo da Bússola IA libera os 50 critérios, o diagnóstico gerado por IA, o app instalável e todos os bônus em pagamento único."
            options={BUSSOLA_DECOY_OPTIONS}
            selectedTier={selectedTier}
            onSelectTier={setSelectedTier}
            offerVariant="sales-page"
          />

          <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-[#c2410c]/35 bg-surface/95 p-6 shadow-sm sm:flex-row sm:p-8 dark:border-[#f97316]/35">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c2410c] dark:text-[#fb923c]">
                Próximo passo
              </p>
              <p className="mt-1 font-playfair text-2xl font-bold text-foreground">
                {BUSSOLA_DECOY_OPTIONS.find((item) => item.id === selectedTier)?.name}
              </p>
              <p className="mt-1 text-sm text-foreground/75">
                {BUSSOLA_DECOY_OPTIONS.find((item) => item.id === selectedTier)?.priceLabel} · acesso individual liberado na hora após confirmação.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <AdaptiveCtaLink
                experiment="bussola-cta"
                href={checkoutHrefWithTier}
                variants={[
                  { id: '0', label: 'Desbloquear minha Bússola IA agora' },
                  { id: '1', label: 'Revelar meus 3 negócios ideais' },
                  { id: '2', label: 'Gerar meu diagnóstico completo' },
                ]}
                className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#c2410c] px-6 py-3 text-center text-sm font-bold text-white no-underline shadow-sm transition-colors hover:bg-[#9a3412] dark:bg-[#f97316] dark:text-[#090b10] dark:hover:bg-[#fb923c]"
              />
              <OfferCheckoutCta
                href={checkoutHrefWithTier}
                label="Ir para o checkout seguro"
                productSlug={product.slug}
                trackId={product.trackId}
                placement="footer"
                testId="offer-checkout-cta"
                className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-border bg-background px-5 py-3 text-center text-sm font-bold text-foreground no-underline transition-colors hover:border-[#c2410c] dark:hover:border-[#f97316]"
              />
            </div>
          </div>
        </div>
      ) : (
        <section
          aria-label="Desbloqueio liberado após o mini-quiz"
          className="rounded-3xl border border-dashed border-border bg-surface/65 p-6 text-center sm:p-8"
        >
          <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-[#c2410c] dark:text-[#fb923c]">
            <Lock size={18} aria-hidden="true" />
          </span>
          <h3 className="mt-3 font-playfair text-2xl font-bold text-foreground">
            Responda às 3 perguntas acima para ver seu pré-diagnóstico e os planos
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-foreground/70">
            Queremos primeiro mostrar como a Bússola de Negócios IA enxerga o seu momento antes de apresentar qualquer opção de desbloqueio.
          </p>
          <button
            type="button"
            onClick={scrollToMiniQuiz}
            className="mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#c2410c] px-5 py-2.5 text-sm font-bold text-[#9a3412] transition hover:bg-[#c2410c] hover:text-white dark:border-[#f97316] dark:text-[#fdba74] dark:hover:bg-[#f97316] dark:hover:text-[#090b10]"
          >
            <span>Responder etapa {Math.min(stepIndex + 1, 3)} de 3</span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </section>
      )}
    </div>
  );
}

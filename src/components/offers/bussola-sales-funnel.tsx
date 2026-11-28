'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Compass,
  Cpu,
  GraduationCap,
  Layers,
  Lock,
  RotateCcw,
  ShoppingBag,
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

type SimulatorState = {
  area?: AreaOption;
  income?: TargetIncomeOption;
  budget?: BudgetOption;
};

const AREA_CHOICES: ReadonlyArray<{
  id: AreaOption;
  label: string;
  tag: string;
  detail: string;
  icon: typeof Cpu;
}> = [
  {
    id: 'ia-automacoes',
    label: 'Inteligência Artificial e automações',
    tag: 'Alta demanda atual',
    detail: 'Assistentes de IA, fluxos automáticos e tarefas técnicas de alta produtividade.',
    icon: Cpu,
  },
  {
    id: 'servicos-digitais',
    label: 'Serviços digitais e freelancing',
    tag: 'Caixa mais rápido',
    detail: 'Edição, revisão, design, suporte ou consultoria remota para clientes.',
    icon: Briefcase,
  },
  {
    id: 'produtos-conteudo',
    label: 'Produtos digitais, e-books e conteúdo',
    tag: 'Sem aparecer',
    detail: 'Guias práticos, templates, Amazon KDP, vídeos sem rosto ou canais temáticos.',
    icon: Layers,
  },
  {
    id: 'ecommerce-indicacoes',
    label: 'Comércio online, revenda ou indicações',
    tag: 'Margem recorrente',
    detail: 'Afiliados de nicho, print on demand ou curadoria em marketplaces.',
    icon: ShoppingBag,
  },
  {
    id: 'educacao-mentoria',
    label: 'Aulas, mentoria ou consultoria prática',
    tag: 'Autoridade pessoal',
    detail: 'Transformar o que você já domina em sessões individuais ou comunidade.',
    icon: GraduationCap,
  },
  {
    id: 'descobrir-ia',
    label: 'Quero que a IA cruze meu perfil completo',
    tag: 'Sem chute',
    detail: 'Deixar a Bússola de Negócios IA comparar os 18 modelos do portal para você.',
    icon: Sparkles,
  },
];

const INCOME_CHOICES: ReadonlyArray<{
  id: TargetIncomeOption;
  label: string;
  lifestyle: string;
  detail: string;
}> = [
  {
    id: '1500-3000',
    label: 'R$ 1.500 a R$ 3.000/mês',
    lifestyle: 'Alívio imediato nas contas',
    detail: 'Complemento consistente com 1h a 2h livres por dia sem largar sua rotina.',
  },
  {
    id: '3000-7000',
    label: 'R$ 3.000 a R$ 7.000/mês',
    lifestyle: 'Autonomia para escolher',
    detail: 'Renda sólida para ganhar fôlego financeiro e reduzir dependência de terceiros.',
  },
  {
    id: '7000-15000',
    label: 'R$ 7.000 a R$ 15.000/mês',
    lifestyle: 'Viver do próprio negócio',
    detail: 'Carteira recorrente ou ativos digitais operando no seu próprio ritmo.',
  },
  {
    id: '15000-plus',
    label: 'Acima de R$ 15.000/mês',
    lifestyle: 'Operação escalável',
    detail: 'Estrutura digital com processos replicáveis e múltiplas fontes de entrada.',
  },
];

const BUDGET_CHOICES: ReadonlyArray<{
  id: BudgetOption;
  label: string;
  badge: string;
  detail: string;
}> = [
  {
    id: 'zero',
    label: 'R$ 0 — Prefiro começar sem investir dinheiro',
    badge: 'Risco financeiro zero',
    detail: 'Foco em tempo, habilidade, validação orgânica e plataformas gratuitas.',
  },
  {
    id: 'ate-300',
    label: 'Até R$ 300 para começar mais estruturado',
    badge: 'Enxuto',
    detail: 'Orçamento mínimo para domínio, ferramentas essenciais ou primeiro teste.',
  },
  {
    id: '300-1500',
    label: 'De R$ 300 a R$ 1.500 para acelerar resultados',
    badge: 'Aceleração controlada',
    detail: 'Espaço para ferramentas Pro, amostras ou validação paga sob controle.',
  },
  {
    id: 'acima-1500',
    label: 'Acima de R$ 1.500 para montar operação sólida',
    badge: 'Estrutura completa',
    detail: 'Capital inicial para estrutura comercial, automação ou estoque validado.',
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

const AREA_PREVIEW_MAP: Record<
  AreaOption,
  {
    zeroModel: string;
    paidModel: string;
    archetypeBase: string;
    firstWinWindow: string;
    firstStepTip: string;
  }
> = {
  'ia-automacoes': {
    zeroModel: 'Avaliação e curadoria de modelos de IA em projetos remotos',
    paidModel: 'Automação e assistentes de IA para pequenos negócios locais',
    archetypeBase: 'Arquiteto de Produtividade com IA',
    firstWinWindow: '7 a 14 dias',
    firstStepTip: 'Mapeie 1 tarefa repetitiva de atendimento ou triagem que um negócio local resolveria em 5 minutos com IA.',
  },
  'servicos-digitais': {
    zeroModel: 'Serviços digitais sob demanda (revisão, planilhas ou suporte remoto)',
    paidModel: 'Edição de vídeos curtos com IA em pacotes mensais para criadores',
    archetypeBase: 'Especialista de Execução Rápida',
    firstWinWindow: '5 a 10 dias',
    firstStepTip: 'Transforme uma habilidade que você já executa em 1 entrega fechada com prazo curto e 2 amostras simples.',
  },
  'produtos-conteudo': {
    zeroModel: 'Publicação de guias práticos e e-books na Amazon KDP',
    paidModel: 'Loja de templates, planilhas e microprodutos digitais (Gumroad / Etsy)',
    archetypeBase: 'Criador de Ativos Silenciosos',
    firstWinWindow: '10 a 21 dias',
    firstStepTip: 'Escolha um problema prático que você já resolveu e estruture um roteiro enxuto de 10 páginas ou planilha modelo.',
  },
  'ecommerce-indicacoes': {
    zeroModel: 'Curadoria de compras e afiliado de nicho em marketplaces brasileiros',
    paidModel: 'Print on Demand sem estoque ou operação validada de nicho',
    archetypeBase: 'Curador Comercial Inteligente',
    firstWinWindow: '7 a 15 dias',
    firstStepTip: 'Selecione 1 categoria específica que você acompanha de perto e compare 3 opções reais antes de divulgar links.',
  },
  'educacao-mentoria': {
    zeroModel: 'Aulas particulares, tutoria ou consultoria prática online',
    paidModel: 'Comunidade recorrente e materiais guiados para alunos',
    archetypeBase: 'Mentor de Transformação Prática',
    firstWinWindow: '7 a 14 dias',
    firstStepTip: 'Desenhe o roteiro de uma primeira sessão de 50 minutos resolvendo o maior bloqueio de quem está começando.',
  },
  'descobrir-ia': {
    zeroModel: 'Combinação de Testes de Usabilidade + Avaliação de IA sem aporte inicial',
    paidModel: 'Operação digital enxuta combinando automação e produtos digitais',
    archetypeBase: 'Perfil Híbrido sob Análise de IA',
    firstWinWindow: '7 a 14 dias',
    firstStepTip: 'Na Bússola completa, os 50 critérios cruzam tempo semanal, perfil social e risco para eliminar ideias fora da sua rotina.',
  },
};

function computeLiveSnapshot(answers: SimulatorState) {
  const areaData = answers.area ? AREA_PREVIEW_MAP[answers.area] : null;
  const incomeData = INCOME_CHOICES.find((item) => item.id === answers.income) ?? null;
  const budgetData = BUDGET_CHOICES.find((item) => item.id === answers.budget) ?? null;
  const completedCount = Number(Boolean(answers.area)) + Number(Boolean(answers.income)) + Number(Boolean(answers.budget));
  const isZeroBudget = answers.budget === 'zero';

  const fitScore =
    completedCount === 0 ? 0 : completedCount === 1 ? 42 : completedCount === 2 ? 74 : isZeroBudget ? 89 : 93;

  const archetypePreview = !areaData
    ? 'Aguardando sua primeira escolha'
    : isZeroBudget
      ? `${areaData.archetypeBase} (Capital Zero)`
      : answers.income === '7000-15000' || answers.income === '15000-plus'
        ? `${areaData.archetypeBase} · Foco em Escala`
        : areaData.archetypeBase;

  const matchedExample = !areaData
    ? 'Será revelado ao combinar área e capital inicial'
    : isZeroBudget || !answers.budget
      ? areaData.zeroModel
      : areaData.paidModel;

  const alignmentNote =
    incomeData && budgetData
      ? `Para buscar ${incomeData.label} começando com ${budgetData.label.toLowerCase()}, a IA prioriza modelos de validação rápida antes de qualquer custo fixo.`
      : 'Cada clique calibra o espelho ao lado para mostrar um negócio compatível com a sua realidade.';

  return {
    completedCount,
    fitScore,
    archetypePreview,
    matchedExample,
    firstWinWindow: areaData?.firstWinWindow ?? 'Definido após escolha',
    firstStepTip: areaData?.firstStepTip ?? '',
    incomeLabel: incomeData?.label ?? 'Ainda não definida',
    budgetLabel: budgetData?.badge ?? 'Ainda não definido',
    alignmentNote,
  };
}

export function BussolaSalesFunnel({ product }: { product: PaidProduct }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<SimulatorState>({});
  const [selectedTier, setSelectedTier] = useState<OfferTier>('complete');

  const isComplete = Boolean(answers.area && answers.income && answers.budget);
  const snapshot = useMemo(() => computeLiveSnapshot(answers), [answers]);

  function scrollToSimulator(): void {
    document.getElementById('simulador-bussola')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  function resetSimulator(): void {
    setAnswers({});
    setStepIndex(0);
  }

  const checkoutHrefWithTier = `${product.checkoutRoute}?tier=${selectedTier}`;

  return (
    <div className="space-y-10">
      <header className="relative overflow-hidden rounded-3xl border border-border bg-surface/95 p-6 shadow-sm backdrop-blur-md sm:p-10">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c2410c]/35 bg-[#c2410c]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#9a3412] dark:border-[#f97316]/40 dark:bg-[#f97316]/15 dark:text-[#fdba74]">
            <Sparkles size={13} aria-hidden="true" />
            <span>{product.title}</span>
          </span>
          <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground/75">
            Simulação gratuita em tempo real · sem cadastro
          </span>
        </div>

        <h1 className="mt-4 max-w-3xl font-playfair text-3xl font-bold leading-tight text-foreground sm:text-5xl">
          Imagine acordar sabendo exatamente qual negócio próprio construir — e vê-lo funcionando no seu ritmo.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg">
          A maioria das pessoas trava porque tenta copiar ideias que não cabem no próprio tempo, orçamento ou perfil. Antes de gastar energia no caminho errado, desenhe seu cenário abaixo e veja ao vivo um recorte do que a Bússola de Negócios IA monta para você.
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
              title: 'Primeiros resultados em 7 dias',
              body: 'Comece enxuto com segurança, valide a ideia na primeira semana e evolua com critério.',
            },
            {
              icon: Target,
              title: 'Diagnóstico personalizado por IA',
              body: '50 critérios cruzando capital, tempo, tecnologia, risco e perfil social para entregar seus 3 melhores caminhos.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-border bg-background/75 p-4">
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
            onClick={scrollToSimulator}
            className="inline-flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#c2410c] px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#9a3412] dark:bg-[#f97316] dark:text-[#090b10] dark:hover:bg-[#fb923c]"
          >
            <span>Desenhar meu negócio ideal agora (grátis)</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <span className="text-xs font-medium text-foreground/65">
            3 escolhas rápidas · o espelho do seu negócio monta ao vivo
          </span>
        </div>
      </header>

      <section
        id="simulador-bussola"
        data-testid="bussola-live-simulator"
        className="scroll-mt-24 rounded-3xl border border-[#c2410c]/30 bg-surface/95 p-5 shadow-sm backdrop-blur-md dark:border-[#f97316]/35 sm:p-8"
        aria-labelledby="simulador-bussola-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c2410c] dark:text-[#fb923c]">
              {isComplete ? 'Prévia personalizada pronta' : 'Espelho interativo do seu negócio'}
            </p>
            <h2 id="simulador-bussola-heading" className="mt-1 font-playfair text-2xl font-bold sm:text-4xl">
              {isComplete
                ? 'Aqui está o desenho inicial do seu negócio ideal'
                : 'Monte seu cenário e veja o modelo ganhar forma ao vivo'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {[
              { idx: 0, label: 'Área' },
              { idx: 1, label: 'Meta' },
              { idx: 2, label: 'Capital' },
            ].map((pill) => {
              const done =
                (pill.idx === 0 && Boolean(answers.area)) ||
                (pill.idx === 1 && Boolean(answers.income)) ||
                (pill.idx === 2 && Boolean(answers.budget));
              const active = !isComplete && stepIndex === pill.idx;
              return (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => {
                    if (pill.idx === 0 || (pill.idx === 1 && answers.area) || (pill.idx === 2 && answers.income)) {
                      setStepIndex(pill.idx);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    done
                      ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : active
                        ? 'border-[#c2410c] bg-[#c2410c] text-white dark:border-[#f97316] dark:bg-[#f97316] dark:text-[#090b10]'
                        : 'border-border bg-background/70 text-foreground/60'
                  }`}
                >
                  <span>{pill.label}</span>
                </button>
              );
            })}
            {(stepIndex > 0 || isComplete) && (
              <button
                type="button"
                onClick={resetSimulator}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground/70 transition hover:border-[#c2410c] hover:text-[#c2410c] dark:hover:border-[#f97316] dark:hover:text-[#fb923c]"
                aria-label="Refazer simulação"
                title="Refazer simulação"
              >
                <RotateCcw size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.95fr] lg:items-start">
          <div>
            {!isComplete ? (
              <>
                {stepIndex === 0 && (
                  <div>
                    <h3 className="text-xl font-bold sm:text-2xl">
                      Qual universo mais combina com o negócio que você quer construir?
                    </h3>
                    <p className="mt-1.5 text-sm text-foreground/70">
                      Toque em uma opção e observe o cartão ao lado começar a desenhar o seu perfil.
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {AREA_CHOICES.map((option) => {
                        const Icon = option.icon;
                        const active = answers.area === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => selectArea(option.id)}
                            className={`group flex flex-col rounded-2xl border p-4 text-left transition hover:border-[#c2410c] hover:bg-[#c2410c]/5 dark:hover:border-[#f97316] dark:hover:bg-[#f97316]/10 ${
                              active
                                ? 'border-[#c2410c] bg-[#c2410c]/10 dark:border-[#f97316] dark:bg-[#f97316]/15'
                                : 'border-border bg-background/80'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#c2410c]/12 text-[#c2410c] dark:bg-[#f97316]/15 dark:text-[#fb923c]">
                                <Icon size={16} aria-hidden="true" />
                              </span>
                              <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-bold text-foreground/65">
                                {option.tag}
                              </span>
                            </div>
                            <span className="mt-3 text-sm font-bold text-foreground">{option.label}</span>
                            <span className="mt-1 text-xs leading-relaxed text-foreground/70">{option.detail}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {stepIndex === 1 && (
                  <div>
                    <h3 className="text-xl font-bold sm:text-2xl">
                      Qual renda mensal já mudaria sua tranquilidade hoje?
                    </h3>
                    <p className="mt-1.5 text-sm text-foreground/70">
                      Isso define se faz mais sentido começar por caixa rápido, renda recorrente ou ativo escalável.
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
                              : 'border-border bg-background/80'
                          }`}
                        >
                          <span className="text-[11px] font-bold uppercase tracking-wide text-[#c2410c] dark:text-[#fb923c]">
                            {option.lifestyle}
                          </span>
                          <span className="mt-1 text-base font-bold text-foreground">{option.label}</span>
                          <span className="mt-1 text-xs leading-relaxed text-foreground/70">{option.detail}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setStepIndex(0)}
                      className="mt-5 text-xs font-bold text-foreground/70 underline hover:text-foreground"
                    >
                      Alterar área escolhida
                    </button>
                  </div>
                )}

                {stepIndex === 2 && (
                  <div>
                    <h3 className="text-xl font-bold sm:text-2xl">
                      Quanto você prefere investir no começo para testar sem pressão?
                    </h3>
                    <p className="mt-1.5 text-sm text-foreground/70">
                      Adaptamos o modelo ao seu limite real — começar com R$ 0 é totalmente possível.
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
                              : 'border-border bg-background/80'
                          }`}
                        >
                          <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                            {option.badge}
                          </span>
                          <span className="mt-1 text-sm font-bold text-foreground">{option.label}</span>
                          <span className="mt-1 text-xs leading-relaxed text-foreground/70">{option.detail}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setStepIndex(1)}
                      className="mt-5 text-xs font-bold text-foreground/70 underline hover:text-foreground"
                    >
                      Alterar meta de renda
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                    Perfil identificado na prévia
                  </p>
                  <p className="mt-2 font-playfair text-2xl font-bold text-foreground">
                    {snapshot.archetypePreview}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                    {snapshot.alignmentNote}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#c2410c]/30 bg-background/85 p-5 dark:border-[#f97316]/35">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c2410c] dark:text-[#fb923c]">
                    1ª direção compatível revelada
                  </p>
                  <p className="mt-2 text-lg font-bold text-foreground">{snapshot.matchedExample}</p>
                  <p className="mt-2 text-xs leading-relaxed text-foreground/75">
                    <strong className="text-foreground">Ação prática de hoje:</strong> {snapshot.firstStepTip}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background/75 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground/65">
                    O que está trancado no Diagnóstico Completo por IA
                  </p>
                  <ul className="mt-3 grid gap-2.5 text-sm text-foreground/85 sm:grid-cols-2">
                    {[
                      'Cruzamento de 50 critérios reais (Capital, Tempo, Tecnologia, Risco e Perfil Social)',
                      'Diagnóstico personalizado gerado por IA conectando forças e alertas',
                      'Os 3 modelos exatos mais compatíveis com plano de 7 dias passo a passo',
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
            )}
          </div>

          <aside
            data-testid="bussola-live-mirror"
            className="rounded-2xl border border-border bg-background/90 p-5 shadow-sm"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-foreground/65">
                Rascunho vivo do seu negócio
              </p>
              <span className="rounded-full bg-[#c2410c]/12 px-2.5 py-0.5 text-xs font-bold text-[#c2410c] dark:bg-[#f97316]/15 dark:text-[#fb923c]">
                {snapshot.fitScore > 0 ? `${snapshot.fitScore}% calibrado` : 'Pronto para iniciar'}
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-border" aria-hidden="true">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#c2410c] to-emerald-500 transition-all duration-300 dark:from-[#f97316]"
                style={{ width: `${Math.max(snapshot.fitScore, 10)}%` }}
              />
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-border/80 bg-surface/65 p-3">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-foreground/55">
                  Perfil em formação
                </dt>
                <dd className="mt-1 font-bold text-foreground">{snapshot.archetypePreview}</dd>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-border/80 bg-surface/65 p-3">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-foreground/55">
                    Meta mensal
                  </dt>
                  <dd className="mt-1 text-xs font-bold text-foreground">{snapshot.incomeLabel}</dd>
                </div>
                <div className="rounded-xl border border-border/80 bg-surface/65 p-3">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-foreground/55">
                    Janela 1ª validação
                  </dt>
                  <dd className="mt-1 text-xs font-bold text-foreground">{snapshot.firstWinWindow}</dd>
                </div>
              </div>
              <div className="rounded-xl border border-border/80 bg-surface/65 p-3">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-foreground/55">
                  Direção sugerida
                </dt>
                <dd className="mt-1 text-xs font-semibold leading-relaxed text-foreground/85">
                  {snapshot.matchedExample}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {isComplete ? (
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
          aria-label="Desbloqueio liberado após concluir a simulação"
          className="rounded-3xl border border-dashed border-border bg-surface/65 p-6 text-center sm:p-8"
        >
          <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-[#c2410c] dark:text-[#fb923c]">
            <Lock size={18} aria-hidden="true" />
          </span>
          <h3 className="mt-3 font-playfair text-2xl font-bold text-foreground">
            Complete as 3 escolhas no espelho acima para liberar seu pré-diagnóstico
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-foreground/70">
            Antes de apresentar qualquer opção de acesso, queremos mostrar uma prévia real de como a Bússola de Negócios IA enxerga o seu momento.
          </p>
          <button
            type="button"
            onClick={scrollToSimulator}
            className="mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#c2410c] px-5 py-2.5 text-sm font-bold text-[#9a3412] transition hover:bg-[#c2410c] hover:text-white dark:border-[#f97316] dark:text-[#fdba74] dark:hover:bg-[#f97316] dark:hover:text-[#090b10]"
          >
            <span>Continuar montando meu negócio</span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </section>
      )}
    </div>
  );
}

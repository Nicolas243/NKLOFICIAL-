'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Lightbulb, Sparkles } from 'lucide-react';

type LabGoalId =
  | 'vendas'
  | 'atendimento'
  | 'conteudo'
  | 'estudo'
  | 'processos'
  | 'proposta';

type LabGoal = {
  id: LabGoalId;
  label: string;
  role: string;
  constraint: string;
  verification: string;
};

const LAB_GOALS: readonly LabGoal[] = [
  {
    id: 'vendas',
    label: 'Crescer vendas e clareza da oferta',
    role: 'Consultor prático de posicionamento e comunicação comercial sem promessas exageradas',
    constraint: 'Não use urgência falsa, gatilhos agressivos ou promessas de ganho garantido.',
    verification: 'Peça para listar as 3 principais objeções reais do cliente e como respondê-las com fatos.',
  },
  {
    id: 'atendimento',
    label: 'Atender clientes no WhatsApp ou e-mail',
    role: 'Especialista em atendimento cordial, objetivo e resolutivo',
    constraint: 'Respostas curtas (até 90 palavras), tom humano, sem jargões corporativos.',
    verification: 'Peça uma versão alternativa caso o cliente diga que achou caro ou precise pensar.',
  },
  {
    id: 'conteudo',
    label: 'Criar roteiros e conteúdos que ensinam',
    role: 'Editor de conteúdo educacional focado em utilidade prática nos primeiros 10 segundos',
    constraint: 'Evite introduções genéricas ("no mundo de hoje"). Comece por um problema concreto.',
    verification: 'Peça para marcar quais exemplos são ilustrativos e quais dados precisam de fonte antes de gravar.',
  },
  {
    id: 'estudo',
    label: 'Aprender um assunto complexo rápido',
    role: 'Tutor socrático que explica em camadas simples com exemplos do cotidiano',
    constraint: 'Não despeje teoria longa de uma vez; use analogias concretas e 1 checagem prática no fim.',
    verification: 'Peça 3 perguntas de teste rápido para validar se você realmente entendeu antes de avançar.',
  },
  {
    id: 'processos',
    label: 'Organizar rotina e processos internos',
    role: 'Analista de operações focado em reduzir retrabalho e transformar tarefas soltas em checklist',
    constraint: 'Cada passo deve começar com verbo de ação e indicar o responsável ou ferramenta usada.',
    verification: 'Peça para apontar onde existe gargalo ou risco de esquecimento sem inventar etapas irreais.',
  },
  {
    id: 'proposta',
    label: 'Montar proposta de serviço ou parceria',
    role: 'Redator de propostas comerciais objetivas para freelancers e pequenas empresas',
    constraint: 'Deixe explícito escopo, prazo, entregáveis e o que NÃO está incluído no valor.',
    verification: 'Peça para revisar cláusulas ambíguas que poderiam gerar retrabalho gratuito.',
  },
] as const;

const OUTPUT_FORMATS = [
  'Checklist acionável em tópicos',
  'Tabela comparativa com critérios',
  'Roteiro passo a passo pronto para usar',
  'Texto curto com 2 variações de abordagem',
] as const;

export function AiPromptLab() {
  const [goalId, setGoalId] = useState<LabGoalId>('vendas');
  const [businessContext, setBusinessContext] = useState(
    'pequeno negócio ou prestação de serviço que busca mais clareza e novos clientes',
  );
  const [audience, setAudience] = useState('iniciantes e clientes locais que comparam preço e confiança');
  const [outputFormat, setOutputFormat] = useState<string>(OUTPUT_FORMATS[0]);
  const [copied, setCopied] = useState(false);

  const activeGoal = useMemo(
    () => LAB_GOALS.find((item) => item.id === goalId) ?? LAB_GOALS[0],
    [goalId],
  );

  const generatedPrompt = useMemo(() => {
    const context = businessContext.trim() || 'meu projeto atual';
    const target = audience.trim() || 'meu público principal';
    return [
      `1. Papel: Atue como ${activeGoal.role}.`,
      `2. Contexto: Estou trabalhando em ${context}.`,
      `3. Público-alvo: ${target}.`,
      `4. Objetivo principal: ${activeGoal.label}.`,
      `5. Formato da entrega: Entregue no formato "${outputFormat}", em português claro.`,
      `6. Regras e limites: ${activeGoal.constraint}`,
      `7. Verificação obrigatória: ${activeGoal.verification}`,
    ].join('\n');
  }, [activeGoal, audience, businessContext, outputFormat]);

  async function copyGeneratedPrompt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      aria-labelledby="ai-prompt-lab-heading"
      className="rounded-3xl border border-neon/35 bg-income-surface/95 p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles size={16} className="text-neon" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">
          Laboratório Prático · Aprenda enquanto monta seu pedido
        </p>
      </div>
      <h2 id="ai-prompt-lab-heading" className="mt-2 font-playfair text-3xl font-bold sm:text-4xl">
        Monte um pedido profissional e entenda por que ele funciona
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/75 sm:text-base">
        Em vez de digitar frases genéricas e receber respostas vagas, preencha os 4 blocos abaixo.
        Veja ao lado como cada peça transforma a qualidade da resposta da IA em qualquer negócio.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 rounded-2xl border border-border bg-background/80 p-5">
          <label className="block text-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">
              1. O que você quer resolver hoje
            </span>
            <select
              value={goalId}
              onChange={(event) => setGoalId(event.target.value as LabGoalId)}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-neon"
            >
              {LAB_GOALS.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">
              2. Seu negócio, trabalho ou projeto
            </span>
            <textarea
              rows={2}
              value={businessContext}
              onChange={(event) => setBusinessContext(event.target.value)}
              placeholder="Ex.: oficina de luthieria, loja de templates no Notion, aulas particulares..."
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-neon"
            />
          </label>

          <label className="block text-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">
              3. Para quem é a resposta (público)
            </span>
            <input
              type="text"
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
              placeholder="Ex.: pais de alunos iniciantes, pequenos lojistas, clientes B2B..."
              className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-neon"
            />
          </label>

          <label className="block text-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">
              4. Formato de saída fácil de conferir
            </span>
            <select
              value={outputFormat}
              onChange={(event) => setOutputFormat(event.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-neon"
            >
              {OUTPUT_FORMATS.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-background/90 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange">
              Pedido estruturado pronto para colar
            </p>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-surface p-4 text-xs leading-relaxed text-foreground">
              {generatedPrompt}
            </pre>
            <button
              type="button"
              onClick={() => void copyGeneratedPrompt()}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-neon px-4 py-2 text-sm font-bold text-black hover:opacity-90"
            >
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              <span>{copied ? 'Pedido copiado!' : 'Copiar pedido e testar na minha IA'}</span>
            </button>
          </div>

          <div className="rounded-xl border border-orange/30 bg-orange/5 p-4 text-xs leading-relaxed text-foreground/85">
            <p className="flex items-center gap-1.5 font-bold text-orange">
              <Lightbulb size={15} aria-hidden="true" />
              <span>Por que esse modelo ensina a usar IA de verdade</span>
            </p>
            <ul className="mt-2 space-y-1.5">
              <li><strong>Papel + Contexto:</strong> corta respostas genéricas de manual.</li>
              <li><strong>Limites claros:</strong> impede que a IA invente números ou faça promessas irreais.</li>
              <li><strong>Verificação obrigatória:</strong> força o modelo a apontar lacunas antes de você decidir.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

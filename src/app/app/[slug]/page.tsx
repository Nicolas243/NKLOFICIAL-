import type { Metadata } from 'next';
import { and, desc, eq } from 'drizzle-orm';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Layers, ShieldCheck } from 'lucide-react';
import { AiPromptCard } from '@/components/ai/ai-prompt-card';
import { AiPromptLab } from '@/components/ai/ai-prompt-lab';
import { StandalonePwaInstallButton } from '@/components/member/standalone-pwa-install-button';
import { BusinessMatchmaker } from '@/components/quiz/business-matchmaker';
import { GuideAssetDownloads } from '@/components/sales/guide-asset-downloads';
import { LanguageAiAndPlanner } from '@/components/sales/language-ai-and-planner';
import { ClipboardCopy } from '@/components/ui/clipboard-copy';
import { getProductBySlug, isValidProductSlug, type PaidProduct, type ProductSlug } from '@/config/products';
import { db } from '@/db';
import { guidePurchases, guideSubscriptions } from '@/db/schema';
import { getAiCourseModules } from '@/lib/ai-course';
import { AI_PROMPTS } from '@/lib/ai-prompts';
import { isUndefinedTableError, requireProductAccess } from '@/lib/entitlements';
import { GUIDE_ASSETS, getGuideAssetsForOffer, type GuideAsset } from '@/lib/guide-assets';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Área Exclusiva do App',
  robots: { index: false, follow: false },
};

type AppToolPageProps = {
  params: Promise<{ slug: string }>;
};

const BUSSOLA_SEVEN_DAY_PLAN = [
  {
    days: 'Dias 1 e 2',
    title: 'Definir teto de tempo e capital',
    description:
      'Escolha uma única frente compatível com sua rotina semanal e defina quanto você pode testar sem pressionar as contas fixas.',
  },
  {
    days: 'Dias 3 e 4',
    title: 'Preparar perfil e critérios mínimos',
    description:
      'Revise apresentação, idioma exigido, equipamentos necessários e regras de pagamento antes de abrir cadastro ou enviar propostas.',
  },
  {
    days: 'Dias 5 a 7',
    title: 'Executar primeiro ciclo com registro',
    description:
      'Acompanhe horas gastas, aprovações e dificuldades reais para ajustar a escolha com base em evidências da primeira semana.',
  },
] as const;

const BUSSOLA_ANTI_REJECTION_CHECKS = [
  'Perfil preenchido com coerência entre habilidades reais, cidade e disponibilidade.',
  'Documentos e meios de recebimento conferidos antes de iniciar tarefas ou candidaturas.',
  'Amostras curtas e verdadeiras, sem copiar descrições genéricas nem prometer resultados irreais.',
  'Separação clara entre frentes sem custo inicial e frentes que exigem investimento ou equipamento.',
  'Leitura das regras de revisão, prazos e suporte da plataforma escolhida.',
] as const;

const BUSSOLA_WEEKLY_TRACKER = [
  ['Semana 1', 'Triagem e preparo de perfil', '4 a 6 horas', 'Cadastro aprovado / rascunho pronto'],
  ['Semana 2', 'Primeiras entregas ou candidaturas', '4 a 6 horas', 'Registro de envios e retornos'],
  ['Semana 3', 'Ajuste de rotina e ritmo', '5 a 8 horas', 'Tempo médio por atividade medido'],
  ['Semana 4', 'Decisão de manter ou trocar frente', '5 a 8 horas', 'Balanço claro de esforço x retorno'],
] as const;

const AI_TOOL_CHECKLISTS = [
  {
    title: 'Antes de enviar um pedido',
    items: [
      'Defina o resultado esperado em uma frase.',
      'Remova dados pessoais, senhas e informações confidenciais.',
      'Informe público, contexto e limites do texto.',
      'Peça um formato fácil de conferir.',
    ],
  },
  {
    title: 'Antes de confiar na resposta',
    items: [
      'Separe o que é fato, hipótese e sugestão.',
      'Confira datas e fontes originais quando o tema for atual.',
      'Avalie o impacto de um erro antes de usar o conteúdo.',
      'Peça segunda opinião humana em decisões críticas.',
    ],
  },
  {
    title: 'Antes de publicar ou executar',
    items: [
      'Revise clareza, tom e direitos de uso.',
      'Teste uma mudança pequena e reversível primeiro.',
      'Confirme que nenhum número ou exemplo foi inventado.',
      'Registre o próximo passo prático da tarefa.',
    ],
  },
] as const;

const LANGUAGE_TUTOR_PROMPT = `Atue como tutor prático de inglês para conversação e trabalho remoto.
Meu nível atual é [iniciante/intermediário] e meu objetivo hoje é [entrevista / e-mail / atendimento].
1. Me faça uma pergunta curta por vez em inglês.
2. Quando eu responder, corrija com delicadeza, explique o porquê em português e me dê uma versão mais natural.
3. Só avance para a próxima pergunta quando eu repetir a frase corrigida.`;

const INCOME_TEMPLATE_PT = `Olá! Trabalho com organização de conteúdos, revisão em português e apoio operacional remoto. Tenho disponibilidade de [X horas por semana], entrego dentro do prazo combinado e posso enviar uma amostra curta antes de fecharmos o primeiro trabalho.`;

const INCOME_TEMPLATE_EN = `Hello! I support remote teams with structured content review, QA testing, and clear written communication in Portuguese and English. I am available [X hours/week] and happy to complete a short sample task before starting.`;

async function readUserGuideDownloadsForSlug(
  userId: string,
  slug: ProductSlug,
): Promise<{ assets: readonly GuideAsset[]; remainingDownloads: number } | null> {
  if (
    slug !== 'pacote-renda-extra' &&
    slug !== 'ebook-ingles' &&
    slug !== 'pacote-idiomas-ia'
  ) {
    return null;
  }

  try {
    const [purchases, subs] = await Promise.all([
      db
        .select({
          offerVariant: guidePurchases.offerVariant,
          downloadCount: guidePurchases.downloadCount,
          maxDownloads: guidePurchases.maxDownloads,
        })
        .from(guidePurchases)
        .where(
          and(
            eq(guidePurchases.userId, userId),
            eq(guidePurchases.status, 'approved'),
          ),
        )
        .orderBy(desc(guidePurchases.createdAt)),
      db
        .select({
          offerVariant: guideSubscriptions.offerVariant,
          downloadCount: guideSubscriptions.downloadCount,
          maxDownloads: guideSubscriptions.maxDownloads,
        })
        .from(guideSubscriptions)
        .where(
          and(
            eq(guideSubscriptions.userId, userId),
            eq(guideSubscriptions.status, 'active'),
          ),
        )
        .orderBy(desc(guideSubscriptions.createdAt)),
    ]);

    const rows = [...purchases, ...subs];
    if (rows.length === 0) return null;

    const allowedAssetIds = new Set<string>();
    for (const row of rows) {
      for (const asset of getGuideAssetsForOffer(row.offerVariant)) {
        allowedAssetIds.add(asset.id);
      }
    }

    const skuAllowedIds =
      slug === 'pacote-renda-extra'
        ? new Set([
            'guia-essencial-renda-extra-2027',
            'escudo-black-friday',
            'dinheiro-para-ontem',
            'raiox-financeiro-mobile',
            'raiox-financeiro-computador',
          ])
        : new Set(['ingles-para-ganhar-dinheiro']);

    const assets = GUIDE_ASSETS.filter(
      (asset) => allowedAssetIds.has(asset.id) && skuAllowedIds.has(asset.id),
    );
    if (assets.length === 0) return null;

    const totalRemaining = rows.reduce(
      (sum, row) => sum + Math.max(row.maxDownloads - row.downloadCount, 0),
      0,
    );

    return {
      assets,
      remainingDownloads: totalRemaining,
    };
  } catch (error) {
    if (isUndefinedTableError(error)) {
      return null;
    }
    console.error('[APP_WORKSPACE] Erro ao carregar downloads do guia:', error);
    return null;
  }
}

function BussolaWorkspace() {
  return (
    <div className="space-y-10">
      <section aria-labelledby="bussola-tool-heading" className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-400">
            Bússola de Negócios · Ferramenta Interativa
          </p>
          <h2 id="bussola-tool-heading" className="mt-1 font-playfair text-2xl font-bold text-slate-50 sm:text-3xl">
            Compare caminhos pela sua disponibilidade real
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
            Responda os critérios abaixo para organizar tempo, capital inicial, tecnologia e tolerância a risco em um plano prático.
          </p>
        </div>
        <div className="text-foreground">
          <BusinessMatchmaker />
        </div>
      </section>

      <section aria-labelledby="bussola-7days-heading" className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
          Bônus incluído
        </p>
        <h2 id="bussola-7days-heading" className="mt-1 font-playfair text-2xl font-bold text-slate-50">
          Plano de ação prático para os primeiros 7 dias
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {BUSSOLA_SEVEN_DAY_PLAN.map((step) => (
            <article key={step.days} className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-400">{step.days}</p>
              <h3 className="mt-2 text-lg font-bold text-slate-100">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="bussola-checklist-heading" className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <h2 id="bussola-checklist-heading" className="font-playfair text-2xl font-bold text-slate-50">
            Checklist anti-reprovação
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Revise estes cinco pontos antes de enviar seu perfil ou começar uma frente nova:
          </p>
          <ul className="mt-5 space-y-3">
            {BUSSOLA_ANTI_REJECTION_CHECKS.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-sm text-slate-200">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="bussola-tracker-heading" className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <h2 id="bussola-tracker-heading" className="font-playfair text-2xl font-bold text-slate-50">
            Tracker semanal de execução e validação
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Use esta referência de quatro semanas para acompanhar ritmo e evidências reais:
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pr-3">Etapa</th>
                  <th className="py-2.5 pr-3">Foco</th>
                  <th className="py-2.5 pr-3">Meta</th>
                  <th className="py-2.5">Evidência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {BUSSOLA_WEEKLY_TRACKER.map(([week, focus, goal, evidence]) => (
                  <tr key={week}>
                    <td className="py-3 pr-3 font-bold text-sky-400">{week}</td>
                    <td className="py-3 pr-3">{focus}</td>
                    <td className="py-3 pr-3 whitespace-nowrap text-slate-300">{goal}</td>
                    <td className="py-3 text-slate-300">{evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function FerramentaIaWorkspace() {
  return (
    <div className="space-y-10">
      <AiPromptLab />
      <section aria-labelledby="ia-checklists-heading" className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-400">
            Checklists operacionais
          </p>
          <h2 id="ia-checklists-heading" className="mt-1 font-playfair text-2xl font-bold text-slate-50 sm:text-3xl">
            Listas de conferência rápida antes de agir
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {AI_TOOL_CHECKLISTS.map((group) => (
            <article key={group.title} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
              <h3 className="text-lg font-bold text-slate-100">{group.title}</h3>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-300">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <ShieldCheck size={16} className="mt-1 shrink-0 text-sky-400" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="ia-prompts-heading" className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
            Biblioteca organizada
          </p>
          <h2 id="ia-prompts-heading" className="mt-1 font-playfair text-2xl font-bold text-slate-50 sm:text-3xl">
            Prompts editáveis por objetivo e contexto
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Copie qualquer modelo abaixo, preencha os campos entre chaves e use os critérios de qualidade para revisar a resposta.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {AI_PROMPTS.map((prompt) => (
            <AiPromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      </section>
    </div>
  );
}

function CursoIaWorkspace() {
  const modules = getAiCourseModules();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-sky-500/35 bg-slate-900/90 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-400">
              7 módulos em português
            </p>
            <h2 className="mt-1 font-playfair text-2xl font-bold text-slate-50 sm:text-3xl">
              Ambiente completo de aulas e progresso
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Abra cada módulo em sequência ou vá direto ao tema que precisa resolver hoje. Suas lições concluídas ficam salvas na conta.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/ia/curso"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-sky-300"
            >
              <span>Abrir ambiente completo do curso</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/ia/progresso"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-100 hover:border-sky-400"
            >
              <span>Ver meu progresso</span>
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="course-modules-heading">
        <h2 id="course-modules-heading" className="mb-4 font-playfair text-2xl font-bold text-slate-50">
          Módulos do curso
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((courseModule, index) => (
            <article key={courseModule.slug} className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-400">
                    Módulo {String(index + 1).padStart(2, '0')}
                  </p>
                  <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                    {courseModule.unlockAfterDays === 0
                      ? 'Liberado no Dia 1'
                      : `Semana ${Math.ceil(courseModule.unlockAfterDays / 7) + 1} · Dia ${courseModule.unlockAfterDays}`}
                  </span>
                </div>
                <h3 className="mt-2 text-xl font-bold text-slate-100">{courseModule.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{courseModule.summary}</p>
                <p className="mt-2 text-xs font-semibold text-orange-300">{courseModule.notebookLmFormat}</p>
                <ul className="mt-4 space-y-1.5 border-t border-slate-800 pt-4 text-xs text-slate-300">
                  {courseModule.lessons.map((lesson) => (
                    <li key={lesson.id} className="flex items-center gap-2">
                      <BookOpen size={14} className="shrink-0 text-sky-400" aria-hidden="true" />
                      <span>{lesson.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-5">
                <Link
                  href={`/ia/curso/${courseModule.slug}`}
                  className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-sky-400 hover:underline"
                >
                  <span>Estudar módulo</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function PacoteIdiomasIaWorkspace({
  downloads,
}: {
  downloads: { assets: readonly GuideAsset[]; remainingDownloads: number } | null;
}) {
  return (
    <div className="space-y-8">
      {downloads && (
        <section className="rounded-2xl border border-emerald-500/35 bg-slate-900/90 p-6">
          <h2 className="font-playfair text-2xl font-bold text-slate-50">
            Download personalizado do seu e-book
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Cada arquivo recebe sua identificação de acesso no momento do download.
          </p>
          <GuideAssetDownloads
            assets={downloads.assets}
            initialRemainingDownloads={downloads.remainingDownloads}
          />
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-400">
            Rotina diária de 15 minutos
          </p>
          <h2 className="mt-2 font-playfair text-2xl font-bold text-slate-50">
            Como treinar sem sobrecarga
          </h2>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
            <li><strong className="text-slate-100">Minutos 1 a 5:</strong> Leia uma lição curta do guia de inglês e ouça a pronúncia dos exemplos.</li>
            <li><strong className="text-slate-100">Minutos 6 a 10:</strong> Troque uma palavra por um detalhe real da sua rotina e fale em voz alta.</li>
            <li><strong className="text-slate-100">Minutos 11 a 15:</strong> Cole o prompt tutor na sua IA de preferência para simular diálogo e corrigir erros.</li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/guias/ingles/ebook"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-sky-300"
            >
              <span>Abrir leitor de amostra e sumário</span>
            </Link>
            <Link
              href="/blog/aprender/ingles"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-100 hover:border-sky-400"
            >
              <span>Guia de apoio em inglês</span>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">
            Simulação por voz e texto
          </p>
          <h2 className="mt-2 font-playfair text-2xl font-bold text-slate-50">
            Prompt de tutora de idiomas para qualquer IA
          </h2>
          <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-xs leading-relaxed text-slate-200">
            {LANGUAGE_TUTOR_PROMPT}
          </pre>
          <div className="mt-4">
            <ClipboardCopy textToCopy={LANGUAGE_TUTOR_PROMPT} label="Copiar prompt de tutora" />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
        <h2 className="font-playfair text-2xl font-bold text-slate-50">
          Trilhas dos próximos idiomas do portal
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Aproveite os roteiros abertos de base enquanto acompanha a coleção completa de idiomas:
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {[
            ['/blog/aprender/espanhol', 'Espanhol'],
            ['/blog/aprender/frances', 'Francês'],
            ['/blog/aprender/italiano', 'Italiano'],
            ['/blog/aprender/alemao', 'Alemão'],
            ['/blog/aprender/chines', 'Mandarim'],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-bold text-slate-100 hover:border-sky-400 hover:text-sky-300"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
      <LanguageAiAndPlanner language="Idiomas com IA" slug="ingles" />
    </div>
  );
}

function PacoteRendaExtraWorkspace({
  downloads,
}: {
  downloads: { assets: readonly GuideAsset[]; remainingDownloads: number } | null;
}) {
  return (
    <div className="space-y-8">
      {downloads && (
        <section className="rounded-2xl border border-emerald-500/35 bg-slate-900/90 p-6">
          <h2 className="font-playfair text-2xl font-bold text-slate-50">
            Seus arquivos personalizados do pacote
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Baixe seus cadernos em PDF e planilhas Raio-X Financeiro diretamente abaixo.
          </p>
          <GuideAssetDownloads
            assets={downloads.assets}
            initialRemainingDownloads={downloads.remainingDownloads}
          />
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">
            Apresentação pronta
          </p>
          <h2 className="mt-2 font-playfair text-2xl font-bold text-slate-50">
            Templates em português e inglês
          </h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-400">Português</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{INCOME_TEMPLATE_PT}</p>
              <div className="mt-3">
                <ClipboardCopy textToCopy={INCOME_TEMPLATE_PT} label="Copiar modelo em português" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-400">Inglês</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{INCOME_TEMPLATE_EN}</p>
              <div className="mt-3">
                <ClipboardCopy textToCopy={INCOME_TEMPLATE_EN} label="Copiar modelo em inglês" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-400">
            Ordem de envio
          </p>
          <h2 className="mt-2 font-playfair text-2xl font-bold text-slate-50">
            Checklist antes de enviar seu perfil
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
            {BUSSOLA_ANTI_REJECTION_CHECKS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/programas"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-sky-300"
            >
              <span>Comparar plataformas no catálogo</span>
            </Link>
            <Link
              href="/programas/iniciantes"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-100 hover:border-sky-400"
            >
              <span>Opções sem custo inicial</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function EbookInglesWorkspace({
  downloads,
}: {
  downloads: { assets: readonly GuideAsset[]; remainingDownloads: number } | null;
}) {
  return (
    <div className="space-y-8">
      {downloads && (
        <section className="rounded-2xl border border-emerald-500/35 bg-slate-900/90 p-6">
          <h2 className="font-playfair text-2xl font-bold text-slate-50">
            Download do E-book em PDF A5 personalizado
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Seu arquivo já sai com os dados da compra e leitura confortável no celular.
          </p>
          <GuideAssetDownloads
            assets={downloads.assets}
            initialRemainingDownloads={downloads.remainingDownloads}
          />
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-400">
            Plano de 90 dias
          </p>
          <h2 className="mt-2 font-playfair text-2xl font-bold text-slate-50">
            Constância em três blocos práticos
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-bold text-slate-100">Dias 1 a 30 · Destravar leitura e voz</p>
              <p className="mt-1">Leia 1 lição por dia, ouça a pronúncia e grave 30 segundos repetindo frases reais.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-bold text-slate-100">Dias 31 a 60 · Construir autonomia</p>
              <p className="mt-1">Adapte os exemplos coloridos para e-mails curtos, rotina de casa e mensagens de trabalho.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-bold text-slate-100">Dias 61 a 90 · Aplicar em portfólio simples</p>
              <p className="mt-1">Treine apresentações curtas, respostas de entrevista e revisões com apoio de IA.</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/guias/ingles/ebook"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-sky-300"
            >
              <span>Abrir leitor interativo</span>
            </Link>
            <Link
              href="/blog/aprender/ingles"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-100 hover:border-sky-400"
            >
              <span>Praticar estruturas essenciais</span>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">
            Parceira de conversa
          </p>
          <h2 className="mt-2 font-playfair text-2xl font-bold text-slate-50">
            Prompt para revisar suas frases no celular
          </h2>
          <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-xs leading-relaxed text-slate-200">
            {LANGUAGE_TUTOR_PROMPT}
          </pre>
          <div className="mt-4">
            <ClipboardCopy textToCopy={LANGUAGE_TUTOR_PROMPT} label="Copiar prompt de revisão" />
          </div>
        </section>
      </div>
      <LanguageAiAndPlanner language="Inglês" slug="ingles" />
    </div>
  );
}

function ProductDeliverablesSummary({ product }: { product: PaidProduct }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        <Layers size={15} aria-hidden="true" />
        <span>Incluído neste acesso</span>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400">Entregas principais</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {product.deliverables.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400">Bônus e apoios</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {product.bonuses.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-sky-400" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default async function PaidToolWorkspacePage({ params }: AppToolPageProps) {
  const { slug } = await params;
  if (!isValidProductSlug(slug)) {
    notFound();
  }

  const access = await requireProductAccess(slug);
  const product = getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const downloads = await readUserGuideDownloadsForSlug(access.userId, slug);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/minha-conta"
          className="inline-flex items-center gap-2 text-sm font-bold text-sky-400 hover:underline"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Voltar para Minha Conta</span>
        </Link>
        {access.userEmail && (
          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
            Conta conectada: {access.userEmail}
          </span>
        )}
      </div>

      <header className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {product.hasStandalonePwa && product.pwaIcon192 && (
              <Image
                src={product.pwaIcon192}
                alt={product.pwaBrandName ?? product.title}
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 rounded-2xl border border-slate-700 object-cover"
              />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-300">
                  Acesso ativo
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {product.badgeLabel}
                </span>
              </div>
              <h1 className="mt-3 font-playfair text-3xl font-bold text-slate-50 sm:text-5xl">
                {product.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
                {product.aspirationalLead}
              </p>
            </div>
          </div>

          {product.hasStandalonePwa && (
            <StandalonePwaInstallButton
              productSlug={product.slug}
              appName={product.pwaBrandName ?? product.title}
              iconSrc={product.pwaIcon192 ?? '/icons/portal-nkl-192.png'}
            />
          )}
        </div>
      </header>

      {slug === 'bussola-negocios' && <BussolaWorkspace />}
      {slug === 'ferramenta-ia' && <FerramentaIaWorkspace />}
      {slug === 'curso-ia-pratica' && <CursoIaWorkspace />}
      {slug === 'pacote-idiomas-ia' && <PacoteIdiomasIaWorkspace downloads={downloads} />}
      {slug === 'pacote-renda-extra' && <PacoteRendaExtraWorkspace downloads={downloads} />}
      {slug === 'ebook-ingles' && <EbookInglesWorkspace downloads={downloads} />}

      <ProductDeliverablesSummary product={product} />
    </div>
  );
}

'use client';

import { ArrowRight, BookOpen, FileSpreadsheet, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const MATERIALS = [
  {
    title: 'Guia Essencial Renda Extra 2027',
    format: 'PDF',
    description: 'Um mapa prático para comparar caminhos de renda extra, entender requisitos e escolher um primeiro passo possível.',
    icon: BookOpen,
  },
  {
    title: 'O Código de Novembro',
    format: 'PDF',
    description: 'Checklist editorial para organizar oportunidades, links importantes e decisões de curto prazo sem agir no impulso.',
    icon: BookOpen,
  },
  {
    title: 'Dinheiro Para Ontem',
    format: 'PDF',
    description: 'Orientações para priorizar ações que podem ser pesquisadas e testadas primeiro, com limites e cuidados claros.',
    icon: BookOpen,
  },
  {
    title: 'Escudo de Black Friday',
    format: 'PDF',
    description: 'Critérios para avaliar ofertas, identificar sinais de alerta e evitar decisões apressadas em períodos de promoção.',
    icon: ShieldCheck,
  },
  {
    title: 'Raio-X Financeiro',
    format: 'Planilhas mobile e computador',
    description: 'Duas versões para registrar entradas, saídas e próximos passos com uma visão mais simples da sua rotina financeira.',
    icon: FileSpreadsheet,
  },
] as const;

export function GuidePackagePreview() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  function usePackage(): void {
    setIsOpen(false);
    window.setTimeout(() => {
      document.getElementById('guide-offer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group mx-auto flex aspect-[3/4] w-full max-w-xs flex-col justify-between rounded-xl border border-orange/40 bg-[linear-gradient(145deg,#172554,#07152d)] p-6 text-left text-white shadow-2xl transition duration-300 hover:-translate-y-1 hover:border-orange hover:shadow-orange/20 focus-visible:outline-orange"
        aria-haspopup="dialog"
        aria-label="Ver os materiais incluídos no pacote de novembro"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-orange px-3 py-1 text-xs font-black uppercase text-white">PDF</span>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-orange-200">Portal NKL</span>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">Edição prática</p>
          <p className="mt-3 font-playfair text-4xl font-bold leading-tight">Pacote de novembro</p>
        </div>
        <div className="space-y-2 text-xs text-white/65">
          <p>5 materiais em um pacote</p>
          <p>Orientações práticas</p>
          <p className="flex items-center gap-2 text-orange-200 transition group-hover:text-white">
            Clique para ver o conteúdo <ArrowRight size={14} aria-hidden="true" />
          </p>
        </div>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[320] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-package-preview-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section className="max-h-[min(90vh,48rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-orange/35 bg-income-surface p-5 text-foreground shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Por dentro do pacote</p>
                <h2 id="guide-package-preview-title" className="mt-2 font-playfair text-3xl font-bold sm:text-4xl">O que você vai receber</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/70">
                  Cinco materiais para sair da pesquisa solta e organizar decisões, critérios e próximos passos.
                </p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-foreground/60 hover:bg-accent hover:text-foreground" aria-label="Fechar detalhes do pacote">
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {MATERIALS.map(({ title, format, description, icon: Icon }) => (
                <article key={title} className="rounded-xl border border-border bg-background/60 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange/12 text-orange" aria-hidden="true">
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="font-bold">{title}</h3>
                        <span className="text-xs font-bold uppercase tracking-wide text-orange">{format}</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-foreground/70">{description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-foreground/55">Acesso protegido após a confirmação do pagamento. Sem promessa de renda ou resultado financeiro.</p>
              <button type="button" onClick={usePackage} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-orange px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-dark">
                Aproveitar agora <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

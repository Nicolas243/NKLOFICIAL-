'use client';

import { useState, type FormEvent } from 'react';
import type { PartnerProgramCard } from '@/actions/partner-programs';

type Props = {
  program: PartnerProgramCard;
};

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/maqzkwwb';

function buildGuide(program: PartnerProgramCard): string {
  return [
    `Guia detalhado da oportunidade ${program.name}`,
    `Categoria: ${program.category}`,
    `Dificuldade: ${program.difficulty}`,
    `Nota editorial: ${program.editorialRating.toFixed(1)}/10`,
    `Potencial de ganho: ${program.earningPotential ?? program.averageEarning}`,
    `Descrição: ${program.longDescription}`,
    `Critérios editoriais: ${program.editorialSource}`,
    `Acesso: ${program.affiliateUrl ?? program.websiteUrl}`,
  ].join('\n\n');
}

export function LeadCaptureForm({ program }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (status === 'sending') return;

    setStatus('sending');
    const formData = new FormData(event.currentTarget);
    formData.set('program', program.name);
    formData.set('slug', program.slug);
    formData.set('guide', buildGuide(program));
    formData.set('_replyto', email);
    formData.set('_subject', `Guia detalhado: ${program.name}`);

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Falha ao enviar o guia.');
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6 md:p-8" aria-labelledby={`guide-${program.slug}`}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500 dark:text-orange-400">Material editorial</p>
      <h2 id={`guide-${program.slug}`} className="mt-2 font-playfair text-2xl font-bold md:text-3xl">Receba o guia detalhado de {program.name}</h2>
      {status === 'sent' ? (
        <p className="mt-4 text-sm leading-relaxed text-emerald-700 dark:text-emerald-300" role="status">
          Solicitação recebida. O guia foi encaminhado ao fluxo de atendimento configurado no Formspree.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-sm font-bold">
            Seu e-mail
            <input
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={255}
              className="mt-2 min-h-11 w-full rounded-md border border-border bg-income-surface px-3 font-normal"
            />
          </label>
          <button type="submit" disabled={status === 'sending'} className="min-h-11 rounded-md bg-orange-500 px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
            {status === 'sending' ? 'Enviando...' : 'Enviar guia'}
          </button>
        </form>
      )}
      {status === 'error' && <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">Não foi possível enviar agora. Tente novamente.</p>}
      <p className="mt-3 text-xs leading-relaxed opacity-60">Usaremos o e-mail somente para entregar este material. O envio é processado pelo Formspree.</p>
    </section>
  );
}

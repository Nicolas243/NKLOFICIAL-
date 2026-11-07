'use client';

import { FormEvent, useState } from 'react';
import { usePathname } from 'next/navigation';
import { isIncomePortalPath } from '@/lib/income-portal';

type Props = {
  context: string;
};

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/maqzkwwb';
const GUIDE_PATH = '/guias/guia-renda-extra-nkl.pdf';

export function LeadCaptureForm({ context }: Props) {
  const pathname = usePathname();
  const isIncomeContext = isIncomePortalPath(pathname)
    || context.includes('renda-extra')
    || context.includes('programa');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set('context', context);

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Não foi possível concluir o cadastro.');
      }

      setIsSuccess(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Não foi possível concluir o cadastro.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="footer-lead" className="rounded-2xl border border-neon/30 bg-neon/5 p-6 md:p-8" aria-labelledby="lead-capture-title">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">{isIncomeContext ? 'Guia gratuito' : 'Material de estudo'}</p>
      <h2 id="lead-capture-title" className="mt-2 font-playfair text-2xl font-bold md:text-3xl">{isIncomeContext ? 'Receba o PDF com o resumo prático e comparativo das oportunidades antes de se cadastrar' : 'Comece com mais contexto'}</h2>
      {isSuccess ? (
        <div className="mt-4" aria-live="polite">
          <p className="text-sm leading-relaxed">Cadastro confirmado! Baixe seu Guia de Renda Extra abaixo:</p>
          <a href={GUIDE_PATH} download="Guia_Renda_Extra_NKL.pdf" className="mt-4 inline-flex min-h-11 items-center rounded-md bg-neon px-5 py-3 text-sm font-bold text-black hover:opacity-90">
            Baixar Guia PDF
          </a>
        </div>
      ) : (
        <>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed opacity-75">
            {isIncomeContext ? 'Receba um resumo prático para comparar dificuldade, idioma, remuneração de referência e cuidados antes de se cadastrar.' : 'Receba um resumo prático para comparar dificuldade, idioma, remuneração de referência e cuidados antes de se cadastrar.'}
          </p>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="text-sm font-bold">
              Nome
              <input name="name" required maxLength={120} className="mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 font-normal" />
            </label>
            <label className="text-sm font-bold">
              E-mail
              <input name="email" type="email" required maxLength={255} className="mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 font-normal" />
            </label>
            <button type="submit" disabled={isSubmitting} className="min-h-11 rounded-md bg-neon px-5 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50">
              {isSubmitting ? 'Enviando...' : 'Quero receber'}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
          <p className="mt-3 text-xs leading-relaxed opacity-55">Usaremos seus dados somente para entregar o material e comunicações relacionadas. Você pode pedir a remoção a qualquer momento.</p>
        </>
      )}
    </section>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { submitPartnerSuggestion } from '@/actions/partner-programs';
import type { PortalSuggestionArea } from '@/lib/income-portal';

type SiteSuggestionFormProps = {
  area: PortalSuggestionArea;
  areaLabel: string;
  originPath: string | null;
  urlPlaceholder: string;
  reasonPlaceholder: string;
};

export function SiteSuggestionForm({
  area,
  areaLabel,
  originPath,
  urlPlaceholder,
  reasonPlaceholder,
}: SiteSuggestionFormProps) {
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitted(false);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      const contextTag = originPath
        ? `[Área: ${areaLabel} | Origem: ${originPath}]`
        : `[Área: ${areaLabel} | Slug: ${area}]`;
      formData.set('name', name.trim());
      formData.set('websiteUrl', websiteUrl.trim());
      formData.set('reason', `${contextTag} ${reason.trim()}`.trim());

      const result = await submitPartnerSuggestion(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setSubmitted(true);
      setName('');
      setWebsiteUrl('');
      setReason('');
    } catch {
      setError('Não foi possível enviar a sugestão agora. Tente novamente em instantes.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
      <div>
        <label htmlFor="suggestion-name" className="block text-xs font-bold uppercase tracking-[0.12em] text-foreground/70">
          Nome do site, canal ou ferramenta
        </label>
        <input
          id="suggestion-name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={160}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Chinês Já, Pleco, DW Learn German..."
          className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20"
        />
      </div>

      <div>
        <label htmlFor="suggestion-url" className="block text-xs font-bold uppercase tracking-[0.12em] text-foreground/70">
          Link do site (URL)
        </label>
        <input
          id="suggestion-url"
          name="websiteUrl"
          type="url"
          required
          maxLength={500}
          value={websiteUrl}
          onChange={(event) => setWebsiteUrl(event.target.value)}
          placeholder={urlPlaceholder}
          className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20"
        />
      </div>

      <div>
        <label htmlFor="suggestion-reason" className="block text-xs font-bold uppercase tracking-[0.12em] text-foreground/70">
          O que a ferramenta faz e por que ajuda o leitor (mínimo 10 palavras)
        </label>
        <textarea
          id="suggestion-reason"
          name="reason"
          required
          rows={4}
          maxLength={1500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={reasonPlaceholder}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark disabled:cursor-wait disabled:opacity-60"
      >
        <Send size={16} aria-hidden="true" />
        <span>{isSubmitting ? 'Enviando sugestão...' : 'Enviar sugestão para análise'}</span>
      </button>

      {submitted && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-200"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>Sugestão registrada para revisão editorial do Portal NKL. Obrigado por contribuir.</p>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-red-500/35 bg-red-500/10 p-3.5 text-sm font-medium text-red-900 dark:text-red-200">
          {error}
        </p>
      )}
    </form>
  );
}

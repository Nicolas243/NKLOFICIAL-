'use client';

import { useState } from 'react';
import type { AiPrompt } from '@/lib/ai-prompts';

export function AiPromptCard({ prompt }: { prompt: AiPrompt }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copyPrompt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(prompt.template);
      setCopyError(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <article className="rounded-2xl border border-border bg-surface/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-neon">{prompt.level}</p>
          <h2 className="mt-2 text-xl font-bold">{prompt.title}</h2>
        </div>
        <button type="button" onClick={() => void copyPrompt()} className="rounded-lg border border-border px-3 py-2 text-sm font-bold hover:border-neon hover:text-neon">
          {copied ? 'Copiado' : 'Copiar prompt'}
        </button>
      </div>
      <pre className="mt-5 whitespace-pre-wrap rounded-xl border border-border bg-background/70 p-4 text-sm leading-relaxed">{prompt.template}</pre>
      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wide opacity-60">Preencha estes campos</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {prompt.fields.map((field) => <span key={field} className="rounded-full bg-neon/10 px-2.5 py-1 text-xs font-semibold text-neon">{`{{${field}}}`}</span>)}
        </div>
      </div>
      <ul className="mt-4 space-y-1 text-sm opacity-75">
        {prompt.qualityCriteria.map((criterion) => <li key={criterion}>✓ {criterion}</li>)}
      </ul>
      {prompt.safetyNote && <p className="mt-4 rounded-lg border border-amber-300/30 bg-amber-300/5 p-3 text-xs leading-relaxed text-amber-100">{prompt.safetyNote}</p>}
      {copyError && <p role="status" className="mt-3 text-xs text-amber-200">Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.</p>}
    </article>
  );
}

'use client';

import { useRef, useState, useTransition } from 'react';
import { submitNewsSuggestion } from '@/actions/news-public';

const inputCls =
  'p-3 bg-background border border-border rounded-md focus:border-neon outline-none';

/**
 * Tarefa 9 — form de anúncio. As sugestões caem na fila de aprovação
 * (news_suggestions.status = 'pending') com sanitização no servidor.
 */
export function AnunciarForm() {
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const action = (formData: FormData) => {
    startTransition(async () => {
      const res = await submitNewsSuggestion(formData);
      setResult(res);
      if (res.success) {
        formRef.current?.reset();
      }
    });
  };

  return (
    <form ref={formRef} action={action} className="p-6 bg-surface border border-border rounded-xl flex flex-col gap-4">
      {result && (
        <p
          role="status"
          className={`p-3 rounded-lg text-sm font-medium ${
            result.success
              ? 'bg-green-500/10 border border-green-500/40 text-green-400'
              : 'bg-red-500/10 border border-red-500/40 text-red-400'
          }`}
        >
          {result.message}
        </p>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium opacity-80">Título</span>
        <input
          type="text"
          name="title"
          required
          maxLength={255}
          placeholder="Ex.: Vendo violino 4/4 com arco e estojo"
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium opacity-80">Texto do anúncio</span>
        <textarea
          name="contentOrLink"
          required
          rows={5}
          minLength={10}
          placeholder="Descreva o item/serviço, condições e como entrar em contato..."
          className={inputCls + ' resize-none'}
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium opacity-80">Imagem 1 (URL)</span>
          <input type="url" name="image1" placeholder="https://..." className={inputCls} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium opacity-80">Imagem 2 (URL, opcional)</span>
          <input type="url" name="image2" placeholder="https://..." className={inputCls} />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium opacity-80">Seu nome (opcional)</span>
        <input type="text" name="suggestedBy" maxLength={120} className={inputCls} />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="self-start px-8 py-3 bg-neon text-black rounded-md font-bold transition-all hover:scale-105 hover:shadow-lg hover:shadow-neon/30 disabled:opacity-50"
      >
        {isPending ? 'Enviando...' : 'Enviar anúncio para aprovação'}
      </button>

      <p className="text-xs opacity-60">
        Conteúdo impróprio ou ofensivo será removido. Ao enviar, você concorda com os{' '}
        <a href="/termos" className="text-neon font-bold hover:underline">
          Termos do Portal
        </a>
        .
      </p>
    </form>
  );
}
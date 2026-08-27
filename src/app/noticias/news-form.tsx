'use client';

import { submitNews } from '@/actions/news';
import { useTransition, useRef } from 'react';

export default function NewsForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const action = (formData: FormData) => {
    startTransition(async () => {
      try {
        await submitNews(formData);
        formRef.current?.reset();
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao processar publicação.');
      }
    });
  };

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <input 
        type="text" 
        name="title" 
        placeholder="Título da publicação" 
        required 
        className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
      />
      <textarea 
        name="content" 
        placeholder="Descreva as atualizações ou detalhes..." 
        required 
        rows={4}
        className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none resize-none"
      />
      <input 
        type="text" 
        name="tags" 
        placeholder="Tags (separadas por vírgula. Ex: Lançamento, Cordas)" 
        className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
      />
      <div className="upload-area">
        <span className="block mb-2 text-sm opacity-70">Selecione uma imagem (compressão automática WebP no servidor)</span>
        <input 
          type="file" 
          name="image" 
          accept="image/*" 
          required 
          className="w-full text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-neon file:text-black hover:file:bg-neon/80"
        />
      </div>
      <button 
        type="submit" 
        disabled={isPending}
        className="py-3 bg-text text-bg rounded-md font-bold transition-all disabled:opacity-50"
      >
        {isPending ? 'Otimizando e Publicando...' : 'Publicar Notícia'}
      </button>
    </form>
  );
}
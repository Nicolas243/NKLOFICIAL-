'use client'

import { submitNewsSuggestion } from '@/actions/news-public'
import { useRef, useState, useTransition } from 'react'

export default function SuggestNewsModal() {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const action = (formData: FormData) => {
    startTransition(async () => {
      const res = await submitNewsSuggestion(formData)
      setResult(res)
      if (res.success) {
        formRef.current?.reset()
        setTimeout(() => { setOpen(false); setResult(null) }, 2500)
      }
    })
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(true)}
        data-suggest-news
        className="fixed bottom-6 right-6 z-50 bg-neon text-black font-bold px-5 py-3 rounded-full shadow-xl shadow-neon/30 hover:scale-105 transition-transform flex items-center gap-2 text-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Quero noticiar algo
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { if (!isPending) setOpen(false) }}>
          <div className="bg-surface border border-border rounded-2xl shadow-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-playfair text-xl font-bold">Sugerir Notícia</h2>
              <button onClick={() => { if (!isPending) setOpen(false) }} className="opacity-50 hover:opacity-100 text-2xl leading-none">&times;</button>
            </div>

            {result && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${result.success ? 'bg-green-500/10 border border-green-500/40 text-green-400' : 'bg-red-500/10 border border-red-500/40 text-red-400'}`}>
                {result.message}
              </div>
            )}

            <form ref={formRef} action={action} className="flex flex-col gap-4">
              <input type="text" name="title" placeholder="Título da notícia" required maxLength={255}
                className="p-3 bg-background border border-border rounded-xl focus:border-neon focus:ring-1 focus:ring-neon outline-none text-text placeholder:text-text/40" />
              <textarea name="contentOrLink" placeholder="Conteúdo ou link da notícia (mín. 10 caracteres)" required rows={4}
                className="p-3 bg-background border border-border rounded-xl focus:border-neon focus:ring-1 focus:ring-neon outline-none text-text placeholder:text-text/40 resize-none" />
              <input type="text" name="suggestedBy" placeholder="Seu nome (opcional)"
                className="p-3 bg-background border border-border rounded-xl focus:border-neon focus:ring-1 focus:ring-neon outline-none text-text placeholder:text-text/40" />
              <button type="submit" disabled={isPending}
                className="py-3 bg-neon text-black rounded-xl font-bold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-neon/30 disabled:opacity-50">
                {isPending ? 'Enviando...' : 'Enviar Sugestão'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
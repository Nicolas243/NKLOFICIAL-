'use client'

import { useState, useTransition } from 'react'
import { registerWithProfile } from '@/actions/auth'

const STEPS = ['Conta', 'Perfil', 'Preferencias']
const INPUT = 'p-3.5 bg-black/20 border border-white/10 rounded-xl focus:border-neon focus:ring-1 focus:ring-neon outline-none text-text placeholder:text-text/40 transition-all'

export default function RegistroForm() {
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Estados persistentes dos passos anteriores: o FormData do último submit
  // precisa conter email/senha/perfil mesmo depois que o input foi desmontado.
  // (Bug corrigido: antes, os input dos passos 0/1 sumiam do DOM e o registro
  // falhava com "E-mail obrigatório e senha deve ter no mínimo 8 caracteres".)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [papel, setPapel] = useState('')
  const [instrumento, setInstrumento] = useState('')
  const [anosExperiencia, setAnosExperiencia] = useState('')
  const [newsletterOptIn, setNewsletterOptIn] = useState(false)

  const action = (formData: FormData) => {
    startTransition(async () => {
      try {
        const result = await registerWithProfile(formData)
        if (result.error) setError(result.error)
      } catch (err) {
        // redirect() do Next lança um erro especial (digest NEXT_REDIRECT).
        // Ele DEVE ser re-lançado para o Next concluir a navegação — engoli-lo
        // aqui quebrava o auto-login pós-registro com "NEXT_REDIRECT" na tela.
        const digest =
          err && typeof err === 'object' && 'digest' in err
            ? String((err as { digest?: unknown }).digest)
            : ''
        if (digest.startsWith('NEXT_REDIRECT')) {
          throw err
        }
        setError(err instanceof Error ? err.message : 'Erro ao criar conta.')
      }
    })
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Inputs ocultos SEMPRE presentes no form para o submit final */}
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="password" value={password} />
      <input type="hidden" name="fullName" value={fullName} />
      <input type="hidden" name="papel" value={papel} />
      <input type="hidden" name="instrumento" value={instrumento} />
      <input type="hidden" name="anosExperiencia" value={anosExperiencia} />
      {newsletterOptIn && <input type="hidden" name="newsletterOptIn" value="on" />}

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {STEPS.map((label, i) => {
          const isActive = i <= step
          return (
            <div key={i} className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-neon text-black' : 'bg-white/10 text-text/40'}`}>
                {i + 1}
              </span>
              <span className={`text-xs ${isActive ? 'text-text' : 'text-text/30'}`}>{label}</span>
              {i < STEPS.length - 1 && <span className="w-4 h-px bg-border" />}
            </div>
          )
        })}
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-lg text-red-400 text-sm text-center">{error}</div>}

      {/* STEP 0: Email + Senha + OAuth */}
      {step === 0 && (
        <>
          <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" required autoComplete="email" className={INPUT} />
          <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha (min. 8 caracteres)" required minLength={8} autoComplete="new-password" className={INPUT} />
          <input type="text" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome completo" required className={INPUT} />
          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-white/10" />
            <span className="text-xs opacity-40 uppercase tracking-wider">ou continue com</span>
            <span className="flex-1 h-px bg-white/10" />
          </div>
          <div className="flex gap-3">
            <a href="/api/auth/google" className="flex-1 py-3 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 hover:bg-white/20">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <span className="text-sm font-medium text-text">Google</span>
            </a>
            <a href="/api/auth/facebook" className="flex-1 py-3 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 hover:bg-white/20">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <span className="text-sm font-medium text-text">Facebook</span>
            </a>
          </div>
          <button type="button" onClick={() => setStep(1)} className="py-3.5 bg-neon text-black rounded-xl font-bold text-base hover:scale-[1.02] hover:shadow-lg hover:shadow-neon/30">
            Proximo → Perfil
          </button>
        </>
      )}

      {/* STEP 1: Perfil (papel, instrumento, experiencia) */}
      {step === 1 && (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm opacity-60">Qual o seu papel?</span>
            <select name="papel" value={papel} onChange={(e) => setPapel(e.target.value)} required className={INPUT}>
              <option value="">Selecione...</option>
              <option value="Musico">Musico</option>
              <option value="Lojista">Lojista</option>
              <option value="Luthier">Luthier</option>
              <option value="Professor">Professor</option>
              <option value="Aluno">Aluno</option>
            </select>
          </label>
          <input type="text" name="instrumento" value={instrumento} onChange={(e) => setInstrumento(e.target.value)} placeholder="Instrumento principal (ex: Violino)" required className={INPUT} />
          <input type="number" name="anosExperiencia" value={anosExperiencia} onChange={(e) => setAnosExperiencia(e.target.value)} placeholder="Anos de experiencia (ex: 5)" min={0} max={80} required className={INPUT} />
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(0)} className="flex-1 py-3.5 border border-white/10 text-text rounded-xl font-bold text-base hover:border-neon">
              ← Voltar
            </button>
            <button type="button" onClick={() => setStep(2)} className="flex-1 py-3.5 bg-neon text-black rounded-xl font-bold text-base hover:scale-[1.02] hover:shadow-lg hover:shadow-neon/30">
              Proximo → Preferencias
            </button>
          </div>
        </>
      )}

      {/* STEP 2: Newsletter + Submit */}
      {step === 2 && (
        <>
          <label className="flex items-center gap-3 p-4 bg-black/20 rounded-xl border border-white/10 cursor-pointer">
            <input type="checkbox" name="newsletterOptIn" checked={newsletterOptIn} onChange={(e) => setNewsletterOptIn(e.target.checked)} className="accent-neon w-5 h-5" />
            <span className="text-sm opacity-80">Desejo receber novidades e noticias por e-mail</span>
          </label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="flex-1 py-3.5 border border-white/10 text-text rounded-xl font-bold text-base hover:border-neon">
              ← Voltar
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-3.5 bg-neon text-black rounded-xl font-bold text-base hover:scale-[1.02] hover:shadow-lg hover:shadow-neon/30 disabled:opacity-50">
              {isPending ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </div>
        </>
      )}
    </form>
  )
}
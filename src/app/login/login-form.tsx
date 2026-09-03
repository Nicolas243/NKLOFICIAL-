'use client'

import { useState, useTransition } from 'react'
import { login, registerWithProfile } from '@/actions/auth'

const INPUT = 'p-3.5 bg-black/20 border border-white/10 rounded-xl focus:border-neon focus:ring-1 focus:ring-neon outline-none text-text placeholder:text-text/40 transition-all'

function passwordStrength(pw: string): { level: string; color: string; width: string } {
  if (pw.length < 6) return { level: 'Fraca', color: 'bg-red-500', width: 'w-1/4' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 2) return { level: 'Fraca', color: 'bg-red-500', width: 'w-1/3' }
  if (score <= 3) return { level: 'Media', color: 'bg-yellow-500', width: 'w-2/3' }
  return { level: 'Forte', color: 'bg-green-500', width: 'w-full' }
}

export function LoginForm({ serverError }: { serverError: string | null }) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(serverError)
  const [isPending, startTransition] = useTransition()
  const [pw, setPw] = useState('')

  const isRedirect = (err: unknown): boolean => {
    // redirect() do Next lança erro com digest "NEXT_REDIRECT" — deve
    // propagar para o Next concluir a navegação, nunca ser engolido aqui.
    const digest =
      err instanceof Error
        ? (err as Error & { digest?: unknown }).digest
        : undefined
    return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')
  }

  const handleLogin = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await login(formData)
      } catch (err) {
        if (isRedirect(err)) throw err
        setError('Erro ao fazer login. Tente novamente.')
      }
    })
  }

  const handleRegister = async (formData: FormData) => {
    startTransition(async () => {
      try {
        const result = await registerWithProfile(formData)
        if (result.error) setError(result.error)
      } catch (err) {
        if (isRedirect(err)) throw err
        setError('Erro ao criar conta.')
      }
    })
  }

  return (
    <form className="flex flex-col gap-4" action={isRegistering ? handleRegister : handleLogin}>
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-lg text-red-400 text-sm text-center">{error}</div>
      )}

      <input type="email" name="email" placeholder="E-mail" required autoComplete="email" className={INPUT} />

      {isRegistering && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" name="firstName" placeholder="Nome" required className={INPUT} />
            <input type="text" name="lastName" placeholder="Sobrenome" required className={INPUT} />
          </div>
          <input type="date" name="birthDate" className={INPUT} />
          <select name="papel" required className={INPUT}>
            <option value="">Perfil...</option>
            <option value="Musico">Musico</option>
            <option value="Loja">Loja</option>
            <option value="Luthier">Luthier</option>
            <option value="Professor">Professor</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" name="instrumento" placeholder="Instrumento (opcional)" className={INPUT} />
            <input type="number" name="anosExperiencia" placeholder="Anos que toca (opcional)" min={0} max={80} className={INPUT} />
          </div>
        </>
      )}
<input type="password" name="password" placeholder="Senha" required
        autoComplete={isRegistering ? 'new-password' : 'current-password'}
        className={INPUT} value={pw} onChange={(e) => setPw(e.target.value)} />

      {isRegistering && pw.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength(pw).color} ${passwordStrength(pw).width}`} />
          </div>
          <span className="text-xs opacity-50">Forca: {passwordStrength(pw).level}</span>
        </div>
      )}

      <button type="submit" disabled={isPending}
        className="py-3.5 bg-neon text-black rounded-xl font-bold text-base transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-neon/30 disabled:opacity-50">
        {isPending ? 'Processando...' : isRegistering ? 'Criar Conta' : 'Entrar'}
      </button>

      <div className="flex items-center gap-3">
        <span className="flex-1 h-px bg-white/10" />
        <span className="text-xs opacity-40 uppercase tracking-wider">ou</span>
        <span className="flex-1 h-px bg-white/10" />
      </div>

      <div className="flex gap-3">
        <a href="/api/auth/google" className="flex-1 py-3 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-white/20">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          <span className="text-sm font-medium text-text">Google</span>
        </a>
        <a href="/api/auth/facebook" className="flex-1 py-3 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-white/20">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          <span className="text-sm font-medium text-text">Facebook</span>
        </a>
      </div>

      <button type="button"
        onClick={() => { setIsRegistering((v) => !v); setError(null); setPw('') }}
        className="py-3 border-2 border-white/10 text-text rounded-xl font-bold text-base transition-all hover:border-neon hover:text-neon">
        {isRegistering ? '← Ja tenho conta' : 'Criar conta gratuita'}
      </button>
    </form>
  )
}
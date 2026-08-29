import Image from 'next/image'
import { login, signup } from '@/actions/auth'

export const metadata = {
  title: 'Entrar | Portal NKL',
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function LoginPage(props: { searchParams: SearchParams }) {
  const search = await props.searchParams
  const error = typeof search.error === 'string' ? search.error : null

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md relative">
        {/* Card glassmorphism */}
        <div className="relative z-10 bg-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/30">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <Image src="/NKL/NKL.png" alt="NKL" width={56} height={56} className="mb-3" unoptimized priority />
            <h1 className="font-playfair text-2xl font-bold">Portal NKL</h1>
            <p className="text-sm opacity-60 mt-1">Entre no ecossistema da lutheria</p>
          </div>

          {error && (
            <div role="alert" className="mb-6 p-4 bg-red-500/10 border border-red-500/40 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form className="flex flex-col gap-4">
            <input
              type="email" name="email" placeholder="E-mail" required autoComplete="email"
              className="p-3.5 bg-black/20 border border-white/10 rounded-xl focus:border-neon focus:ring-1 focus:ring-neon outline-none text-text placeholder:text-text/40 transition-all"
            />
            <input
              type="password" name="password" placeholder="Senha" required autoComplete="current-password"
              className="p-3.5 bg-black/20 border border-white/10 rounded-xl focus:border-neon focus:ring-1 focus:ring-neon outline-none text-text placeholder:text-text/40 transition-all"
            />
            <button
              type="submit" formAction={login}
              className="py-3.5 bg-neon text-black rounded-xl font-bold text-base transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-neon/30"
            >
              Entrar
            </button>
            <div className="flex items-center gap-3">
              <span className="flex-1 h-px bg-white/10" />
              <span className="text-xs opacity-40 uppercase tracking-wider">ou</span>
              <span className="flex-1 h-px bg-white/10" />
            </div>
            <button
              type="submit" formAction={signup}
              className="py-3 border-2 border-white/10 text-text rounded-xl font-bold text-base transition-all hover:border-neon hover:text-neon"
            >
              Criar conta gratuita
            </button>
          </form>
        </div>

        {/* Backdrop glow */}
        <div className="absolute inset-0 -z-0 bg-neon/5 blur-3xl rounded-full transform -translate-y-1/4" />
      </div>
    </div>
  )
}
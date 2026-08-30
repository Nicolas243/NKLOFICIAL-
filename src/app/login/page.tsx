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
      <div className="w-full max-w-md relative z-10 pointer-events-auto">
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
            {/* OAuth Social — três provedores */}
            <div className="flex gap-3">
              <a href="/api/auth/google"
                className="flex-1 py-3 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-white/20">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span className="text-sm font-medium text-text">Google</span>
              </a>
              <a href="/api/auth/apple"
                className="flex-1 py-3 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-white/20">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <span className="text-sm font-medium text-text">Apple</span>
              </a>
              <a href="/api/auth/facebook"
                className="flex-1 py-3 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-white/20">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                <span className="text-sm font-medium text-text">Facebook</span>
              </a>
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
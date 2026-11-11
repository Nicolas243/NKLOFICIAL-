import Image from 'next/image'
import { LoginForm, type LoginArea } from './login-form'
import { parseGuideResumeIntent } from '@/lib/auth/return-intent'
import { safeNextPath } from '@/lib/auth/oauth'

export const metadata = {
  title: 'Entrar | Portal NKL',
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function LoginPage(props: { searchParams: SearchParams }) {
  const search = await props.searchParams
  const errorCode = typeof search.error === 'string' ? search.error : null
  const error = errorCode === 'profile_sync_failed'
    ? 'Sua conta foi autenticada, mas o perfil ainda não foi sincronizado. Tente novamente.'
    : errorCode === 'oauth_callback_failed'
      ? 'Não foi possível concluir o login com Google. Tente novamente.'
      : errorCode
  const nextPath = safeNextPath(typeof search.next === 'string' ? search.next : null)
  const resumeIntent = parseGuideResumeIntent(typeof search.resume === 'string' ? search.resume : null)
  const area: LoginArea = search.area === 'income' ? 'income' : 'music'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md relative z-10 pointer-events-auto">
        <div className="relative z-10 bg-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/30">
          <div className="flex flex-col items-center mb-6">
            <Image src="/NKL/NKL.png" alt="NKL" width={56} height={56} className="mb-3 dark:invert" unoptimized priority />
            <h1 className="font-playfair text-2xl font-bold">Portal NKL</h1>
            <p className="text-sm opacity-60 mt-1">Entre no ecossistema da lutheria</p>
          </div>

          <LoginForm serverError={error} nextPath={nextPath} resumeIntent={resumeIntent} area={area} />
        </div>

        <div className="absolute inset-0 -z-0 bg-neon/5 blur-3xl rounded-full transform -translate-y-1/4" />
      </div>
    </div>
  )
}
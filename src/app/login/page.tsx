import Image from 'next/image'
import { LoginForm } from './login-form'

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
        <div className="relative z-10 bg-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/30">
          <div className="flex flex-col items-center mb-6">
            <Image src="/NKL/NKL.png" alt="NKL" width={56} height={56} className="mb-3" unoptimized priority />
            <h1 className="font-playfair text-2xl font-bold">Portal NKL</h1>
            <p className="text-sm opacity-60 mt-1">Entre no ecossistema da lutheria</p>
          </div>

          <LoginForm serverError={error} />
        </div>

        <div className="absolute inset-0 -z-0 bg-neon/5 blur-3xl rounded-full transform -translate-y-1/4" />
      </div>
    </div>
  )
}
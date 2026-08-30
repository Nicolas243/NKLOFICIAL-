import Image from 'next/image'
import Link from 'next/link'
import RegistroForm from './registro-form'

export const metadata = {
  title: 'Criar Conta | Portal NKL',
}

export default function RegistroPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-lg relative z-10 pointer-events-auto">
        {/* Card glassmorphism */}
        <div className="relative z-10 bg-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/30">
          <div className="flex flex-col items-center mb-6">
            <Image src="/NKL/NKL.png" alt="NKL" width={56} height={56} className="mb-3" unoptimized priority />
            <h1 className="font-playfair text-2xl font-bold">Criar Conta</h1>
            <p className="text-sm opacity-60 mt-1">Junte-se ao ecossistema da lutheria</p>
          </div>

          <RegistroForm />

          <p className="text-xs text-center opacity-40 mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-neon hover:underline font-medium">
              Fazer login
            </Link>
          </p>
        </div>

        <div className="absolute inset-0 -z-0 bg-neon/5 blur-3xl rounded-full transform -translate-y-1/4" />
      </div>
    </div>
  )
}
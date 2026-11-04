'use client'

import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.error('[pwa] Falha ao registrar service worker:', error)
    })
  }, [])

  return null
}

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  if (!installPrompt) return null

  const install = async () => {
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') setInstallPrompt(null)
  }

  return (
    <button
      type="button"
      onClick={() => void install()}
      className="inline-flex h-[30px] shrink-0 items-center gap-1 rounded-[3px] border border-neon px-2 text-xs font-bold text-neon transition-colors hover:bg-neon hover:text-black"
      aria-label="Adicionar o Portal NKL à tela inicial"
      title="Adicionar à tela inicial"
    >
      <Download size={14} aria-hidden="true" />
      <span className="hidden sm:inline">Instalar</span>
    </button>
  )
}

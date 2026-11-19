'use client';

import { useState, useCallback, useEffect, type FormEvent } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MUSIC_PORTAL_HOME, getPortalSurface } from '@/lib/income-portal';
import { SharePageButton } from '@/components/ui/share-page-button';
import { getSupportLinkClassName } from '@/lib/ui/support-layout';

const WHATSAPP_MESSAGE_INTERVAL_MS = 6500;
const WHATSAPP_MESSAGE_VISIBLE_MS = 12000;
const COMMUNITY_NOTIFICATION_KEY = 'community_notified';

export function Footer() {
  const pathname = usePathname();
  const surface = getPortalSurface(pathname);
  const isMusicSurface = surface === 'music';
  const isHomeSurface = surface === 'home';

  const communityUrl = isMusicSurface
    ? 'https://chat.whatsapp.com/FXtRa6sLL4W5d136xMze7r'
    : 'https://chat.whatsapp.com/Fegie9C05eG0cMidDUpzRk';
  const communityLabel = isMusicSurface
    ? 'Entrar na comunidade musical do Portal NKL no WhatsApp'
    : 'Entrar no grupo de renda extra do Portal NKL no WhatsApp';
  const whatsappMessages = isMusicSurface
    ? [
      'Converse com músicos e profissionais da comunidade NKL.',
      'Tire suas dúvidas sobre cordas, luteria e instrumentos.',
      'Entre na comunidade musical do Portal NKL.',
    ]
    : [
      'Tire suas dúvidas com pessoas que já conhecem as plataformas.',
      'Compartilhe uma oportunidade e descubra experiências reais.',
      'Entre na comunidade do Portal NKL.',
    ];
  const [pixOpen, setPixOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [whatsappMessageIndex, setWhatsappMessageIndex] = useState(0);
  const [showWhatsappMessage, setShowWhatsappMessage] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<string | null>(null);

  useEffect(() => {
    if (window.sessionStorage.getItem(COMMUNITY_NOTIFICATION_KEY)) return;
    window.sessionStorage.setItem(COMMUNITY_NOTIFICATION_KEY, new Date().toISOString());
    const showTimer = window.setTimeout(() => setShowWhatsappMessage(true), 0);
    const visibilityTimer = window.setTimeout(() => setShowWhatsappMessage(false), WHATSAPP_MESSAGE_VISIBLE_MS);
    const timer = window.setInterval(() => {
      setWhatsappMessageIndex((index) => (index + 1) % whatsappMessages.length);
    }, WHATSAPP_MESSAGE_INTERVAL_MS);
    return () => {
      window.clearTimeout(visibilityTimer);
      window.clearTimeout(showTimer);
      window.clearInterval(timer);
    };
  }, [whatsappMessages.length]);

  useEffect(() => {
    const closeOverlays = (): void => setPixOpen(false);
    document.addEventListener('nkl:close-overlays', closeOverlays);
    return () => document.removeEventListener('nkl:close-overlays', closeOverlays);
  }, []);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText('contato.nikoluthieria@gmail.com');
      setToast('Email copiado');
      setTimeout(() => setToast(null), 2000);
    } catch {
      setToast('contato.nikoluthieria@gmail.com');
      setTimeout(() => setToast(null), 3000);
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setCaptureStatus(null);
    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          area: isMusicSurface ? 'music' : 'income',
          privacyConsent: data.get('privacyConsent') === 'yes',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        setCaptureStatus(result?.error ?? 'Não foi possível enviar agora. Tente novamente em instantes.');
        return;
      }
      form.reset();
      setCaptureStatus('Obrigado! O PDF foi enviado para o seu e-mail.');
    } catch {
      setCaptureStatus('Não foi possível enviar agora. Tente novamente em instantes.');
    }
  };

  return (
    <>
      <div className="fixed bottom-[5.75rem] right-5 z-40 max-[768px]:bottom-[4.75rem] max-[768px]:right-3">
        <SharePageButton compact />
      </div>
      <div className="whatsapp-guide">
        {showWhatsappMessage && <p key={whatsappMessageIndex} className="whatsapp-guide-message" aria-live="polite">{whatsappMessages[whatsappMessageIndex]}</p>}
        <a href={communityUrl} target="_blank" rel="noopener noreferrer" className="whatsapp-float" aria-label={communityLabel}>
          <Image src="/NKL/wpplogo.w70-h70-c1.png" alt="WhatsApp" width={60} height={60} />
        </a>
      </div>
      <footer className="site-footer">
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] px-6 py-3 bg-foreground text-background rounded-xl shadow-2xl font-bold text-sm animate-[fadeInUp_0.3s_ease-out]">
            {toast}
          </div>
        )}
        {isMusicSurface && (
          <div className="footer-header">
            <h3 className="text-neon font-bold">Receba o PDF completo em Alta Resolucao do Grafico de Cordas</h3>
            <p>Deixe o seu contato para enviarmos o material de estudo diretamente para voce.</p>
            <form className="capture-form" onSubmit={handleSubmit}>
              <input type="text" name="name" autoComplete="name" className="capture-input" placeholder="Seu nome" required />
              <input type="email" name="email" autoComplete="email" className="capture-input" placeholder="Escreva o seu e-mail principal" required />
              <label className="flex items-start gap-2 text-left text-xs opacity-75">
                <input type="checkbox" name="privacyConsent" value="yes" required className="mt-0.5 accent-neon" />
                <span>
                  Autorizo o envio do material e o tratamento desses dados para essa finalidade.
                  Consulte a <Link href="/privacidade" className="font-bold text-neon hover:underline">Política de Privacidade</Link>.
                </span>
              </label>
              <button type="submit" className="btn-outline font-bold transition-colors duration-200 hover:!bg-foreground hover:!text-background">Confirmar</button>
              {captureStatus && <p className="text-sm opacity-80" role="status">{captureStatus}</p>}
            </form>
          </div>
        )}
        {!isMusicSurface && !isHomeSurface && (
          <div className="footer-header">
            <h3 className="text-neon font-bold">Receba o Guia Essencial de Renda Extra 2027</h3>
            <p>Deixe o seu contato para enviarmos o material diretamente para você.</p>
            <form className="capture-form" onSubmit={handleSubmit}>
              <input type="text" name="name" autoComplete="name" className="capture-input" placeholder="Seu nome" required />
              <input type="email" name="email" autoComplete="email" className="capture-input" placeholder="Escreva o seu e-mail principal" required />
              <label className="flex items-start gap-2 text-left text-xs opacity-75">
                <input type="checkbox" name="privacyConsent" value="yes" required className="mt-0.5 accent-neon" />
                <span>
                  Autorizo o envio do material e o tratamento desses dados para essa finalidade.
                  Consulte a <Link href="/privacidade" className="font-bold text-neon hover:underline">Política de Privacidade</Link>.
                </span>
              </label>
              <button type="submit" className="btn-outline font-bold transition-colors duration-200 hover:!bg-foreground hover:!text-background">Confirmar</button>
              {captureStatus && <p className="text-sm opacity-80" role="status">{captureStatus}</p>}
            </form>
          </div>
        )}
        <div className="footer-grid">
          <div className="footer-box">
            <h4>Sua voz importa</h4>
            <p>{isMusicSurface ? 'Ajude a construir o melhor portal de violino do Brasil.' : 'Ajude a manter o ecossistema editorial claro e atualizado.'}</p>
            <a href="https://forms.gle/mcfnxfXuF7bmuhPDA" target="_blank" rel="noopener noreferrer" className="btn-outline hover:!bg-foreground hover:!text-background transition-colors duration-200">Deixar Feedback Rapido</a>
          </div>
          <div className="footer-box">
            <h4>Contato Direto</h4>
            <p>Duvidas, parcerias ou projetos pessoais? Mande-nos um e-mail.</p>
            <button type="button" onClick={copyEmail} className="btn-outline hover:!bg-foreground hover:!text-background transition-colors duration-200 w-full text-left">contato.nikoluthieria@gmail.com</button>
          </div>
          <div className="footer-box">
            <h4>Apoie o Projeto</h4>
            <p>{isMusicSurface ? 'Todo o conteudo gratuito exige pesquisa. Apoie nossa estrutura.' : 'A curadoria exige pesquisa e revisão contínuas. Apoie nossa estrutura.'}</p>
            <p className="mt-2 text-sm opacity-75">Apoio direto para manter os guias, catálogos e estudos abertos.</p>
            <div className="flex w-full flex-wrap gap-2">
              <a href="https://link.mercadopago.com.br/apoienkloficial" target="_blank" rel="noopener noreferrer" className={`${getSupportLinkClassName()} btn-outline hover:!bg-foreground hover:!text-background transition-colors duration-200`}>Apoiar NKL</a>
              <button type="button" onClick={() => setPixOpen(true)} className={`${getSupportLinkClassName()} btn-outline hover:!bg-foreground hover:!text-background transition-colors duration-200`}>Apoiar por Pix</button>
              <a href="https://www.buymeacoffee.com/ni2co3san9c" target="_blank" rel="noopener noreferrer" className={`${getSupportLinkClassName()} btn-outline hover:!bg-foreground hover:!text-background transition-colors duration-200`}>Buy Me a Coffee</a>
            </div>
          </div>
        </div>
        <div className="footer-box footer-legal items-center text-center">
          <h4>Ecossistema Portal NKL</h4>
          <nav className="mb-3 flex flex-wrap justify-center gap-x-4 gap-y-2" aria-label="Navegação do rodapé">
            <Link href="/" className="text-sm hover:text-neon hover:underline">Início</Link>
            <Link href={MUSIC_PORTAL_HOME} className="text-sm hover:text-neon hover:underline">NKL Cordas</Link>
            <Link href="/programas" className="text-sm hover:text-neon hover:underline">Oportunidades</Link>
            <Link href="/ia" className="text-sm hover:text-neon hover:underline">IA na Prática</Link>
            <Link href="/blog/aprender/ingles" className="text-sm hover:text-neon hover:underline">Idiomas</Link>
            <Link href="/quiz-negocios" className="text-sm hover:text-neon hover:underline">Diagnóstico</Link>
            <Link href="/mural-de-parceiros" className="text-sm hover:text-neon hover:underline">Mural de Parceiros</Link>
          </nav>
          <h4>Legal / Conformidade</h4>
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2" aria-label="Links legais">
            <Link href="/privacidade" className="text-sm hover:text-neon hover:underline">Privacidade</Link>
            <Link href="/termos" className="text-sm hover:text-neon hover:underline">Termos de Uso</Link>
            <Link href="/reembolso" className="text-sm hover:text-neon hover:underline">Reembolso</Link>
          </nav>
        </div>
        <div className="footer-bottom">&copy; Copyright 2026 | NKL | Todos direitos reservados <span className="opacity-60">v0.2.2</span></div>
      </footer>

      {pixOpen && (
        <div className="fixed inset-0 z-[320] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPixOpen(false)}>
          <div className="bg-surface border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm relative" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="absolute top-3 right-3 text-2xl opacity-50 hover:opacity-100" aria-label="Fechar janela de apoio por Pix" onClick={() => setPixOpen(false)}>&times;</button>
            <h4 className="font-playfair text-xl font-bold mb-2 text-foreground">Apoiar o NKL por Pix</h4>
            <p className="text-sm opacity-70 mb-4">Escaneie o código abaixo para apoiar a manutenção do Portal.</p>
            <Image src="/NKL/1000343886.webp" alt="QR Code para apoiar o NKL por Pix" width={220} height={220} className="block mx-auto rounded-lg border border-border" />
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState, useCallback, useEffect, type FormEvent } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { isIncomePortalPath } from '@/lib/income-portal';
const WHATSAPP_MESSAGE_INTERVAL_MS = 6500;
const WHATSAPP_MESSAGE_VISIBLE_MS = 12000;
const COMMUNITY_NOTIFICATION_KEY = 'community_notified';

export function Footer() {
  const pathname = usePathname();
  const isPartnerPortal = isIncomePortalPath(pathname);
  const communityUrl = isPartnerPortal
    ? 'https://chat.whatsapp.com/Fegie9C05eG0cMidDUpzRk'
    : 'https://chat.whatsapp.com/FXtRa6sLL4W5d136xMze7r';
  const communityLabel = isPartnerPortal
    ? 'Entrar no grupo de renda extra do Portal NKL no WhatsApp'
    : 'Entrar na comunidade musical do Portal NKL no WhatsApp';
  const whatsappMessages = isPartnerPortal
    ? [
      'Tire suas dúvidas com pessoas que já conhecem as plataformas.',
      'Compartilhe uma oportunidade e descubra experiências reais.',
      'Entre na comunidade de Renda Extra do Portal NKL.',
    ]
    : [
      'Converse com músicos e profissionais da comunidade NKL.',
      'Tire suas dúvidas sobre cordas, luteria e instrumentos.',
      'Entre na comunidade musical do Portal NKL.',
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

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText('contato.nikoluthieria@gmail.com');
      setToast('Email copiado');
      setTimeout(() => setToast(null), 2000);
    } catch {
      // fallback para navegadores antigos
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
      const response = await fetch('https://formspree.io/f/maqzkwwb', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        setCaptureStatus('Não foi possível enviar agora. Tente novamente em instantes.');
        return;
      }
      form.reset();
      setCaptureStatus('Obrigado! Enviaremos o material em breve.');
    } catch {
      setCaptureStatus('Não foi possível enviar agora. Tente novamente em instantes.');
    }
  };

  return (
    <>
      <div className="whatsapp-guide">
        {showWhatsappMessage && <p key={whatsappMessageIndex} className="whatsapp-guide-message" aria-live="polite">{whatsappMessages[whatsappMessageIndex]}</p>}
        <a href={communityUrl} target="_blank" rel="noopener noreferrer" className="whatsapp-float" aria-label={communityLabel}>
          <Image src="/NKL/wpplogo.w70-h70-c1.png" alt="WhatsApp" width={60} height={60} />
        </a>
      </div>
      <footer className="site-footer">
        {/* Toast de email copiado */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] px-6 py-3 bg-foreground text-background rounded-xl shadow-2xl font-bold text-sm animate-[fadeInUp_0.3s_ease-out]">
            {toast}
          </div>
        )}
        {!isPartnerPortal && (
          <div className="footer-header">
            <h3 className="text-neon font-bold">Receba o PDF completo em Alta Resolucao do Grafico de Cordas</h3>
            <p>Deixe o seu contato para enviarmos o material de estudo diretamente para voce.</p>
            <form className="capture-form" onSubmit={handleSubmit}>
              <input type="text" name="name" className="capture-input" placeholder="Seu nome" required />
              <input type="email" name="email" className="capture-input" placeholder="Escreva o seu e-mail principal" required />
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
            <p>{isPartnerPortal ? 'Ajude a manter o mapa de oportunidades claro e atualizado.' : 'Ajude a construir o melhor portal de violino do Brasil.'}</p>
            <a href="https://forms.gle/mcfnxfXuF7bmuhPDA" target="_blank" rel="noopener noreferrer" className="btn-outline hover:!bg-foreground hover:!text-background transition-colors duration-200">Deixar Feedback Rapido</a>
          </div>
          <div className="footer-box">
            <h4>Contato Direto</h4>
            <p>Duvidas, parcerias ou projetos pessoais? Mande-nos um e-mail.</p>
            <button type="button" onClick={copyEmail} className="btn-outline hover:!bg-foreground hover:!text-background transition-colors duration-200 w-full text-left">contato.nikoluthieria@gmail.com</button>
          </div>
          <div className="footer-box">
            <h4>Apoie o Projeto</h4>
            <p>{isPartnerPortal ? 'A curadoria exige pesquisa e revisão contínuas. Apoie nossa estrutura.' : 'Todo o conteudo gratuito exige pesquisa. Apoie nossa estrutura.'}</p>
            <div className="flex w-full flex-wrap gap-2">
              <a href="https://link.mercadopago.com.br/apoienkloficial" target="_blank" rel="noopener noreferrer" className="btn-outline hover:!bg-foreground hover:!text-background transition-colors duration-200">Apoiar NKL</a>
              <button type="button" onClick={() => setPixOpen(true)} className="btn-outline hover:!bg-foreground hover:!text-background transition-colors duration-200">Apoiar por Pix</button>
              <a href="https://www.buymeacoffee.com/ni2co3san9c" target="_blank" rel="noopener noreferrer" className="btn-outline hover:!bg-foreground hover:!text-background transition-colors duration-200">Buy Me a Coffee</a>
              <a href="https://www.buymeacoffee.com/invite/ni2co3san9c" target="_blank" rel="noopener noreferrer" className="btn-outline hover:!bg-foreground hover:!text-background transition-colors duration-200">Convidar no Buy Me a Coffee</a>
            </div>
          </div>
        </div>
        <div className="footer-box footer-legal items-center text-center">
          <h4>Legal / Conformidade</h4>
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2" aria-label="Links legais">
            <Link href="/privacidade" className="text-sm hover:text-neon hover:underline">Privacidade</Link>
            <Link href="/termos" className="text-sm hover:text-neon hover:underline">Termos de Uso</Link>
            <Link href="/reembolso" className="text-sm hover:text-neon hover:underline">Reembolso</Link>
          </nav>
        </div>
        <div className="footer-bottom">&copy; Copyright 2026 | NKL | Todos direitos reservados <span className="opacity-60">v0.2.2</span></div>
      </footer>

      {/* Modal de apoio */}
      {pixOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPixOpen(false)}>
          <div className="bg-surface border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm relative" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-3 right-3 text-2xl opacity-50 hover:opacity-100" onClick={() => setPixOpen(false)}>&times;</button>
            <h4 className="font-playfair text-xl font-bold mb-2 text-foreground">Apoiar o NKL por Pix</h4>
            <p className="text-sm opacity-70 mb-4">Escaneie o código abaixo para apoiar a manutenção do Portal.</p>
            <Image src="/NKL/1000343886.webp" alt="QR Code para apoiar o NKL por Pix" width={220} height={220} className="block mx-auto rounded-lg border border-border" />
          </div>
        </div>
      )}
    </>
  );
}
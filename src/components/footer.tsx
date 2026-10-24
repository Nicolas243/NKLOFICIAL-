'use client';

import { useState, useCallback, type FormEvent } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();
  const isPartnerPortal = pathname === '/programas' || pathname.startsWith('/programas/');
  const [pixOpen, setPixOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    // Captura Formspree - fetch nativo
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    fetch('https://formspree.io/f/maqzkwwb', { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(() => { alert('Obrigado! Enviaremos o material em breve.'); form.reset(); })
      .catch(() => { alert('Erro ao enviar. Tente novamente.'); });
  };

  return (
    <>
      <a href="https://chat.whatsapp.com/FXtRa6sLL4W5d136xMze7r" target="_blank" rel="noopener noreferrer" className={isPartnerPortal ? 'hidden' : 'whatsapp-float'} aria-label="Comunidade VIP WhatsApp">
        <Image src="/NKL/wpplogo.w70-h70-c1.png" alt="WhatsApp" width={60} height={60} />
      </a>
      <footer className="site-footer">
        {/* Toast de email copiado */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] px-6 py-3 bg-foreground text-background rounded-xl shadow-2xl font-bold text-sm animate-[fadeInUp_0.3s_ease-out]">
            {toast}
          </div>
        )}
        <div className="footer-header">
          <h3 className="text-neon font-bold">Receba o PDF completo em Alta Resolucao do Grafico de Cordas</h3>
          <p>Deixe o seu contato para enviarmos o material de estudo diretamente para voce.</p>
          <form className="capture-form" onSubmit={handleSubmit}>
            <input type="text" name="name" className="capture-input" placeholder="Seu nome" required />
            <input type="email" name="email" className="capture-input" placeholder="Escreva o seu e-mail principal" required />
            <button type="submit" className="btn-outline font-bold transition-colors duration-200 hover:!bg-foreground hover:!text-background">Confirmar</button>
          </form>
        </div>
        <div className="footer-grid">
          <div className="footer-box">
            <h4>Sua voz importa</h4>
            <p>Ajude a construir o melhor portal de violino do Brasil.</p>
            <a href="https://forms.gle/mcfnxfXuF7bmuhPDA" target="_blank" rel="noopener noreferrer" className="btn-outline hover:!bg-foreground hover:!text-background transition-colors duration-200">Deixar Feedback Rapido</a>
          </div>
          <div className="footer-box">
            <h4>Contato Direto</h4>
            <p>Duvidas, parcerias ou projetos pessoais? Mande-nos um e-mail.</p>
            <button type="button" onClick={copyEmail} className="btn-outline hover:!bg-foreground hover:!text-background transition-colors duration-200 w-full text-left">contato.nikoluthieria@gmail.com</button>
          </div>
          <div className="footer-box">
            <h4>Apoie o Projeto</h4>
            <p>Todo o conteudo gratuito exige pesquisa. Apoie nossa estrutura.</p>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <a href="https://link.mercadopago.com.br/apoienkloficial" target="_blank" rel="noopener noreferrer" className="btn-outline hover:!bg-foreground hover:!text-background transition-colors duration-200" style={{ flex: 1 }}>Apoiar NKL</a>
              <button type="button" onClick={() => setPixOpen(true)} className="btn-outline hover:!bg-foreground hover:!text-background transition-colors duration-200" style={{ flex: 1 }}>PayPal</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">&copy; Copyright 2026 | NKL | Todos direitos reservados</div>
      </footer>

      {/* PayPal Modal */}
      {pixOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPixOpen(false)}>
          <div className="bg-surface border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm relative" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-3 right-3 text-2xl opacity-50 hover:opacity-100" onClick={() => setPixOpen(false)}>&times;</button>
            <h4 className="font-playfair text-xl font-bold mb-2 text-foreground">Apoiar o NKL pelo PayPal</h4>
            <p className="text-sm opacity-70 mb-4">Escaneie o codigo abaixo para apoiar a manutencao do nosso Portal.</p>
            <Image src="/NKL/1000343886.webp" alt="QR Code PayPal" width={220} height={220} className="block mx-auto rounded-lg border border-border" />
          </div>
        </div>
      )}
    </>
  );
}
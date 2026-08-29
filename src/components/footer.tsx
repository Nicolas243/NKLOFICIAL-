'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';

export function Footer() {
  const [pixOpen, setPixOpen] = useState(false);

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
      <a href="https://chat.whatsapp.com/FXtRa6sLL4W5d136xMze7r" target="_blank" rel="noopener noreferrer" className="whatsapp-float" aria-label="Comunidade VIP WhatsApp">
        <Image src="/NKL/wpplogo.w70-h70-c1.png" alt="WhatsApp" width={60} height={60} />
      </a>
      <footer className="site-footer">
        <div className="footer-header">
          <h3 className="text-neon font-bold">Receba o PDF completo em Alta Resolucao do Grafico de Cordas</h3>
          <p>Deixe o seu contato para enviarmos o material de estudo diretamente para voce.</p>
          <form className="capture-form" onSubmit={handleSubmit}>
            <input type="text" name="name" className="capture-input" placeholder="Seu nome" required />
            <input type="email" name="email" className="capture-input" placeholder="Escreva o seu e-mail principal" required />
            <button type="submit" className="capture-btn">Confirmar</button>
          </form>
        </div>
        <div className="footer-grid">
          <div className="footer-box">
            <h4>Sua voz importa</h4>
            <p>Ajude a construir o melhor portal de violino do Brasil.</p>
            <a href="https://forms.gle/mcfnxfXuF7bmuhPDA" target="_blank" rel="noopener noreferrer" className="btn-outline">Deixar Feedback Rapido</a>
          </div>
          <div className="footer-box">
            <h4>Contato Direto</h4>
            <p>Duvidas, parcerias ou projetos pessoais? Mande-nos um e-mail.</p>
            <a href="mailto:contato.nikoluthieria@gmail.com" className="btn-outline">contato.nikoluthieria@gmail.com</a>
          </div>
          <div className="footer-box">
            <h4>Apoie o Projeto</h4>
            <p>Todo o conteudo gratuito exige pesquisa. Apoie nossa estrutura.</p>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <a href="https://link.mercadopago.com.br/apoienkloficial" target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ flex: 1 }}>Apoiar NKL</a>
              <button type="button" onClick={() => setPixOpen(true)} className="btn-outline" style={{ flex: 1 }}>PayPal</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">&copy; Copyright 2026 | NKL | Todos direitos reservados</div>
      </footer>

      {/* PayPal Modal */}
      {pixOpen && (
        <div className="pix-modal-overlay" onClick={() => setPixOpen(false)}>
          <div className="pix-modal-content" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
            <button className="pix-modal-close" onClick={() => setPixOpen(false)}>&times;</button>
            <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text)' }}>Apoiar o NKL pelo PayPal</h4>
            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1.2rem', color: 'var(--text)' }}>Escaneie o codigo abaixo para apoiar a manutencao do nosso Portal.</p>
            <Image src="/NKL/1000343886.webp" alt="QR Code PayPal" width={220} height={220} style={{ display: 'block', margin: '0 auto', borderRadius: '8px', border: '1px solid var(--border)' }} />
          </div>
        </div>
      )}
    </>
  );
}
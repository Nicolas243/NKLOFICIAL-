import type { Metadata } from 'next';
import Image from 'next/image';

// Dados portados do contatos.html legado
const LINKS = [
  { icon: '🎻', title: 'NKL no Instagram', desc: 'Dicas diarias e analises comparativas de equipamentos em videos.', url: 'https://www.instagram.com/nkloficial/' },
  { icon: '🎯', title: 'NKL no TikTok', desc: 'Dicas rapidas, diretas ao ponto e resolucao de problemas em videos de 1 minuto.', url: 'https://www.tiktok.com/@nkloficial' },
  { icon: '📺', title: 'NKL no YouTube', desc: 'Tutoriais completos, analises profundas e aulas especiais.', url: 'https://www.youtube.com/@nkloficial' },
  { icon: '🛒', title: 'eBay: Criar Conta + Loja com Promocoes', desc: 'Acesso direto a leiloes internacionais e lojas com ofertas especiais.', url: 'https://ebay.us/ea99Iy' },
  { icon: '🌏', title: 'FansBuy: Redirecionador da China', desc: 'Plataforma que redireciona compras de lojas chinesas para o Brasil.', url: 'https://fansbuy.com/register?invite=RmFucy1UdE11bnoxOQ==' },
  { icon: '🏪', title: 'Goofish / Xianyu: OLX da China', desc: 'Marketplace chines com violinos, arcos e acessorios direto de vendedores.', url: 'https://www.goofish.com/search?q=violin&spm=a21ybx.search.searchInput.0' },
  { icon: '🔧', title: 'ImportKit: Extensao para Xianyu', desc: 'Extensao para facilitar a navegacao e compras no Xianyu pelo Chrome.', url: 'https://chromewebstore.google.com/detail/importkit/ccbhhdpejdlnaahapcifabbaajagoifo' },
  { icon: '🏛️', title: 'SISCOMEX: Situacao da Importacao', desc: 'Portal oficial para acompanhar o status da sua importacao na Receita.', url: 'https://portalunico.siscomex.gov.br/portal/#/' },
  { icon: '🎻', title: 'Violinos de Oficina Profissional', desc: 'Selecao de violinos nivel profissional em leiloes no eBay.', url: 'https://www.ebay.com/sch/i.html?_nkw=VIOLIN&_sacat=0&_from=R40&LH_Auction=1&_sop=1' },
  { icon: '🇺🇸', title: 'USCloser: Redirecionador dos EUA', desc: 'Plataforma que permite comprar itens dos EUA que nao vem para o Brasil normalmente.', url: 'https://uscloser.com/cadastre-se/nkloficial' },
];

export const metadata: Metadata = {
  title: 'Contatos | Portal NKL',
  description: 'NKL_oficial — Engenheiro · Criador de conteudo. Links oficiais.',
};

export default function ContatosPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <Image src="/NKL/NKL.png" alt="NKL Logo" width={96} height={96} className="rounded-full mx-auto mb-4 object-contain border border-border p-2 bg-surface dark:invert" />
        <h1 className="font-playfair text-2xl md:text-3xl font-bold">NKL_oficial</h1>
        <p className="opacity-70 mt-1 text-sm">Engenheiro · Criador de conteudo. Links oficiais.</p>
      </header>
      <div className="flex items-center justify-center text-neon font-bold tracking-widest uppercase text-xs mb-8">
        <span className="flex-1 h-px bg-border" />&nbsp; Links &nbsp;<span className="flex-1 h-px bg-border" />
      </div>
      <div className="flex flex-col gap-4">
        {LINKS.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-surface border border-border rounded-lg hover:border-neon transition-colors"
          >
            <span className="text-2xl">{link.icon}</span>
            <span className="flex flex-col">
              <span className="font-bold text-base">{link.title}</span>
              <span className="text-sm opacity-60">{link.desc}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
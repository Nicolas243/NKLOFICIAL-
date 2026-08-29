import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CopyCouponButton } from '@/components/copy-coupon-button';

export const metadata: Metadata = {
  title: 'Importacao Direta | Metodo NKL',
  description: 'Descubra como adquirir violinos, arcos e acessorios de alta performance cortando intermediarios e economizando ate 40%.',
};

export default function ImportacaoPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="text-center mb-6">
        <h1 className="font-playfair text-3xl md:text-4xl font-bold mb-2">
          Equipamento Premium, Preco de Fabrica
        </h1>
        <p className="text-base opacity-80 max-w-2xl mx-auto">
          Descubra como adquirir violinos, arcos e acessorios de alta performance
          cortando intermediarios e economizando ate 40%.
        </p>
      </header>

      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          O Segredo do Mercado Musical
        </h2>
        <p className="leading-relaxed opacity-90 mb-4">
          Voce ja se perguntou por que um instrumento custa tao caro nas lojas brasileiras?
          A resposta esta na cadeia de atravessadores. Como musico e pesquisador, eu
          desenvolvi um caminho para que voce tenha acesso direto as fontes.
        </p>
        <ul className="space-y-3 opacity-90">
          <li>
            <strong>Acessorios Direto da Fonte:</strong> Arcos de pau-brasil, estojos
            de fibra de carbono, cordas profissionais e breus premium importados com
            seguranca.
          </li>
          <li>
            <strong>Oportunidade de Negocio:</strong> Muitos alunos utilizam este metodo
            para iniciar sua propria loja ou oficina, revendendo acessorios com alta
            margem de lucro.
          </li>
        </ul>
      </section>

      {/* Violino Liu Xi M20+ */}
      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          Minhas Importacoes: Violino Liu Xi M20+
          <span className="block text-base font-normal opacity-70 mt-1">Stradivarius The Cremonese</span>
        </h2>
        <p className="leading-relaxed opacity-90 mb-5">
          <strong>Investimento:</strong> Paguei R$ 1.300 | <strong>Preco no Brasil:</strong> R$ 3.500
        </p>
        <p className="leading-relaxed opacity-90 mb-6">
          Um exemplo classico de como a importacao reduz custos drasticamente. Este
          Stradivarius reproducao de oficina chinesa e construido com tecnicas tradicionais
          e oferece uma qualidade de som muito boa para iniciantes e intermediarios. Ao
          importar diretamente, economizei mais de 60%!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-3 relative aspect-video rounded-lg overflow-hidden bg-black/20 border border-border">
            <video src="/NKL/Violino-video-principal.webm" autoPlay muted loop playsInline className="w-full h-full object-cover" />
          </div>
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-black/20 border border-border">
              <Image src="/NKL/Violino_foto_princial.webp" alt="Violino Liu Xi M20+" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
            </div>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-black/20 border border-border">
              <Image src="/NKL/Violino2.webp" alt="Violino Liu Xi - foto 2" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>
{/* Arco Ipe */}
      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          Minhas Importacoes: Arco Ipe D. Peccatte
        </h2>
        <p className="leading-relaxed opacity-90 mb-5">
          <strong>Investimento:</strong> Paguei R$ 279 | <strong>Preco no Brasil:</strong> R$ 550
        </p>
        <p className="leading-relaxed opacity-90 mb-6">
          O arco Ipe e uma escolha excelente de custo-beneficio para violinistas em
          desenvolvimento. A madeira Ipe oferece estabilidade em ambientes umidos, sendo
          perfeita para o clima tropical. Este modelo replica o design de arcos
          profissionais europeus, mas com o preco de mercado asiatico.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-3 relative aspect-video rounded-lg overflow-hidden bg-black/20 border border-border">
            <video src="/NKL/Arco_video_principal.webm" autoPlay muted loop playsInline className="w-full h-full object-cover" />
          </div>
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-black/20 border border-border">
              <Image src="/NKL/arco_foto_principal.webp" alt="Arco Ipe" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
            </div>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-black/20 border border-border">
              <Image src="/NKL/arco1.webp" alt="Arco Ipe detalhe" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Metodo NKL */}
      <section className="p-8 md:p-12 bg-surface border-2 border-neon rounded-xl text-center">
        <h2 className="font-playfair text-2xl font-bold text-neon mb-4">O Metodo NKL</h2>
        <p className="text-base opacity-90 max-w-2xl mx-auto mb-6 leading-relaxed">
          O conhecimento tem valor. Se voce tem condicoes financeiras de investir neste
          treinamento, saiba que o valor cobrado e irrisorio perto dos milhares de reais
          que voce vai economizar ao longo da sua vida musical.{' '}
          <strong>Mas nos conhecemos a realidade do musico no Brasil.</strong> Se a grana
          esta realmente curta e voce precisa desse acesso para evoluir nos seus estudos,
          use o cupom de apoio abaixo.
        </p>
        <div className="inline-flex items-center gap-4 bg-black/30 px-5 py-3 rounded-lg border border-dashed border-text mb-6">
          <span className="font-mono text-lg tracking-wider">METODONKL</span>
          <CopyCouponButton />
        </div>
        <br />
        <Link
          href="https://go.hotmart.com/P105515350D?dp=1"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex px-8 py-4 bg-neon text-black rounded-md font-bold text-lg transition-opacity hover:opacity-80"
        >
          Acessar o Metodo NKL Agora
        </Link>
      </section>
    </div>
  );
}
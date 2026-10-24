import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Reembolso',
  description: 'Diretrizes de cancelamento e reembolso do Portal NKL.',
};

export default function ReembolsoPage() {
  return (
    <main className="max-w-3xl w-full mx-auto px-4 pt-8 pb-12">
      <article className="space-y-7 text-sm leading-relaxed">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-neon font-bold">Conformidade</p>
          <h1 className="font-playfair text-3xl font-bold mt-2">Política de Reembolso</h1>
          <p className="mt-3 opacity-70">Estas diretrizes estabelecem a base para futuras transações realizadas pelo Portal NKL.</p>
        </header>
        <section>
          <h2 className="font-playfair text-2xl font-bold">1. Direito de arrependimento</h2>
          <p className="mt-2 opacity-85">Nas contratações abrangidas pelo Código de Defesa do Consumidor, o consumidor pode exercer o direito de arrependimento no prazo de até 7 dias a contar da assinatura ou do recebimento do serviço ou produto, conforme o Art. 49 do CDC, quando aplicável.</p>
        </section>
        <section>
          <h2 className="font-playfair text-2xl font-bold">2. Como solicitar</h2>
          <p className="mt-2 opacity-85">A solicitação deve ser enviada pela página de <Link href="/contatos" className="text-neon font-bold hover:underline">Contatos</Link>, com nome, e-mail da compra, identificação da transação e motivo do pedido. O prazo e os requisitos podem variar conforme o produto, serviço e fornecedor responsável.</p>
        </section>
        <section>
          <h2 className="font-playfair text-2xl font-bold">3. Processamento</h2>
          <p className="mt-2 opacity-85">Após a análise, o reembolso aprovado será processado pelo mesmo meio de pagamento, quando tecnicamente possível. Em transações futuras via Mercado Pago, os prazos de disponibilização poderão depender da instituição financeira, bandeira ou método utilizado.</p>
        </section>
        <section>
          <h2 className="font-playfair text-2xl font-bold">4. Serviços de terceiros</h2>
          <p className="mt-2 opacity-85">Quando o pagamento ou a contratação ocorrer diretamente em uma plataforma de terceiros por meio de um link de afiliado, o pedido de cancelamento e reembolso deverá seguir a política do fornecedor responsável pela cobrança. O Portal NKL não controla decisões, prazos ou critérios de empresas externas.</p>
        </section>
        <section>
          <h2 className="font-playfair text-2xl font-bold">5. Atualizações</h2>
          <p className="mt-2 opacity-85">Esta política poderá ser atualizada antes da ativação de novas ofertas ou integrações de pagamento. A versão publicada nesta página será considerada a versão vigente.</p>
        </section>
      </article>
    </main>
  );
}

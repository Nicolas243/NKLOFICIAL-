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
          <p className="mt-3 opacity-70">Versão 1.1 · última atualização: 4 de novembro de 2026</p>
          <p className="mt-3 opacity-85">
            Esta política explica como pedir cancelamento ou reembolso e não limita direitos
            obrigatórios previstos no Código de Defesa do Consumidor.
          </p>
        </header>

        <section>
          <h2 className="font-playfair text-2xl font-bold">1. Direito de arrependimento</h2>
          <p className="mt-2 opacity-85">
            Em contratação feita fora do estabelecimento comercial e abrangida pelo CDC, o
            consumidor pode desistir em até 7 dias a contar da assinatura ou do recebimento do
            produto ou serviço, conforme o caso. O reembolso será realizado na forma e no prazo
            compatíveis com a legislação e com o meio de pagamento.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">2. Aulas e serviços do Portal</h2>
          <p className="mt-2 opacity-85">
            Cancelamentos e reagendamentos de aulas devem ser solicitados, preferencialmente, com
            pelo menos 24 horas de antecedência. Quando a regra da oferta permitir, o crédito será
            estornado ou convertido em reagendamento. Falhas de execução, cobrança indevida ou
            descumprimento da oferta serão analisados conforme o contrato e a legislação aplicável.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">3. Como solicitar</h2>
          <p className="mt-2 opacity-85">
            Envie o pedido pela página de <Link href="/contatos" className="text-neon font-bold hover:underline">Contatos</Link> ou pelo canal informado na confirmação,
            incluindo nome, e-mail da compra, identificação da transação, data, produto ou aula e
            motivo do pedido. Podemos solicitar informações adicionais para localizar a cobrança e
            evitar fraude.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">4. Processamento e prazos</h2>
          <p className="mt-2 opacity-85">
            Após a análise, o reembolso aprovado será feito, quando tecnicamente possível, pelo
            mesmo meio de pagamento. O prazo de disponibilização pode depender do Mercado Pago,
            banco, bandeira ou instituição financeira, sem impedir o atendimento dentro do prazo
            legal aplicável ao Portal.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">5. Links e contratações externas</h2>
          <p className="mt-2 opacity-85">
            Se você clicar em um link de afiliado e pagar ou contratar diretamente uma plataforma
            externa, o pedido deve ser feito ao fornecedor que recebeu a cobrança, conforme a
            política dele. O Portal NKL não controla a aprovação, execução ou reembolso de empresas
            independentes, mas pode ajudar a encaminhar uma dúvida quando possível.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">6. Atualizações</h2>
          <p className="mt-2 opacity-85">
            Esta política pode ser atualizada quando novas ofertas ou integrações forem ativadas.
            A versão publicada nesta página, com sua data, é a referência vigente.
          </p>
        </section>
      </article>
    </main>
  );
}

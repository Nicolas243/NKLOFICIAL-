import Link from 'next/link';

export const metadata = {
  title: 'Termos de Uso | Portal NKL',
  description: 'Regras de utilização, responsabilidades e contratos do Portal NKL.',
};

const contracts = [
  {
    href: '/contratos/termo-professores.md',
    title: 'Termo do Professor(a)',
    description: 'Regras para divulgação e prestação de aulas dentro do diretório.',
  },
  {
    href: '/contratos/termo-luthiers.md',
    title: 'Termo do Luthier',
    description: 'Regras para divulgação de construção, manutenção e reparo de instrumentos.',
  },
  {
    href: '/contratos/termo-lojas.md',
    title: 'Termo da Loja',
    description: 'Regras para divulgação de lojas e produtos de instrumentos e acessórios.',
  },
];

export default function TermosPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-8 pb-12">
      <article className="mx-auto max-w-3xl space-y-7 text-sm leading-relaxed">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-neon font-bold">Regras da plataforma</p>
          <h1 className="font-playfair text-3xl font-bold mt-2">Termos de Uso</h1>
          <p className="mt-3 opacity-70">Versão 1.1 · última atualização: 4 de novembro de 2026</p>
          <p className="mt-3 opacity-85">
            Ao acessar o Portal NKL, você concorda com estes termos e com a{' '}
            <Link href="/privacidade" className="text-neon font-bold hover:underline">Política de Privacidade</Link>.
          </p>
        </header>

        <section>
          <h2 className="font-playfair text-2xl font-bold">1. O que é o Portal NKL</h2>
          <p className="mt-2 opacity-85">
            O Portal NKL reúne conteúdo editorial, catálogo e ferramentas para o universo musical,
            diretório de professores, luthiers e lojas, além de uma seleção editorial de
            oportunidades de renda extra. Algumas funções são gratuitas; outras podem depender de
            cadastro, disponibilidade, contratação ou pagamento informado na própria tela.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">2. Cadastro e uso permitido</h2>
          <p className="mt-2 opacity-85">
            Informe dados verdadeiros, mantenha suas credenciais em sigilo e use a plataforma de
            forma lícita. É proibido fraudar avaliações, criar contas para burlar limites,
            automatizar abusos, publicar conteúdo ilegal, discriminatório, enganoso ou que viole
            direitos de terceiros. O responsável pela conta responde pelo material que enviar.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">3. Conteúdo editorial e afiliados</h2>
          <p className="mt-2 opacity-85">
            O catálogo de oportunidades é uma curadoria informativa. Alguns links são de afiliado:
            o Portal pode receber comissão se você se cadastrar ou contratar por eles, sem custo
            adicional necessariamente. Isso não transforma o Portal em empregador, agente,
            representante ou garantidor da empresa externa.
          </p>
          <p className="mt-2 opacity-85">
            Valores, moedas, idiomas, notas e descrições são referências editoriais aproximadas.
            Não constituem promessa de renda, vaga, aprovação, quantidade de trabalho ou resultado.
            Confirme os requisitos, disponibilidade, remuneração e regras diretamente com o terceiro
            antes de fornecer dados ou realizar atividade.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">4. Avaliações e conteúdo do usuário</h2>
          <p className="mt-2 opacity-85">
            Avaliações devem refletir experiência real e podem receber nota de 0 a 10, além de
            informações opcionais sobre remuneração. Não publique dados pessoais de outras pessoas,
            acusações sem fundamento, spam ou material protegido sem autorização. O Portal pode
            ocultar, corrigir ou remover conteúdo que viole estes termos, preservando registros
            necessários para segurança e defesa de direitos.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">5. Serviços musicais e pagamentos</h2>
          <p className="mt-2 opacity-85">
            Quando o Portal intermediar aulas ou serviços, a oferta exibirá as condições aplicáveis.
            Pagamentos podem ser processados por Mercado Pago ou outro provedor identificado na
            contratação. Taxas, divisão de valores, cancelamento e reembolso devem ser apresentados
            antes da confirmação e não afastam direitos obrigatórios do consumidor. O prestador é
            responsável pela execução do serviço e o Portal atua somente no papel descrito na oferta.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">6. Plataformas externas</h2>
          <p className="mt-2 opacity-85">
            Sites de terceiros têm cadastro, aprovação, privacidade, cobrança, suporte e regras
            próprios. O Portal não controla disponibilidade, decisões, pagamentos, segurança,
            remuneração ou resultados dessas empresas. A relação formada após o clique é entre você
            e o terceiro; leia os termos externos antes de prosseguir.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">7. Propriedade intelectual</h2>
          <p className="mt-2 opacity-85">
            Textos, identidade visual, código e componentes do Portal pertencem ao Portal NKL ou
            aos respectivos licenciadores. Marcas, logos e materiais de terceiros permanecem de
            seus titulares. É permitido compartilhar links da plataforma sem remover atribuição,
            mas não copiar, revender, extrair em massa ou explorar o conteúdo sem autorização.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">8. Suspensão, disponibilidade e alterações</h2>
          <p className="mt-2 opacity-85">
            Podemos limitar ou suspender contas para investigar fraude, abuso, risco à comunidade,
            inadimplemento ou violação destes termos, com oportunidade de esclarecimento quando
            cabível. Buscamos manter o serviço disponível, mas não garantimos funcionamento
            ininterrupto. Alterações relevantes serão publicadas nesta página com nova data de
            atualização.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">9. Lei aplicável e contato</h2>
          <p className="mt-2 opacity-85">
            Aplicam-se as leis brasileiras, sem prejuízo dos direitos inderrogáveis do consumidor.
            Para dúvidas, denúncias ou solicitações, use a página de{' '}
            <Link href="/contatos" className="text-neon font-bold hover:underline">Contatos</Link>.
          </p>
        </section>
      </article>

      <section className="mt-10 space-y-4">
        <h2 className="font-playfair text-2xl font-bold">Termos específicos por categoria</h2>
        {contracts.map((contract) => (
          <article key={contract.href} className="p-6 bg-surface border border-border rounded-xl">
            <h3 className="font-playfair text-xl font-bold">{contract.title}</h3>
            <p className="text-sm opacity-80 mt-2">{contract.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <a href={contract.href} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-neon hover:underline">
                Ler o termo completo →
              </a>
              <a href={contract.href} download className="text-sm font-bold opacity-70 hover:underline">
                Baixar (.md)
              </a>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

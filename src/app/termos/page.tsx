import Link from 'next/link';

export const metadata = {
  title: 'Termos de Uso | Portal NKL',
  description:
    'Regras de utilização, responsabilidades e contratos do Portal NKL.',
};

const contracts = [
  {
    href: '/contratos/termo-professores.md',
    title: 'Termo do Professor(a)',
    description:
      'Aulas por videochamada e presencialmente, com cláusula de não-circunvenção que proíbe contratar alunos da plataforma por fora.',
  },
  {
    href: '/contratos/termo-luthiers.md',
    title: 'Termo do Luthier',
    description:
      'Serviços de construção e reparo de instrumentos, com cláusula de não-circunvenção sobre clientes captados via plataforma.',
  },
  {
    href: '/contratos/termo-lojas.md',
    title: 'Termo da Loja',
    description:
      'Comércio de instrumentos e acessórios, com cláusula de não-circunvenção e responsabilidades de relação de consumo (CDC).',
  },
];

export default function TermosPage() {
  return (
    <div className="max-w-3xl w-full mx-auto px-4 pt-8">
      <h1 className="font-playfair text-3xl font-bold mb-2">Termos de Uso</h1>
      <p className="text-sm opacity-70 mb-8">
        Estes termos estabelecem as condições gerais para utilização do Portal NKL. Profissionais do portal (Professores, Luthiers e Lojas) aderem aos
        termos abaixo, que incluem cláusulas de <strong>não-circunvenção
        (anti-circumvention)</strong>: é proibido fechar aulas, serviços ou
        vendas &quot;por fora&quot; com clientes captados pela plataforma, sob
        penalidade de suspensão, cancelamento e multa.
      </p>

      <div className="mb-8 space-y-6 text-sm leading-relaxed opacity-85">
        <section>
          <h2 className="font-playfair text-2xl font-bold opacity-100">1. Uso da plataforma</h2>
          <p className="mt-2">O usuário deve fornecer informações verdadeiras, manter seus dados de acesso protegidos e utilizar os recursos do portal de forma lícita, respeitosa e compatível com sua finalidade. É proibido publicar conteúdo fraudulento, ofensivo, enganoso ou que viole direitos de terceiros.</p>
        </section>
        <section>
          <h2 className="font-playfair text-2xl font-bold opacity-100">2. Conteúdo e oportunidades de terceiros</h2>
          <p className="mt-2">O Portal NKL pode apresentar links de afiliados, plataformas de trabalho, marketplaces, serviços e conteúdos pertencentes a terceiros. Não somos responsáveis por disponibilidade, aprovação, preços, pagamentos, políticas, resultados ou decisões dessas plataformas. A relação contratual realizada fora do Portal NKL ocorre diretamente entre o usuário e o terceiro.</p>
        </section>
        <section>
          <h2 className="font-playfair text-2xl font-bold opacity-100">3. Avaliações e informações editoriais</h2>
          <p className="mt-2">Notas, tags e descrições servem como referência informativa e não constituem promessa de renda, recomendação financeira ou garantia de contratação. Avaliações devem refletir experiências reais e podem ser moderadas quando violarem estas regras.</p>
        </section>
        <section>
          <h2 className="font-playfair text-2xl font-bold opacity-100">4. Alterações e contato</h2>
          <p className="mt-2">Podemos atualizar funcionalidades, conteúdos e estes termos para refletir mudanças operacionais ou legais. A versão publicada nesta página é a referência vigente. Em caso de dúvida, utilize a página de <Link href="/contatos" className="text-neon font-bold hover:underline">Contatos</Link>.</p>
        </section>
      </div>

      <h2 className="font-playfair text-2xl font-bold mb-4">Termos específicos por categoria</h2>
      <div className="flex flex-col gap-4">
        {contracts.map((contract) => (
          <article
            key={contract.href}
            className="p-6 bg-surface border border-border rounded-xl flex flex-col gap-2"
          >
            <h2 className="font-playfair text-xl font-bold">{contract.title}</h2>
            <p className="text-sm opacity-80">{contract.description}</p>
            <div className="flex items-center gap-4 mt-1">
              <a
                href={contract.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-neon hover:underline"
              >
                Ler o termo completo →
              </a>
              <a
                href={contract.href}
                download
                className="text-sm font-bold opacity-70 hover:underline"
              >
                Baixar (.md)
              </a>
            </div>
          </article>
        ))}
      </div>

      <p className="text-xs opacity-60 mt-8">
        Dúvidas sobre os termos? Fale conosco pela página{' '}
        <Link href="/contatos" className="text-neon font-bold hover:underline">
          Contatos
        </Link>
        .
      </p>
    </div>
  );
}

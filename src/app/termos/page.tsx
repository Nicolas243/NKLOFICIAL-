import Link from 'next/link';

export const metadata = {
  title: 'Termos e Contratos | Portal NKL',
  description:
    'Termos de uso e contratos de Professores, Luthiers e Lojas do Portal NKL.',
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
      <h1 className="font-playfair text-3xl font-bold mb-2">Termos e Contratos</h1>
      <p className="text-sm opacity-70 mb-8">
        Profissionais do Portal NKL (Professores, Luthiers e Lojas) aderem aos
        termos abaixo, que incluem cláusulas de <strong>não-circunvenção
        (anti-circumvention)</strong>: é proibido fechar aulas, serviços ou
        vendas &quot;por fora&quot; com clientes captados pela plataforma, sob
        penalidade de suspensão, cancelamento e multa.
      </p>

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

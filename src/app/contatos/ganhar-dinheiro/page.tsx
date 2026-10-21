import type { Metadata } from 'next';
import Link from 'next/link';

const PROGRAMS = [
  {
    name: 'uTest',
    description: 'Plataforma global de QA. Ganhe em dólar realizando testes de software, aplicativos e jogos em projetos de grandes empresas.',
    href: 'https://www.utest.com/',
    cta: 'Cadastrar-se',
  },
  {
    name: 'Outlier AI',
    description: 'Treinamento de Inteligência Artificial. Seja pago em dólar por hora para avaliar e refinar modelos fundacionais de IA.',
    href: 'https://outlier.ai/',
    cta: 'Acessar Plataforma',
  },
  {
    name: 'Fluencify',
    description: 'Desenvolvimento de idiomas. Plataforma focada em impulsionar o aprendizado (insira seu link de indicação).',
    href: '#fluencify',
    cta: 'Cadastrar-se',
  },
  {
    name: 'Indica Aí',
    description: 'Programa de recompensas por indicações financeiras e imobiliárias.',
    href: '#indica-ai',
    cta: 'Acessar Plataforma',
  },
];

export const metadata: Metadata = {
  title: 'Programas de Parceria e Renda Extra | Portal NKL',
  description: 'Plataformas de afiliação, freelance e renda extra recomendadas pelo Portal NKL.',
};

export default function GanharDinheiroPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 pt-[120px] pb-12">
      <header className="max-w-3xl mx-auto text-center mb-12">
        <p className="text-neon uppercase tracking-[0.24em] text-xs font-bold mb-4">Oportunidades selecionadas</p>
        <h1 className="font-playfair text-3xl md:text-5xl font-bold leading-tight">
          Programas de Parceria e Renda Extra
        </h1>
        <p className="mt-5 text-base md:text-lg opacity-70 leading-relaxed">
          Conheça plataformas que podem abrir novas possibilidades de trabalho, aprendizado e renda
          extra no Brasil e no exterior. Avalie cada oportunidade e confira as condições antes de se
          cadastrar.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {PROGRAMS.map((program) => (
          <article
            key={program.name}
            id={program.href.startsWith('#') ? program.href.slice(1) : undefined}
            className="flex flex-col gap-5 p-6 md:p-8 bg-surface border border-border rounded-xl hover:border-neon transition-colors"
          >
            <div>
              <h2 className="font-playfair text-2xl font-bold">{program.name}</h2>
              <p className="mt-3 text-sm md:text-base opacity-70 leading-relaxed">{program.description}</p>
            </div>
            <a
              href={program.href}
              target={program.href.startsWith('http') ? '_blank' : undefined}
              rel={program.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="mt-auto inline-flex w-fit items-center justify-center px-5 py-3 bg-neon text-black rounded-md font-bold text-sm hover:opacity-90 transition-opacity"
            >
              {program.cta}
            </a>
          </article>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link href="/contatos" className="text-neon font-medium text-sm hover:underline">
          ← Voltar para contatos
        </Link>
      </div>
    </div>
  );
}

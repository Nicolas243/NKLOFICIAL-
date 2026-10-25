import { getProfessorsDirectory, type ProfessorCard } from '@/actions/directory';
import { BusinessCard } from '@/components/directory/business-card';

export const metadata = {
  title: 'Diretório de Professores | Portal NKL',
  description: 'Encontre professores de música e instrumentos.',
};

const fallbackProfessors: ProfessorCard[] = [
  {
  id: 'demo-professor-1',
  name: 'Lívia Ramos Música',
  bio: 'Aulas individuais de violino para iniciantes e músicos intermediários.',
  instrumento: 'Violino',
  anosExperiencia: 12,
  city: 'Rio de Janeiro',
  state: 'RJ',
  planType: 'free',
  },
  {
  id: 'demo-professor-2',
  name: 'Estúdio Renato Alves',
  bio: 'Aulas de viola com planos de estudo personalizados.',
  instrumento: 'Viola',
  anosExperiencia: 15,
  city: 'Recife',
  state: 'PE',
  planType: 'free',
  },
  {
  id: 'demo-professor-3',
  name: 'Música em Camadas',
  bio: 'Ensino de violoncelo para jovens e adultos.',
  instrumento: 'Violoncelo',
  anosExperiencia: 10,
  city: 'Porto Alegre',
  state: 'RS',
  planType: 'free',
  },
];

export default async function ProfessoresPage() {
  let directory: ProfessorCard[] = [];
  try {
  directory = await getProfessorsDirectory();
  } catch (error) {
  console.error('[professores] Diretório indisponível:', error instanceof Error ? error.message : 'erro desconhecido');
  }
  const profiles = directory.length > 0 ? directory : fallbackProfessors;

  return (
    <main className="min-h-screen pt-[120px] pb-12 flex flex-col max-w-7xl mx-auto px-4">
      <div className="mb-10">
        <h1 className="font-playfair text-4xl font-bold text-foreground">Professores</h1>
        <p className="text-neutral-500 mt-2">
          Encontre professores de violino, viola, violoncelo e teoria musical.
          {' Agende sua aula de vídeo direto pela plataforma.'}
        </p>
      </div>

      {profiles.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {profiles.map((professor) => (
            <BusinessCard
              key={professor.id}
              name={professor.name}
              specialty={professor.instrumento ?? 'Aulas de música'}
              location={professor.city && professor.state ? `${professor.city} · ${professor.state}` : professor.city ?? professor.state ?? 'Atendimento online'}
              contactUrl={professor.id.startsWith('demo-') ? '/contatos' : `/professores/${professor.id}`}
              reportTargetType="teacher"
              reportTargetId={professor.id}
            />
          ))}
        </section>
      ) : (
        <div className="bg-surface/50 border border-dashed border-border rounded-xl p-12 text-center text-neutral-400">
          <p className="text-lg font-medium mb-2">Diretório em sincronização</p>
          <p>Nenhum professor encontrado no momento. Novos perfis estarão disponíveis em breve.</p>
        </div>
      )}
    </main>
  );
}
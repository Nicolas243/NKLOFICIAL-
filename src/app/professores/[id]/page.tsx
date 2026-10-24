import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProfessorsDirectory } from '@/actions/directory';
import type { ProfessorCard } from '@/actions/directory';
import { isProfessorFavorite, toggleFavoriteProfessor } from '@/actions/favorites';
import { FavoriteButton } from '@/components/favorite-button';
import { JitsiMeetRoom } from '@/components/jitsi-meet-room';
import { createClient } from '@/lib/supabase/server';
import { BookingCalendar } from '@/components/scheduling/booking-calendar';

type Params = Promise<{ id: string }>;

export default async function ProfessorDetailsPage(props: { params: Params }) {
  const { id } = await props.params;

  let professor: ProfessorCard | undefined;
  try {
    professor = (await getProfessorsDirectory()).find((p) => p.id === id);
  } catch {
    professor = {
      id,
      name: 'Professor de demonstração',
      bio: 'Perfil temporário exibido enquanto o diretório é sincronizado.',
      instrumento: 'Instrumento não informado',
      anosExperiencia: null,
      city: null,
      state: null,
      planType: 'free',
    };
  }

  if (!professor) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isFavorite = user?.id ? await isProfessorFavorite(user.id, id) : false;

  const location =
    professor.city && professor.state
      ? `${professor.city} · ${professor.state}`
      : professor.city ?? professor.state ?? 'Localização não informada';

  return (
    <div className="max-w-3xl w-full mx-auto px-4 pt-8">
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-8 border-b border-border">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-playfair text-3xl font-bold mb-1">{professor.name}</h1>
              <p className="text-sm opacity-80">
                {professor.instrumento ?? 'Instrumento não informado'} · {location}
              </p>
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
                professor.planType === 'premium'
                  ? 'bg-neon/10 text-neon border-neon/40'
                  : 'bg-accent/10 text-foreground/70 border-border'
              }`}
            >
              {professor.planType === 'premium' ? 'Perfil Premium' : 'Verificado'}
            </span>
          </div>
        </div>

        {/* Sobre */}
        <div className="p-8 border-b border-border">
          <h2 className="font-playfair text-xl font-bold mb-3">Sobre</h2>
          <p className="leading-relaxed opacity-90 whitespace-pre-line">
            {professor.bio || 'Este professor ainda não adicionou uma biografia.'}
          </p>
          {professor.anosExperiencia !== null && (
            <p className="text-sm opacity-70 mt-3">
              {professor.anosExperiencia}{' '}
              {professor.anosExperiencia === 1 ? 'ano de experiência' : 'anos de experiência'}
            </p>
          )}
        </div>

        {/* Aula de vídeo + ações */}
        <div className="p-8 flex flex-col gap-4">
          <h2 className="font-playfair text-xl font-bold">Aula de Vídeo</h2>
          {user ? (
            <JitsiMeetRoom
              roomName={professor.id}
              displayName={professor.name}
            />
          ) : (
            <Link
              href="/login"
              className="inline-flex justify-center py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90"
            >
              Entre na sua conta para agendar uma aula
            </Link>
          )}

          {user && (
            <FavoriteButton
              action={toggleFavoriteProfessor}
              targetId={professor.id}
              initialSaved={isFavorite}
              savedLabel="Salvo nos Meus Professores"
              unsavedLabel="Salvar nos Meus Professores"
            />
          )}

          {user && <BookingCalendar professorId={professor.id} />}

          {/* Proteção anti-circumvention — lembrete contratual */}
          <p className="text-xs opacity-60 text-center mt-2">
            As aulas devem ser contratadas exclusivamente pela plataforma, conforme o{' '}
            <Link href="/termos" className="text-neon font-bold hover:underline">
              Termo do Professor
            </Link>{' '}
            (cláusula de não-concorrência).
          </p>
        </div>
      </div>
    </div>
  );
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProfessorsDirectory } from '@/actions/directory';
import type { ProfessorCard } from '@/actions/directory';
import { isProfessorFavorite, toggleFavoriteProfessor } from '@/actions/favorites';
import { FavoriteButton } from '@/components/favorite-button';
import { JitsiMeetRoom } from '@/components/jitsi-meet-room';
import { createClient } from '@/lib/supabase/server';
import { BookingCalendar } from '@/components/scheduling/booking-calendar';
import { getAvailableTeacherSlots } from '@/actions/scheduling';
import { TimeSlotPicker } from '@/components/booking/time-slot-picker';
import { db } from '@/db';
import { studentPlanEnrollments, teacherReviews, userProfiles } from '@/db/schema';
import { and, eq, gt } from 'drizzle-orm';
import type { ClassPlanModality } from '@/lib/pricing';
import { DEFAULT_CLASS_PRICE_CENTS, CENTS_PER_UNIT, MONTHLY_PLAN_CLASSES, SEMIANNUAL_PLAN_CLASSES, ANNUAL_PLAN_CLASSES } from '@/lib/pricing';
import { ReportEntityModal } from '@/components/moderation/report-entity-modal';

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
  const [profile] = await db.select({
    singleClassPriceCents: userProfiles.singleClassPriceCents,
    monthlyPlanPriceCents: userProfiles.monthlyPlanPriceCents,
    semiannualPlanPriceCents: userProfiles.semiannualPlanPriceCents,
    annualPlanPriceCents: userProfiles.annualPlanPriceCents,
    acceptsNewStudents: userProfiles.acceptsNewStudents,
  }).from(userProfiles).where(eq(userProfiles.id, id)).limit(1);
  const prices: Record<ClassPlanModality, number> = {
    single: profile?.singleClassPriceCents ?? DEFAULT_CLASS_PRICE_CENTS,
    monthly: profile?.monthlyPlanPriceCents ?? DEFAULT_CLASS_PRICE_CENTS * MONTHLY_PLAN_CLASSES,
    semiannual: profile?.semiannualPlanPriceCents ?? DEFAULT_CLASS_PRICE_CENTS * SEMIANNUAL_PLAN_CLASSES,
    annual: profile?.annualPlanPriceCents ?? DEFAULT_CLASS_PRICE_CENTS * ANNUAL_PLAN_CLASSES,
  };
  const activeCredits = user?.id
    ? await db.select({ totalCredits: studentPlanEnrollments.totalCredits, usedCredits: studentPlanEnrollments.usedCredits })
      .from(studentPlanEnrollments)
      .where(and(eq(studentPlanEnrollments.studentId, user.id), eq(studentPlanEnrollments.teacherId, id), eq(studentPlanEnrollments.status, 'active'), gt(studentPlanEnrollments.expiresAt, new Date())))
    : [];
  const publicReviews = await db.select({
    id: teacherReviews.id,
    rating: teacherReviews.rating,
    comment: teacherReviews.comment,
    createdAt: teacherReviews.createdAt,
  }).from(teacherReviews).where(and(eq(teacherReviews.teacherId, id), eq(teacherReviews.visibility, 'public')));
  let availableSlots: Date[] = [];
  if (user) {
    const from = new Date();
    const to = new Date(from);
    to.setDate(to.getDate() + 14);
    try {
      availableSlots = await getAvailableTeacherSlots(id, from, to);
    } catch (error) {
      console.error('[PROFESSOR_BOOKING] Falha ao carregar disponibilidade:', error instanceof Error ? error.message : 'erro desconhecido');
    }
  }

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
          <ReportEntityModal targetType="teacher" targetUserId={professor.id} />
          {user && (
            <TimeSlotPicker
              teacherId={professor.id}
              slots={availableSlots.map((slot) => slot.toISOString())}
              prices={prices}
              acceptsNewStudents={profile?.acceptsNewStudents ?? true}
            />
          )}
          <section className="rounded-xl border border-border p-5">
            <h2 className="font-playfair text-xl font-bold">Planos e Valores de Aula</h2>
            <p className="mt-2 text-sm opacity-70">A partir de R$ {(prices.single / CENTS_PER_UNIT).toFixed(2)} por aula avulsa. Planos com créditos também estão disponíveis no agendamento.</p>
            {activeCredits.length > 0 && <p className="mt-2 text-sm text-neon">Você possui crédito ativo com este professor.</p>}
          </section>
          <section className="rounded-xl border border-border p-5">
            <h2 className="font-playfair text-xl font-bold">Avaliações públicas</h2>
            {publicReviews.length === 0 ? (
              <p className="mt-2 text-sm opacity-70">Este professor ainda não possui avaliações públicas.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {publicReviews.map((review) => (
                  <article key={review.id} className="rounded-lg border border-border p-4">
                    <p className="font-bold text-neon">{review.rating}/5</p>
                    <p className="mt-1 text-sm">{review.comment}</p>
                    <p className="mt-2 text-xs opacity-60">{review.createdAt.toLocaleDateString('pt-BR')}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

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

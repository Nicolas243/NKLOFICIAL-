import { redirect } from 'next/navigation';
import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import { AvailabilityManager } from '@/components/dashboard/availability-manager';
import { db } from '@/db';
import { classBookings, notifications, studentPlanEnrollments, teacherReviews, userProfiles, users } from '@/db/schema';
import { TeacherPricingForm } from '@/components/dashboard/teacher-pricing-form';
import { createClient } from '@/lib/supabase/server';
import { BookingRoom } from '@/components/video/booking-room';
import { UpcomingClassBanner } from '@/components/dashboard/upcoming-class-banner';
import { ReportEntityModal } from '@/components/moderation/report-entity-modal';
import { LgpdPrivacyPanel } from '@/components/dashboard/lgpd-privacy-panel';

export const metadata = {
  title: 'Dashboard do Professor | Portal NKL',
};

export default async function ProfessorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect('/login');
  }

  const [profile] = await db.select({
    name: users.name,
    role: users.role,
    papel: userProfiles.papel,
    singleClassPriceCents: userProfiles.singleClassPriceCents,
    monthlyPlanPriceCents: userProfiles.monthlyPlanPriceCents,
    semiannualPlanPriceCents: userProfiles.semiannualPlanPriceCents,
    annualPlanPriceCents: userProfiles.annualPlanPriceCents,
    acceptsNewStudents: userProfiles.acceptsNewStudents,
  }).from(users).innerJoin(userProfiles, eq(userProfiles.id, users.id)).where(eq(users.id, user.id)).limit(1);
  if (!profile || (profile.role !== 'professor' && profile.papel !== 'Professor')) {
    redirect('/');
  }
  const bookings = await db
    .select({
      id: classBookings.id,
      studentId: classBookings.studentId,
      scheduledAt: classBookings.scheduledAt,
      meetingUrl: classBookings.meetingUrl,
      completedAt: classBookings.completedAt,
      studentName: users.name,
      planModality: classBookings.planModality,
      teacherNetCents: classBookings.teacherNetCents,
    })
    .from(classBookings)
    .innerJoin(users, eq(users.id, classBookings.studentId))
    .where(and(eq(classBookings.teacherId, user.id), gte(classBookings.scheduledAt, new Date())));
  const reviews = await db.select({
    id: teacherReviews.id,
    rating: teacherReviews.rating,
    comment: teacherReviews.comment,
    visibility: teacherReviews.visibility,
    createdAt: teacherReviews.createdAt,
  }).from(teacherReviews).where(and(eq(teacherReviews.teacherId, user.id), eq(teacherReviews.visibility, 'public')));
  const privateTeacherReviews = await db.select({
    id: teacherReviews.id,
    rating: teacherReviews.rating,
    comment: teacherReviews.comment,
    visibility: teacherReviews.visibility,
    createdAt: teacherReviews.createdAt,
  }).from(teacherReviews).where(and(eq(teacherReviews.teacherId, user.id), eq(teacherReviews.visibility, 'teacher_only')));
  const [activePlans] = await db.select({ count: count() }).from(studentPlanEnrollments).where(and(eq(studentPlanEnrollments.teacherId, user.id), eq(studentPlanEnrollments.status, 'active')));
  const bannerNow = new Date();
  const bannerTo = new Date(bannerNow.getTime() + 2 * 60 * 60 * 1000);
  const bannerClasses = await db.select({
    id: classBookings.id,
    scheduledAt: classBookings.scheduledAt,
    studentName: users.name,
  }).from(classBookings).innerJoin(users, eq(users.id, classBookings.studentId)).where(and(
    eq(classBookings.teacherId, user.id),
    eq(classBookings.status, 'confirmed'),
    gte(classBookings.scheduledAt, bannerNow),
    lte(classBookings.scheduledAt, bannerTo),
  ));
  const recentNotifications = await db.select({
    id: notifications.id,
    title: notifications.title,
    message: notifications.message,
    createdAt: notifications.createdAt,
    isRead: notifications.isRead,
  }).from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(5);
  // Use one instant for consistent room availability across all cards.
  // eslint-disable-next-line react-hooks/purity
  const currentTime = Date.now();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Teacher Hub</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold sm:text-5xl">Sua agenda, no seu ritmo</h1>
        <p className="mt-4 text-base opacity-70">
          Olá, {profile.name}. Defina os intervalos em que você pode receber alunos.
        </p>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4"><span className="text-xs opacity-60">Planos ativos</span><strong className="mt-2 block text-2xl">{activePlans?.count ?? 0}</strong></div>
        <div className="rounded-xl border border-border bg-surface p-4"><span className="text-xs opacity-60">Aulas futuras</span><strong className="mt-2 block text-2xl">{bookings.length}</strong></div>
      </div>
      <div className="mb-6 space-y-6">
        <TeacherPricingForm singleClassPriceCents={profile.singleClassPriceCents} monthlyPlanPriceCents={profile.monthlyPlanPriceCents} semiannualPlanPriceCents={profile.semiannualPlanPriceCents} annualPlanPriceCents={profile.annualPlanPriceCents} acceptsNewStudents={profile.acceptsNewStudents} />
      </div>
      <UpcomingClassBanner
        classes={bannerClasses.map((item) => ({ ...item, scheduledAt: item.scheduledAt.toISOString() }))}
        notifications={recentNotifications.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))}
      />
      <AvailabilityManager />
      <section className="mt-8 space-y-4">
        <h2 className="font-playfair text-2xl font-bold">Próximas aulas</h2>
        {bookings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm opacity-70">Nenhuma aula confirmada no momento.</p>
        ) : bookings.map((booking) => {
          const isOpen = currentTime >= booking.scheduledAt.getTime() - 10 * 60 * 1000;
          return (
            <article key={booking.id} className="rounded-xl border border-border bg-surface p-6">
              <h3 className="font-playfair text-xl font-bold">{booking.studentName}</h3>
              <p className="mt-2 text-sm opacity-70">
                {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(booking.scheduledAt)}
              </p>
              {booking.completedAt && <p className="mt-1 text-xs font-bold text-neon">Aula Concluída</p>}
              {isOpen ? (
                <BookingRoom url={booking.meetingUrl} />
              ) : (
                <p className="mt-2 text-xs opacity-60">A sala será liberada 10 minutos antes do horário.</p>
              )}
              <ReportEntityModal targetType="student" targetUserId={booking.studentId} bookingId={booking.id} />
            </article>
          );
        })}
      </section>
      <section className="mt-8 space-y-4">
        <h2 className="font-playfair text-2xl font-bold">Avaliações recebidas</h2>
        {[...reviews, ...privateTeacherReviews].length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm opacity-70">Nenhuma avaliação disponível.</p>
        ) : [...reviews, ...privateTeacherReviews].map((review) => (
          <article key={review.id} className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-bold text-neon">{review.rating}/5 · {review.visibility === 'public' ? 'Pública' : 'Privada'}</p>
            <p className="mt-2 text-sm">{review.comment}</p>
            <p className="mt-2 text-xs opacity-60">{review.createdAt.toLocaleDateString('pt-BR')}</p>
          </article>
        ))}
      </section>
      <LgpdPrivacyPanel />
    </div>
  );
}

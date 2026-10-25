import { and, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/db';
import { classBookings, users } from '@/db/schema';
import { calculateClassPricing, CENTS_PER_UNIT, getModalityMetadata, type ClassPlanModality } from '@/lib/pricing';
import { createClient } from '@/lib/supabase/server';
import { BookingPayment } from '@/components/checkout/booking-payment';

type Params = Promise<{ bookingId: string }>;

export default async function BookingCheckoutPage(props: { params: Params }) {
  const { bookingId } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect('/login');
  }

  const [booking] = await db
    .select({
      id: classBookings.id,
      scheduledAt: classBookings.scheduledAt,
      status: classBookings.status,
      paymentStatus: classBookings.paymentStatus,
      priceCents: classBookings.priceCents,
      planModality: classBookings.planModality,
      teacherId: classBookings.teacherId,
      teacherName: users.name,
    })
    .from(classBookings)
    .innerJoin(users, eq(users.id, classBookings.teacherId))
    .where(and(eq(classBookings.id, bookingId), eq(classBookings.studentId, user.id)))
    .limit(1);

  if (!booking) {
    notFound();
  }

  const modality = getModalityMetadata(booking.planModality as ClassPlanModality);
  const pricing = calculateClassPricing(booking.priceCents, booking.planModality as ClassPlanModality);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Checkout seguro</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold">Confirme sua aula</h1>
        <p className="mt-3 text-sm opacity-70">
          Aula com {booking.teacherName} em{' '}
          {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(booking.scheduledAt)}.
        </p>
      </div>
      <BookingPayment
        bookingId={booking.id}
        basePrice={pricing.basePriceCents / CENTS_PER_UNIT}
        studentFee={pricing.studentFeeCents / CENTS_PER_UNIT}
        total={pricing.totalStudentPaysCents / CENTS_PER_UNIT}
        modalityLabel={modality.label}
        includedClasses={modality.includedClasses}
        maxInstallments={modality.maxInstallments}
      />
    </div>
  );
}

import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { classBookings } from '@/db/schema';
import { env } from '@/env';
import { createClient } from '@/lib/supabase/server';
import { calculateClassPricing, getModalityMetadata, type ClassPlanModality } from '@/lib/pricing';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { buildBookingCheckoutParams } from '@/lib/stripe/premium-booking';

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const body: unknown = await request.json();
    if (typeof body !== 'object' || body === null || !('bookingId' in body) || typeof body.bookingId !== 'string' || !body.bookingId) {
      return NextResponse.json({ error: 'invalid_payment_data' }, { status: 400 });
    }

    const [booking] = await db
      .select({
        id: classBookings.id,
        priceCents: classBookings.priceCents,
        planModality: classBookings.planModality,
        studentId: classBookings.studentId,
        paymentStatus: classBookings.paymentStatus,
      })
      .from(classBookings)
      .where(and(eq(classBookings.id, body.bookingId), eq(classBookings.studentId, user.id)))
      .limit(1);

    if (!booking) return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });
    if (booking.paymentStatus !== 'pending') return NextResponse.json({ error: 'booking_not_payable' }, { status: 409 });
    const pricing = calculateClassPricing(booking.priceCents, booking.planModality as ClassPlanModality);
    const modality = getModalityMetadata(booking.planModality as ClassPlanModality);
    const session = await createCheckoutSession(buildBookingCheckoutParams({
      bookingId: booking.id,
      siteUrl: env.NEXT_PUBLIC_SITE_URL,
      totalCents: pricing.totalStudentPaysCents,
      description: `Aula individual Portal NKL — ${modality.label}`,
    }));
    if (!session.url) {
      return NextResponse.json({ error: 'checkout_url_missing' }, { status: 502 });
    }
    return NextResponse.json({ checkoutUrl: session.url }, { status: 200 });
  } catch (error) {
    console.error('[BOOKING_PAYMENT] Falha ao criar pagamento:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'payment_creation_failed' }, { status: 502 });
  }
}

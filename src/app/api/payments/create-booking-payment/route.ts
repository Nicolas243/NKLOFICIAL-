import { and, eq } from 'drizzle-orm';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { classBookings, userProfiles } from '@/db/schema';
import { env } from '@/env';
import { createClient } from '@/lib/supabase/server';
import { calculateClassPricing, CENTS_PER_UNIT, getModalityMetadata, type ClassPlanModality } from '@/lib/pricing';

type PaymentInput = {
  bookingId?: unknown;
  token?: unknown;
  payment_method_id?: unknown;
  installments?: unknown;
  issuer_id?: unknown;
  payer?: unknown;
};

function isPaymentInput(value: unknown): value is PaymentInput {
  return typeof value === 'object' && value !== null;
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const body: unknown = await request.json();
    if (!isPaymentInput(body) || typeof body.bookingId !== 'string' || !body.bookingId) {
      return NextResponse.json({ error: 'invalid_payment_data' }, { status: 400 });
    }

    const [booking] = await db
      .select({
        id: classBookings.id,
        priceCents: classBookings.priceCents,
        planModality: classBookings.planModality,
        studentId: classBookings.studentId,
        teacherId: classBookings.teacherId,
        paymentStatus: classBookings.paymentStatus,
        teacherAccessToken: userProfiles.mpAccessToken,
      })
      .from(classBookings)
      .innerJoin(userProfiles, eq(userProfiles.id, classBookings.teacherId))
      .where(and(eq(classBookings.id, body.bookingId), eq(classBookings.studentId, user.id)))
      .limit(1);

    if (!booking) return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });
    if (booking.paymentStatus !== 'pending') return NextResponse.json({ error: 'booking_not_payable' }, { status: 409 });
    if (process.env.NODE_ENV === 'production' && !booking.teacherAccessToken) {
      return NextResponse.json({ error: 'teacher_mp_account_not_connected' }, { status: 422 });
    }

    const pricing = calculateClassPricing(booking.priceCents, booking.planModality as ClassPlanModality);
    const modality = getModalityMetadata(booking.planModality as ClassPlanModality);
    const accessToken = booking.teacherAccessToken || env.MERCADOPAGO_ACCESS_TOKEN;
    const paymentBody: Record<string, unknown> = {
      token: body.token,
      payment_method_id: body.payment_method_id,
      installments: body.installments,
      issuer_id: body.issuer_id,
      payer: body.payer,
      transaction_amount: pricing.totalStudentPaysCents / CENTS_PER_UNIT,
      description: 'Aula individual Portal NKL',
      external_reference: booking.id,
      metadata: {
        booking_id: booking.id,
        plan_modality: booking.planModality,
        included_classes: modality.includedClasses,
        student_id: booking.studentId,
        teacher_id: booking.teacherId,
      },
    };
    if (booking.teacherAccessToken) {
      paymentBody.application_fee = pricing.platformApplicationFeeCents / CENTS_PER_UNIT;
    }

    const payment = await new Payment(new MercadoPagoConfig({ accessToken })).create({ body: paymentBody });
    return NextResponse.json({ id: payment.id, status: payment.status });
  } catch (error) {
    console.error('[BOOKING_PAYMENT] Falha ao criar pagamento:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'payment_creation_failed' }, { status: 502 });
  }
}

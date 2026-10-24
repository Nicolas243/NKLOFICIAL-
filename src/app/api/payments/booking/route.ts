import { and, eq } from 'drizzle-orm';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { classBookings } from '@/db/schema';
import { env } from '@/env';
import { createClient } from '@/lib/supabase/server';

type PaymentInput = {
  token?: string;
  payment_method_id?: string;
  installments?: number;
  issuer_id?: number;
  payer?: Record<string, unknown>;
};

function isPaymentInput(value: unknown): value is PaymentInput {
  return typeof value === 'object' && value !== null;
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    if (!isPaymentInput(body)) {
      return NextResponse.json({ error: 'invalid_payment_data' }, { status: 400 });
    }

    const bookingId = request.headers.get('x-booking-id');
    if (!bookingId) {
      return NextResponse.json({ error: 'missing_booking_id' }, { status: 400 });
    }

    const [booking] = await db
      .select({ id: classBookings.id, paymentStatus: classBookings.paymentStatus })
      .from(classBookings)
      .where(and(eq(classBookings.id, bookingId), eq(classBookings.studentId, user.id)))
      .limit(1);
    if (!booking) {
      return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });
    }
    if (booking.paymentStatus !== 'pending') {
      return NextResponse.json({ error: 'booking_not_payable' }, { status: 409 });
    }

    const payment = await new Payment(new MercadoPagoConfig({
      accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
    })).create({
      body: {
        ...body,
        transaction_amount: 150,
        description: 'Aula individual Portal NKL',
        external_reference: bookingId,
        metadata: { booking_id: bookingId },
        payer: body.payer,
      },
    });

    return NextResponse.json({ id: payment.id, status: payment.status });
  } catch (error) {
    console.error('[BOOKING_PAYMENT] Falha ao criar pagamento:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'payment_creation_failed' }, { status: 502 });
  }
}

import Stripe from 'stripe';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  classBookings,
  guideOfferEvents,
  guidePurchases,
  guideSubscriptions,
  studentPlanEnrollments,
  stripeWebhookEvents,
  subscriptions,
  userProfiles,
} from '@/db/schema';
import { env } from '@/env';
import { getModalityMetadata, type ClassPlanModality } from '@/lib/pricing';
import { createBookingNotification } from '@/lib/notifications/booking-alerts';
import { getOfferExperimentFromVariant, parseValidatedOfferVariant } from '@/lib/offer-experiment';
import {
  getStripeReference,
  normalizeStripeSubscriptionStatus,
  parseStripePeriodEnd,
  type StripeReference,
} from './webhook-helpers';

export { getStripeReference, normalizeStripeSubscriptionStatus, parseStripePeriodEnd } from './webhook-helpers';

function getOfferExperiment(offerVariant: string | null): { experiment: string; variant: string } | null {
  return getOfferExperimentFromVariant(parseValidatedOfferVariant(offerVariant));
}

async function markEventProcessed(event: Stripe.Event): Promise<boolean> {
  const inserted = await db.insert(stripeWebhookEvents).values({
    id: event.id,
    type: event.type,
  }).onConflictDoNothing().returning({ id: stripeWebhookEvents.id });
  return inserted.length > 0;
}

async function processGuidePurchase(session: Stripe.Checkout.Session, reference: StripeReference): Promise<void> {
  const [purchase] = await db.select({
    id: guidePurchases.id,
    offerVariant: guidePurchases.offerVariant,
  }).from(guidePurchases).where(eq(guidePurchases.id, reference.id)).limit(1);
  if (!purchase) return;

  await db.update(guidePurchases).set({
    status: 'approved',
    paymentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
    email: session.customer_details?.email ?? null,
    updatedAt: new Date(),
  }).where(and(eq(guidePurchases.id, purchase.id), eq(guidePurchases.status, 'pending')));

  const experiment = getOfferExperiment(purchase.offerVariant);
  if (!experiment) return;
  const [existingConversion] = await db.select({ id: guideOfferEvents.id })
    .from(guideOfferEvents)
    .where(and(eq(guideOfferEvents.purchaseId, purchase.id), eq(guideOfferEvents.eventType, 'conversion')))
    .limit(1);
  if (!existingConversion) {
    await db.insert(guideOfferEvents).values({
      experiment: experiment.experiment,
      variant: experiment.variant,
      eventType: 'conversion',
      purchaseId: purchase.id,
    });
  }
}

async function processFailedCheckout(session: Stripe.Checkout.Session): Promise<void> {
  const reference = getStripeReference(session.metadata);
  if (!reference || reference.type !== 'guide_purchase') return;
  await db.update(guidePurchases).set({
    status: 'rejected',
    paymentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
    updatedAt: new Date(),
  }).where(and(eq(guidePurchases.id, reference.id), eq(guidePurchases.status, 'pending')));
}

async function processGuideSubscription(
  subscription: Stripe.Subscription,
  reference: StripeReference,
): Promise<void> {
  const [row] = await db.select({
    id: guideSubscriptions.id,
    offerVariant: guideSubscriptions.offerVariant,
  }).from(guideSubscriptions).where(eq(guideSubscriptions.id, reference.id)).limit(1);
  if (!row) return;

  await db.update(guideSubscriptions).set({
    gatewaySubscriptionId: subscription.id,
    status: normalizeStripeSubscriptionStatus(subscription.status),
    currentPeriodEnd: parseStripePeriodEnd(subscription.items.data[0]?.current_period_end),
    updatedAt: new Date(),
  }).where(eq(guideSubscriptions.id, row.id));

  if (subscription.status !== 'active') return;
  const experiment = getOfferExperiment(row.offerVariant);
  if (!experiment) return;
  const [existingConversion] = await db.select({ id: guideOfferEvents.id })
    .from(guideOfferEvents)
    .where(and(eq(guideOfferEvents.subscriptionId, row.id), eq(guideOfferEvents.eventType, 'conversion')))
    .limit(1);
  if (!existingConversion) {
    await db.insert(guideOfferEvents).values({
      experiment: experiment.experiment,
      variant: experiment.variant,
      eventType: 'conversion',
      subscriptionId: row.id,
    });
  }
}

async function processPremiumSubscription(
  subscription: Stripe.Subscription,
  reference: StripeReference,
): Promise<void> {
  await db.insert(subscriptions).values({
    userId: reference.id,
    gatewayProvider: 'stripe',
    gatewaySubscriptionId: subscription.id,
    status: normalizeStripeSubscriptionStatus(subscription.status),
    currentPeriodEnd: parseStripePeriodEnd(subscription.items.data[0]?.current_period_end),
  }).onConflictDoUpdate({
    target: subscriptions.gatewaySubscriptionId,
    set: {
      status: normalizeStripeSubscriptionStatus(subscription.status),
      currentPeriodEnd: parseStripePeriodEnd(subscription.items.data[0]?.current_period_end),
      updatedAt: new Date(),
    },
  });
  await db.update(userProfiles).set({
    planType: subscription.status === 'active' ? 'premium' : 'free',
  }).where(eq(userProfiles.id, reference.id));
}

async function processBooking(session: Stripe.Checkout.Session, reference: StripeReference): Promise<void> {
  const [booking] = await db.select({
    id: classBookings.id,
    studentId: classBookings.studentId,
    teacherId: classBookings.teacherId,
    planModality: classBookings.planModality,
    priceCents: classBookings.priceCents,
    platformFeeCents: classBookings.platformFeeCents,
    paymentStatus: classBookings.paymentStatus,
  }).from(classBookings)
    .where(and(eq(classBookings.id, reference.id), eq(classBookings.paymentStatus, 'pending')))
    .limit(1);
  if (!booking) return;

  const dailyResponse = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      privacy: 'private',
      properties: { exp: Math.floor(Date.now() / 1000) + 7200 },
    }),
  });
  if (!dailyResponse.ok) throw new Error(`Daily room creation failed: ${dailyResponse.status}`);
  const dailyPayload: unknown = await dailyResponse.json();
  if (typeof dailyPayload !== 'object' || dailyPayload === null || !('url' in dailyPayload) || typeof dailyPayload.url !== 'string') {
    throw new Error('Daily returned an invalid room URL.');
  }

  const modality = getModalityMetadata(booking.planModality as ClassPlanModality);
  let enrollmentId: string | undefined;
  if (modality.includedClasses > 1) {
    const [enrollment] = await db.insert(studentPlanEnrollments).values({
      studentId: booking.studentId,
      teacherId: booking.teacherId,
      modality: booking.planModality,
      totalCredits: modality.includedClasses,
      usedCredits: 1,
      pricePaidCents: booking.priceCents,
      platformFeeCents: booking.platformFeeCents,
      mpPaymentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
      expiresAt: new Date(Date.now() + modality.validityDays * 24 * 60 * 60 * 1000),
    }).returning({ id: studentPlanEnrollments.id });
    enrollmentId = enrollment?.id;
  }

  await db.update(classBookings).set({
    paymentStatus: 'paid',
    status: 'confirmed',
    meetingUrl: dailyPayload.url,
    enrollmentId,
  }).where(and(eq(classBookings.id, booking.id), eq(classBookings.paymentStatus, 'pending')));
  await Promise.all([
    createBookingNotification({ userId: booking.studentId, title: 'Aula confirmada', message: 'Seu pagamento foi aprovado e a sala está pronta.', link: booking.id }),
    createBookingNotification({ userId: booking.teacherId, title: 'Pagamento aprovado', message: 'A aula foi confirmada e a sala Daily está disponível.', link: booking.id }),
  ]);
}

async function processCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const reference = getStripeReference(session.metadata);
  if (!reference) throw new Error('Stripe Checkout session is missing valid domain metadata.');
  if (reference.type === 'guide_purchase' && session.payment_status === 'paid') {
    await processGuidePurchase(session, reference);
  } else if (reference.type === 'booking' && session.payment_status === 'paid') {
    await processBooking(session, reference);
  } else if (reference.type === 'guide_subscription' && typeof session.subscription === 'string') {
    const subscription = await getStripeClient().subscriptions.retrieve(session.subscription);
    await processGuideSubscription(subscription, reference);
  } else if (reference.type === 'premium_subscription' && typeof session.subscription === 'string') {
    const subscription = await getStripeClient().subscriptions.retrieve(session.subscription);
    await processPremiumSubscription(subscription, reference);
  }
}

function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured.');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  if (!(await markEventProcessed(event))) return;
  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await processCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        return;
      case 'checkout.session.async_payment_failed':
        await processFailedCheckout(event.data.object as Stripe.Checkout.Session);
        return;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const reference = getStripeReference(subscription.metadata);
        if (!reference) throw new Error('Stripe subscription is missing valid domain metadata.');
        if (reference.type === 'guide_subscription') await processGuideSubscription(subscription, reference);
        if (reference.type === 'premium_subscription') await processPremiumSubscription(subscription, reference);
        return;
      }
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;
        if (!subscriptionId) return;
        const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
        const reference = getStripeReference(subscription.metadata);
        if (!reference) throw new Error('Stripe invoice subscription is missing valid domain metadata.');
        if (reference.type === 'guide_subscription') await processGuideSubscription(subscription, reference);
        if (reference.type === 'premium_subscription') await processPremiumSubscription(subscription, reference);
        return;
      }
      default:
        return;
    }
  } catch (error) {
    await db.delete(stripeWebhookEvents).where(eq(stripeWebhookEvents.id, event.id));
    throw error;
  }
}

# Stripe-only payments design

## Intent

Replace Mercado Pago as the active payment gateway with Stripe while preserving
the current product prices, access rules, and polished Portuguese checkout
experience. Stripe must cover every paid flow currently present: the luthier
Premium plan, the one-time Guide purchase, the recurring Guide subscription,
and class bookings.

## Goals

- Use Stripe Checkout hosted pages for one-time and recurring payments.
- Create or reuse Stripe Products and Prices from the existing BRL constants.
- Keep checkout creation server-side and never expose secret keys.
- Validate Stripe webhook signatures and process events idempotently.
- Update purchases, subscriptions, and bookings only after confirmed Stripe events.
- Remove Mercado Pago from active UI, actions, routes, dependencies, and required
  environment validation without deleting historical database records.
- Keep the existing success pages, download authorization, subscription status,
  booking access, and offer attribution behavior.

## Non-goals

- Migrating or deleting historical Mercado Pago records.
- Automatically changing production data, applying remote migrations, or
  deploying infrastructure.
- Building an embedded card form; hosted Checkout is the selected UX.
- Adding new products, discounts, currencies, or pricing beyond the current
  application constants.

## Constraints

- Next.js 16 App Router, strict TypeScript, Drizzle, and Supabase remain in use.
- Webhooks must verify signatures before database writes.
- Stripe secrets come from `.env.local`/deployment environment and are never
  printed or committed.
- The Stripe CLI is currently unavailable in the workspace, so `stripe agent
  setup` and remote Product/Price creation require the CLI to be installed and
  authenticated before those steps can be verified.

## Approaches

1. **Stripe Checkout hosted pages (selected):** smallest secure surface and
   handles cards, redirects, and recurring billing through Stripe. It fits the
   current server-created checkout URLs and avoids handling raw payment data.
2. **Stripe Payment Element:** more visual control, but adds client-side payment
   state, 3DS handling, and more failure paths than this portal needs.
3. **Payment Links:** quick for static products, but cannot reliably bind
   bookings and authenticated users to domain records or support consistent
   webhook metadata.

## Design

Create a small server-only Stripe client and a shared Checkout session helper.
Each checkout includes stable metadata and a domain reference:

- `premium_subscription:<user-id>` for the luthier plan.
- `guide_purchase:<purchase-id>` for the one-time Guide.
- `guide_subscription:<subscription-id>` for the recurring Guide.
- `booking:<booking-id>` for class bookings.

Use one Stripe webhook route for Checkout, payment, invoice, and subscription
events. It verifies `STRIPE_WEBHOOK_SECRET`, reads metadata, and performs
idempotent updates. Subscription and invoice events update the relevant
subscription period/status; successful one-time payments approve the Guide or
booking. Existing download and access checks remain the source of truth.

The UI replaces the Mercado Pago brick with a Stripe Checkout button and
redirects to the existing success route with a pending/confirmation message.
The legal payment copy is updated from Mercado Pago-specific wording to
provider-neutral Stripe wording.

## Remaining builder decisions

- Use existing price constants as the source of truth and expose configurable
  Stripe Price IDs only when a pre-created Price is required by the account.
- Add an additive migration only if the existing gateway columns cannot safely
  represent Stripe IDs; prefer `gatewayProvider` plus existing IDs where
  possible.
- Keep legacy Mercado Pago routes available only if existing historical
  callbacks require them; they are no longer linked or required for new sales.

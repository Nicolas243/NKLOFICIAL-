import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { guidePurchases } from '@/db/schema';

export const metadata: Metadata = {
  title: 'Pagamento confirmado | Guia NKL',
  robots: {
    index: false,
    follow: false,
  },
};

type SuccessPageProps = {
  searchParams: Promise<{
    external_reference?: string;
    payment_id?: string;
    status?: string;
  }>;
};

export default async function GuidePurchaseSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const purchaseId = z.string().uuid().safeParse(params.external_reference);
  const [purchase] = purchaseId.success
    ? await db.select({
      id: guidePurchases.id,
      status: guidePurchases.status,
      paymentId: guidePurchases.paymentId,
    }).from(guidePurchases).where(eq(guidePurchases.id, purchaseId.data)).limit(1)
    : [];
  const paymentMatches = !params.payment_id || purchase?.paymentId === params.payment_id;
  const isApproved = purchase?.status === 'approved' && paymentMatches;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      {isApproved ? (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Acesso liberado</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold">Pagamento Confirmado! Seu acesso foi liberado.</h1>
          <p className="mt-4 leading-relaxed text-foreground/75">Obrigado pela compra. Baixe o material pelo botão abaixo e guarde este endereço para consultar o arquivo novamente.</p>
          <a href="/guias/guia-renda-extra-nkl.pdf" download className="mt-6 inline-flex min-h-12 items-center justify-center rounded-md bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark">Baixar Guia (PDF)</a>
        </section>
      ) : (
        <section className="rounded-2xl border border-orange/30 bg-orange/5 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Pagamento em processamento</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold">Estamos confirmando seu pagamento.</h1>
          <p className="mt-4 leading-relaxed text-foreground/75">O acesso será liberado após a confirmação do Mercado Pago. Se o pagamento já foi aprovado, aguarde alguns instantes e atualize esta página.</p>
        </section>
      )}
    </div>
  );
}

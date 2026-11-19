import type { Metadata } from 'next';
import Link from 'next/link';
import { AD_CONTRACT_CLAUSES, AD_CONTRACT_VERSION } from '@/lib/ad-contract';

export const metadata: Metadata = {
  title: 'Contrato de Publicidade',
  description: 'Termos para campanhas publicitárias no Portal NKL.',
};

export default function AdvertisingContractPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 md:py-16">
      <Link href="/programas/anuncie" className="text-sm font-bold text-neon hover:underline">← Voltar para anunciar</Link>
      <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-orange">Portal NKL · versão {AD_CONTRACT_VERSION}</p>
      <h1 className="mt-3 font-playfair text-4xl font-bold md:text-6xl">Contrato de Publicidade</h1>
      <p className="mt-5 rounded-xl border border-orange/30 bg-orange/5 p-4 text-sm leading-relaxed text-foreground/75">
        Este é um modelo operacional para o fluxo do Portal NKL e deve ser revisado por profissional jurídico antes do lançamento comercial definitivo.
      </p>
      <div className="mt-8 space-y-6">
        {AD_CONTRACT_CLAUSES.map((clause) => (
          <section key={clause.title}>
            <h2 className="font-playfair text-2xl font-bold">{clause.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">{clause.body}</p>
          </section>
        ))}
      </div>
      <div className="mt-10 grid gap-8 border-t border-border pt-8 text-sm">
        <div><p className="font-bold">Portal NKL</p><p className="mt-8 border-t border-border pt-2">Assinatura e data</p></div>
        <div><p className="font-bold">Anunciante</p><p className="mt-8 border-t border-border pt-2">Assinatura e data</p></div>
      </div>
    </div>
  );
}

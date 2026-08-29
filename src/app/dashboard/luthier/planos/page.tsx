import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PremiumCheckoutButton } from '@/components/premium-checkout-button';

export const metadata = {
  title: 'Planos | Portal NKL',
};

const FREE_FEATURES = [
  'Perfil no diretório de luthiers',
  'WhatsApp de contato',
  'Recebimento de leads',
];

const PREMIUM_FEATURES = [
  'Tudo do plano gratuito',
  'Portfólio público ilimitado (vitrine visual)',
  'Dashboard analítico com métricas de conversão',
  'Badge "Premium" no perfil (destaque no diretório)',
];

export default async function PlanosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) redirect('/');

  const [profile] = await db
    .select({ role: userProfiles.role, planType: userProfiles.planType })
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== 'luthier') redirect('/');

  const isPremium = profile.planType === 'premium';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/dashboard/luthier" className="text-sm text-neon hover:underline inline-block mb-8">
        ← Voltar ao Dashboard
      </Link>
      <div className="text-center mb-12">
        <h1 className="font-playfair text-3xl font-bold">Planos para Luthiers</h1>
        <p className="text-sm opacity-70 mt-2">
          Escolha o plano ideal para fazer sua vitrine decolar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Plano Gratuito */}
        <section className="p-8 bg-surface border border-border rounded-2xl">
          <h2 className="font-playfair text-2xl font-bold mb-2">Gratuito</h2>
          <p className="text-sm opacity-70 mb-6">Para começar</p>
          <p className="font-playfair text-4xl font-bold mb-6">
            R$ 0<span className="text-base text-opacity-60 font-normal">/mês</span>
          </p>
          <ul className="space-y-2 mb-8 text-sm opacity-90">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <span className="text-neon">✓</span> {feature}
              </li>
            ))}
          </ul>
          <span className="block w-full py-3 text-center text-sm font-bold bg-background border border-border rounded-md opacity-70 cursor-default">
            Plano atual
          </span>
        </section>

        {/* Plano Premium */}
        <section className="p-8 bg-surface border-2 border-neon rounded-2xl shadow-lg relative">
          {isPremium && (
            <span className="absolute -top-3 right-4 text-xs font-bold px-3 py-1 bg-neon text-black rounded-full">
              ATUAL
            </span>
          )}
          <h2 className="font-playfair text-2xl font-bold mb-2">Premium</h2>
          <p className="text-sm opacity-70 mb-6">Para profissionais em destaque</p>
          <p className="font-playfair text-4xl font-bold mb-6">
            R$ 49,90<span className="text-base text-opacity-60 font-normal">/mês</span>
          </p>
          <ul className="space-y-2 mb-8 text-sm opacity-90">
            {PREMIUM_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <span className="text-neon">✓</span> {feature}
              </li>
            ))}
          </ul>
          {isPremium ? (
            <span className="block w-full py-3 text-center text-sm font-bold bg-background border border-border rounded-md opacity-70 cursor-default">
              Você já é Premium
            </span>
          ) : (
            <PremiumCheckoutButton />
          )}
        </section>
      </div>
    </div>
  );
}
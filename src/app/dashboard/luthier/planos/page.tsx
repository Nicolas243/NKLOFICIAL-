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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plano Gratuito */}
        <section className="p-8 bg-surface border border-border rounded-2xl flex flex-col justify-between">
          <div>
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
          </div>
          <span className="block w-full py-3 text-center text-sm font-bold bg-background border border-border rounded-md opacity-70 cursor-default">
            Plano atual
          </span>
        </section>

        {/* Plano Premium Mensal */}
        <section className="p-8 bg-surface border-2 border-neon rounded-2xl shadow-lg relative flex flex-col justify-between">
          {isPremium ? (
            <span className="absolute -top-3 right-4 text-xs font-bold px-3 py-1 bg-neon text-black rounded-full">
              ATUAL
            </span>
          ) : (
            <span className="absolute -top-3 right-4 text-xs font-bold px-3 py-1 bg-neon text-black rounded-full">
              MAIS ESCOLHIDO
            </span>
          )}
          <div>
            <h2 className="font-playfair text-2xl font-bold mb-2">Premium Mensal</h2>
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
          </div>
          {isPremium ? (
            <span className="block w-full py-3 text-center text-sm font-bold bg-background border border-border rounded-md opacity-70 cursor-default">
              Você já é Premium
            </span>
          ) : (
            <PremiumCheckoutButton plan="monthly" label="Assinar Premium (R$ 49,90/mês)" />
          )}
        </section>

        {/* Plano Mestre Luthier Anual */}
        <section className="p-8 bg-surface border border-orange/45 rounded-2xl shadow-sm relative flex flex-col justify-between">
          <span className="absolute -top-3 right-4 text-xs font-bold px-3 py-1 bg-orange text-white rounded-full">
            20% OFF ANUAL
          </span>
          <div>
            <h2 className="font-playfair text-2xl font-bold mb-2">Mestre Luthier Anual</h2>
            <p className="text-sm opacity-70 mb-6">12 meses completos com economia de R$ 119,80</p>
            <p className="font-playfair text-4xl font-bold mb-6">
              R$ 479<span className="text-base text-opacity-60 font-normal">/ano</span>
            </p>
            <ul className="space-y-2 mb-8 text-sm opacity-90">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="text-orange">✓</span> {feature}
                </li>
              ))}
              <li className="flex items-center gap-2 font-semibold">
                <span className="text-orange">✓</span> 12 meses garantidos com prioridade máxima no diretório
              </li>
            </ul>
          </div>
          {isPremium ? (
            <span className="block w-full py-3 text-center text-sm font-bold bg-background border border-border rounded-md opacity-70 cursor-default">
              Você já é Premium
            </span>
          ) : (
            <PremiumCheckoutButton plan="annual" label="Garantir Plano Anual (R$ 479/ano)" />
          )}
        </section>
      </div>
    </div>
  );
}
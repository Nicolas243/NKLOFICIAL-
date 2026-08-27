import { notFound } from 'next/navigation';
import { getLuthierDetails } from '@/actions/luthier';

type Params = Promise<{ id: string }>;

function buildWhatsAppUrl(whatsapp: string): string {
  const digits = whatsapp.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

export default async function LuthierDetailsPage(props: { params: Params }) {
  const { id } = await props.params;
  const luthier = await getLuthierDetails(id);

  if (!luthier) {
    notFound();
  }

  const displayName = luthier.businessName ?? luthier.fullName ?? 'Luthier';
  const location =
    luthier.city && luthier.state
      ? `${luthier.city} · ${luthier.state}`
      : luthier.city ?? luthier.state ?? 'Localização não informada';

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pt-8">
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-8 border-b border-border">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-playfair text-3xl font-bold mb-1">{displayName}</h1>
              <p className="text-sm opacity-80">{location}</p>
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
                luthier.planType === 'premium'
                  ? 'bg-neon/10 text-neon border-neon/40'
                  : 'bg-accent/10 text-foreground/70 border-border'
              }`}
            >
              {luthier.planType === 'premium' ? 'Perfil Premium' : 'Verificado'}
            </span>
          </div>
        </div>

        {/* Corpo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
          <div className="lg:col-span-2 p-8">
            <h2 className="font-playfair text-xl font-bold mb-3">Sobre</h2>
            <p className="leading-relaxed opacity-90 whitespace-pre-line">
              {luthier.bio || 'Este profissional ainda não adicionou uma biografia.'}
            </p>
          </div>

          {/* Painel lateral */}
          <aside className="p-8 flex flex-col gap-4">
            <div className="text-sm">
              <span className="font-medium opacity-70">Plano</span>
              <p className="font-bold mt-1 capitalize">
                {luthier.planType === 'premium' ? 'Premium' : 'Grátis / Verificado'}
              </p>
            </div>

            {luthier.whatsapp ? (
              <a
                href={buildWhatsAppUrl(luthier.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90"
              >
                Contatar via WhatsApp
              </a>
            ) : (
              <p className="text-center text-sm opacity-60 border border-dashed border-border rounded-md py-3">
                WhatsApp não disponível
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
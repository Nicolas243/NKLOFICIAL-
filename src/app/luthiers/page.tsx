import { getLuthiersDirectory } from '@/actions/directory';
import Link from 'next/link';

export const metadata = {
  title: 'Diretório de Luthiers | Portal NKL',
  description: 'Encontre luthiers verificados e profissionais do mercado.',
};

function buildWhatsAppUrl(whatsapp: string): string {
  const digits = whatsapp.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

export default async function LuthiersPage() {
  const directory = await getLuthiersDirectory();

  return (
    <div className="max-w-7xl w-full mx-auto px-4 pt-8">
      <h1 className="font-playfair text-3xl font-bold mb-2">Diretório de Luthiers</h1>
      <p className="text-sm opacity-70 mb-8">
        Conecte-se com profissionais do mercado. Fale direto pelo WhatsApp.
      </p>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {directory.map((luthier) => (
          <article
            key={luthier.id}
            className="p-6 bg-surface border border-border rounded-xl hover:border-neon transition-colors flex flex-col gap-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-playfair font-bold text-lg">
                  <Link href={`/luthiers/${luthier.id}`} className="hover:text-neon transition-colors">
                    {luthier.name}
                  </Link>
                </h3>
                <p className="text-sm opacity-80">
                  {luthier.city && luthier.state
                    ? `${luthier.city} · ${luthier.state}`
                    : luthier.city ?? luthier.state ?? 'Localização não informada'}
                </p>
              </div>
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
                  luthier.planType === 'premium'
                    ? 'bg-neon/10 text-neon border-neon/40'
                    : 'bg-accent/10 text-foreground/70 border-border'
                }`}
              >
                {luthier.planType === 'premium' ? 'Premium' : 'Verificado'}
              </span>
            </div>

            <div className="mt-auto flex flex-col gap-3">
              <Link
                href={`/luthiers/${luthier.id}`}
                className="inline-flex justify-center py-3 border border-neon text-neon rounded-md font-bold transition-all hover:bg-neon hover:text-black"
              >
                Ver perfil
              </Link>
              {luthier.whatsapp ? (
                <a
                  href={buildWhatsAppUrl(luthier.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90"
                >
                  Falar no WhatsApp
                </a>
              ) : (
                <p className="text-center text-sm opacity-60 border border-dashed border-border rounded-md py-3">
                  WhatsApp não disponível
                </p>
              )}
            </div>
          </article>
        ))}
      </section>

      {directory.length === 0 && (
        <p className="text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
          Nenhum luthier cadastrado ainda. Volte em breve!
        </p>
      )}
    </div>
  );
}
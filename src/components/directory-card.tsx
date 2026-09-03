import Image from 'next/image';
import Link from 'next/link';
import { WhatsAppLeadButton } from '@/components/whatsapp-lead-button';
import { FavoriteButton } from '@/components/favorite-button';
import type { DirectoryCard } from '@/actions/directory';

type DirectoryCardViewProps = {
  item: DirectoryCard;
  /** Paywall de Privacidade (Tarefa 12): o WhatsApp só aparece autenticado. */
  isAuthenticated: boolean;
  /** Página de detalhe individual (ex.: /luthiers/[id]). Lojas não têm. */
  profileHref?: string;
  favorite?: {
    action: (targetId: string) => Promise<void>;
    initialSaved: boolean;
  };
};

function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export function DirectoryCardView({
  item,
  isAuthenticated,
  profileHref,
  favorite,
}: DirectoryCardViewProps) {
  const location =
    item.city && item.state
      ? `${item.city} · ${item.state}`
      : item.city ?? item.state ?? 'Localização não informada';

  return (
    <article className="p-6 bg-surface border border-border rounded-xl hover:border-neon transition-colors flex flex-col gap-4">
      {/* Foto / fallback com inicial */}
      {item.imageUrl ? (
        <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-border/40">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] rounded-lg bg-accent/20 border border-border flex items-center justify-center">
          <span className="font-playfair text-4xl font-bold opacity-40">
            {initials(item.name)}
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-playfair font-bold text-lg truncate">
            {profileHref ? (
              <Link href={profileHref} className="hover:text-neon transition-colors">
                {item.name}
              </Link>
            ) : (
              item.name
            )}
          </h3>
          <p className="text-sm opacity-80">{location}</p>
        </div>
        <span
          className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border shrink-0 ${
            item.planType === 'premium'
              ? 'bg-neon/10 text-neon border-neon/40'
              : 'bg-accent/10 text-foreground/70 border-border'
          }`}
        >
          {item.planType === 'premium' ? 'Premium' : 'Verificado'}
        </span>
      </div>

      {/* Apresentação */}
      {item.bio && <p className="text-sm opacity-90 line-clamp-2">{item.bio}</p>}

      {/* Especialidades: instrumentos atendidos e tipos de reparos */}
      {(item.instrumentTypes || item.repairTypes) && (
        <div className="flex flex-col gap-1 text-xs opacity-80">
          {item.instrumentTypes && (
            <p>
              <span className="font-bold uppercase tracking-wider opacity-70">
                Instrumentos:
              </span>{' '}
              {item.instrumentTypes}
            </p>
          )}
          {item.repairTypes && (
            <p>
              <span className="font-bold uppercase tracking-wider opacity-70">Reparos:</span>{' '}
              {item.repairTypes}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3">
        {favorite && (
          <FavoriteButton
            action={favorite.action}
            targetId={item.id}
            initialSaved={favorite.initialSaved}
          />
        )}
        {profileHref && (
          <Link
            href={profileHref}
            className="inline-flex justify-center py-3 border border-neon text-neon rounded-md font-bold transition-all hover:bg-neon hover:text-black"
          >
            Ver perfil
          </Link>
        )}

        {/* Auth Wall — contato direto somente para usuários autenticados */}
        {isAuthenticated ? (
          item.whatsapp ? (
            <WhatsAppLeadButton
              luthierId={item.id}
              whatsapp={item.whatsapp}
              leadType="whatsapp_business_click"
            />
          ) : (
            <p className="text-center text-sm opacity-60 border border-dashed border-border rounded-md py-3">
              WhatsApp não disponível
            </p>
          )
        ) : (
          <Link
            href="/login"
            className="inline-flex justify-center py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90 text-center"
          >
            Entre para ver o contato
          </Link>
        )}
      </div>
    </article>
  );
}

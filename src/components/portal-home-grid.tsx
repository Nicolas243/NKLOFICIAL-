import Link from 'next/link';
import {
  ArrowUpRight,
  BrainCircuit,
  Clock3,
  Languages,
  Music2,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import {
  PORTAL_AREA_CARDS,
  getValidPortalAreaCards,
  isExternalPortalHref,
  type PortalAreaCard,
  type PortalAreaCategory,
} from '@/lib/portal-areas';

const CATEGORY_ICONS = {
  music: Music2,
  income: WalletCards,
  languages: Languages,
  learning: BrainCircuit,
  partners: UsersRound,
} satisfies Record<PortalAreaCategory, typeof Music2>;

const CATEGORY_LABELS: Record<PortalAreaCategory, string> = {
  music: 'NKL Cordas',
  income: 'Renda & Negócios',
  languages: 'Idiomas',
  learning: 'IA & Aprendizagem',
  partners: 'Parceiros',
};

function PortalCardContent({ card }: { card: PortalAreaCard }) {
  const Icon = CATEGORY_ICONS[card.category];
  const isComingSoon = card.status === 'coming-soon';

  return (
    <>
      <div className="portal-card-top">
        <span className="portal-card-icon" aria-hidden="true">
          <Icon size={20} />
        </span>
        <div className="portal-card-badges">
          <span className="portal-card-category">{CATEGORY_LABELS[card.category]}</span>
          {card.meta && <span className="portal-card-meta">{card.meta}</span>}
          <span
            className={
              isComingSoon
                ? 'portal-card-status portal-card-status-soon'
                : 'portal-card-status portal-card-status-active'
            }
          >
            <span className="portal-card-status-dot" aria-hidden="true" />
            {isComingSoon ? 'Em breve' : 'Ativo'}
          </span>
        </div>
      </div>

      <div className="portal-card-body">
        <h2 className="portal-card-title">{card.title}</h2>
        <p className="portal-card-description">{card.description}</p>
      </div>

      <div className="portal-card-footer">
        {isComingSoon ? (
          <span className="portal-card-action portal-card-action-soon">
            <Clock3 size={15} aria-hidden="true" />
            Em produção editorial
          </span>
        ) : (
          <span className="portal-card-action">
            {card.label ?? 'Acessar'}
            <ArrowUpRight size={17} aria-hidden="true" />
          </span>
        )}
      </div>
    </>
  );
}

function PortalCard({ card }: { card: PortalAreaCard }) {
  if (card.status === 'coming-soon') {
    return (
      <article
        className="portal-card portal-card-coming-soon"
        aria-label={`${card.title} — Em breve`}
        data-card-id={card.id}
        data-card-category={card.category}
        data-card-status={card.status}
      >
        <PortalCardContent card={card} />
      </article>
    );
  }

  const className = `portal-card ${card.featured ? 'portal-card-featured' : ''}`;
  const ariaLabel = `${card.title} — ${card.label ?? 'Acessar'}`;

  if (isExternalPortalHref(card.href)) {
    return (
      <a
        href={card.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={ariaLabel}
        data-card-id={card.id}
        data-card-category={card.category}
        data-card-status={card.status}
      >
        <PortalCardContent card={card} />
      </a>
    );
  }

  return (
    <Link
      href={card.href}
      className={className}
      aria-label={ariaLabel}
      data-card-id={card.id}
      data-card-category={card.category}
      data-card-status={card.status}
    >
      <PortalCardContent card={card} />
    </Link>
  );
}

export function PortalHomeGrid({
  cards = PORTAL_AREA_CARDS,
}: {
  cards?: readonly PortalAreaCard[];
}) {
  const validCards = getValidPortalAreaCards(cards);

  if (validCards.length === 0) {
    return (
      <div className="portal-empty" role="status">
        <p className="portal-empty-title">As áreas do Portal NKL estão sendo organizadas.</p>
        <p className="portal-empty-copy">
          Volte em instantes para acessar os catálogos, guias e estudos disponíveis.
        </p>
      </div>
    );
  }

  const featuredCards = validCards.filter((card) => card.featured);
  const regularCards = validCards.filter((card) => !card.featured);

  return (
    <section aria-label="Áreas do Portal NKL" className="portal-grid-sections">
      {featuredCards.length > 0 && (
        <div className="portal-grid-group">
          <div className="portal-section-heading">
            <p className="portal-section-kicker">Ecossistemas principais</p>
            <p className="portal-section-subtitle">
              Frentes editoriais independentes do Portal NKL.
            </p>
          </div>
          <div className="portal-grid portal-grid-featured">
            {featuredCards.map((card) => (
              <PortalCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

      {regularCards.length > 0 && (
        <div className="portal-grid-group">
          <div className="portal-section-heading">
            <p className="portal-section-kicker">Guias, cursos, idiomas e parcerias</p>
            <p className="portal-section-subtitle">
              Produtos individuais, diagnósticos práticos e espaços de apoio ao portal.
            </p>
          </div>
          <div className="portal-grid">
            {regularCards.map((card) => (
              <PortalCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

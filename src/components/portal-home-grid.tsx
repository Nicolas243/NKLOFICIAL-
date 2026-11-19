import Link from 'next/link';
import {
  ArrowUpRight,
  BrainCircuit,
  BookOpenText,
  Globe2,
  Landmark,
  Languages,
  Music2,
  Sparkles,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import {
  PORTAL_AREA_CARDS,
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
  income: 'Renda',
  languages: 'Idiomas',
  learning: 'Aprendizagem',
  partners: 'Parceiros',
};

function PortalCard({ card }: { card: PortalAreaCard }) {
  const Icon = CATEGORY_ICONS[card.category];

  if (card.status === 'coming-soon') {
    return (
      <article className="portal-card portal-card-coming-soon" aria-label={`${card.title} — em breve`}>
        <div className="portal-card-icon" aria-hidden="true">
          <Icon size={22} />
        </div>
        <p className="portal-card-category">{CATEGORY_LABELS[card.category]}</p>
        <h2>{card.title}</h2>
        <p className="portal-card-description">{card.description}</p>
        <span className="portal-card-action">Em breve</span>
      </article>
    );
  }

  return (
    <Link
      href={card.href}
      className={`portal-card ${card.featured ? 'portal-card-featured' : ''}`}
      aria-label={`${card.title} — ${card.label ?? 'Acessar'}`}
    >
      <div className="portal-card-icon" aria-hidden="true">
        <Icon size={22} />
      </div>
      <p className="portal-card-category">{CATEGORY_LABELS[card.category]}</p>
      <h2>{card.title}</h2>
      <p className="portal-card-description">{card.description}</p>
      <span className="portal-card-action">
        {card.label ?? 'Acessar'}
        <ArrowUpRight size={17} aria-hidden="true" />
      </span>
    </Link>
  );
}

export function PortalHomeGrid() {
  if (PORTAL_AREA_CARDS.length === 0) {
    return (
      <p className="portal-empty" role="status">
        As áreas do Portal NKL estão sendo organizadas.
      </p>
    );
  }

  return (
    <section aria-label="Áreas do Portal NKL" className="portal-grid">
      {PORTAL_AREA_CARDS.map((card) => (
        <PortalCard key={card.id} card={card} />
      ))}
    </section>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Clock3 } from 'lucide-react';
import { useState } from 'react';
import {
  isExternalPortalHref,
  type PortalAreaCard,
  type PortalAreaCategory,
} from '@/lib/portal-areas';

type FilterId = 'all' | PortalAreaCategory;

const FILTER_TABS: readonly { id: FilterId; label: string; heading: string; subtitle: string }[] = [
  {
    id: 'all',
    label: 'Tudo',
    heading: 'Todas as áreas',
    subtitle: 'Escolha o tema que faz sentido para você agora.',
  },
  {
    id: 'income',
    label: 'Renda',
    heading: 'Renda extra e negócios',
    subtitle: 'Oportunidades pela internet, guias práticos e Bússola de Negócios.',
  },
  {
    id: 'music',
    label: 'Música',
    heading: 'NKL Cordas — Área musical',
    subtitle: 'Cordas, luthiers, professores e guias de instrumentos.',
  },
  {
    id: 'languages',
    label: 'Idiomas',
    heading: 'Estudo de idiomas',
    subtitle: 'Inglês disponível hoje e cinco idiomas em preparo.',
  },
  {
    id: 'learning',
    label: 'IA',
    heading: 'Inteligência artificial na prática',
    subtitle: 'Ferramentas, guias e curso direto para o trabalho e estudo.',
  },
  {
    id: 'partners',
    label: 'Parceiros',
    heading: 'Parceiros e anúncios',
    subtitle: 'Projetos apoiadores e espaços para divulgar no portal.',
  },
];

const CATEGORY_LABELS: Record<PortalAreaCategory, string> = {
  music: 'NKL Cordas',
  income: 'Renda Extra',
  languages: 'Idiomas',
  learning: 'IA na Prática',
  partners: 'Parceiros',
};

function PortalCardContent({ card }: { card: PortalAreaCard }) {
  const isComingSoon = card.status === 'coming-soon';

  return (
    <>
      <div className="portal-card-media">
        {card.media ? (
          <Image
            src={card.media.src}
            alt={card.media.alt}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
            unoptimized={card.media.src.endsWith('.svg')}
            className="portal-card-media-img"
            style={
              card.media.objectPosition
                ? { objectPosition: card.media.objectPosition }
                : undefined
            }
          />
        ) : (
          <div className="portal-card-media-fallback" aria-hidden="true" />
        )}
        <div className="portal-card-media-scrim" aria-hidden="true" />
        <span
          className={
            isComingSoon
              ? 'portal-card-status portal-card-status-media portal-card-status-soon'
              : 'portal-card-status portal-card-status-media portal-card-status-active'
          }
        >
          <span className="portal-card-status-dot" aria-hidden="true" />
          {isComingSoon ? 'Em breve' : 'Ativo'}
        </span>
      </div>

      <div className="portal-card-inner">
        <div className="portal-card-meta-row">
          <span className="portal-card-category">{CATEGORY_LABELS[card.category]}</span>
          {(card.accessBadge || card.meta) && (
            <div className="portal-card-badges">
              {card.accessBadge && (
                <span className="portal-card-access-badge">{card.accessBadge}</span>
              )}
              {card.meta && <span className="portal-card-meta">{card.meta}</span>}
            </div>
          )}
        </div>

        <div className="portal-card-body">
          <h3 className="portal-card-title">{card.title}</h3>
          <p className="portal-card-description">{card.description}</p>
        </div>

        <div className="portal-card-footer">
          {isComingSoon ? (
            <span className="portal-card-action portal-card-action-soon">
              <Clock3 size={15} aria-hidden="true" />
              Chega em breve
            </span>
          ) : (
            <span className="portal-card-action">
              {card.label ?? 'Acessar'}
              <ArrowUpRight size={17} aria-hidden="true" />
            </span>
          )}
        </div>
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

  const className = card.featured ? 'portal-card portal-card-featured' : 'portal-card';
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

/** Explorador interativo com filtros por tema e capas visuais dos cards. */
export function PortalAreaExplorer({ cards }: { cards: readonly PortalAreaCard[] }) {
  const [selectedCategory, setSelectedCategory] = useState<FilterId>('all');

  const featuredCards = cards.filter((card) => card.featured);
  const regularCards = cards.filter((card) => !card.featured);
  const activeTab = FILTER_TABS.find((tab) => tab.id === selectedCategory) ?? FILTER_TABS[0];
  const filteredCards =
    selectedCategory === 'all'
      ? cards
      : cards.filter((card) => card.category === selectedCategory);

  return (
    <section
      id="areas"
      aria-label="Áreas do Portal NKL"
      className="portal-grid-sections"
    >
      <nav aria-label="Filtrar áreas por tema" className="portal-filter-bar">
        {FILTER_TABS.map((tab) => {
          const isActive = tab.id === selectedCategory;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setSelectedCategory(tab.id)}
              className={
                isActive
                  ? 'portal-filter-pill portal-filter-pill-active'
                  : 'portal-filter-pill'
              }
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {selectedCategory === 'all' ? (
        <>
          {featuredCards.length > 0 && (
            <div id="principais" className="portal-grid-group">
              <div className="portal-section-heading">
                <div className="portal-section-heading-text">
                  <h2 className="portal-section-kicker">Principais áreas</h2>
                  <p className="portal-section-subtitle">
                    Entre direto no assunto que faz sentido para você agora.
                  </p>
                </div>
              </div>
              <div className="portal-grid portal-grid-featured">
                {featuredCards.map((card) => (
                  <PortalCard key={card.id} card={card} />
                ))}
              </div>
            </div>
          )}

          {regularCards.length > 0 && (
            <div id="catalogo" className="portal-grid-group">
              <div className="portal-section-heading">
                <div className="portal-section-heading-text">
                  <h2 className="portal-section-kicker">Guias, ferramentas, idiomas e parceiros</h2>
                  <p className="portal-section-subtitle">
                    Materiais prontos para usar no seu ritmo, mais espaços para marcas parceiras.
                  </p>
                </div>
              </div>
              <div className="portal-grid">
                {regularCards.map((card) => (
                  <PortalCard key={card.id} card={card} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="portal-grid-group">
          <div className="portal-section-heading">
            <div className="portal-section-heading-text">
              <h2 className="portal-section-kicker">{activeTab.heading}</h2>
              <p className="portal-section-subtitle">{activeTab.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="portal-filter-reset"
            >
              Ver todas as áreas
            </button>
          </div>

          {filteredCards.length > 0 ? (
            <div className="portal-grid">
              {filteredCards.map((card) => (
                <PortalCard key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="portal-empty" role="status">
              <p className="portal-empty-title">Nenhum item encontrado neste filtro.</p>
              <p className="portal-empty-copy">
                Volte para ver todas as áreas disponíveis do Portal NKL.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="portal-filter-reset"
              >
                Ver todas as áreas
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

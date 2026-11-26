import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Languages,
  Music2,
  WalletCards,
} from 'lucide-react';
import { PortalScrollReveal } from '@/components/home/portal-scroll-reveal';
import { PortalTrackPriorityBanner } from '@/components/home/portal-track-priority-banner';
import { PortalTrackSelector } from '@/components/home/portal-track-selector';
import { PortalWayfindingBar } from '@/components/home/portal-wayfinding-bar';
import { PortalHomeGrid } from '@/components/portal-home-grid';
import { PortalHomeParallax } from '@/components/portal-home-parallax';
import { PORTAL_AREA_CARDS, getValidPortalAreaCards } from '@/lib/portal-areas';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: {
    absolute: 'Portal NKL | Renda Extra, Música, Idiomas e IA',
  },
  description:
    'Renda extra, NKL Cordas e luthieria, estudo de idiomas, IA na Prática e mural de parceiros em um só lugar.',
  alternates: {
    canonical: absoluteSiteUrl('/'),
  },
  openGraph: {
    type: 'website',
    title: 'Portal NKL | Renda Extra, Música, Idiomas e IA',
    description:
      'Renda extra, NKL Cordas e luthieria, estudo de idiomas, IA na Prática e mural de parceiros em um só lugar.',
    url: absoluteSiteUrl('/'),
  },
};

const QUICKSTART_PATHS = [
  {
    href: '/programas',
    title: 'Ganhar renda pela internet',
    hint: 'Plataformas e caminhos reais por perfil',
    icon: WalletCards,
  },
  {
    href: '/musica/naipe_cordas',
    title: 'Cordas, luthiers e professores',
    hint: 'Catálogo completo para músicos',
    icon: Music2,
  },
  {
    href: '/blog/aprender/ingles',
    title: 'Estudar inglês na prática',
    hint: 'Lições diretas para o dia a dia',
    icon: Languages,
  },
  {
    href: '/ia',
    title: 'Usar IA no trabalho e estudo',
    hint: 'Guias, ferramentas e exemplos prontos',
    icon: BrainCircuit,
  },
] as const;

const TRUST_SIGNALS = [
  'Acesso direto nas áreas abertas',
  'Português simples, sem enrolação',
  '4 frentes ativas no mesmo lugar',
] as const;

export default function HomePage() {
  const validCards = getValidPortalAreaCards(PORTAL_AREA_CARDS);
  const activeCount = validCards.filter((card) => card.status === 'active').length;
  const soonCount = validCards.filter((card) => card.status === 'coming-soon').length;
  const languageTotal = validCards.filter(
    (card) => card.category === 'languages' && card.id !== 'idiomas',
  ).length;

  const bentoTiles = [
    {
      value: '4',
      label: 'Frentes ativas hoje',
      hint: 'Renda, Música, Idiomas e IA',
    },
    {
      value: String(activeCount),
      label: 'Áreas prontas para abrir',
      hint: 'Acesso direto no navegador',
    },
    {
      value: String(languageTotal),
      label: 'Idiomas no plano',
      hint: soonCount > 0 ? `Inglês ativo + ${soonCount} chegando` : `Todos os ${languageTotal} idiomas ativos`,
    },
    {
      value: '100%',
      label: 'Português simples',
      hint: 'Direto ao ponto, sem enrolação',
    },
  ] as const;

  return (
    <div className="portal-home-shell">
      <PortalHomeParallax />

      <div className="portal-home-container">
        <PortalWayfindingBar />

        <div id="topo" className="portal-hero-band">
          <section className="portal-hero-grid" aria-labelledby="portal-home-heading">
            <div className="portal-hero-main">
              <p className="portal-eyebrow">Portal NKL</p>
              <h1 id="portal-home-heading" className="portal-hero-title">
                Renda extra, música, idiomas e IA de um jeito simples
              </h1>
              <p className="portal-hero-lead">
                Escolha o que você quer resolver hoje: encontrar formas reais de fazer renda na
                internet, cuidar do seu instrumento de cordas, estudar idiomas ou usar IA no dia a
                dia.
              </p>

              <div className="portal-hero-actions">
                <Link href="/programas" className="portal-btn-primary">
                  Explorar oportunidades
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link href="/ofertas/bussola-negocios" className="portal-btn-secondary">
                  Conhecer a Bússola de Negócios
                </Link>
              </div>

              <ul className="portal-trust-list" aria-label="Como o portal funciona">
                {TRUST_SIGNALS.map((signal) => (
                  <li key={signal} className="portal-trust-item">
                    <CheckCircle2 size={16} className="portal-trust-icon" aria-hidden="true" />
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="portal-quickstart" aria-labelledby="portal-quickstart-heading">
              <div className="portal-quickstart-header">
                <h2 id="portal-quickstart-heading" className="portal-quickstart-title">
                  Acesso rápido por objetivo
                </h2>
                <p className="portal-quickstart-subtitle">Clique direto onde você quer chegar</p>
              </div>

              <div className="portal-quickstart-list">
                {QUICKSTART_PATHS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className="portal-quickstart-link">
                      <span className="portal-quickstart-left">
                        <span className="portal-quickstart-icon" aria-hidden="true">
                          <Icon size={18} />
                        </span>
                        <span className="portal-quickstart-copy">
                          <span className="portal-quickstart-label">{item.title}</span>
                          <span className="portal-quickstart-hint">{item.hint}</span>
                        </span>
                      </span>
                      <ArrowUpRight size={17} className="portal-quickstart-arrow" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </aside>
          </section>

          <section className="portal-bento-strip" aria-label="Resumo do Portal NKL">
            {bentoTiles.map((tile) => (
              <div key={tile.label} className="portal-bento-tile">
                <span className="portal-bento-value">{tile.value}</span>
                <span className="portal-bento-label">{tile.label}</span>
                <span className="portal-bento-hint">{tile.hint}</span>
              </div>
            ))}
          </section>
        </div>

        <PortalScrollReveal>
          <PortalTrackSelector />
        </PortalScrollReveal>

        <PortalScrollReveal preserveVisibility>
          <PortalTrackPriorityBanner />
          <PortalHomeGrid cards={validCards} />
        </PortalScrollReveal>
      </div>
    </div>
  );
}

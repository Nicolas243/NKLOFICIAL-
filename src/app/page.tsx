import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PortalHomeGrid } from '@/components/portal-home-grid';
import { PortalHomeParallax } from '@/components/portal-home-parallax';
import { ThemeToggle } from '@/components/theme-toggle';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Portal NKL | Música, Renda Extra, Idiomas e IA na Prática',
  description:
    'Portal editorial multidisciplinar: NKL Cordas e luthieria, oportunidades de renda extra, estudo de idiomas, IA na Prática e mural de parceiros.',
  alternates: {
    canonical: absoluteSiteUrl('/'),
  },
  openGraph: {
    type: 'website',
    title: 'Portal NKL | Música, Renda Extra, Idiomas e IA na Prática',
    description:
      'Portal editorial multidisciplinar: NKL Cordas e luthieria, oportunidades de renda extra, estudo de idiomas, IA na Prática e mural de parceiros.',
    url: absoluteSiteUrl('/'),
  },
};

export default function HomePage() {
  return (
    <div className="portal-home-shell">
      <PortalHomeParallax />

      <div className="portal-home-container">
        <div className="portal-topbar" aria-label="Identidade e acesso do Portal NKL">
          <div className="portal-brand">
            <Image
              src="/NKL/NKL.png"
              alt="Portal NKL"
              width={34}
              height={34}
              className="portal-brand-logo"
            />
            <div className="portal-brand-copy">
              <span className="portal-brand-name">Portal NKL</span>
              <span className="portal-brand-tag">
                <span className="portal-live-dot" aria-hidden="true" />
                Plataforma editorial multidisciplinar
              </span>
            </div>
          </div>

          <div className="portal-utility" aria-label="Utilidades da conta e tema">
            <ThemeToggle />
            <Link href="/login" className="portal-utility-link">
              Entrar
            </Link>
          </div>
        </div>

        <section className="portal-hero" aria-labelledby="portal-home-heading">
          <p className="portal-eyebrow">Ecossistema Portal NKL</p>
          <h1 id="portal-home-heading" className="portal-hero-title">
            Música, inteligência artificial, idiomas e negócios digitais em um só lugar
          </h1>
          <p className="portal-hero-lead">
            Escolha uma área ou produto individual abaixo para acessar catálogos técnicos,
            diagnósticos práticos, guias de estudo e oportunidades com critérios claros.
          </p>
        </section>

        <PortalHomeGrid />
      </div>
    </div>
  );
}

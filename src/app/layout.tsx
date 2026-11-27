import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ParallaxBackground } from '@/components/parallax-background'
import { JsonLd } from '@/components/seo/json-ld'
import { PwaInstallReminder, PwaRegister } from '@/components/pwa'
import { PrivacyScripts } from '@/components/privacy-scripts'
import { SiteGuidance } from '@/components/site-guidance'
import { SpotlightTutorial } from '@/components/ui/spotlight-tutorial'
import { RifaCampaignShell } from '@/components/rifa-campaign/rifa-campaign-shell'
import { absoluteSiteUrl, SITE_URL } from '@/lib/site'
import {
  buildAuthorPersonNode,
  buildOrganizationNode,
  buildWebsiteNode,
} from '@/lib/seo/schema-graph'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: '/nkl.png',
    shortcut: '/nkl.png',
    apple: '/nkl.png',
  },
  title: {
    default: 'Portal NKL | Renda Extra, IA na Prática, Idiomas e Música',
    template: '%s | Portal NKL',
  },
  description: 'Mais de 55 formas reais de renda extra online, ferramentas de IA na prática, idiomas e música em um só portal editorial sem promessas fáceis.',
  ...(process.env.NEXT_PUBLIC_GOOGLE_ADS_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_ADS_VERIFICATION } }
    : {}),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Portal NKL',
    title: 'Portal NKL | Renda Extra, IA na Prática, Idiomas e Música',
    description: 'Mais de 55 formas reais de renda extra online, ferramentas de IA na prática, idiomas e música em um só portal editorial sem promessas fáceis.',
    url: absoluteSiteUrl('/'),
    images: [
      {
        url: absoluteSiteUrl('/images/areas/renda-extra.jpg'),
        width: 960,
        height: 540,
        alt: 'Portal NKL — Renda Extra, IA, Idiomas e Música',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portal NKL | Renda Extra, IA na Prática, Idiomas e Música',
    description: 'Mais de 55 formas reais de renda extra online, ferramentas de IA na prática, idiomas e música em um só portal editorial sem promessas fáceis.',
    images: [absoluteSiteUrl('/images/areas/renda-extra.jpg')],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const googleAdsVerification = process.env.NEXT_PUBLIC_GOOGLE_ADS_VERIFICATION;
  const themeInitScript =
    "(function(){try{var d=window.localStorage.getItem('theme')==='dark';var r=document.documentElement;r.classList.toggle('dark',d);r.dataset.theme=d?'dark':'light';r.style.colorScheme=d?'dark':'light';}catch(e){}})();";

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {googleAdsVerification && <meta name="google-site-verification" content={googleAdsVerification} />}
        <meta name="google-adsense-account" content="ca-pub-8249438839607534" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-background text-foreground antialiased selection:bg-orange-500/30 selection:text-white`} suppressHydrationWarning>
        <PrivacyScripts />
        <PwaRegister />
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@graph': [
            buildOrganizationNode(),
            buildWebsiteNode(),
            buildAuthorPersonNode(),
          ],
        }} />
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <ParallaxBackground />
          <Header />
          <SiteGuidance />
          <SpotlightTutorial />
          <PwaInstallReminder />
          <a
            href="#main-content"
            className="sr-only fixed left-4 top-4 z-[100000] rounded-md bg-foreground px-4 py-3 text-background focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-neon"
          >
            Pular para o conteúdo principal
          </a>
          <main id="main-content" tabIndex={-1} className="relative z-10 isolate min-h-screen w-full max-w-full overflow-x-clip pt-[5px] pb-12 flex flex-col outline-none lg:pt-[77px]">
            {children}
          </main>
          <RifaCampaignShell />
          <Footer />
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
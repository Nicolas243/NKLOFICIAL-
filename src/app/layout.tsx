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

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: '/nkl.png',
    shortcut: '/nkl.png',
    apple: '/nkl.png',
  },
  title: {
    default: 'Portal NKL | Luthieria, Cordas e Oportunidades',
    template: '%s | Portal NKL',
  },
  description: 'Catálogo de cordas, luthieria, professores e oportunidades freelance em um só portal.',
  ...(process.env.NEXT_PUBLIC_GOOGLE_ADS_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_ADS_VERIFICATION } }
    : {}),
  alternates: {
    canonical: absoluteSiteUrl('/'),
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Portal NKL',
    title: 'Portal NKL | Luthieria, Cordas e Oportunidades',
    description: 'Catálogo de cordas, luthieria, professores e oportunidades freelance em um só portal.',
    url: absoluteSiteUrl('/'),
  },
  twitter: {
    card: 'summary',
    title: 'Portal NKL | Luthieria, Cordas e Oportunidades',
    description: 'Catálogo de cordas, luthieria, professores e oportunidades freelance em um só portal.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const googleAdsVerification = process.env.NEXT_PUBLIC_GOOGLE_ADS_VERIFICATION;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {googleAdsVerification && <meta name="google-site-verification" content={googleAdsVerification} />}
        <meta name="google-adsense-account" content="ca-pub-8249438839607534" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-background text-foreground antialiased selection:bg-orange-500/30 selection:text-white`} suppressHydrationWarning>
        <PrivacyScripts />
        <PwaRegister />
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Organization', name: 'Portal NKL', url: SITE_URL },
            { '@type': 'WebSite', name: 'Portal NKL', url: SITE_URL },
          ],
        }} />
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <ParallaxBackground />
          <Header />
          <SiteGuidance />
          <SpotlightTutorial />
          <PwaInstallReminder />
          <main className="relative z-10 isolate min-h-screen pt-[5px] pb-12 flex flex-col lg:pt-[77px]">
            {children}
          </main>
          <RifaCampaignShell />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ParallaxBackground } from '@/components/parallax-background'
import { JsonLd } from '@/components/seo/json-ld'
import Script from 'next/script'
import { PwaRegister } from '@/components/pwa'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nkl.com.br'),
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
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Portal NKL',
    title: 'Portal NKL | Luthieria, Cordas e Oportunidades',
    description: 'Catálogo de cordas, luthieria, professores e oportunidades freelance em um só portal.',
    url: '/',
  },
  twitter: {
    card: 'summary',
    title: 'Portal NKL | Luthieria, Cordas e Oportunidades',
    description: 'Catálogo de cordas, luthieria, professores e oportunidades freelance em um só portal.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-background text-foreground antialiased`} suppressHydrationWarning>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8249438839607534"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-QD0HQJFWVW"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QD0HQJFWVW');
          `}
        </Script>
        <PwaRegister />
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Organization', name: 'Portal NKL', url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nkl.com.br' },
            { '@type': 'WebSite', name: 'Portal NKL', url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nkl.com.br' },
          ],
        }} />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ParallaxBackground />
          <Header />
          <main className="relative z-10 isolate min-h-screen pt-[5px] pb-12 flex flex-col lg:pt-[77px]">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
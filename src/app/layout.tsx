import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ParallaxBackground } from '@/components/parallax-background'
import { JsonLd } from '@/components/seo/json-ld'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nkl.com.br'),
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
          <main className="min-h-screen lg:pt-[72px] pb-12 flex flex-col relative z-10">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
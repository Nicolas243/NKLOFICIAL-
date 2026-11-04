import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Portal NKL',
    short_name: 'Portal NKL',
    description: 'O Portal NKL reúne música, luthieria e oportunidades de renda extra.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#050505',
    lang: 'pt-BR',
    icons: [
      { src: '/nkl.png', sizes: '192x192', type: 'image/png' },
      { src: '/nkl.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}

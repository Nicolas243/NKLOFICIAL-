import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Portal NKL · Música',
    short_name: 'NKL Música',
    description: 'O espaço musical do Portal NKL reúne cordas, luthieria, professores e comunidade.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f8fa',
    theme_color: '#0b5ed7',
    lang: 'pt-BR',
    icons: [
      { src: '/nkl.png', sizes: '192x192', type: 'image/png' },
      { src: '/nkl.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}

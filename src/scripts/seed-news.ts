import { db } from '../db/index'
import { newsFeed } from '../db/schema'

async function seedNews() {
  const news = [
    {
      title: 'Novo Lote de Pau-Brasil Chega à Europa Após 3 Anos de Restrição',
      content: 'A ITTO (International Tropical Timber Organization) aprovou a liberação de um lote controlado de Pau-Brasil certificado para fabricação de arcos. Luthiers europeus comemoram o fim de uma seca de 3 anos que dobrou o preço dos arcos profissionais.',
      tags: 'Mercado, Pau-Brasil, Arcos',
      imageUrl: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80',
    },
    {
      title: 'Fabricante Francesa Lança Corda com Núcleo Híbrido de Carbono-Seda',
      content: 'A Corelli apresentou na Musikmesse a nova linha "Crystal Carbon", que combina filamentos de carbono com seda natural no núcleo. Testes iniciais mostram projeção 15% maior que cordas puramente sintéticas, mantendo o calor tonal da tripa.',
      tags: 'Lançamento, Cordas, Inovação',
      imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
    },
    {
      title: 'Estudo da Universidade de Cambridge Revela Segredo Acústico dos Stradivarius',
      content: 'Pesquisadores usaram tomografia computadorizada para mapear a densidade da madeira em 9 violinos Stradivari. Descobriram que a variação de densidade no tampo segue um padrão matemático que amplifica harmônicos entre 2 kHz e 4 kHz — exatamente a faixa onde o ouvido humano é mais sensível.',
      tags: 'Pesquisa, Acústica, Stradivarius',
      imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&q=80',
    },
    {
      title: 'Mercado Livre Passa a Exigir Certificação CITES para Instrumentos com Ébano',
      content: 'A partir de janeiro, vendedores do Mercado Livre precisarão anexar certificado CITES para qualquer instrumento contendo ébano ou outras madeiras protegidas. A medida visa combater o tráfico ilegal que movimenta US$ 2 bilhões por ano.',
      tags: 'Regulamentação, CITES, Marketplace',
      imageUrl: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800&q=80',
    },
    {
      title: 'Luthier Brasileiro Vence Competição Internacional com Viola Modelo Tertis',
      content: 'Ricardo Sanches, de São Paulo, conquistou medalha de ouro na VSA Competition 2026 (Violin Society of America) com uma viola de 41.5 cm baseada no modelo Tertis. É a primeira vez que um luthier brasileiro vence a categoria viola em 50 anos de competição.',
      tags: 'Concurso, Luthier Brasileiro, Viola',
      imageUrl: 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=800&q=80',
    },
  ]

  for (const item of news) {
    await db.insert(newsFeed).values(item)
    console.log(`[seed-news] Inserido: ${item.title}`)
  }

  console.log('[seed-news] Seed de 5 notícias concluído com sucesso!')
  process.exit(0)
}

seedNews().catch((err) => {
  console.error('[seed-news] Erro:', err)
  process.exit(1)
})
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { businessDirectory, partnerPrograms, userProfiles } from '../db/schema';

type ProfileSeed = {
  email: string;
  fullName: string;
  role: string;
  papel?: string;
  businessName: string;
  city: string;
  state: string;
  bio: string;
  instrumento?: string;
  anosExperiencia?: number;
  instrumentTypes?: string;
  repairTypes?: string;
  singleClassPriceCents?: number;
  monthlyPlanPriceCents?: number;
  semiannualPlanPriceCents?: number;
  annualPlanPriceCents?: number;
  isSuspended?: boolean;
};

type PartnerSeed = {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  difficulty: string;
  tags: string[];
  websiteUrl: string;
  affiliateUrl: string | null;
  editorialRating: number;
  editorialSource: string;
  pros?: string[];
  cons?: string[];
  requirements?: string[];
  paymentMethods?: string[];
  earningPotential?: string;
  lastVerifiedAt?: Date;
  youtubeVideoId?: string;
  tiktokVideoId?: string;
  zeroInvestmentRequired?: boolean;
};

const profileSeeds: ProfileSeed[] = [
  {
    email: 'seed.luthier.aurora@portal-nkl.local',
    fullName: 'Aurora Martins',
    role: 'luthier',
    businessName: 'Oficina Aurora de Cordas',
    city: 'São Paulo',
    state: 'SP',
    bio: 'Luthier especializada em regulagem, restauração e construção de instrumentos de arco para estudantes e profissionais.',
    instrumentTypes: 'Violino, viola, violoncelo',
    repairTypes: 'Regulagem, restauração, ajuste acústico',
  },
  {
    email: 'seed.luthier.caio@portal-nkl.local',
    fullName: 'Caio Nogueira',
    role: 'luthier',
    businessName: 'Ateliê Nogueira de Arcos',
    city: 'Curitiba',
    state: 'PR',
    bio: 'Ateliê dedicado a arcos, manutenção preventiva e avaliação de instrumentos para músicos de orquestra.',
    instrumentTypes: 'Violino, viola',
    repairTypes: 'Arcos, cravelhas, cavaletes',
  },
  {
    email: 'seed.luthier.helena@portal-nkl.local',
    fullName: 'Helena Duarte',
    role: 'luthier',
    businessName: 'Duarte Luteria Fina',
    city: 'Belo Horizonte',
    state: 'MG',
    bio: 'Serviço de luteria fina com foco em restauração cuidadosa e preparação de instrumentos para apresentações.',
    instrumentTypes: 'Violino, viola, violoncelo',
    repairTypes: 'Restauração, verniz, alma e cavalete',
  },
  {
    email: 'seed.professor.livia@portal-nkl.local',
    fullName: 'Lívia Ramos',
    role: 'user',
    papel: 'Professor',
    businessName: 'Lívia Ramos Música',
    city: 'Rio de Janeiro',
    state: 'RJ',
    bio: 'Aulas individuais de violino com metodologia progressiva para iniciantes e músicos intermediários.',
    instrumento: 'Violino',
    anosExperiencia: 12,
    singleClassPriceCents: 15000,
    monthlyPlanPriceCents: 54000,
    semiannualPlanPriceCents: 288000,
    annualPlanPriceCents: 504000,
  },
  {
    email: 'seed.professor.renato@portal-nkl.local',
    fullName: 'Renato Alves',
    role: 'user',
    papel: 'Professor',
    businessName: 'Estúdio Renato Alves',
    city: 'Recife',
    state: 'PE',
    bio: 'Professor de viola com aulas remotas e presenciais, leitura musical e preparação para provas práticas.',
    instrumento: 'Viola',
    anosExperiencia: 15,
    singleClassPriceCents: 16000,
    monthlyPlanPriceCents: 57600,
    semiannualPlanPriceCents: 307200,
    annualPlanPriceCents: 537600,
  },
  {
    email: 'seed.professor.beatriz@portal-nkl.local',
    fullName: 'Beatriz Campos',
    role: 'user',
    papel: 'Professor',
    businessName: 'Música em Camadas',
    city: 'Porto Alegre',
    state: 'RS',
    bio: 'Ensino de violoncelo para jovens e adultos com planos de estudo personalizados e acompanhamento contínuo.',
    instrumento: 'Violoncelo',
    anosExperiencia: 10,
    singleClassPriceCents: 18000,
    monthlyPlanPriceCents: 64800,
    semiannualPlanPriceCents: 345600,
    annualPlanPriceCents: 604800,
  },
  {
    email: 'seed.store.arco@portal-nkl.local',
    fullName: 'Marcelo Vieira',
    role: 'lojista',
    businessName: 'Casa do Arco Musical',
    city: 'São Paulo',
    state: 'SP',
    bio: 'Loja especializada em acessórios, cordas e itens de manutenção para instrumentos de arco.',
    instrumentTypes: 'Violino, viola, violoncelo',
    repairTypes: 'Acessórios, cordas, manutenção básica',
  },
  {
    email: 'seed.store.sonora@portal-nkl.local',
    fullName: 'Patrícia Freire',
    role: 'lojista',
    businessName: 'Sonora Instrumentos',
    city: 'Brasília',
    state: 'DF',
    bio: 'Comércio de instrumentos musicais e acessórios com atendimento para estudantes, professores e conjuntos.',
    instrumentTypes: 'Violino, viola, violoncelo',
    repairTypes: 'Acessórios, ajustes e encomendas',
  },
  {
    email: 'seed.store.arco-norte@portal-nkl.local',
    fullName: 'Diego Moura',
    role: 'lojista',
    businessName: 'Arco Norte Musical',
    city: 'Belém',
    state: 'PA',
    bio: 'Loja regional com curadoria de instrumentos de arco, materiais de estudo e acessórios para músicos.',
    instrumentTypes: 'Violino, viola',
    repairTypes: 'Acessórios, cordas e revisão',
  },
];

const partnerSeeds: PartnerSeed[] = [
  {
    slug: 'fluencify',
    name: 'Fluencify',
    shortDescription: 'Crie vídeos para marcas e encontre contratos de conteúdo com mais facilidade, conforme seu perfil.',
    longDescription: 'A Fluencify conecta criadores a marcas que precisam de conteúdo UGC. Você pode apresentar seu estilo, receber briefings e se candidatar a trabalhos de vídeo sem depender apenas de uma audiência enorme. Pela experiência relatada no catálogo, pode ser mais fácil encontrar contratos do que em algumas plataformas parecidas, mas isso depende do perfil, região e campanhas disponíveis. Confira o briefing, o uso de imagem, o prazo e o pagamento antes de aceitar.',
    category: 'Conteúdo e vídeo',
    difficulty: 'médio',
    tags: ['Melhor para Começar', 'gravar vídeos em casa', 'UGC', 'criadores', 'vender serviços', 'ganhar pela internet'],
    websiteUrl: 'https://app.fluencify.io/',
    affiliateUrl: 'https://app.fluencify.io/r/NBGXP6',
    editorialRating: 9,
    editorialSource: 'Descrição editorial baseada na proposta pública da plataforma e na experiência informada pelo curador; disponibilidade e contratos variam.',
  },
  {
    slug: 'prolific',
    name: 'Prolific',
    shortDescription: 'Participe de estudos remunerados e use alguns minutos livres para responder pesquisas que combinam com seu perfil.',
    longDescription: 'A Prolific conecta participantes a estudos acadêmicos e pesquisas de mercado. Você responde apenas aos estudos para os quais se qualifica, e a remuneração e a disponibilidade aparecem antes da participação. Perfil, país e demanda influenciam os convites.',
    category: 'Pesquisas e estudos',
    difficulty: 'fácil',
    tags: ['pesquisas', 'remoto', 'flexível', 'internacional', 'ganhar com pesquisas', 'renda extra sem investimento'],
    websiteUrl: 'https://app.prolific.com/register/',
    affiliateUrl: null,
    editorialRating: 7,
    editorialSource: 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.',
  },
  {
    slug: 'mercado-pago',
    name: 'Mercado Pago',
    shortDescription: 'Indique uma solução digital que você já conhece e acompanhe campanhas de recompensa pelo celular.',
    longDescription: 'O Mercado Pago oferece carteira digital, pagamentos e serviços financeiros. Campanhas de indicação podem pagar recompensas conforme regras, período e elegibilidade. Confira a campanha ativa antes de divulgar e nunca prometa um valor que não esteja nos termos.',
    category: 'Finanças digitais',
    difficulty: 'fácil',
    tags: ['indicação', 'carteira digital', 'finanças digitais', 'ganhar indicando', 'renda extra pelo celular'],
    websiteUrl: 'https://www.mercadopago.com.br/',
    affiliateUrl: 'https://mpago.li/2h3xfGP',
    editorialRating: 7,
    editorialSource: 'Nota editorial inicial do Portal NKL, baseada em informações públicas e sujeita às condições vigentes da campanha.',
  },
  {
    slug: 'honeygain',
    name: 'Honeygain',
    shortDescription: 'Compartilhe conexão ociosa e acumule créditos em segundo plano, com retorno variável por país e demanda.',
    longDescription: 'O Honeygain permite compartilhar recursos de conexão ociosa em troca de créditos. O app pode funcionar em segundo plano, mas o retorno depende de país, demanda, dispositivo e disponibilidade. Leia as políticas de uso e privacidade antes de instalar.',
    category: 'Oportunidades digitais',
    difficulty: 'fácil',
    tags: ['Melhor para Começar', 'renda passiva', 'ganhar sem fazer nada', 'renda extra pelo celular', 'automático', 'internet ociosa'],
    websiteUrl: 'https://www.honeygain.com/',
    affiliateUrl: 'https://join.honeygain.com/CACAN455AF',
    editorialRating: 9,
    editorialSource: 'Nota editorial inicial do Portal NKL, baseada em informações públicas e sujeita a variações de disponibilidade e retorno.',
  },
  {
    slug: 'apphub',
    name: 'AppHub',
    shortDescription: 'Grave vídeos em casa para tarefas de conteúdo e confira campanhas abertas para o seu perfil.',
    longDescription: 'O AppHub reúne oportunidades que podem envolver gravação de vídeos e produção de conteúdo em casa. Veja as campanhas disponíveis, confira o briefing e só aceite tarefas que você consegue entregar. A oferta depende do seu perfil, região e momento.',
    category: 'Conteúdo e vídeo',
    difficulty: 'médio',
    tags: ['Melhor para Começar', 'gravar vídeos em casa', 'criação de conteúdo', 'tarefas de vídeo', 'trabalho remoto', 'renda extra com vídeos'],
    websiteUrl: 'https://app.hub.xyz/',
    affiliateUrl: 'https://app.hub.xyz/r/NX6XDDEG',
    editorialRating: 9,
    editorialSource: 'Nota editorial inicial do Portal NKL, baseada em informações públicas e sujeita à disponibilidade de campanhas.',
    requirements: [
      'iPhone 12 ao 18 (Mini, Plus, Pro e Pro Max). Incompatível com modelos 16e, 17e e 18e.',
      'Google Pixel 6 ao 10 (incluindo modelos Pro).',
      'Samsung Galaxy S21 ao S26 (incluindo modelos Plus e Ultra).',
    ],
  },
  {
    slug: 'tiktok-shop',
    name: 'TikTok Shop',
    shortDescription: 'Crie conteúdo e recomende produtos no TikTok Shop conforme as campanhas e regras disponíveis na sua região.',
    longDescription: 'O TikTok Shop permite que criadores apresentem produtos e recebam comissão quando uma venda elegível acontece pelas ferramentas da plataforma. A disponibilidade, a aprovação, as categorias, as taxas e os requisitos dependem da região e podem mudar. Leia as regras oficiais antes de publicar, sinalize conteúdo comercial e não prometa resultado ou remuneração fixa.',
    category: 'Conteúdo e vídeo',
    difficulty: 'médio',
    tags: ['TikTok', 'afiliados', 'vídeos curtos', 'vendas', 'renda extra pelo celular'],
    websiteUrl: 'https://www.tiktok.com/shop',
    affiliateUrl: 'https://www.tiktok.com/d/1/ZS9y3kC6kW7Tx-TCI1K/',
    editorialRating: 8,
    editorialSource: 'Descrição editorial baseada na proposta pública do TikTok Shop; elegibilidade, campanhas e comissões variam por região e período.',
  },
  {
    slug: 'quintoandar-indica-ai',
    name: 'QuintoAndar Indica Aí',
    shortDescription: 'Conhece um imóvel para alugar ou vender? Você pode ganhar R$ 100 quando ele for publicado e muito mais se o negócio avançar.',
    longDescription: 'No Indica Aí, você pode indicar um imóvel residencial com autorização do proprietário. As condições divulgadas incluem R$ 100 quando o imóvel é publicado e 10% do primeiro aluguel quando a locação acontece; valores, cidades, prazos e critérios podem mudar. Nunca compartilhe nome ou telefone sem consentimento explícito.',
    category: 'Indicações e imóveis',
    difficulty: 'fácil',
    tags: ['Melhor para Começar', 'indicar imóveis', 'casas para alugar', 'apartamentos à venda', 'ganhar indicando', 'renda extra com contatos', 'sem investimento'],
    websiteUrl: 'https://indicaai.quintoandar.com.br/',
    affiliateUrl: 'https://indicaai.quintoandar.com.br/',
    editorialRating: 9,
    editorialSource: 'Programa oficial Indica Aí do QuintoAndar; valores e critérios devem ser conferidos nos termos vigentes.',
  },
  {
    slug: 'fiverr',
    name: 'Fiverr',
    shortDescription: 'Publique seu serviço em 3 passos e ofereça design, texto, edição ou tecnologia para clientes do mundo todo.',
    longDescription: 'No Fiverr, você cria ofertas de serviços como design, redação, edição, tecnologia e marketing. Monte seu perfil, publique uma oferta e apresente seu portfólio para clientes de vários países. A renda depende da demanda, do preço, da concorrência e da entrega.',
    category: 'Freelance',
    difficulty: 'médio',
    tags: ['freelance', 'serviços', 'internacional', 'remoto', 'vender serviços', 'trabalhar pela internet'],
    websiteUrl: 'https://www.fiverr.com/',
    affiliateUrl: 'https://www.fiverr.com/pe/AGGXVpq',
    editorialRating: 8,
    editorialSource: 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.',
  },
  {
    slug: 'oort-datahub',
    name: 'OORT DataHub',
    shortDescription: 'Participe de tarefas de dados e ajude a treinar IA usando seu conhecimento, atenção e disponibilidade.',
    longDescription: 'O OORT DataHub reúne tarefas de coleta, preparação e anotação de dados para projetos de tecnologia. O cadastro pode exigir código de indicação e a oferta depende de perfil, região, critérios e disponibilidade de cada projeto.',
    category: 'Inteligência artificial',
    difficulty: 'médio',
    tags: ['IA', 'dados', 'remoto', 'código de indicação', 'tarefas de dados', 'treinar inteligência artificial'],
    websiteUrl: 'https://datahub.oortech.com/start/task',
    affiliateUrl: 'https://datahub.oortech.com/start/task',
    editorialRating: 7,
    editorialSource: 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.',
  },
  {
    slug: 'ugc-roster',
    name: 'UGC Roster',
    shortDescription: 'Encontre campanhas de conteúdo gerado por usuários e produza vídeos para marcas conforme o briefing.',
    longDescription: 'O UGC Roster reúne oportunidades para criadores produzirem vídeos e outros materiais para marcas. O volume de campanhas, a seleção e o valor dependem do briefing, do perfil, da região e da disponibilidade. Leia as regras de uso de imagem e confirme o pagamento antes de aceitar um trabalho.',
    category: 'Conteúdo e vídeo',
    difficulty: 'médio',
    tags: ['ugc', 'freelance', 'video', 'estrategias-de-conteudo', 'trabalho-remoto'],
    websiteUrl: 'https://ugcroster.com/',
    affiliateUrl: 'https://tolt.link/nkloficial',
    editorialRating: 7,
    editorialSource: 'Descrição editorial inicial baseada na proposta informada para o catálogo; campanhas, elegibilidade e valores variam.',
    pros: ['Pode ser feito remotamente', 'Portfólio de vídeos para marcas', 'Não exige audiência grande em todas as campanhas'],
    cons: ['Seleção depende do briefing e do perfil', 'Prazos e direitos de uso devem ser conferidos'],
    requirements: ['Celular com câmera', 'Boa iluminação e áudio', 'Leitura cuidadosa do briefing'],
    paymentMethods: ['Conferir em cada campanha'],
    earningPotential: 'US$ 300 ± por vídeo',
    lastVerifiedAt: new Date('2026-11-05T00:00:00.000Z'),
  },
  {
    slug: 'creator-space',
    name: 'Creator Space',
    shortDescription: 'Organize oportunidades de criação de conteúdo e conecte seu perfil a campanhas de marcas.',
    longDescription: 'O Creator Space é uma plataforma para criadores encontrarem campanhas e apresentarem seu trabalho a marcas. A disponibilidade depende do país, do perfil e das campanhas abertas. Antes de aceitar, confira o briefing, o prazo, o formato de entrega e os direitos de utilização do conteúdo.',
    category: 'Conteúdo e vídeo',
    difficulty: 'médio',
    tags: ['ugc', 'estrategias-de-conteudo', 'video', 'freelance', 'trabalho-remoto'],
    websiteUrl: 'https://app.creator.space/',
    affiliateUrl: 'https://app.creator.space/',
    editorialRating: 7,
    editorialSource: 'Descrição editorial inicial baseada na proposta informada para o catálogo; campanhas e condições devem ser validadas na plataforma.',
    pros: ['Centraliza campanhas de conteúdo', 'Pode ampliar o portfólio', 'Trabalho remoto em algumas oportunidades'],
    cons: ['Aprovação e oferta de campanhas variam', 'Pode exigir produção e revisão de conteúdo'],
    requirements: ['Perfil de criador', 'Celular ou câmera adequada', 'Capacidade de seguir briefing'],
    paymentMethods: ['Conferir em cada campanha'],
    earningPotential: 'US$ 100 ± por campanha',
    lastVerifiedAt: new Date('2026-11-05T00:00:00.000Z'),
  },
  {
    slug: 'canal-dark-youtube-notebooklm',
    name: 'Estratégia Canal Dark YouTube + NotebookLM',
    shortDescription: 'Estruture um canal sem aparecer usando pesquisa, roteiro e ferramentas de IA com revisão humana.',
    longDescription: 'Esta é uma estratégia editorial para criar vídeos narrados ou ilustrados sem depender da aparição do criador. O fluxo pode combinar pesquisa, roteiro, revisão humana, edição e distribuição no YouTube com apoio do NotebookLM e outras ferramentas. Não há remuneração garantida: crescimento, monetização e retorno dependem da qualidade, consistência, direitos autorais e regras da plataforma.',
    category: 'Conteúdo e vídeo',
    difficulty: 'difícil',
    tags: ['Melhor para Começar', 'estrategias-de-conteudo', 'ia', 'video', 'renda-passiva', 'trabalho-remoto'],
    websiteUrl: 'https://www.youtube.com/creators/',
    affiliateUrl: null,
    editorialRating: 9,
    editorialSource: 'Estratégia editorial do Portal NKL; resultados, monetização e elegibilidade não são garantidos.',
    pros: ['Crescimento escalável', 'Não requer aparecer na câmera', 'Pode criar um ativo de conteúdo'],
    cons: ['Requer consistência e domínio de prompts IA', 'Exige revisão humana e atenção a direitos autorais'],
    requirements: ['Computador ou celular', 'Pesquisa e roteiro originais', 'Edição de vídeo e áudio', 'Revisão de fatos e direitos autorais'],
    paymentMethods: ['Receita de anúncios e outras fontes do canal, conforme elegibilidade'],
    earningPotential: 'R$ 300 ± por mês após monetização',
    lastVerifiedAt: new Date('2026-11-05T00:00:00.000Z'),
  },
];

async function findOrCreateProfile(seed: ProfileSeed): Promise<string> {
  const [existing] = await db.select({ id: userProfiles.id }).from(userProfiles).where(eq(userProfiles.email, seed.email)).limit(1);
  if (existing) {
    if (seed.singleClassPriceCents !== undefined) {
      await db.update(userProfiles).set({
        singleClassPriceCents: seed.singleClassPriceCents,
        monthlyPlanPriceCents: seed.monthlyPlanPriceCents,
        semiannualPlanPriceCents: seed.semiannualPlanPriceCents,
        annualPlanPriceCents: seed.annualPlanPriceCents,
        isSuspended: seed.isSuspended ?? false,
      }).where(eq(userProfiles.id, existing.id));
    }
    return existing.id;
  }

  const [created] = await db.insert(userProfiles).values({
    email: seed.email,
    fullName: seed.fullName,
    role: seed.role,
    papel: seed.papel,
    businessName: seed.businessName,
    city: seed.city,
    state: seed.state,
    bio: seed.bio,
    instrumento: seed.instrumento,
    anosExperiencia: seed.anosExperiencia,
    singleClassPriceCents: seed.singleClassPriceCents,
    monthlyPlanPriceCents: seed.monthlyPlanPriceCents,
    semiannualPlanPriceCents: seed.semiannualPlanPriceCents,
    annualPlanPriceCents: seed.annualPlanPriceCents,
  }).returning({ id: userProfiles.id });

  if (!created) throw new Error(`Não foi possível criar o perfil seed ${seed.email}.`);
  return created.id;
}

async function seedDirectory(): Promise<void> {
  for (const seed of profileSeeds) {
    const userId = await findOrCreateProfile(seed);
    if (!seed.instrumentTypes && !seed.repairTypes) continue;

    const [existingDirectory] = await db.select({ id: businessDirectory.id }).from(businessDirectory).where(eq(businessDirectory.userId, userId)).limit(1);
    if (existingDirectory) continue;

    await db.insert(businessDirectory).values({
      userId,
      businessName: seed.businessName,
      city: seed.city,
      state: seed.state,
      planType: 'free',
      instrumentTypes: seed.instrumentTypes,
      repairTypes: seed.repairTypes,
    });
  }
}

async function seedPrograms(): Promise<void> {
  for (const seed of partnerSeeds) {
    await db.insert(partnerPrograms).values(seed).onConflictDoUpdate({
      target: partnerPrograms.slug,
      set: {
        name: seed.name,
        shortDescription: seed.shortDescription,
        longDescription: seed.longDescription,
        category: seed.category,
        difficulty: seed.difficulty,
        tags: seed.tags,
        websiteUrl: seed.websiteUrl,
        affiliateUrl: seed.affiliateUrl,
        editorialRating: seed.editorialRating,
        editorialSource: seed.editorialSource,
        pros: seed.pros,
        cons: seed.cons,
        requirements: seed.requirements,
        paymentMethods: seed.paymentMethods,
        earningPotential: seed.earningPotential,
        youtubeVideoId: seed.youtubeVideoId,
        tiktokVideoId: seed.tiktokVideoId,
        zeroInvestmentRequired: seed.zeroInvestmentRequired ?? true,
        updatedAt: new Date(),
      },
    });
  }
}

async function main(): Promise<void> {
  await seedDirectory();
  await seedPrograms();
  console.log('[seed-b2b-and-affiliates] Diretório e programas atualizados com sucesso.');
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error('[seed-b2b-and-affiliates] Falha:', error instanceof Error ? error.message : 'erro desconhecido');
  process.exitCode = 1;
});

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

const partnerSeeds = [
  {
    slug: 'prolific',
    name: 'Prolific',
    shortDescription: 'Participe de estudos de pesquisa remunerados em uma plataforma internacional.',
    longDescription: 'A Prolific conecta participantes a estudos acadêmicos e pesquisas de mercado. A disponibilidade depende do perfil, país e critérios de cada estudo; confira os termos e a remuneração antes de participar.',
    category: 'Pesquisas e estudos',
    difficulty: 'fácil',
    tags: ['pesquisas', 'remoto', 'flexível', 'internacional'],
    websiteUrl: 'https://app.prolific.com/register/',
    affiliateUrl: null,
    editorialRating: 7,
    editorialSource: 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.',
  },
  {
    slug: 'fiverr',
    name: 'Fiverr',
    shortDescription: 'Ofereça serviços digitais para clientes de diferentes países.',
    longDescription: 'O Fiverr permite criar ofertas de serviços em áreas como design, redação, edição, tecnologia e marketing. Para contratar freelancers: [Acesse o portal de clientes (Link Afiliado)](https://www.fiverr.com/pe/AGGXVpq).',
    category: 'Freelance',
    difficulty: 'médio',
    tags: ['freelance', 'serviços', 'internacional', 'remoto'],
    websiteUrl: 'https://www.fiverr.com/',
    affiliateUrl: 'https://www.fiverr.com/pe/AGGXVpq',
    editorialRating: 8,
    editorialSource: 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.',
  },
  {
    slug: 'oort-datahub',
    name: 'OORT DataHub',
    shortDescription: 'Participe de tarefas de dados e treinamento de inteligência artificial.',
    longDescription: 'O OORT DataHub reúne tarefas de coleta e preparação de dados para projetos de tecnologia. O cadastro exige o código de indicação `BPVNW9UH`; a disponibilidade, os critérios e a remuneração variam conforme o projeto.',
    category: 'Inteligência artificial',
    difficulty: 'médio',
    tags: ['IA', 'dados', 'remoto', 'código de indicação'],
    websiteUrl: 'https://datahub.oortech.com/start/task',
    affiliateUrl: 'https://datahub.oortech.com/start/task',
    editorialRating: 7,
    editorialSource: 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.',
  },
];

async function findOrCreateProfile(seed: ProfileSeed): Promise<string> {
  const [existing] = await db.select({ id: userProfiles.id }).from(userProfiles).where(eq(userProfiles.email, seed.email)).limit(1);
  if (existing) return existing.id;

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
        updatedAt: new Date(),
      },
    });
  }
}

async function main(): Promise<void> {
  await seedDirectory();
  await seedPrograms();
  console.log('[seed-b2b-and-affiliates] Diretório e programas atualizados com sucesso.');
}

main().catch((error: unknown) => {
  console.error('[seed-b2b-and-affiliates] Falha:', error instanceof Error ? error.message : 'erro desconhecido');
  process.exitCode = 1;
});

import Link from 'next/link';
import { EnglishLearningPractice, type LearningPracticeQuestion } from '@/components/english-learning-practice';
import { AuthorBio } from '@/components/seo/author-bio';
import { BlufSummary } from '@/components/seo/bluf-summary';
import { JsonLd } from '@/components/seo/json-ld';
import { BILINGUAL_COLOR_CLASSES, tokenizeBilingualExample, type ExampleToken } from '@/lib/english-ebook';
import { SCHEMA_IDS, SITE_CONTENT_LAST_MODIFIED } from '@/lib/seo/schema-graph';
import { absoluteSiteUrl } from '@/lib/site';

type Resource = [name: string, description: string, href: string];
type FoundationLink = { label: string; href: string };
type FoundationItem = [title: string, description: string, link?: FoundationLink];
type LanguageContent = {
  slug: string;
  name: string;
  nativeName: string;
  title: string;
  description: string;
  promise: string;
  foundations: FoundationItem[];
  lessons: [string, string][];
  plan: [string, string][];
  examples: [string, string][];
  resources: Resource[];
  questions: LearningPracticeQuestion[];
};

const languages: LanguageContent[] = [
  {
    slug: 'italiano', name: 'italiano', nativeName: 'Italiano',
    title: 'Aprenda italiano do zero com um caminho claro para começar hoje',
    description: 'Um guia gratuito com pronúncia, gramática, vocabulário, prática, recursos e um plano realista de 90 dias.',
    promise: 'Aprenda frases úteis, melhore sua escuta e construa uma rotina sustentável mesmo com pouco tempo.',
    foundations: [
      ['Frases antes de listas', 'Aprenda expressões completas ligadas à sua rotina: apresentar-se, pedir ajuda, trabalhar e viajar.'],
      ['Repetição inteligente', 'Revise após um dia, três dias e uma semana. A recordação ativa fixa melhor do que a releitura passiva.'],
      ['Escuta diária', 'Ouça diálogos curtos, repita o ritmo e confira a transcrição apenas depois da primeira escuta.'],
      ['Uso real', 'Escreva e fale mesmo com erros. A correção faz parte do aprendizado.'],
    ],
    lessons: [
      ['Pronúncia e ritmo', 'Concentre-se nas vogais claras, consoantes duplas e entonação das perguntas. Grave uma frase e ouça novamente.'],
      ['Gramática essencial', 'Estude essere, avere, presente, artigos e preposições por meio de exemplos reais, não regras isoladas.'],
      ['Vocabulário prático', 'Agrupe palavras por casa, trabalho, compras, viagem e interesses pessoais.'],
      ['Conversação', 'Use frases de reparo para manter o diálogo: “Puoi ripetere?” (Pode repetir?), “Non ho capito” (Não entendi), “Come si dice…?” (Como se diz…?).'],
    ],
    plan: [
      ['Dias 1–7 · destravar', 'Aprenda a se apresentar, cumprimentar e falar da sua rotina. Grave 30 segundos por dia.'],
      ['Dias 8–30 · base', 'Pratique essere, avere, presente, perguntas e frases de sobrevivência com áudios curtos.'],
      ['Dias 31–60 · contexto', 'Leia diálogos graduados, escreva mensagens e repita situações de trabalho ou viagem.'],
      ['Dias 61–90 · autonomia', 'Grave um projeto final, revise os erros recorrentes e use o italiano em uma conversa real.'],
    ],
    examples: [
      ['Mi chiamo Ana.', 'Meu nome é Ana.'],
      ['Vorrei un caffè, per favore.', 'Eu gostaria de um café, por favor.'],
      ['Puoi ripetere lentamente?', 'Você pode repetir devagar?'],
      ['Lavoro da casa.', 'Eu trabalho em casa.'],
    ],
    resources: [
      ['Duolingo Italian', 'Lições curtas para criar consistência e revisar vocabulário.', 'https://www.duolingo.com/course/it/en/Learn-Italian'],
      ['Easy Italian', 'Vídeos e conversas reais com legendas para treinar escuta.', 'https://www.youtube.com/@EasyItalianVideos'],
      ['Coffee Break Italian', 'Podcast gradual para ouvir e repetir ao longo da semana.', 'https://coffeebreaklanguages.com/coffeebreakitalian/'],
      ['Tandem', 'Intercâmbio linguístico; comece por texto e proteja seus dados pessoais.', 'https://tandem.net/'],
      ['WordReference', 'Dicionário e fórum para conferir exemplos e uso das palavras.', 'https://www.wordreference.com/iten/'],
    ],
    questions: [
      { prompt: 'Complete: “Io ___ brasiliano.”', options: ['sono', 'sei', 'è'], answer: 'sono', explanation: 'Com “io”, usamos “sono”: Io sono brasiliano.' },
      { prompt: 'Qual frase significa “Eu trabalho em casa”?', options: ['Lavoro da casa.', 'Lavorando casa.', 'Sono lavoro casa.'], answer: 'Lavoro da casa.', explanation: '“Lavoro da casa” significa “Eu trabalho em casa”.' },
      { prompt: 'Complete: “Lei ___ italiano ogni giorno.”', options: ['studia', 'studio', 'studiare'], answer: 'studia', explanation: 'Com “lei”, o verbo studiare no presente fica “studia”.' },
    ],
  },
  {
    slug: 'frances', name: 'francês', nativeName: 'Français',
    title: 'Aprenda francês do zero com um caminho prático para começar hoje',
    description: 'Um guia gratuito com pronúncia, gramática, vocabulário, prática, recursos e um plano realista de 90 dias.',
    promise: 'Construa frases úteis, melhore sua escuta e avance sem depender de estudar horas por dia.',
    foundations: [['Frases completas', 'Aprenda blocos que você realmente dirá em uma viagem, no trabalho ou em uma conversa.'], ['Ouvir antes de traduzir', 'Escute materiais curtos várias vezes e procure o sentido geral antes de consultar cada palavra.'], ['Revisão espaçada', 'Revisite o conteúdo em intervalos crescentes e tente lembrar antes de olhar a resposta.'], ['Feedback seguro', 'Falar com erros é parte do processo. Peça uma correção por vez para não travar.']],
    lessons: [['Pronúncia e ritmo', 'Observe vogais nasais, o “r” francês e as ligações entre palavras. Priorize inteligibilidade, não um sotaque perfeito.'], ['Estruturas essenciais', 'Comece por être, avoir, presente, negação, perguntas e artigos usando exemplos do seu cotidiano.'], ['Vocabulário contextual', 'Organize palavras por tema e registre gênero, exemplo e áudio junto com cada nova expressão.'], ['Interação real', 'Treine “Pouvez-vous répéter ?” (Pode repetir?), “Je ne comprends pas” (Eu não entendo) e “Comment dit-on… ?” (Como se diz…?).']],
    plan: [['Dias 1–7 · destravar', 'Treine saudações, apresentação e sons difíceis gravando 30 segundos por dia.'], ['Dias 8–30 · construir', 'Use être, avoir, presente, perguntas e frases de reparo em situações simples.'], ['Dias 31–60 · entender', 'Leia textos graduados, acompanhe diálogos com legenda e escreva sobre sua rotina.'], ['Dias 61–90 · usar', 'Simule viagem ou trabalho, grave um projeto e revise os pontos que mais se repetem.']],
    examples: [['Je m’appelle Ana.', 'Meu nome é Ana.'], ['Je voudrais un café, s’il vous plaît.', 'Eu gostaria de um café, por favor.'], ['Pouvez-vous répéter lentement ?', 'Você pode repetir devagar?'], ['Je travaille à la maison.', 'Eu trabalho em casa.']],
    resources: [['TV5MONDE Apprendre', 'Vídeos, exercícios e atividades por nível para estudar francês com contexto.', 'https://apprendre.tv5monde.com/'], ['Easy French', 'Entrevistas e conversas com legendas para treinar compreensão.', 'https://www.youtube.com/@EasyFrenchVideos'], ['Coffee Break French', 'Podcast gradual para ouvir e repetir em sessões curtas.', 'https://coffeebreaklanguages.com/coffeebreakfrench/'], ['RFI Français facile', 'Áudios e notícias adaptadas para estudantes.', 'https://francaisfacile.rfi.fr/'], ['WordReference', 'Dicionário e exemplos para conferir gênero e uso.', 'https://www.wordreference.com/fren/']],
    questions: [{ prompt: 'Complete: “Je ___ brésilien.”', options: ['suis', 'es', 'est'], answer: 'suis', explanation: 'Com “je”, o verbo être fica “je suis”.' }, { prompt: 'Qual frase significa “Eu trabalho em casa”?', options: ['Je travaille à la maison.', 'Je travail maison.', 'Je suis travaille maison.'], answer: 'Je travaille à la maison.', explanation: '“Je travaille à la maison” significa “Eu trabalho em casa”.' }, { prompt: 'Complete: “Elle ___ français.”', options: ['étudie', 'étudier', 'étudies'], answer: 'étudie', explanation: 'Com “elle”, usamos “étudie”.' }],
  },
  {
    slug: 'alemao', name: 'alemão', nativeName: 'Deutsch',
    title: 'Aprenda alemão do zero com uma trilha prática para começar hoje',
    description: 'Fundamentos, pronúncia, gramática, vocabulário, prática, recursos e um plano realista de 90 dias.',
    promise: 'Entenda a estrutura do idioma e pratique frases reais sem tentar decorar um dicionário inteiro.',
    foundations: [['Estrutura visível', 'Observe posição do verbo, gênero dos substantivos e casos dentro de frases completas.'], ['Pronúncia consistente', 'Treine vogais longas e curtas, ch, r e o ritmo. Grave e compare sem buscar perfeição.'], ['Revisão ativa', 'Cubra a tradução e tente produzir a frase; depois confira e corrija uma coisa por vez.'], ['Contexto pessoal', 'Use vocabulário sobre sua casa, profissão, hobbies e planos para tornar a memória útil.']],
    lessons: [['Sons e ritmo', 'Comece por ä, ö, ü, ch e pela diferença entre vogais longas e curtas. Ouça, imite e compare.'], ['Base gramatical', 'Estude sein, haben, presente, perguntas, negação e ordem básica das palavras.'], ['Substantivos', 'Aprenda a palavra junto com artigo e plural: der, die e das não devem ficar separados.'], ['Sobreviver em conversa', 'Pratique “Können Sie das wiederholen?” (Pode repetir isso?), “Ich verstehe nicht” (Eu não entendo) e “Wie sagt man…?” (Como se diz…?).']],
    plan: [['Dias 1–7 · sons', 'Treine sons, saudações e apresentação com gravações curtas e repetição consciente.'], ['Dias 8–30 · estrutura', 'Use sein, haben, presente, perguntas e negação em frases verdadeiras.'], ['Dias 31–60 · contexto', 'Leia textos curtos, escute com transcrição e escreva mensagens sobre sua rotina.'], ['Dias 61–90 · autonomia', 'Simule situações de viagem ou trabalho e faça uma apresentação final gravada.']],
    examples: [['Ich heiße Ana.', 'Meu nome é Ana.'], ['Ich möchte einen Kaffee, bitte.', 'Eu gostaria de um café, por favor.'], ['Können Sie das langsam wiederholen?', 'Você pode repetir isso devagar?'], ['Ich arbeite von zu Hause.', 'Eu trabalho de casa.']],
    resources: [['DW Learn German', 'Curso gratuito com vídeos, exercícios e trilhas por nível.', 'https://learngerman.dw.com/'], ['Easy German', 'Entrevistas e conversas com legendas em alemão.', 'https://www.youtube.com/@EasyGermanVideos'], ['Coffee Break German', 'Podcast gradual para ouvir e repetir durante a semana.', 'https://coffeebreaklanguages.com/coffeebreakgerman/'], ['Goethe-Institut', 'Exercícios e materiais confiáveis para diferentes níveis.', 'https://www.goethe.de/en/spr/ueb.html'], ['WordReference', 'Dicionário e fórum para conferir gênero e exemplos.', 'https://www.wordreference.com/deen/']],
    questions: [{ prompt: 'Complete: “Ich ___ Brasilianer.”', options: ['bin', 'bist', 'ist'], answer: 'bin', explanation: 'Com “ich”, usamos “bin”: Ich bin Brasilianer.' }, { prompt: 'Qual frase significa “Eu trabalho de casa”?', options: ['Ich arbeite von zu Hause.', 'Ich arbeiten Hause.', 'Ich bin arbeite Hause.'], answer: 'Ich arbeite von zu Hause.', explanation: '“Ich arbeite von zu Hause” significa “Eu trabalho de casa”.' }, { prompt: 'Complete: “Sie ___ Deutsch.”', options: ['lernt', 'lernen', 'lerne'], answer: 'lernt', explanation: 'Com “sie” no singular, usamos “lernt”.' }],
  },
  {
    slug: 'espanhol', name: 'espanhol', nativeName: 'Español',
    title: 'Aprenda espanhol do zero com prática e um plano para começar hoje',
    description: 'Um guia gratuito com pronúncia, gramática, vocabulário, prática, recursos e um plano realista de 90 dias.',
    promise: 'A proximidade com o português ajuda, mas exige atenção a falsos amigos, pronúncia e uso real.',
    foundations: [['Falsos amigos', 'Registre palavras parecidas que mudam de sentido e use frases para não confiar apenas na aparência.'], ['Escuta regional', 'Conheça diferentes sotaques sem tentar aprender todos de uma vez. Comece por um conteúdo claro.'], ['Produção diária', 'Descreva sua rotina por dois minutos e escreva cinco frases que alguém realmente entenderia.'], ['Correção', 'Compare português e espanhol com cuidado: semelhança é uma ponte, não uma garantia.']],
    lessons: [['Pronúncia e ritmo', 'Treine j, ll, r/rr e vogais claras. A velocidade vem depois da clareza.'], ['Gramática essencial', 'Comece por ser/estar, presente, perguntas, gênero, plural e pronomes essenciais.'], ['Vocabulário útil', 'Monte grupos para trabalho, compras, viagem e conversa, sempre com uma frase própria.'], ['Conversa', 'Use “¿Puedes repetir?” (Pode repetir?), “No entendí” (Não entendi) e “¿Cómo se dice…?” (Como se diz…?) para manter a interação.']],
    plan: [['Dias 1–7 · clareza', 'Treine saudações, apresentação e sons que parecem português, mas não são iguais.'], ['Dias 8–30 · base', 'Pratique ser/estar, presente, perguntas e falsos amigos em frases reais.'], ['Dias 31–60 · contexto', 'Use diálogos, textos curtos, áudio com legenda e mensagens sobre temas familiares.'], ['Dias 61–90 · autonomia', 'Faça conversas simuladas, um projeto final e revisão dos falsos amigos frequentes.']],
    examples: [['Me llamo Ana.', 'Meu nome é Ana.'], ['Quisiera un café, por favor.', 'Eu gostaria de um café, por favor.'], ['¿Puedes repetir despacio?', 'Você pode repetir devagar?'], ['Trabajo desde casa.', 'Eu trabalho de casa.']],
    resources: [['Duolingo Spanish', 'Lições curtas para criar consistência e revisar vocabulário.', 'https://www.duolingo.com/course/es/en/Learn-Spanish'], ['Dreaming Spanish', 'Vídeos compreensíveis para ouvir espanhol com contexto.', 'https://www.dreamingspanish.com/'], ['Easy Spanish', 'Entrevistas com falantes e legendas para treinar escuta.', 'https://www.youtube.com/@EasySpanishVideos'], ['SpanishDict', 'Dicionário, conjugador e exemplos para conferir o uso.', 'https://www.spanishdict.com/'], ['Tandem', 'Prática de conversa com cuidado e proteção de dados.', 'https://tandem.net/']],
    questions: [{ prompt: 'Complete: “Yo ___ brasileño.”', options: ['soy', 'eres', 'es'], answer: 'soy', explanation: 'Com “yo”, usamos “soy”: Yo soy brasileño.' }, { prompt: 'Qual frase significa “Eu trabalho de casa”?', options: ['Trabajo desde casa.', 'Trabajando casa.', 'Soy trabajo casa.'], answer: 'Trabajo desde casa.', explanation: '“Trabajo desde casa” significa “Eu trabalho de casa”.' }, { prompt: 'Complete: “Ella ___ español.”', options: ['estudia', 'estudiar', 'estudio'], answer: 'estudia', explanation: 'Com “ella”, usamos “estudia”.' }],
  },
  {
    slug: 'chines', name: 'chinês mandarim', nativeName: '中文',
    title: 'Comece mandarim do zero com uma trilha prática para começar hoje',
    description: 'Uma introdução gratuita a tons, pinyin, frases, caracteres, prática, recursos e um plano realista de 90 dias.',
    promise: 'Aprenda os sons primeiro, conecte pinyin a frases e só depois aumente a quantidade de caracteres.',
    foundations: [
      ['Tons antes da velocidade', 'Treine pares mínimos e grave sua voz. Um tom incorreto pode mudar o significado, então a escuta vem cedo.'],
      ['Pinyin com áudio', 'Use pinyin como apoio de pronúncia, não como substituto de ouvir falantes reais. Você pode testar frases em mandarim no conversor em português do Chinês Já, que marca os tons em cada sílaba e reproduz o áudio.', { label: 'Abrir conversor de Pinyin com tons e áudio (Chinês Já)', href: 'https://www.chinesja.com.br/p/pinyin-com-tons-e-audio-converter.html' }],
      ['Caracteres em contexto', 'Aprenda caracteres dentro de palavras e frases, observando componentes e ordem dos traços.'],
      ['Revisão curta', 'Cinco minutos todos os dias vencem uma sessão longa que você não repete.'],
    ],
    lessons: [['Sons e tons', 'Comece pelos quatro tons, tom neutro e combinações frequentes. Ouça, imite e compare.'], ['Frases essenciais', 'Pratique 我是… (Eu sou…), 我有… (Eu tenho…), 我喜欢… (Eu gosto de…) e perguntas simples com exemplos verdadeiros.'], ['Vocabulário', 'Aprenda números, horários, família, trabalho e necessidades com áudio e pinyin.'], ['Interação', 'Treine “请再说一遍” (Por favor, diga novamente), “我不明白” (Eu não entendo) e “怎么说…？” (Como se diz…?) para pedir ajuda sem desistir.']],
    plan: [['Dias 1–7 · ouvir', 'Treine tons, saudações e apresentação gravando e comparando sua voz.'], ['Dias 8–30 · construir', 'Use pinyin, frases curtas, números e perguntas em situações concretas.'], ['Dias 31–60 · reconhecer', 'Pratique diálogos lentos, caracteres frequentes e mensagens curtas.'], ['Dias 61–90 · usar', 'Simule compras ou viagem, grave um áudio final e revise seus tons difíceis.']],
    examples: [['我叫 Ana。', 'Meu nome é Ana.'], ['请给我一杯咖啡。', 'Por favor, me dê um café.'], ['请再说一遍。', 'Por favor, diga novamente.'], ['我在家工作。', 'Eu trabalho em casa.']],
    resources: [
      ['Chinês Já — Pinyin com tons e áudio', 'Ferramenta gratuita em português indicada por Rafael (Chinês Já): cole uma frase em chinês, confira os tons marcados nas sílabas e ouça a leitura em mandarim.', 'https://www.chinesja.com.br/p/pinyin-com-tons-e-audio-converter.html'],
      ['HelloChinese', 'Curso estruturado com tons, pinyin, frases e exercícios curtos.', 'https://www.hellochinese.cc/'],
      ['ChinesePod', 'Lições de áudio e diálogos para diferentes níveis.', 'https://chinesepod.com/'],
      ['Yoyo Chinese', 'Vídeos claros para pronúncia e construção de frases.', 'https://yoyochinese.com/'],
      ['Pleco', 'Dicionário móvel para consultar caracteres, áudio e exemplos.', 'https://www.pleco.com/'],
      ['HSKReading', 'Leituras graduadas para reconhecer palavras em contexto.', 'https://hskreading.com/'],
    ],
    questions: [{ prompt: 'Qual frase significa “Meu nome é Ana”?', options: ['我叫 Ana。', '我有 Ana。', '我喜欢 Ana。'], answer: '我叫 Ana。', explanation: '我叫 (wǒ jiào) é usado para dizer “eu me chamo”.' }, { prompt: 'Como pedir para repetir?', options: ['请再说一遍。', '我在家。', '谢谢你。'], answer: '请再说一遍。', explanation: '请再说一遍 (qǐng zài shuō yí biàn) significa “por favor, diga novamente”.' }, { prompt: 'Complete: “我 ___ 咖啡。”', options: ['喜欢', '叫', '是'], answer: '喜欢', explanation: '喜欢 (xǐhuan) significa gostar.' }],
  },
];

export function getLanguageContent(slug: string): LanguageContent {
  return languages.find((language) => language.slug === slug) ?? languages[0]!;
}

function ResourceList({
  title,
  eyebrow,
  items,
  suggestionHref,
}: {
  title: string;
  eyebrow: string;
  items: Resource[];
  suggestionHref?: string;
}) {
  return (
    <section className="mt-14 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">{eyebrow}</p>
          <h2 className="mt-2 font-playfair text-3xl font-bold md:text-5xl">{title}</h2>
        </div>
        {suggestionHref && (
          <Link href={suggestionHref} className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider hover:border-orange hover:text-orange">
            Sugerir ferramenta para este idioma
          </Link>
        )}
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {items.map(([name, description, href], index) => (
          <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="group rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-orange hover:shadow-[var(--card-shadow)]">
            <div className="flex items-start gap-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange/10 font-playfair text-xl font-bold text-orange">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="font-bold group-hover:text-orange">{name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">{description}</p>
                <span className="mt-3 inline-block text-xs font-bold uppercase tracking-wider text-neon">Abrir recurso ↗</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function ColoredTokens({ tokens }: { tokens: ExampleToken[] }) {
  return (
    <>
      {tokens.map((token, index) => (
        token.isWord
          ? <span key={`${token.text}-${index}`} className={BILINGUAL_COLOR_CLASSES[token.colorIndex % BILINGUAL_COLOR_CLASSES.length]}>{token.text}</span>
          : <span key={`${token.text}-${index}`}>{token.text}</span>
      ))}
    </>
  );
}

function BilingualPhrase({ source, translation }: { source: string; translation: string }) {
  const colored = tokenizeBilingualExample(source, translation);
  return (
    <span className="block font-mono text-sm leading-relaxed">
      <strong><ColoredTokens tokens={colored.english} /></strong>
      <span className="block text-xs"><ColoredTokens tokens={colored.portuguese} /></span>
    </span>
  );
}

export function LanguageLearningPage({ slug }: { slug: string }) {
  const content = getLanguageContent(slug);
  const pageUrl = absoluteSiteUrl(`/blog/aprender/${content.slug}`);
  const nav = [['agora', 'Pratique agora'], ['fundamentos', 'O método'], ['licoes', 'Lições úteis'], ['plano', 'Plano de 90 dias'], ['recursos', 'Recursos'], ['investir', 'Cursos e aulas']];
  const blufSummary = `Este guia gratuito de ${content.name} (${content.nativeName}) organiza uma rotina prática de 90 dias com 20 minutos diários, cinco dias por semana: revisão ativa de frases completas, escuta com transcrição e gravação curta de voz. Você destrava saudações e rotina na primeira semana e conclui o ciclo aplicando o idioma em situações reais.`;

  return <article className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:pt-12">
    <JsonLd data={{
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          '@id': `${pageUrl}#article`,
          headline: content.title,
          description: content.description,
          url: pageUrl,
          mainEntityOfPage: pageUrl,
          inLanguage: 'pt-BR',
          dateModified: SITE_CONTENT_LAST_MODIFIED,
          author: { '@id': SCHEMA_IDS.author },
          publisher: { '@id': SCHEMA_IDS.organization },
          isPartOf: { '@id': SCHEMA_IDS.website },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Portal NKL', item: absoluteSiteUrl('/') },
            { '@type': 'ListItem', position: 2, name: `Aprender ${content.name}`, item: pageUrl },
          ],
        },
      ],
    }} />
    <header className="relative overflow-hidden rounded-[2rem] border border-orange/30 bg-income-surface px-5 py-10 md:px-12 md:py-16"><div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-orange/15 blur-3xl" /><div className="relative max-w-4xl"><p className="text-xs font-bold uppercase tracking-[0.24em] text-orange">Aprender · guia gratuito · faça junto · {content.nativeName}</p><h1 className="mt-4 max-w-4xl font-playfair text-4xl font-bold leading-[1.03] md:text-7xl">{content.title}</h1><p className="mt-6 max-w-3xl text-lg leading-relaxed text-foreground/75 md:text-xl">{content.description} {content.promise}</p><div className="mt-7 flex flex-wrap gap-3"><a href="#agora" className="rounded-md bg-orange px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-dark">Começar agora</a><a href="#plano" className="rounded-md border border-border px-5 py-3 text-sm font-bold transition hover:border-orange hover:text-orange">Ver plano de 90 dias</a><Link href={`/guias/${content.slug}`} className="rounded-md border border-orange/40 bg-orange/10 px-5 py-3 text-sm font-bold text-orange transition hover:bg-orange hover:text-white">Ver e-book de {content.name}</Link></div></div></header>
    <div className="mt-6">
      <BlufSummary
        summary={blufSummary}
        facts={[
          { label: 'Carga diária', value: '20 min · 5 dias/semana' },
          { label: 'Duração total', value: '90 dias em 4 fases' },
          { label: 'Prática central', value: 'Frases úteis e áudio curto' },
        ]}
        methodologyHref="/metodologia"
      />
    </div>
    <nav aria-label="Idiomas e seções" className="mt-6 rounded-2xl border border-border bg-surface p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground/55">Escolha seu próximo passo</p><div className="mt-3 flex flex-wrap gap-2"><Link href="/blog/aprender/ingles" className="rounded-full border border-border px-3 py-2 text-sm font-semibold hover:border-orange hover:text-orange">English</Link>{languages.map((language) => <Link key={language.slug} href={`/blog/aprender/${language.slug}`} className={`rounded-full border px-3 py-2 text-sm font-semibold ${language.slug === slug ? 'border-orange text-orange' : 'border-border hover:border-orange hover:text-orange'}`}>{language.nativeName}</Link>)} </div><div className="mt-3 flex flex-wrap gap-2">{nav.map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-full border border-border px-3 py-2 text-sm font-semibold transition hover:border-orange hover:text-orange">{label}</a>)}</div></nav>
    <section id="agora" className="mt-10 scroll-mt-24 rounded-2xl border border-neon/25 bg-neon/5 p-5 md:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Faça enquanto lê</p><h2 className="mt-2 font-playfair text-3xl font-bold md:text-5xl">O exercício de 90 segundos</h2><p className="mt-3 max-w-3xl leading-relaxed text-foreground/75">Grave sua voz dizendo: <strong>{content.examples[0][0]} · {content.examples[1][0]} · {content.examples[2][0]} · {content.examples[3][0]}</strong> Depois ouça uma vez, anote uma melhoria e repita amanhã.</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{['Grave sem buscar perfeição', 'Ouça e anote uma melhoria', 'Repita amanhã por 90 segundos'].map((step, index) => <div key={step} className="rounded-xl border border-border bg-surface p-4"><span className="font-playfair text-3xl font-bold text-orange">0{index + 1}</span><p className="mt-2 text-sm font-semibold">{step}</p></div>)}</div></section>
    <section id="fundamentos" className="mt-14 scroll-mt-24"><p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">1 · O método</p><h2 className="mt-2 font-playfair text-3xl font-bold md:text-5xl">Aprender fica leve quando você sabe o que fazer com cada palavra.</h2><p className="mt-3 max-w-3xl leading-relaxed text-foreground/70">A meta não é parecer nativo. É compreender um pouco mais, comunicar uma ideia e voltar amanhã com menos medo.</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{content.foundations.map(([title, text, link]) => <article key={title} className="rounded-2xl border border-border bg-surface p-5"><h3 className="font-playfair text-2xl font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-foreground/70">{text}</p>{link && <a href={link.href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-orange/40 bg-orange/10 px-3.5 py-2 text-xs font-bold text-orange transition hover:bg-orange hover:text-white">{link.label} ↗</a>}</article>)}</div></section>
    <section id="licoes" className="mt-14 scroll-mt-24"><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">2 · Lições que viram fala</p><h2 className="mt-2 font-playfair text-3xl font-bold md:text-5xl">Uma habilidade por vez, sempre com exemplo.</h2><div className="mt-6 grid gap-3 md:grid-cols-2">{content.lessons.map(([title, text], index) => <article key={title} className="rounded-xl border border-border bg-surface p-5"><span className="font-playfair text-3xl font-bold text-orange">0{index + 1}</span><h3 className="mt-2 font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-foreground/70">{text}</p><div className="mt-4 space-y-3 border-t border-border pt-3">{content.examples.map(([target, translation]) => <BilingualPhrase key={target} source={target} translation={translation} />)}</div></article>)}</div></section>
    <section id="plano" className="mt-14 scroll-mt-24 rounded-2xl border border-border bg-income-surface p-5 md:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">3 · Um plano possível</p><h2 className="mt-2 font-playfair text-3xl font-bold md:text-5xl">90 dias para sair do “um dia eu começo”.</h2><p className="mt-3 max-w-3xl leading-relaxed text-foreground/70">Faça 20 minutos, cinco dias por semana: revise, escute ou leia e produza uma frase. Perdeu um dia? Retome no próximo.</p><div className="mt-7 grid gap-3 md:grid-cols-2">{content.plan.map(([title, text]) => <article key={title} className="rounded-xl border border-border bg-surface/75 p-4"><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-foreground/70">{text}</p></article>)}</div></section>
    <EnglishLearningPractice questions={content.questions} labels={{ eyebrow: 'Pratique agora', title: 'Um treino rápido, sem nota e sem vergonha', description: 'Responda, leia a explicação e volte amanhã. O objetivo é identificar o próximo passo, não provar que você já sabe.', score: 'Acertos nesta visita', correct: 'Correto!', retry: 'Ainda não.' }} />
    <ResourceList eyebrow="4 · Pratique sem pagar" title="Recursos gratuitos para começar hoje" items={content.resources} suggestionHref={`/sugerir?area=idiomas&origem=${encodeURIComponent(`/blog/aprender/${content.slug}`)}`} />
    <section id="recursos" className="mt-14 scroll-mt-24 rounded-2xl border border-neon/25 bg-neon/5 p-5 md:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">5 · Uma escolha inteligente</p><h2 className="mt-2 font-playfair text-3xl font-bold md:text-5xl">Não baixe tudo. Escolha um recurso por habilidade.</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{['Ouvir: um áudio curto', 'Falar: o gravador do celular', 'Ler: um texto graduado', 'Escrever: cinco frases verdadeiras'].map((item) => <p key={item} className="rounded-xl border border-border bg-surface p-4 text-sm font-semibold"><span className="mr-2 text-orange">✓</span>{item}</p>)}</div><p className="mt-5 text-sm leading-relaxed text-foreground/70"><strong>Faça agora:</strong> escolha apenas um recurso, marque 20 minutos e termine uma tarefa pequena.</p></section>
    <ResourceList eyebrow="6 · Para quem quer avançar" title="Aulas e materiais para acelerar com orientação" items={content.resources.slice(0, 3).map(([name, description, href]) => [`${name} · material de referência`, description, href])} />
    <p id="investir" className="mt-4 text-xs leading-relaxed text-foreground/55">Materiais e aulas podem oferecer estrutura e feedback, mas não garantem fluência ou renda. Antes de comprar, confira preço, renovação, suporte e reembolso.</p>
    <section className="mt-14 grid gap-5 md:grid-cols-[1fr_0.85fr]"><div className="rounded-2xl border border-border bg-surface p-5 md:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Próximo passo concreto</p><h2 className="mt-2 font-playfair text-3xl font-bold">Quando terminar esta página, faça uma entrega.</h2><ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground/75"><li>Escolha uma frase deste guia.</li><li>Adapte para sua vida.</li><li>Grave e escreva a versão.</li><li>Revise amanhã.</li><li>Depois de sete dias, use em uma conversa.</li></ol></div><aside className="rounded-2xl border border-orange/30 bg-orange/5 p-5 md:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">E-books e outros idiomas</p><h2 className="mt-3 font-playfair text-3xl font-bold">Leve o guia completo de {content.name} e outros idiomas.</h2><p className="mt-3 text-sm leading-relaxed text-foreground/75">A edição completa de 100 lições de {content.name} já está disponível com guia de IA por faixa etária e planner de 90 dias. Veja a prévia ou conheça o guia de inglês.</p><div className="mt-5 flex flex-wrap gap-3"><Link href={`/guias/${content.slug}`} className="inline-flex min-h-11 items-center rounded-md bg-orange px-4 py-3 text-sm font-bold text-white hover:bg-orange-dark">Ver página do guia ({content.name})</Link><Link href={`/guias/${content.slug}/ebook`} className="inline-flex min-h-11 items-center rounded-md border border-orange px-4 py-3 text-sm font-bold text-orange hover:bg-orange hover:text-white">Ver prévia do e-book</Link><Link href="/blog/aprender/ingles" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-3 text-sm font-bold hover:border-orange hover:text-orange">Guia gratuito de inglês</Link></div></aside></section>
    <section className="mt-8 rounded-2xl border border-orange/30 bg-income-surface p-5 md:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Lembrete para os dias difíceis</p><h2 className="mt-2 font-playfair text-3xl font-bold md:text-4xl">Você não está atrasado. Você está construindo.</h2><p className="mt-3 max-w-3xl leading-relaxed text-foreground/75">Uma frase falada hoje pode parecer pequena, mas reduz a distância entre você e a conversa que deseja ter. Volte amanhã e faça outra.</p></section>
    <AuthorBio updatedLabel={`Guia gratuito de ${content.name} · Portal NKL`} />
  </article>;
}

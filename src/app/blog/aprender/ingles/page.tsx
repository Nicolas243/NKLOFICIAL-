import type { Metadata } from 'next';
import Link from 'next/link';
import { AffiliateDisclaimer } from '@/components/affiliate-disclaimer';
import { EnglishLearningPractice } from '@/components/english-learning-practice';
import { AuthorBio } from '@/components/seo/author-bio';
import { JsonLd } from '@/components/seo/json-ld';
import { BILINGUAL_COLOR_CLASSES, tokenizeBilingualExample, type ExampleToken } from '@/lib/english-ebook';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Aprender inglês do zero: um plano iluminador para começar hoje',
  description: 'Um guia prático e gratuito para aprender inglês com frases, exercícios, recursos confiáveis e um plano de 90 dias.',
  alternates: { canonical: absoluteSiteUrl('/blog/aprender/ingles') },
  openGraph: {
    type: 'article',
    title: 'Aprender inglês do zero: um plano iluminador para começar hoje',
    description: 'Entenda por que inglês não precisa ser difícil e pratique enquanto lê.',
    url: absoluteSiteUrl('/blog/aprender/ingles'),
  },
};

const foundations = [
  ['Você não precisa traduzir tudo', 'Entenda a ideia geral primeiro. Quando você tenta converter cada palavra para o português, a leitura fica lenta e cansativa.'],
  ['Frases vencem listas', '“I need help with this task” (Eu preciso de ajuda com esta tarefa) ensina need, help e task em uma situação real. Uma lista isolada não mostra como usar nada.'],
  ['A boca precisa participar', 'Ler em silêncio cria reconhecimento; falar cria acesso. Mesmo sozinho, você pode treinar ritmo, pausas e clareza.'],
  ['Erro é dado, não sentença', 'Anote o erro que mais se repete, corrija uma versão e use a frase novamente. É assim que o cérebro transforma informação em habilidade.'],
];

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

function BilingualPhrase({ english, portuguese }: { english: string; portuguese: string }) {
  const colored = tokenizeBilingualExample(english, portuguese);
  return (
    <span className="block">
      <strong><ColoredTokens tokens={colored.english} /></strong>
      <span className="block text-xs"><ColoredTokens tokens={colored.portuguese} /></span>
    </span>
  );
}

type GrammarExample = [english: string, portuguese: string];
type GrammarSection = [title: string, examples: GrammarExample[]];

const grammar: GrammarSection[] = [
  ['Apresentar-se', [['I am Ana.', 'Eu sou Ana.'], ['My name is Ana.', 'Meu nome é Ana.'], ['I live in Recife.', 'Eu moro em Recife.'], ['I work with sales.', 'Eu trabalho com vendas.'], ['I am learning English.', 'Eu estou aprendendo inglês.']]],
  ['Rotina', [['I wake up early.', 'Eu acordo cedo.'], ['I study at night.', 'Eu estudo à noite.'], ['I work from home.', 'Eu trabalho de casa.'], ['I drink coffee.', 'Eu tomo café.'], ['I sleep at ten.', 'Eu durmo às dez.']]],
  ['Perguntar', [['What do you need?', 'Do que você precisa?'], ['Where do you live?', 'Onde você mora?'], ['When do we start?', 'Quando começamos?'], ['Do you speak English?', 'Você fala inglês?'], ['Can you repeat?', 'Você pode repetir?']]],
  ['Trabalho', [['I can help.', 'Eu posso ajudar.'], ['I need more time.', 'Eu preciso de mais tempo.'], ['The file is ready.', 'O arquivo está pronto.'], ['I will send it today.', 'Eu vou enviar hoje.'], ['Let me check that.', 'Deixe-me verificar isso.']]],
  ['Reparar uma conversa', [['Sorry, I did not understand.', 'Desculpe, eu não entendi.'], ['Could you speak slowly?', 'Você poderia falar devagar?'], ['What does this mean?', 'O que isso significa?'], ['Let me try again.', 'Deixe-me tentar de novo.'], ['Do you mean tomorrow?', 'Você quer dizer amanhã?']]],
  ['Conectar ideias', [['I study because I have a goal.', 'Eu estudo porque tenho um objetivo.'], ['I was tired, but I practiced.', 'Eu estava cansado, mas pratiquei.'], ['First I read, then I speak.', 'Primeiro eu leio, depois eu falo.'], ['I like it, so I use it.', 'Eu gosto disso, então eu uso.'], ['However, I need more time.', 'Porém, eu preciso de mais tempo.']]],
];

const weeks = [
  ['Dias 1–7 · destravar', 'Aprenda 20 frases sobre você e sua rotina. Grave 30 segundos por dia. Não corrija tudo: compare apenas se você conseguiu falar mais uma frase.'],
  ['Dias 8–14 · ouvir', 'Escolha um vídeo curto. Escute sem legenda, depois com legenda em inglês e finalmente repita três frases.'],
  ['Dias 15–30 · construir', 'Use to be, presente simples, perguntas e frases de reparo. Escreva cinco frases verdadeiras e leia cada uma em voz alta.'],
  ['Dias 31–45 · entender', 'Leia textos graduados e marque no máximo cinco palavras novas. Releia no dia seguinte sem abrir o dicionário primeiro.'],
  ['Dias 46–60 · falar', 'Faça áudios de dois minutos sobre trabalho, família ou um interesse. Regrave depois de corrigir só três pontos.'],
  ['Dias 61–75 · usar', 'Simule uma mensagem para cliente, uma reunião e uma apresentação. A habilidade aparece quando existe uma tarefa concreta.'],
  ['Dias 76–90 · provar', 'Monte um projeto: vídeo, currículo, apresentação ou amostra de trabalho. Compare com o áudio do primeiro dia.'],
];

const apps = [
  ['Duolingo', 'Lições curtas para criar consistência e revisar vocabulário.', 'https://www.duolingo.com/'],
  ['Anki', 'Cartões com repetição espaçada para frases que você realmente quer lembrar.', 'https://apps.ankiweb.net/'],
  ['Cake', 'Vídeos curtos com repetição de falas e prática de pronúncia.', 'https://cakeapp.me/'],
  ['ELSA Speak', 'Feedback de pronúncia e sons específicos; use o plano gratuito para testar a rotina.', 'https://elsaspeak.com/'],
  ['HelloTalk', 'Troca de mensagens com falantes; proteja seus dados e comece por texto.', 'https://www.hellotalk.com/'],
];

const sites = [
  ['BBC Learning English', 'Notícias, gramática e séries curtas com áudio e transcrição.', 'https://www.bbc.co.uk/learningenglish'],
  ['British Council LearnEnglish', 'Exercícios por nível, habilidades e situações do dia a dia.', 'https://learnenglish.britishcouncil.org/'],
  ['VOA Learning English', 'Notícias em ritmo mais lento para treinar escuta com contexto.', 'https://learningenglish.voanews.com/'],
  ['ESL Fast', 'Diálogos simples com áudio para repetir e transformar em fala.', 'https://www.eslfast.com/'],
  ['LyricsTraining', 'Prática de escuta com músicas e preenchimento de palavras.', 'https://lyricstraining.com/'],
];

const channels = [
  ['BBC Learning English', 'Aulas curtas, pronúncia e vocabulário em situações reais.', 'https://www.youtube.com/@bbclearningenglish'],
  ['Speak English With Vanessa', 'Conversas do cotidiano e frases para falar com naturalidade.', 'https://www.youtube.com/@SpeakEnglishWithVanessa'],
  ['Easy English', 'Entrevistas na rua com legendas em inglês para ouvir pessoas reais.', 'https://www.youtube.com/@EasyEnglishVideos'],
  ["Rachel's English", 'Pronúncia americana, ritmo e redução de sons explicados com clareza.', 'https://www.youtube.com/@rachelsenglish'],
  ['English with Lucy', 'Pronúncia britânica, vocabulário e explicações para nível iniciante/intermediário.', 'https://www.youtube.com/@EnglishwithLucy'],
];

const paidCourses = [
  ['Curso recomendado no Hotmart', 'Uma opção paga para quem quer aulas organizadas, comunidade e um caminho guiado. Confira ementa, suporte e política de reembolso antes de comprar.', 'https://go.hotmart.com/P105515350D?dp=1'],
  ['British Council English Online', 'Curso estruturado com aulas e professores; verifique horários e preços disponíveis para o Brasil.', 'https://englishonline.britishcouncil.org/'],
  ['Cambly', 'Conversação com professores e prática sob demanda; compare o plano com sua frequência real.', 'https://www.cambly.com/'],
  ['italki', 'Aulas individuais com professores de vários países e preços diferentes.', 'https://www.italki.com/'],
  ['Preply', 'Tutoria personalizada para metas específicas, como entrevista ou conversação.', 'https://preply.com/'],
];

function ResourceList({ title, eyebrow, items }: { title: string; eyebrow: string; items: string[][] }) {
  return (
    <section className="mt-14 scroll-mt-24">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">{eyebrow}</p>
      <h2 className="mt-2 font-playfair text-3xl font-bold md:text-5xl">{title}</h2>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {items.map(([name, description, href], index) => (
          <a key={name} href={href} target="_blank" rel="noreferrer" className="group rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-orange hover:shadow-[var(--card-shadow)]">
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

export default function EnglishLearningPage() {
  return (
    <article className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:pt-12">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Aprender inglês do zero: um plano iluminador para começar hoje',
        description: metadata.description,
        mainEntityOfPage: absoluteSiteUrl('/blog/aprender/ingles'),
        author: {
          '@type': 'Person',
          name: 'NKL_oficial',
          url: absoluteSiteUrl('/contatos'),
        },
        publisher: {
          '@type': 'Organization',
          name: 'Portal NKL',
          url: absoluteSiteUrl('/'),
        },
      }} />

      <header className="relative overflow-hidden rounded-[2rem] border border-orange/30 bg-income-surface px-5 py-10 md:px-12 md:py-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-orange/15 blur-3xl" />
        <div className="relative max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange">Aprender · guia gratuito · faça junto</p>
          <h1 className="mt-4 max-w-4xl font-playfair text-4xl font-bold leading-[1.03] md:text-7xl">Inglês não é um muro. É uma porta que abre com a primeira frase.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-foreground/75 md:text-xl">Você não precisa esperar ficar pronto. Este guia foi desenhado para você ler uma ideia, praticar imediatamente e perceber — ainda hoje — que já consegue fazer mais do que imaginava.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#agora" className="rounded-md bg-orange px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-dark">Começar agora</a>
            <a href="#plano" className="rounded-md border border-border px-5 py-3 text-sm font-bold transition hover:border-orange hover:text-orange">Ver plano de 90 dias</a>
          </div>
        </div>
      </header>

      <nav aria-label="Nesta página" className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground/55">Escolha seu próximo passo</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ['agora', 'Pratique agora'], ['fundamentos', 'O método'], ['gramatica', 'Frases úteis'],
            ['plano', 'Plano de 90 dias'], ['recursos', 'Recursos gratuitos'], ['pago', 'Cursos pagos'],
          ].map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-full border border-border px-3 py-2 text-sm font-semibold transition hover:border-orange hover:text-orange">{label}</a>)}
        </div>
      </nav>

      <section id="agora" className="mt-10 scroll-mt-24 rounded-2xl border border-neon/25 bg-neon/5 p-5 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Faça enquanto lê</p>
        <h2 className="mt-2 font-playfair text-3xl font-bold md:text-5xl">O exercício de 90 segundos</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-foreground/75">Pegue o gravador do celular e fale, sem pausar para traduzir: <strong>“My name is ___.” (Meu nome é ___.) “I live in ___.” (Eu moro em ___.) “I am learning English because ___.” (Eu estou aprendendo inglês porque ___.) “Today I will practice ___.” (Hoje eu vou praticar ___.)</strong> Não apague o áudio. Ele é a prova de que você começou.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {['Grave sem buscar perfeição', 'Ouça uma vez e anote uma melhoria', 'Repita amanhã por 90 segundos'].map((step, index) => <div key={step} className="rounded-xl border border-border bg-surface p-4"><span className="font-playfair text-3xl font-bold text-orange">0{index + 1}</span><p className="mt-2 text-sm font-semibold">{step}</p></div>)}
        </div>
      </section>

      <section id="fundamentos" className="mt-14 scroll-mt-24">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">1 · O método que ilumina</p>
        <h2 className="mt-2 font-playfair text-3xl font-bold md:text-5xl">Aprender fica leve quando você sabe o que fazer com cada palavra.</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-foreground/70">A meta não é parecer nativo. A meta é compreender um pouco mais, comunicar uma ideia e voltar amanhã com menos medo. Isso é progresso de verdade.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">{foundations.map(([title, text]) => <article key={title} className="rounded-2xl border border-border bg-surface p-5"><h3 className="font-playfair text-2xl font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-foreground/70">{text}</p></article>)}</div>
      </section>

      <section id="gramatica" className="mt-14 scroll-mt-24">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">2 · Gramática que vira fala</p>
        <h2 className="mt-2 font-playfair text-3xl font-bold md:text-5xl">Seis estruturas para usar hoje, não para decorar para sempre.</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2">        {grammar.map(([title, examples]) => <article key={title} className="rounded-xl border border-border bg-surface p-5"><h3 className="font-bold">{title}</h3><div className="mt-3 space-y-3 font-mono text-sm leading-relaxed">{examples.map(([english, portuguese]) => <BilingualPhrase key={english} english={english} portuguese={portuguese} />)}</div><p className="mt-3 text-xs leading-relaxed text-foreground/60">Agora troque uma palavra em cada frase por algo da sua vida e fale as cinco versões.</p></article>)}</div>
      </section>

      <section id="plano" className="mt-14 scroll-mt-24 rounded-2xl border border-border bg-income-surface p-5 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">3 · Um plano possível</p>
        <h2 className="mt-2 font-playfair text-3xl font-bold md:text-5xl">90 dias para sair do “um dia eu começo”.</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-foreground/70">Faça 20 minutos, cinco dias por semana: 5 minutos de revisão, 10 de contato com inglês e 5 de produção. Perdeu um dia? Retome no próximo. Consistência não é nunca falhar; é voltar.</p>
        <div className="mt-7 grid gap-3 md:grid-cols-2">{weeks.map(([title, text]) => <article key={title} className="rounded-xl border border-border bg-surface/75 p-4"><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-foreground/70">{text}</p></article>)}</div>
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-orange/25 bg-orange/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-foreground/75"><strong>Quer seguir sem montar o plano sozinho?</strong> O e-book completo organiza 100 lições prontas para executar, e você pode começar pelas 5 primeiras gratuitamente.</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/guias/ingles/ebook" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-orange px-4 py-2 text-sm font-bold text-orange hover:bg-orange hover:text-white">Ler amostra gratuita (5 lições)</Link>
            <Link href="/guias/ingles" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-orange px-4 py-2 text-sm font-bold text-white hover:bg-orange-dark">Ver e-book completo</Link>
          </div>
        </div>
      </section>

      <EnglishLearningPractice
        labels={{
          eyebrow: 'Pratique agora',
          title: 'Um treino rápido, sem nota e sem vergonha',
          description: 'Responda, leia a explicação e volte amanhã. O objetivo é identificar o próximo passo, não provar que você já sabe.',
          score: 'Acertos nesta visita',
          correct: 'Correto!',
          retry: 'Ainda não.',
        }}
      />

      <ResourceList eyebrow="4 · Pratique sem pagar" title="Cinco apps gratuitos para começar hoje" items={apps} />
      <ResourceList eyebrow="5 · Estude com contexto" title="Cinco sites para sair da tradução palavra por palavra" items={sites} />
      <ResourceList eyebrow="6 · Deixe o inglês entrar na sua sala" title="Cinco canais do YouTube para ouvir e repetir" items={channels} />

      <section id="recursos" className="mt-14 scroll-mt-24 rounded-2xl border border-neon/25 bg-neon/5 p-5 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Uma escolha inteligente</p>
        <h2 className="mt-2 font-playfair text-3xl font-bold md:text-5xl">Não baixe tudo. Escolha um recurso por habilidade.</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {['Ouvir: um vídeo de até 3 minutos', 'Falar: o gravador do celular', 'Ler: um texto graduado', 'Escrever: cinco frases verdadeiras'].map((item) => <p key={item} className="rounded-xl border border-border bg-surface p-4 text-sm font-semibold"><span className="mr-2 text-orange">✓</span>{item}</p>)}
        </div>
        <p className="mt-5 text-sm leading-relaxed text-foreground/70"><strong>Faça agora:</strong> abra apenas um dos recursos acima, marque 20 minutos no relógio e termine uma tarefa pequena. O melhor material é aquele que você usa.</p>
      </section>

      <ResourceList eyebrow="7 · Para quem pode investir" title="Cinco cursos pagos para acelerar com orientação" items={paidCourses} />
      <p className="mt-4 text-xs leading-relaxed text-foreground/55">Cursos pagos podem oferecer estrutura e feedback, mas não garantem fluência ou renda. Antes de comprar, confira ementa, preço total, renovação, suporte e reembolso. O primeiro item pode conter link de afiliado.</p>

      <section className="mt-14 grid gap-5 md:grid-cols-[1fr_0.85fr]">
        <div className="rounded-2xl border border-border bg-surface p-5 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Próximo passo concreto</p>
          <h2 className="mt-2 font-playfair text-3xl font-bold">Quando terminar esta página, faça uma entrega.</h2>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground/75"><li>Escolha uma frase deste guia.</li><li>Adapte para sua vida.</li><li>Grave e escreva a versão.</li><li>Revise amanhã.</li><li>Depois de sete dias, use em uma conversa ou mensagem.</li></ol>
        </div>
        <aside className="rounded-2xl border border-orange/30 bg-orange/5 p-5 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Quer um roteiro completo?</p>
          <h2 className="mt-3 font-playfair text-3xl font-bold">Leve este método para o e-book.</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/75">O <strong>Inglês para ganhar dinheiro</strong> reúne 100 lições, 500 exemplos coloridos, diálogos e pronúncia. Experimente as 5 primeiras lições gratuitamente ou adquira a edição completa em PDF A5 personalizado.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/guias/ingles/ebook" className="inline-flex min-h-11 items-center rounded-md border border-orange px-4 py-3 text-sm font-bold text-orange hover:bg-orange hover:text-white">Ler amostra gratuita (5 lições)</Link>
            <Link href="/guias/ingles" className="inline-flex min-h-11 items-center rounded-md bg-orange px-5 py-3 text-sm font-bold text-white hover:bg-orange-dark">Adquirir e-book completo</Link>
          </div>
        </aside>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-5 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Estude outros idiomas no Portal NKL</p>
        <h2 className="mt-2 font-playfair text-2xl font-bold md:text-3xl">Guias gratuitos de estudo em mais 5 idiomas</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/70">Explore frases funcionais, pronúncia, plano de 90 dias e exercícios práticos nas outras páginas da série:</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ['/blog/aprender/espanhol', 'Aprender Espanhol'],
            ['/blog/aprender/frances', 'Aprender Francês'],
            ['/blog/aprender/italiano', 'Aprender Italiano'],
            ['/blog/aprender/alemao', 'Aprender Alemão'],
            ['/blog/aprender/chines', 'Aprender Mandarim'],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="rounded-full border border-border bg-background px-4 py-2 text-sm font-bold transition hover:border-orange hover:text-orange">
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-orange/30 bg-income-surface p-5 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Lembrete para os dias difíceis</p>
        <h2 className="mt-2 font-playfair text-3xl font-bold md:text-4xl">Você não está atrasado. Você está construindo.</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-foreground/75">Uma frase falada hoje pode parecer pequena, mas ela reduz a distância entre você e a conversa que deseja ter. Volte amanhã e faça outra. É assim que uma habilidade muda sua autonomia.</p>
      </section>

      <AuthorBio updatedLabel="Guia editorial atualizado para o plano prático de 90 dias" />

      <section className="mt-12"><AffiliateDisclaimer /></section>
    </article>
  );
}

import type { Metadata } from 'next';
import Image from 'next/image';
import { EnglishEbookPrintControls } from '@/components/english-ebook-print-controls';
import { readEnglishEbookLessons, splitEnglishExample, tokenizeBilingualExample } from '@/lib/english-ebook';
import { absoluteSiteUrl } from '@/lib/site';
import './ebook.css';

export const metadata: Metadata = {
  title: 'E-book Inglês para ganhar dinheiro | Portal NKL',
  description: 'E-book do Portal NKL para estudar inglês com letras grandes, exercícios e um plano prático de 90 dias.',
  alternates: { canonical: absoluteSiteUrl('/guias/ingles/ebook') },
};

function PageNumber({ number }: { number: number }) {
  return <span className="ebook-page-number" aria-label={`Página ${number}`}>{String(number).padStart(3, '0')}</span>;
}

const exampleColors = ['#172235', '#2563a8', '#c76538', '#16805b', '#7b4bb7', '#9a5c14'];

function ColoredExample({ tokens }: { tokens: ReturnType<typeof tokenizeBilingualExample>['english'] }) {
  return (
    <>
      {tokens.map((token, index) => (
        token.isWord
          ? <span key={`${token.text}-${index}`} style={{ color: exampleColors[token.colorIndex] }}>{token.text}</span>
          : <span key={`${token.text}-${index}`}>{token.text}</span>
      ))}
    </>
  );
}

export default async function EnglishEbookPage() {
  const lessons = await readEnglishEbookLessons();
  const plannedPages = Math.max(12, Math.ceil(lessons.length * 0.7) + 8);

  return (
    <main className="ebook-shell">
      <EnglishEbookPrintControls />
      <p className="ebook-preview-note">
        Prévia paginada para leitura no celular e impressão em PDF · {plannedPages} páginas planejadas
      </p>

      <section className="ebook-page ebook-cover">
        <div className="ebook-cover-grid" aria-hidden="true" />
        <Image src="/NKL/NKL.png" alt="Portal NKL" width={112} height={112} className="ebook-logo" priority />
        <p className="ebook-kicker">Portal NKL · guia prático</p>
        <h1>Inglês<br /><em>para ganhar dinheiro</em></h1>
        <p className="ebook-cover-subtitle">Como transformar o inglês em mais possibilidades de estudo, trabalho e renda.</p>
        <div className="ebook-cover-rule" />
        <p className="ebook-cover-foot">Um plano simples para começar, praticar e continuar.</p>
        <PageNumber number={1} />
      </section>

      <section className="ebook-page ebook-intro">
        <p className="ebook-kicker">Antes de começar</p>
        <h2>Você não precisa saber tudo para começar.</h2>
        <p>Este e-book foi criado para ser lido no celular, com letras grandes, explicações curtas e tarefas que cabem na vida real.</p>
        <p>Use uma página por vez. Leia, fale em voz alta, escreva uma frase e volte no dia seguinte. O objetivo não é decorar tudo: é construir uma habilidade que você consiga usar.</p>
        <div className="ebook-callout">
          <strong>Uma promessa responsável</strong>
          <span>O inglês pode ampliar suas opções, mas não garante renda, emprego ou contratação. Os resultados dependem da prática, das suas habilidades, do mercado e das oportunidades disponíveis.</span>
        </div>
        <PageNumber number={2} />
      </section>

      <section className="ebook-page ebook-intro">
        <p className="ebook-kicker">Como usar este material</p>
        <h2>Seu ritmo também faz parte do plano.</h2>
        <ol className="ebook-steps">
          <li><strong>Leia uma lição.</strong> Não pule direto para a resposta.</li>
          <li><strong>Faça a tarefa.</strong> Mesmo que pareça simples demais.</li>
          <li><strong>Fale em voz alta.</strong> A boca também precisa treinar.</li>
          <li><strong>Marque seu progresso.</strong> Pequenas repetições viram confiança.</li>
        </ol>
        <p className="ebook-muted">As lições a seguir formam um caderno contínuo: cada uma tem cinco exemplos, uma explicação e uma tarefa. No PDF, o texto flui para aproveitar melhor cada página.</p>
        <PageNumber number={3} />
      </section>

      <section className="ebook-page ebook-intro ebook-toolkit">
        <p className="ebook-kicker">Seu painel de progresso</p>
        <h2>Marque cada vitória.</h2>
        <p>Faça uma lição por dia ou adapte o ritmo. O importante é voltar e deixar uma marca visível do caminho.</p>
        <div className="habit-grid">
          {Array.from({ length: 30 }, (_, index) => <span key={index}><b>{String(index + 1).padStart(2, '0')}</b><i /></span>)}
        </div>
        <PageNumber number={4} />
      </section>

      <section className="ebook-page ebook-intro">
        <p className="ebook-kicker">Ferramenta de feedback</p>
        <h2>Use uma IA como professora particular.</h2>
        <p>Copie uma frase sua e cole este prompt no Gemini, Copilot ou outra IA confiável. Nunca envie senhas, documentos ou dados pessoais.</p>
        <div className="ebook-prompt">“Corrija minha frase em inglês sem apagar minha intenção. Mostre: 1) minha frase, 2) a versão corrigida, 3) uma explicação curta em português, 4) uma alternativa natural. Frase: [cole aqui].”</div>
        <p className="ebook-muted">Peça duas versões: uma simples para iniciantes e outra mais natural. Compare, repita em voz alta e registre o erro que mais se repete.</p>
        <PageNumber number={5} />
      </section>

      <section className="ebook-page ebook-intro">
        <p className="ebook-kicker">Diálogos de mundo real</p>
        <h2>Frases ganham força quando entram em uma conversa.</h2>
        <div className="ebook-dialogue">
          <strong>Cliente e proposta</strong>
          <p><strong>Client:</strong> Could you send the proposal today?</p>
          <p><strong>You:</strong> Yes. I will review it and send it by five.</p>
          <strong>Entrevista</strong>
          <p><strong>Interviewer:</strong> Tell me about your experience.</p>
          <p><strong>You:</strong> I worked with customers and solved daily problems.</p>
          <strong>Escopo de projeto</strong>
          <p><strong>Client:</strong> Can you add one point?</p>
          <p><strong>You:</strong> Of course. I will include it in the next version.</p>
          <p className="ebook-muted">Cliente: Você poderia enviar a proposta hoje? / Você: Sim. Vou revisá-la e enviar até as cinco. / Entrevistador: Fale sobre sua experiência. / Você: Eu trabalhei com clientes e resolvi problemas diários. / Cliente: Você pode acrescentar um ponto? / Você: Claro. Vou incluí-lo na próxima versão.</p>
        </div>
        <p>Treine os dois papéis, depois troque proposta, prazo e pedido por situações da sua vida.</p>
        <PageNumber number={6} />
      </section>

      <section className="ebook-page ebook-intro">
        <p className="ebook-kicker">Templates profissionais</p>
        <h2>Copie, preencha e revise.</h2>
        <div className="ebook-template"><strong>E-mail</strong><span>Subject: Follow-up on [project]</span><span>Hello [name],</span><span>Thank you for your message. I can [action] by [date]. Please let me know if you have any questions.</span><span>Best regards,<br />[your name]</span></div>
        <div className="ebook-template"><strong>Proposta curta</strong><span>Goal: [what the client needs]</span><span>Deliverables: [what you will deliver]</span><span>Timeline: [dates]</span><span>Price: [amount]</span></div>
        <PageNumber number={7} />
      </section>

      <section className="ebook-page ebook-reading">
        <header className="ebook-reading-intro">
          <p className="ebook-kicker">Caderno de prática</p>
          <h2>Leia. Fale. Adapte. Repita.</h2>
          <p>Não passe os olhos pelos exemplos como quem lê uma lista. Escolha dois, troque as palavras por informações suas e diga as novas versões em voz alta.</p>
        </header>
        {lessons.map((lesson) => (
          <section className="ebook-lesson" key={lesson.number}>
            <header className="ebook-lesson-header">
              <span className="ebook-lesson-number">{String(lesson.number).padStart(2, '0')}</span>
              <p className="ebook-kicker">Lição {lesson.number}</p>
            </header>
            <h2>{lesson.title}</h2>
            {lesson.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {lesson.bullets[0] && <a className="ebook-audio-link" href={`https://youglish.com/pronounce/${encodeURIComponent(splitEnglishExample(lesson.bullets[0]).english)}/english`} target="_blank" rel="noreferrer">▶ Ouvir a pronúncia nativa no YouGlish</a>}
            {lesson.bullets.length > 0 && (
              <div className="ebook-examples">
                <strong>5 exemplos para falar agora</strong>
                <ol className="ebook-bullets">
                  {lesson.bullets.slice(0, 5).map((bullet) => {
                    const example = splitEnglishExample(bullet);
                    return (
                      <li key={bullet}>
                        {example.portuguese && (() => {
                          const colored = tokenizeBilingualExample(example.english, example.portuguese);
                          return <><strong className="ebook-example-english"><ColoredExample tokens={colored.english} /></strong><span className="ebook-example-portuguese"><ColoredExample tokens={colored.portuguese} /></span></>;
                        })()}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
            <div className="ebook-practice">
              <strong>Faça agora</strong>
              <span>Escolha dois exemplos, troque uma palavra por algo da sua vida e leia cada frase três vezes. Depois escreva uma versão nova sem olhar.</span>
            </div>
          </section>
        ))}
        <PageNumber number={4} />
      </section>
    </main>
  );
}

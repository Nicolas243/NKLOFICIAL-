import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Guia de Cordas | Portal NKL',
  description: 'Aprenda a ler as especificações de qualquer encordoamento do mundo e descubra exatamente o que o seu violino está pedindo.',
}

export default function GuiaDeCordasPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="text-center mb-6">
        <h1 className="font-playfair text-3xl md:text-4xl font-bold mb-2">O Guia Definitivo das Cordas</h1>
        <p className="text-base opacity-80 max-w-2xl mx-auto">
          Aprenda a ler as especificações de qualquer encordoamento do mundo e descubra exatamente o que o seu violino está pedindo.
        </p>
      </header>

      {/* Gráfico Interativo — embed Canva em JSX estrito (atributos React, nunca HTML cru) */}
      <section className="bg-surface border border-border rounded-xl overflow-hidden p-4 md:p-6">
        <h2 className="font-playfair text-2xl font-bold text-neon mb-4">Gráfico Interativo de Timbres e Cores</h2>
        <div style={{ position: 'relative', width: '100%', height: 0, paddingTop: '100%', boxShadow: '0 2px 8px 0 rgba(63,69,81,0.16)', overflow: 'hidden', willChange: 'transform' }}>
          <iframe loading="lazy" style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, border: 'none', padding: 0, margin: 0 }}
            src="https://www.canva.com/design/DAHNLJTnvC0/ss6Pg-5X2i_MW8Oi6fS5mg/view?embed" allowFullScreen allow="fullscreen" title="Gráfico de Cordas Interativo" />
        </div>
        <p className="text-center mt-4">
          <a href="https://www.canva.com/design/DAHNLJTnvC0/ss6Pg-5X2i_MW8Oi6fS5mg/view" target="_blank" rel="noopener noreferrer" className="text-neon hover:underline font-bold text-sm">
            🔗 Abrir Gráfico em Tela Cheia
          </a>
        </p>
        <p className="text-center text-sm opacity-80 mt-3">
          <em className="font-semibold text-neon font-playfair">Como ler o mapa:</em>{' '}
          O eixo vertical mostra o poder de projeção (Som Focado <em className="italic opacity-70">focused</em> vs Som Complexo <em className="italic opacity-70">complex</em>).
          O eixo horizontal mostra a “temperatura” da voz da corda (Sons Quentes <em className="italic opacity-70">warm</em> vs Sons Brilhantes <em className="italic opacity-70">brilliant</em>).
        </p>
      </section>

      {/* 1. Vocabulário do Timbre */}
      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          1. O Vocabulário do Timbre
        </h2>
        <p className="leading-relaxed opacity-90 mb-4">
          Quando os luthiers e solistas conversam sobre som, eles usam palavras que parecem abstratas. Vamos traduzir o que essas “cores” significam na prática para o seu ouvido:
        </p>
        <ul className="space-y-4">
          {[
            { icon: '🔥', title: 'Som Quente', term: 'warm', desc: 'É um som redondo, macio e aveludado, parecido com o conforto de uma voz humana mais grave. Excelente para “acalmar” violinos de fábrica que vieram com som muito estridente ou fanhoso.' },
            { icon: '✨', title: 'Som Brilhante', term: 'brilliant', desc: 'É um som claro, agudo e vibrante que soa como um sino de cristal. Ele “corta” o ar. Perfeito para “acordar” violinos mais antigos ou de madeiras muito grossas que soam abafados.' },
            { icon: '🎯', title: 'Som Focado', term: 'focused', desc: 'É um som direto, limpo e sem distrações. A nota sai exatamente como você tocou, sem muita ressonância “sobrando” no ar. Ótimo para gravar em estúdios ou para passagens rápidas de arco.' },
            { icon: '🌌', title: 'Som Complexo', term: 'complex', desc: 'O favorito dos solistas experientes. Uma única nota soa cheia de cores (harmônicos), parecendo que várias cordas estão vibrando ao mesmo tempo. É um som rico e cheio de textura.' },
          ].map((item) => (
            <li key={item.term} className="p-4 bg-black/20 border-l-3 border-neon rounded-r-md">
              <strong className="block text-lg mb-1">{item.icon} {item.title} <em className="italic text-base opacity-60">({item.term})</em></strong>
              <span className="text-sm opacity-80">{item.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 2. Ciência das Tensões — jargão de fábrica (Weich/Mittel/Stark) em itálico */}
      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          2. A Ciência das Tensões <em className="italic text-base opacity-60">tension</em>
        </h2>
        <p className="leading-relaxed opacity-90 mb-4">
          A tensão é literalmente a força com que a corda é puxada. A maioria dos músicos passa a vida toda usando tensão Média, mas mudar isso pode ser a chave que faltava:
        </p>
        <ul className="space-y-4">
          {[
            { title: 'Tensão Baixa', term: 'Weich / Light', desc: 'A corda é mais fina. Fica super macia para os dedos (ótima para quem tem dor) e responde rápido a qualquer toque leve do arco. O som fica mais aberto, porém o violino perde volume máximo.' },
            { title: 'Tensão Média', term: 'Mittel / Medium', desc: 'O feijão com arroz que funciona. É o ponto de equilíbrio perfeito desenhado pela fábrica. Se você não sabe o que o seu violino precisa, vá de Média.' },
            { title: 'Tensão Alta', term: 'Stark / Heavy', desc: 'A corda é mais grossa. Exige que sua mão esquerda aperte com mais força e o arco precisa “pesar” mais. Em troca, entrega um volume brutal. Cuidado: em violinos antigos ou muito finos, o excesso de pressão pode “sufocar” o som em vez de aumentá-lo.' },
          ].map((item) => (
            <li key={item.term} className="p-4 bg-black/20 border-l-3 border-neon rounded-r-md">
              <strong className="block text-lg mb-1">{item.title} <em className="italic text-base opacity-60">({item.term})</em></strong>
              <span className="text-sm opacity-80">{item.desc}</span>
            </li>
          ))}
        </ul>
      </section>
      {/* 3. Metais */}
      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          3. Os Metais do Revestimento <em className="italic text-base opacity-60">winding metals</em>
        </h2>
        <ul className="space-y-4">
          {([
            { icon: '⚪', title: 'Alumínio', term: 'aluminium', desc: 'O metal mais popular do mundo das cordas. Barato, leve e com brilho alegre. É o rei das cordas de estudo — mas oxida rápido se você suar muito.' },
            { icon: '🥈', title: 'Prata', term: 'silver', desc: 'Aquece e adoça o som. É a escolha clássica para as cordas Sol (G) e Ré (D) de cordas profissionais, dando aquele timbre encorpado de concerto.' },
            { icon: '⚙️', title: 'Cromo', term: 'chrome steel', desc: 'Muito duro e áspero ao toque. Usado em cordas de aço porque praticamente elimina o ruído do dedo deslizando. Som direto e sem firula.' },
            { icon: '🔩', title: 'Tungstênio', term: 'tungsten', desc: 'O metal mais pesado que existe nessa indústria. O truque dele: deixa a corda física mais fina sem perder peso — o que abre mais espaço de ressonância dentro do corpo do violino. Resposta instantânea ao arco.' },
            { icon: '🥇', title: 'Ouro', term: 'gold / Goldbrokat', desc: <>Imune à oxidação do suor. Sua fama é eliminar o apito <em className="italic">(whistling)</em> da corda Mi solta, deixando os agudos doces, puros e estáveis.</> },
          ] as Array<{ icon: string; title: string; term: string; desc: ReactNode }>).map((item) => (
            <li key={item.term} className="p-4 bg-black/20 border-l-3 border-neon rounded-r-md">
              <strong className="block text-lg mb-1">{item.icon} {item.title} <em className="italic text-base opacity-60">({item.term})</em></strong>
              <span className="text-sm opacity-80">{item.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 4. Finalização */}
      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          4. Bolinha ou Laço? <em className="italic text-base opacity-60">ball-end vs loop-end</em>
        </h2>
        <table className="w-full border-collapse bg-black/20 border border-border rounded-lg overflow-hidden">
          <thead><tr><th className="p-4 text-left text-neon border-b border-border">Finalização</th><th className="p-4 text-left text-neon border-b border-border">Como usar</th></tr></thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="p-4 font-bold">Bolinha <em className="italic opacity-60">ball-end</em></td>
              <td className="p-4 text-sm opacity-80">Cilindro de metal na ponta. É o padrão para 95% dos violinos de estudo e encaixa em afinadores de duas garras.</td>
            </tr>
            <tr>
              <td className="p-4 font-bold">Laço <em className="italic opacity-60">loop-end</em></td>
              <td className="p-4 text-sm opacity-80">Ponta vazada em forma de anel, exclusiva para micro-afinadores de gancho simples. <strong className="text-neon">Dica de Ouro:</strong> se você tentar encaixar uma corda de laço num afinador de garra dupla, o anel vai arrebentar.</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 5. Núcleo */}
      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          5. A Anatomia Interna <em className="italic text-base opacity-60">the core</em>
        </h2>
        <p className="leading-relaxed opacity-90 mb-4">
          O que fica escondido por baixo do revestimento metálico é o esqueleto da corda.
          O material do núcleo dita o comportamento geral da sua afinação e do seu timbre.
        </p>
        <table className="w-full border-collapse bg-black/20 border border-border rounded-lg overflow-hidden">
          <thead><tr><th className="p-4 text-left text-neon border-b border-border">Núcleo</th><th className="p-4 text-left text-neon border-b border-border">Comportamento</th></tr></thead>
          <tbody>
            {[
              { title: 'Tripa Natural', term: 'gut core', desc: 'Aveludada e histórica, o som dos mestres barrocos. Exige um toque sensível e sofre com mudanças de clima.' },
              { title: 'Aço Sólido / Trançado', term: 'solid / rope steel core', desc: 'Estabilidade total de afinação. Responde rápido e dura uma eternidade. A melhor amiga do estudante.' },
              { title: 'Sintéticos / Perlon', term: 'synthetic core', desc: 'Une a estabilidade do aço com a beleza de timbre da tripa. É o padrão moderno: Thomastik, Pirastro e companhia.' },
            ].map((item) => (
              <tr key={item.term} className="border-b border-border last:border-b-0">
                <td className="p-4 font-bold">{item.title} <em className="italic text-sm opacity-60">({item.term})</em></td>
                <td className="p-4 text-sm opacity-80">{item.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
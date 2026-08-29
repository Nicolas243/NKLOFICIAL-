import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guia de Cordas | Portal NKL',
  description: 'Aprenda a ler as especificacoes de qualquer encordoamento e descubra o que seu violino precisa.',
}

export default function GuiaDeCordasPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="text-center mb-6">
        <h1 className="font-playfair text-3xl md:text-4xl font-bold mb-2">O Guia Definitivo de Cordas</h1>
        <p className="text-base opacity-80 max-w-2xl mx-auto">
          Aprenda a ler as especificacoes de qualquer encordoamento do mundo e descubra o que seu violino precisa.
        </p>
      </header>

      {/* Canva embed — React JSX estrito (sem atributos HTML crus) */}
      <section className="bg-surface border border-border rounded-xl overflow-hidden">
        <div style={{ position: 'relative', width: '100%', height: 0, paddingTop: '100%', paddingBottom: 0, boxShadow: '0 2px 8px 0 rgba(63,69,81,0.16)', overflow: 'hidden', willChange: 'transform' }}>
          <iframe loading="lazy" style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, border: 'none', padding: 0, margin: 0 }}
            src="https://www.canva.com/design/DAHNLJTnvC0/ss6Pg-5X2i_MW8Oi6fS5mg/view?embed" allowFullScreen allow="fullscreen" title="Grafico de Cordas Interativo" />
        </div>
      </section>
      <p className="text-center -mt-4">
        <a href="https://www.canva.com/design/DAHNLJTnvC0/ss6Pg-5X2i_MW8Oi6fS5mg/view" target="_blank" rel="noopener noreferrer" className="text-neon hover:underline font-bold text-sm">
          Abrir Grafico de Cordas em tela cheia por Nicolas Santos
        </a>
      </p>

      {/* 1. Como Ler */}
      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          1. Como Ler um Encordoamento
        </h2>
        <p className="leading-relaxed opacity-90 mb-4">
          Olhe para qualquer embalagem de corda importada. Voce vai ver siglas como
          <em className="italic text-neon/80"> 4/4 Medium Aluminium Wound</em> ou
          <em className="italic text-neon/80"> Stark Tungsten</em>. Vamos decodificar isso.
        </p>
        <ul className="space-y-4">
          {[
            ['Tensao <em class="italic opacity-70">tension</em>','Light = dedos ageis, volume baixo. Medium = equilibrio. Heavy / Stark = projecao maxima, exige forca no arco.'],
            ['Calibres <em class="italic opacity-70">gauge</em>','Weich = macio. Mittel = medio. Stark = pesado. Dolce = doce (equivale a Light).'],
            ['Revestimento <em class="italic opacity-70">winding</em>','Wound = enrolada com metal. Plain = lisa (geralmente a corda Mi / E).'],
          ].map(([label, text]) => (
            <li key={label} className="p-4 bg-black/20 border-l-3 border-neon rounded-r-md">
              <strong className="block text-lg mb-1" dangerouslySetInnerHTML={{ __html: label }} />
              <span className="text-sm opacity-80">{text}</span>
            </li>
          ))}
        </ul>
      </section>
{/* 2. Metais */}
      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          2. Os Metais do Revestimento <em className="italic text-base opacity-60">winding metals</em>
        </h2>
        <ul className="space-y-4">
          {[
            ['Aluminio <em class="italic opacity-60">aluminium</em>','Mais comum em cordas de estudo. Barato, leve e brilhante.'],
            ['Prata <em class="italic opacity-60">silver</em>','Aquece o som. Excelente para cordas Sol (G) e Re (D), timbre doce e encorpado.'],
            ['Cromo <em class="italic opacity-60">chrome steel</em>','Muito duro e aspero. Preferido para cordas de aco. Elimina ruido de dedo.'],
            ['Tungstenio <em class="italic opacity-60">tungsten</em>','Metal pesadissimo. Corda mais fina sem perder peso. Resposta instantanea ao arco.'],
            ['Ouro <em class="italic opacity-60">gold / Goldbrokat</em>','Imune a oxidacao do suor, elimina o apito <em class="italic">whistling</em> da corda solta e deixa os agudos doces e puros.'],
          ].map(([label, text]) => (
            <li key={label} className="p-4 bg-black/20 border-l-3 border-neon rounded-r-md">
              <strong className="block text-lg mb-1" dangerouslySetInnerHTML={{ __html: label }} />
              <span className="text-sm opacity-80">{text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. Finalizacao */}
      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          3. Bolinha ou Laco? <em className="italic text-base opacity-60">ball-end vs loop-end</em>
        </h2>
        <table className="w-full border-collapse bg-black/20 border border-border rounded-lg overflow-hidden">
          <thead><tr><th className="p-4 text-left text-neon border-b border-border">Finalizacao</th><th className="p-4 text-left text-neon border-b border-border">Como usar</th></tr></thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="p-4 font-bold">Bolinha <em className="italic opacity-60">ball-end</em></td>
              <td className="p-4 text-sm opacity-85">Cilindro de metal na ponta. Padrao para 95% dos violinos de estudo. Encaixa em afinadores de duas garas.</td>
            </tr>
            <tr>
              <td className="p-4 font-bold">Laco <em className="italic opacity-60">loop-end</em></td>
              <td className="p-4 text-sm opacity-85">Ponta vazada em forma de anel. Exclusiva para micro-afinadores de gancho simples. <em className="text-neon font-bold">Dica de Ouro:</em> Se tentar colocar corda de laco num afinador de garra dupla, o anel vai arrebentar.</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 4. Nucleo */}
      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          A Anatomia Interna <em className="italic text-base opacity-60">the core</em>
        </h2>
        <p className="leading-relaxed opacity-90 mb-4">
          O que fica escondido por baixo do revestimento metalico e o esqueleto da corda.
          O material do nucleo dita o comportamento geral da sua afinacao e timbre.
        </p>
        <table className="w-full border-collapse bg-black/20 border border-border rounded-lg overflow-hidden">
          <thead><tr><th className="p-4 text-left text-neon border-b border-border">Nucleo</th><th className="p-4 text-left text-neon border-b border-border">Comportamento</th></tr></thead>
          <tbody>
            {[
              ['Tripa Natural <em class="italic opacity-60">gut core</em>','Aveludada e historica. Exige toque sensivel, fragil a mudancas de clima.'],
              ['Aco Solido / Trancado <em class="italic opacity-60">solid/rope steel core</em>','Estabilidade total. Responde rapido, dura uma eternidade. Melhor amiga do estudante.'],
              ['Sinteticos / Perlon <em class="italic opacity-60">synthetic core</em>','Unem estabilidade do aco com beleza de timbre da tripa. Mauro Calixto, Thomastik e Pirastro.'],
            ].map(([title, desc]) => (
              <tr key={title} className="border-b border-border">
                <td className="p-4 font-bold" dangerouslySetInnerHTML={{ __html: title }} />
                <td className="p-4 text-sm opacity-85">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
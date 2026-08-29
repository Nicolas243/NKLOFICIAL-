import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guia de Cordas | Portal NKL',
  description: 'Aprenda a ler as especificacoes de qualquer encordoamento.',
};

export default function GuiaDeCordasPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="text-center mb-6">
        <h1 className="font-playfair text-3xl md:text-4xl font-bold mb-2">
          O Guia Definitivo de Cordas
        </h1>
        <p className="text-base opacity-80 max-w-2xl mx-auto">
          Aprenda a ler as especificacoes de qualquer encordoamento do mundo
          e descubra o que seu violino precisa.
        </p>
      </header>

      <section className="p-4 md:p-6 bg-surface border border-border rounded-xl overflow-hidden">
        <iframe
          src="https://www.canva.com/design/DAGkbu7WIcc/view/embed"
          title="Grafico de Cordas"
          className="w-full h-[600px] border-0 rounded-lg"
          allowFullScreen
          loading="lazy"
        />
      </section>

      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          1. Como Ler um Encordoamento
        </h2>
        <p className="leading-relaxed opacity-90 mb-4">
          Olhe para qualquer embalagem de corda importada. Voce vai ver siglas como
          4/4 Medium Aluminium Wound ou Stark Tungsten. Vamos decodificar isso.
        </p>
        <ul className="space-y-4">
          {[
            ['Tensao', 'Light (leve/fraca) = Dedos ageis, volume baixo. Medium (media) = Equilibrio. Heavy/Stark (forte) = Projecao maxima.'],
            ['Calibres', 'Weich = macio. Mittel = medio. Stark = pesado/forte. Dolce = doce.'],
            ['Ferida vs Lisa', 'Wound = enrolada com metal. Plain = lisa (geralmente a corda Mi).'],
          ].map(([label, text]) => (
            <li key={label} className="p-4 bg-black/20 border-l-3 border-neon rounded-r-md">
              <strong className="block text-lg mb-1">{label}</strong>
              <span className="text-sm opacity-80">{text}</span>
            </li>
          ))}
        </ul>
      </section>
{/* Metais */}
      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          2. Os Metais (O Banho da Corda)
        </h2>
        <ul className="space-y-4">
          {[
            ['Aluminio','Mais comum em cordas de estudo. Barato, leve e brilhante.'],
            ['Prata','Aquece o som. Excelente para cordas Sol e Re.'],
            ['Cromo','Muito duro e aspero. Preferido para cordas de aco.'],
            ['Tungstenio','Metal pesadissimo. Corda mais fina sem perder peso. Resposta instantanea.'],
            ['Ouro (Goldbrokat)','Imune a oxidacao do suor, elimina o apito da corda solta.'],
          ].map(([label,text]) => (
            <li key={label} className="p-4 bg-black/20 border-l-3 border-neon rounded-r-md">
              <strong className="block text-lg mb-1">{label}</strong>
              <span className="text-sm opacity-80">{text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Bolinha ou Laco */}
      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          3. Bolinha ou Laco? (O Final da Corda)
        </h2>
        <table className="w-full border-collapse bg-black/20 border border-border rounded-lg overflow-hidden">
          <thead>
            <tr>
              <th className="p-4 text-left text-neon border-b border-border">Finalizacao</th>
              <th className="p-4 text-left text-neon border-b border-border">Como usar</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="p-4 font-bold">Bolinha (Ball-End)</td>
              <td className="p-4 text-sm opacity-85">Cilindro de metal na ponta. Padrao para 95% dos violinos de estudo.</td>
            </tr>
            <tr>
              <td className="p-4 font-bold">Laco (Loop-End)</td>
              <td className="p-4 text-sm opacity-85">Ponta vazada em forma de anel. Exclusiva para afinadores de gancho simples. <em className="text-neon">Nao misture os tipos!</em></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Nucleo */}
      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          A Anatomia Interna (O Nucleo)
        </h2>
        <table className="w-full border-collapse bg-black/20 border border-border rounded-lg overflow-hidden">
          <thead>
            <tr>
              <th className="p-4 text-left text-neon border-b border-border">Nucleo</th>
              <th className="p-4 text-left text-neon border-b border-border">Comportamento</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Tripa Natural','Aveludada e historica. Fragil a mudancas de clima.'],
              ['Aco Solido/Trancado','Estabilidade total. Responde rapido, dura eternidade.'],
              ['Sinteticos / Perlon','Equilibrio entre tripa e aco. Marcas nacionais como Mauro Calixto.'],
            ].map(([title,desc]) => (
              <tr key={title} className="border-b border-border">
                <td className="p-4 font-bold">{title}</td>
                <td className="p-4 text-sm opacity-85">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
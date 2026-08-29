import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fisica do Som | Portal NKL',
  description: 'Da crina do arco ate o ouvido: compreenda o milagre mecanico e acustico que da vida ao violino.',
};

export default function FisicaDoSomPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="text-center mb-6">
        <h1 className="font-playfair text-3xl md:text-4xl font-bold mb-2">
          A Jornada da Vibracao
        </h1>
        <p className="text-base opacity-80 max-w-2xl mx-auto">
          Da crina do arco ate o ouvido: compreenda o milagre mecanico e acustico que da vida ao violino.
        </p>
      </header>

      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          1. O Gatilho: A Crina e o Breu
        </h2>
        <p className="leading-relaxed opacity-90 mb-4">
          Tudo comeca no nivel microscopico. Diferente de um fio de nylon liso, a crina
          do cavalo e repleta de minusculas &ldquo;escamas&rdquo; ao longo de sua estrutura.
          Quando passamos o breu (que e uma resina solida), os pequenos graos desse po se
          alojam sob essas escamas, agindo como verdadeiras <strong>cunhas</strong> que as
          deixam ericadas, quase na vertical.
        </p>
        <p className="leading-relaxed opacity-90">
          Quando voce passa o arco, essas escamas &ldquo;esbarram&rdquo; e agarram a corda,
          puxando-a para o lado. A corda resiste ate nao aguentar mais e escorrega de volta.
          E esse ciclo frenetico de agarrar e soltar (efeito <em>Stick-Slip</em>) que faz a
          corda pular como se estivesse em uma brincadeira de &ldquo;pular corda&rdquo; em
          camera hiper lenta.
        </p>
      </section>

      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          2. O Filtro Mecanico: O Cavalete
        </h2>
        <p className="leading-relaxed opacity-90 mb-4">
          A corda vibrando no ar faz um som muito fraco. E aqui que entra a engenharia do
          cavalete. Ele absorve a vibracao caotica da corda e a &ldquo;filtra&rdquo; atraves
          do seu formato esculpido (os coracoes e os rins cortados na madeira nao sao so
          enfeite, eles regulam frequencias!).
        </p>
        <p className="leading-relaxed opacity-90">
          O cavalete atua como um pistao, transferindo toda essa energia limpa e organizada
          diretamente para o tampo superior do violino.
        </p>
      </section>

      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          3. A Caixa Toracica e o Sopro de Vida
        </h2>
        <p className="leading-relaxed opacity-90 mb-4">
          Com o tampo, as laterais (faixas) e o fundo do violino vibrando violentamente, o
          corpo do instrumento comeca a funcionar como o cone de um alto-falante. Essa
          madeira pulsante faz com que a <strong>massa de ar interna</strong> do violino
          tambem vibre.
        </p>
        <p className="leading-relaxed opacity-90">
          Esse ar pressurizado e cheio de energia acustica precisa escapar. E ai que ele e
          ejetado pelos orificios em formato de &ldquo;f&rdquo; (os <em>F-holes</em>, que
          evoluram matematicamente durante seculos de lutheria para projetar o som com a
          maxima eficiencia aerodinamica). Esse ar vibrante atinge seus timpanos, e voce
          ouve a musica.
        </p>
      </section>
    </div>
  );
}
import type { Metadata } from 'next';
import FisicaExpandSection from './fisica-expand-section';

export const metadata: Metadata = {
  title: 'Fisica do Som | Portal NKL',
  description: 'Da crina do arco ate o ouvido: compreenda o milagre mecanico e acustico que da vida ao violino.',
};

const SECTIONS = [
  {
    id: 'crina-breu',
    title: '1. O Gatilho: A Crina e o Breu',
    paragraphs: [
      'Tudo comeca no nivel microscopico. Diferente de um fio de nylon liso, a crina do cavalo e repleta de minusculas &ldquo;escamas&rdquo; ao longo de sua estrutura. Quando passamos o breu (que e uma resina solida), os pequenos graos desse po se alojam sob essas escamas, agindo como verdadeiras <strong>cunhas</strong> que as deixam ericadas, quase na vertical.',
      'Quando voce passa o arco, essas escamas &ldquo;esbarram&rdquo; e agarram a corda, puxando-a para o lado. A corda resiste ate nao aguentar mais e escorrega de volta. E esse ciclo frenetico de agarrar e soltar (efeito <em>Stick-Slip</em>) que faz a corda pular como se estivesse em uma brincadeira de &ldquo;pular corda&rdquo; em camera hiper lenta.',
    ],
    formula: 'Atrito dinamico de Coulomb: F_atrito = \\u03BC_k \\u00D7 N. A crina com breu alterna entre \\u03BC_s (estatico, ~0.8) e \\u03BC_k (cinetico, ~0.4), gerando o ciclo stick-slip que excita a corda com frequencia dominante f = (1/2L) \\u00D7 \\u221A(T/\\u03BC).',
    image: '/NKL/',
  },
  {
    id: 'cavalete',
    title: '2. O Filtro Mecanico: O Cavalete',
    paragraphs: [
      'A corda vibrando no ar faz um som muito fraco. E aqui que entra a engenharia do cavalete. Ele absorve a vibracao caotica da corda e a &ldquo;filtra&rdquo; atraves do seu formato esculpido (os coracoes e os rins cortados na madeira nao sao so enfeite, eles regulam frequencias!).',
      'O cavalete atua como um pistao, transferindo toda essa energia limpa e organizada diretamente para o tampo superior do violino.',
    ],
    formula: 'Funcao de transferencia mecanica H(\\u03C9) = F_saida / F_entrada. O cavalete suprime modos acima de 3 kHz (\"ponte de Wolf\") e acopla a vibracao da corda ao tampo com impedancia casada Z_corda \\u2248 Z_tampo.',
    image: '/NKL/',
  },
  {
    id: 'caixa-toracica',
    title: '3. A Caixa Toracica e o Sopro de Vida',
    paragraphs: [
      'Com o tampo, as laterais (faixas) e o fundo do violino vibrando violentamente, o corpo do instrumento comeca a funcionar como o cone de um alto-falante. Essa madeira pulsante faz com que a <strong>massa de ar interna</strong> do violino tambem vibre.',
      'Esse ar pressurizado e cheio de energia acustica precisa escapar. E ai que ele e ejetado pelos orificios em formato de &ldquo;f&rdquo; (os <em>F-holes</em>, que evoluram matematicamente durante seculos de lutheria para projetar o som com a maxima eficiencia aerodinamica). Esse ar vibrante atinge seus timpanos, e voce ouve a musica.',
    ],
    formula: 'Equacao de Helmholtz para ressonador: f_0 = (c / 2\\u03C0) \\u00D7 \\u221A(A / V\\u00B7L_ef). O volume interno V \\u2248 2.0 L, area dos f-holes A \\u2248 8 cm\\u00B2, comprimento efetivo L_ef \\u2248 5 mm, resultando em f_0 \\u2248 280 Hz (proximo do D\\u2084).',
    image: '/NKL/',
  },
];

export default function FisicaDoSomPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="text-center mb-6">
        <h1 className="font-playfair text-3xl md:text-4xl font-bold mb-2 text-neon">
          A Jornada da Vibracao
        </h1>
        <p className="text-base opacity-80 max-w-2xl mx-auto">
          Da crina do arco ate o ouvido: compreenda o milagre mecanico e acustico que da vida ao violino.
        </p>
      </header>

      {SECTIONS.map((section) => (
        <FisicaExpandSection key={section.id} section={section} />
      ))}
    </div>
  );
}
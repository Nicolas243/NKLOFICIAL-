import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Clinica de Lutheria | Portal NKL',
  description: 'O Cuidado Oculto por tras da Voz do Instrumento.',
};

type Section = {
  title: string;
  image: string;
  paragraphs: string[];
};

const SECTIONS: Section[] = [
  {
    title: 'O Cavalete: O Coracao da Transmissao do Som',
    image: '/NKL/violino3.webp',
    paragraphs: [
      'Muitos violinistas iniciantes acreditam que o cavalete serve apenas como um suporte passivo para segurar as cordas no lugar. Mas a verdade e muito mais profunda. Ele atua como um verdadeiro conversor de energia fisica em ondas acusticas. Quando o seu arco fricciona a corda, o cavalete faz um movimento continuo de micro-alavanca na madeira do tampo. Se ele estiver encurvado ou fora do angulo correto de 90 graus em relacao a face do instrumento, o som simplesmente “trava”. Ajustar os pes do cavalete para que eles fiquem perfeitamente colados no tampo e o segredo dos profissionais para liberar harmonicos que voce nem sabia que seu instrumento tinha.',
    ],
  },
  {
    title: 'A Alma: Onde o Equilibrio se Torna Arte',
    image: '/NKL/violino4.webp',
    paragraphs: [
      'Dentro do violino existe uma pequena estaca cilindrica de madeira que chamamos carinhosamente de “Alma”. Esse nome nao e por acaso: ela literalmente dita a personalidade do instrumento. Localizada estrategicamente logo atras do pe direito do cavalete, ela funciona como um ponto de apoio dinamico que impede que as ondas sonoras se cancelem dentro da caixa. Musicos experientes sabem que mover a alma menos de 1mm para frente, para tras ou para os lados pode transformar completamente a projecao das notas. Um ajuste fino na alma pode deixar o som mais doce e aveludado para uma sala de camara, ou extremamente focado e agressivo para solar em um grande teatro.',
    ],
  },
  {
    title: 'O Estandarte: Tensao, Estetica e Afinacao Estavel',
    image: '/NKL/violino5.webp',
    paragraphs: [
      'O estandarte e a peca que segura as cordas na extremidade oposta ao cavalete, e sua funcao vai alem da fixacao. O angulo formado entre a corda e o tampo, definido pela altura do estandarte e pela posicao do cavalete, influencia diretamente a pressao exercida sobre o tampo — e, portanto, a resposta e o volume do instrumento.',
      'Na troca de estandarte, o luthier avalia o tipo (fixo ou com afinadores embutidos), o material (ebano, buxo ou rosewood) e o comprimento da corda vibrante. Um estandarte mal posicionado causa desafinacao constante e pode ate comprometer a estrutura do tampo. Estandartes com afinadores integrados reduzem o comprimento livre das cordas e deixam o som mais seco — um detalhe decisivo para quem toca com ou sem barras finas no Mi.',
    ],
  },
  {
    title: 'O Rabicho: O Ancoramento silencioso',
    image: '/NKL/Violino2.webp',
    paragraphs: [
      'O rabicho (ou cordal) e o elo final da cadeia de transmissao: ele ancora as cordas ao instrumento atraves do loop de nylon que se enrola no botao inferior. Embora discreto, ele participa do equilibrio total de tensao do violino — rabichos mais pesados adicionam massa na regiao grave e tendem a escurecer o timbre, enquanto modelos leves preservam o brilho natural.',
      'Na troca de rabicho, sao avaliados o ajuste do loop (que deve ficar firme, sem folgas), o alinhamento das cordas entre o cavalete e o estandarte e o estado do botao e da guia interna. Um rabicho mal instalado pode afrouxar sob tensao e riscar o verniz do tampo — um reparo simples, mas que exige critério de profissional.',
    ],
  },
];

export default function ClinicaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="text-center mb-6">
        <h1 className="font-playfair text-3xl md:text-4xl font-bold mb-2">
          O Cuidado Oculto por tras da Voz do Instrumento
        </h1>
        <p className="text-base opacity-80 max-w-2xl mx-auto">
          Seja bem-vindo a nossa oficina. Aqui, nos cuidamos de cada milimetro de madeira
          para que voce se preocupe apenas com a sua musica.
        </p>
      </header>

      {SECTIONS.map((section) => (
        <section
          key={section.title}
          className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors flex flex-col gap-5"
        >
          <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-1">
            {section.title}
          </h2>

          {/* Tarefa 8 — imagem representativa do componente */}
          <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-border/40">
            <Image
              src={section.image}
              alt={section.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>

          {section.paragraphs.map((paragraph, index) => (
            <p key={index} className="leading-relaxed opacity-90">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}

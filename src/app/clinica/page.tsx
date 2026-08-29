import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clinica de Lutheria | Portal NKL',
  description: 'O Cuidado Oculto por tras da Voz do Instrumento.',
};

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

      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          O Cavalete: O Coracao da Transmissao do Som
        </h2>
        <p className="leading-relaxed opacity-90">
          Muitos violinistas iniciantes acreditam que o cavalete serve apenas como um suporte
          passivo para segurar as cordas no lugar. Mas a verdade e muito mais profunda. Ele atua
          como um verdadeiro conversor de energia fisica em ondas acusticas. Quando o seu arco
          fricciona a corda, o cavalete faz um movimento continuo de micro-alavanca na madeira do
          tampo. Se ele estiver encurvado ou fora do angulo correto de 90 graus em relacao a face
          do instrumento, o som simplesmente &ldquo;trava&rdquo;. Ajustar os pes do cavalete para
          que eles fiquem perfeitamente colados no tampo e o segredo dos profissionais para liberar
          harmonicos que voce nem sabia que seu instrumento tinha.
        </p>
      </section>

      <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
        <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
          A Alma: Onde o Equilibrio se Torna Arte
        </h2>
        <p className="leading-relaxed opacity-90">
          Dentro do violino existe uma pequena estaca cilindrica de madeira que chamamos
          carinhosamente de &ldquo;Alma&rdquo;. Esse nome nao e por acaso: ela literalmente dita
          a personalidade do instrumento. Localizada estrategicamente logo atras do pe direito do
          cavalete, ela funciona como um ponto de apoio dinamico que impede que as ondas sonoras
          se cancelem dentro da caixa. Musicos experientes sabem que mover a alma menos de 1mm
          para frente, para tras ou para os lados pode transformar completamente a projecao das
          notas. Um ajuste fino na alma pode deixar o som mais doce e aveludado para uma sala de
          camara, ou extremamente focado e agressivo para solar em um grande teatro.
        </p>
      </section>
    </div>
  );
}
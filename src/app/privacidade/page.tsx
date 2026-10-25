import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Como o Portal NKL trata dados pessoais, cookies e direitos dos titulares.',
};

export default function PrivacidadePage() {
  return (
    <main className="max-w-3xl w-full mx-auto px-4 pt-8 pb-12">
      <article className="space-y-7 text-sm leading-relaxed">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-neon font-bold">Conformidade</p>
          <h1 className="font-playfair text-3xl font-bold mt-2">Política de Privacidade</h1>
          <p className="mt-3 opacity-70">Esta política explica, de forma objetiva, como o Portal NKL trata dados pessoais em suas áreas musicais e de oportunidades.</p>
        </header>
        <section>
          <h2 className="font-playfair text-2xl font-bold">1. Compromisso com a LGPD</h2>
          <p className="mt-2 opacity-85">Tratamos dados pessoais de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), observando finalidade, necessidade, transparência, segurança e prevenção. Os dados são utilizados somente para operar, proteger e melhorar os serviços compatíveis com a finalidade informada.</p>
        </section>
        <section>
          <h2 className="font-playfair text-2xl font-bold">2. Dados coletados e finalidades</h2>
          <p className="mt-2 opacity-85">Podemos coletar dados de cadastro, contato, preferências, registros de acesso e informações enviadas voluntariamente em formulários. Esses dados podem ser usados para autenticação, atendimento, publicação de perfis, avaliações, comunicações solicitadas, segurança e cumprimento de obrigações legais.</p>
        </section>
        <section>
          <h2 className="font-playfair text-2xl font-bold">3. Cookies e identificadores técnicos</h2>
          <p className="mt-2 opacity-85">Utilizamos cookies necessários para sessão, preferências e segurança. Ao avaliar uma oportunidade, um identificador técnico protegido pode ser armazenado para reduzir avaliações duplicadas. Esse identificador não é exibido publicamente como identidade do avaliador e não substitui os controles de segurança aplicáveis.</p>
        </section>
        <section>
          <h2 className="font-playfair text-2xl font-bold">4. Compartilhamento e terceiros</h2>
          <p className="mt-2 opacity-85">Podemos utilizar provedores de infraestrutura, autenticação, banco de dados e pagamentos para operar a plataforma. Links de afiliados levam a serviços de terceiros, que possuem suas próprias políticas e responsabilidades. Não vendemos dados pessoais.</p>
        </section>
        <section>
          <h2 className="font-playfair text-2xl font-bold">5. Direitos do titular</h2>
          <p className="mt-2 opacity-85">O titular pode solicitar confirmação de tratamento, acesso, correção, anonimização, eliminação quando aplicável, portabilidade, informação sobre compartilhamentos e revisão de consentimentos, conforme a legislação. Usuários autenticados também podem exportar seus dados em JSON e iniciar a anonimização nos dashboards de Aluno e Professor. Para outras solicitações, utilize a página de <Link href="/contatos" className="text-neon font-bold hover:underline">Contatos</Link>.</p>
        </section>
      </article>
    </main>
  );
}

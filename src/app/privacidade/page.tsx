import type { Metadata } from 'next';
import Link from 'next/link';
import { PrivacyPreferencesButton } from '@/components/privacy-preferences-button';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Como o Portal NKL trata dados pessoais, cookies e direitos dos titulares.',
};

const lastUpdated = '4 de novembro de 2026';

export default function PrivacidadePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-8 pb-12">
      <article className="mx-auto max-w-3xl space-y-7 text-sm leading-relaxed">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-neon font-bold">Conformidade</p>
          <h1 className="font-playfair text-3xl font-bold mt-2">Política de Privacidade</h1>
          <p className="mt-3 opacity-70">Versão 1.1 · última atualização: {lastUpdated}</p>
          <p className="mt-3 opacity-85">
            Esta política explica como o Portal NKL trata dados pessoais em suas áreas musicais,
            profissionais e de oportunidades de renda extra.
          </p>
        </header>

        <section>
          <h2 className="font-playfair text-2xl font-bold">1. Quem controla os dados</h2>
          <p className="mt-2 opacity-85">
            O Portal NKL, operado pelo responsável pelo site, atua como controlador dos dados
            tratados dentro da plataforma. O canal para solicitações de privacidade é{' '}
            <a href="mailto:contato.nikoluthieria@gmail.com" className="text-neon font-bold hover:underline">
              contato.nikoluthieria@gmail.com
            </a>
            . Esse canal também recebe pedidos destinados ao encarregado pelo tratamento de dados.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">2. Dados, finalidade e base legal</h2>
          <p className="mt-2 opacity-85">
            Podemos tratar nome, e-mail, telefone, cidade, perfil profissional, dados de acesso,
            avaliações, mensagens enviadas ao suporte, informações de pagamento necessárias à
            conciliação e registros técnicos. Usamos esses dados para criar e proteger contas,
            exibir perfis solicitados, intermediar contatos, moderar conteúdo, processar serviços,
            responder solicitações, cumprir obrigações legais e prevenir fraude.
          </p>
          <p className="mt-2 opacity-85">
            As bases legais podem incluir execução de contrato ou de procedimentos preliminares,
            cumprimento de obrigação legal, exercício regular de direitos, legítimo interesse
            proporcional e consentimento, especialmente para comunicações e recursos não essenciais.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">3. Cookies, armazenamento e consentimento</h2>
          <p className="mt-2 opacity-85">
            Cookies e armazenamento local estritamente necessários podem manter sessão, segurança,
            preferências, instalação do web app e prevenção de avaliações duplicadas. O Portal
            também usa um armazenamento local para registrar sua escolha sobre recursos não
            essenciais. Google Analytics e Google AdSense só são carregados após a opção “Aceitar
            não essenciais”; é possível recusar sem perder o acesso ao conteúdo.
          </p>
          <p className="mt-2 opacity-85">
            O navegador também pode receber cookies de terceiros quando você aceita recursos de
            medição ou publicidade. Consulte as políticas do Google para entender esses tratamentos
            e altere sua decisão a qualquer momento por meio do botão abaixo.
          </p>
          <p className="mt-3"><PrivacyPreferencesButton /></p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">4. Compartilhamento e transferências</h2>
          <p className="mt-2 opacity-85">
            Compartilhamos o mínimo necessário com provedores que hospedam banco, autenticação,
            armazenamento, e-mail, formulários, pagamentos, monitoramento e infraestrutura. Esses
            fornecedores atuam conforme suas próprias condições e podem processar dados fora do
            Brasil, com salvaguardas contratuais e técnicas aplicáveis.
          </p>
          <p className="mt-2 opacity-85">
            Links de afiliados e oportunidades levam a plataformas independentes. Ao sair do
            Portal NKL, o tratamento passa a seguir a política do terceiro. Não vendemos dados
            pessoais e não compartilhamos contatos para marketing de terceiros sem base legal.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">5. Retenção e segurança</h2>
          <p className="mt-2 opacity-85">
            Mantemos dados pelo tempo necessário à finalidade, à prestação do serviço, à defesa de
            direitos e às obrigações legais. Aplicamos controle de acesso, validação server-side,
            limitação de requisições, segregação de permissões e proteção dos segredos de integração.
            Nenhum serviço conectado à internet é completamente livre de riscos; incidentes
            relevantes serão tratados e comunicados conforme a legislação aplicável.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">6. Direitos do titular</h2>
          <p className="mt-2 opacity-85">
            Você pode solicitar confirmação, acesso, correção, anonimização, eliminação quando
            aplicável, portabilidade, informações sobre compartilhamentos e revisão de consentimento.
            Responderemos no prazo legal, após confirmar a identidade quando necessário. Usuários
            autenticados podem exportar dados e solicitar a anonimização no painel de privacidade.
            Para exercer direitos, use a página de <Link href="/contatos" className="text-neon font-bold hover:underline">Contatos</Link> ou o e-mail acima.
          </p>
        </section>

        <section>
          <h2 className="font-playfair text-2xl font-bold">7. Crianças, alterações e contato</h2>
          <p className="mt-2 opacity-85">
            O Portal não é direcionado a crianças e não solicita intencionalmente dados de menores
            sem a participação do responsável legal. Podemos atualizar esta política para refletir
            mudanças legais ou operacionais; a versão vigente será publicada nesta página com a
            data de atualização.
          </p>
        </section>
      </article>
    </main>
  );
}

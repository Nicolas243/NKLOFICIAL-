import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ExportDataButton, DeleteAccountButton } from '@/components/privacy-actions';

export const metadata = {
  title: 'Privacidade e Dados | Portal NKL',
};

export default async function PrivacidadePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="font-playfair text-3xl font-bold mb-2">Privacidade e Dados</h1>
        <p className="text-sm opacity-70">
          Controle total sobre suas informações pessoais, conforme a LGPD (Lei 13.709/2018).
        </p>
      </header>

      <section className="p-6 bg-surface border border-border rounded-xl space-y-3">
        <h2 className="font-playfair text-xl font-bold">Exportar Meus Dados</h2>
        <p className="text-sm opacity-70">
          Baixe uma cópia completa dos seus dados: perfil, favoritos, avaliações e notificações,
          em formato JSON portável.
        </p>
        <ExportDataButton />
      </section>

      <section className="p-6 border border-red-500/40 rounded-xl space-y-3 bg-surface">
        <h2 className="font-playfair text-xl font-bold text-red-500">Zona de Risco</h2>
        <p className="text-sm opacity-70">
          A exclusão da conta anonimiza seu nome, e-mail, cidade, biografia e dados comerciais.
          Seu histórico de avaliações é mantido de forma anônima para preservar a integridade da
          comunidade.
        </p>
        <DeleteAccountButton />
      </section>
    </div>
  );
}

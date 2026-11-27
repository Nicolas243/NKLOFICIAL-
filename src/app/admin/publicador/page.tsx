import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { SocialPublisherStudio } from '@/components/admin/social-publisher-studio';
import { getChannelConnectionStatus } from '../../../../tools/social-publisher/validators';

export const metadata = {
  title: 'Publicador Multiplataforma | Admin Portal NKL',
};

export default async function AdminSocialPublisherPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect('/');
  }

  const [profile] = await db
    .select({ role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  const isAdmin = profile?.role === 'admin';
  const connectionStatus = isAdmin ? getChannelConnectionStatus(process.env) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-neon">
            Administração · Distribuição Oficial
          </p>
          <h1 className="mt-1 font-playfair text-3xl font-bold">
            Publicador Multiplataforma de Vídeos
          </h1>
          <p className="mt-1 text-sm opacity-75">
            Prepare legendas por rede, confira limites de texto e vídeo e gere o job.json para rodar em simulação ou envio real via CLI.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs">
            Perfil: <strong className="text-neon">{profile?.role ?? 'user'}</strong>
          </span>
          <Link
            href="/admin"
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-bold hover:border-neon"
          >
            Voltar ao Admin
          </Link>
        </div>
      </div>

      {!isAdmin ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="font-medium text-red-400">Acesso restrito a administradores.</p>
          <p className="mt-2 text-sm opacity-70">
            Esta área exige perfil de administrador para consultar credenciais conectadas e montar pacotes de publicação.
          </p>
        </div>
      ) : (
        <SocialPublisherStudio connectionStatus={connectionStatus} />
      )}
    </div>
  );
}

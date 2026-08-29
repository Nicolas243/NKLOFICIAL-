import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserNotifications, markAllAsRead } from '@/actions/notifications';

export const metadata = {
  title: 'Notificações | Portal NKL',
};

const TYPE_LABELS: Record<string, string> = {
  lead_received: 'Lead',
  review_received: 'Avaliação',
  system_alert: 'Sistema',
};

export default async function NotificacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) redirect('/login');

  const notifications = await getUserNotifications();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl w-full mx-auto px-4 pt-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-playfair text-3xl font-bold">Notificações</h1>
        {unreadCount > 0 && (
          <form action={markAllAsRead}>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold border border-neon text-neon rounded-md hover:bg-neon hover:text-black transition-colors"
            >
              Marcar todas como lidas
            </button>
          </form>
        )}
      </div>
      <p className="text-sm opacity-70 mb-8">
        {unreadCount > 0
          ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
          : 'Você está em dia com todas as notificações.'}
      </p>

      <div className="flex flex-col gap-3">
        {notifications.map((item) => (
          <article
            key={item.id}
            className={`p-5 rounded-xl border ${item.isRead ? 'bg-surface border-border' : 'bg-border/40 border-neon/40'}`}
          >
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neon">
                  {TYPE_LABELS[item.type] ?? 'Notificação'}
                </span>
                {!item.isRead && (
                  <span className="w-2 h-2 rounded-full bg-neon" aria-label="Não lida" />
                )}
              </div>
              <span className="text-xs opacity-60">
                {new Date(item.createdAt).toLocaleString('pt-BR')}
              </span>
            </div>
            <h2 className="font-bold text-base">{item.title}</h2>
            <p className="text-sm opacity-80 mt-1">{item.message}</p>
            {item.relatedId && (
              <div className="mt-3">
                <Link
                  href={`/luthiers/${item.relatedId}`}
                  className="text-xs text-neon hover:underline"
                >
                  Ver perfil do profissional →
                </Link>
              </div>
            )}
          </article>
        ))}

        {notifications.length === 0 && (
          <p className="text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
            Nenhuma notificação ainda.
          </p>
        )}
      </div>
    </div>
  );
}
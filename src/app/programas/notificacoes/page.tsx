import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NotificationsPage } from '@/components/notifications/notifications-page';

export const metadata = {
  title: 'Notificações de Renda Extra',
};

export default async function IncomeNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) redirect('/login?next=/programas/notificacoes&area=income');

  return <NotificationsPage />;
}

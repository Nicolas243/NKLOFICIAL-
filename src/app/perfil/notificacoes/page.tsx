import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NotificationsPage } from '@/components/notifications/notifications-page';

export const metadata = {
  title: 'Notificações | Portal NKL',
};

export default async function NotificacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) redirect('/login');

  return (
    <NotificationsPage />
  );
}
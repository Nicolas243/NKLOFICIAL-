import type { SupabaseClient, User } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/email/resend';
import { SITE_URL } from '@/lib/site';

type WelcomeArea = 'income' | 'music';

export async function sendWelcomeEmailOnce(
  supabase: SupabaseClient,
  user: User,
  area: WelcomeArea,
): Promise<'preview' | 'sent' | 'already_sent'> {
  if (user.user_metadata?.nkl_welcome_email_sent === true) return 'already_sent';

  const result = await sendWelcomeEmail({
    recipientEmail: user.email ?? '',
    recipientName: user.user_metadata?.full_name ?? user.user_metadata?.name,
    area,
    siteUrl: SITE_URL,
  });

  const { error } = await supabase.auth.updateUser({
    data: {
      nkl_welcome_email_sent: true,
      nkl_welcome_email_delivery: result,
    },
  });
  if (error) throw new Error(`Falha ao registrar boas-vindas: ${error.message}`);

  return result;
}

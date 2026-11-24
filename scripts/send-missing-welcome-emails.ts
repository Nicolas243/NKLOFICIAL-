import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/email/resend';
import { SITE_URL } from '@/lib/site';

loadEnv({ path: '.env.local', override: false });

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const shouldSend = args.has('--send');
  const isDryRun = args.has('--dry-run') || !shouldSend;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) {
    throw new Error(`Falha ao listar usuários no Supabase Auth: ${error.message}`);
  }

  const users = data?.users ?? [];
  const pending = users.filter(
    (user) =>
      Boolean(user.email_confirmed_at) &&
      Boolean(user.email?.trim()) &&
      user.user_metadata?.nkl_welcome_email_sent !== true,
  );

  console.log(
    JSON.stringify({
      mode: shouldSend ? 'send' : 'dry-run',
      totalUsers: users.length,
      confirmedPendingWelcome: pending.length,
    }),
  );

  if (isDryRun || pending.length === 0) {
    return;
  }

  process.env.EMAIL_DELIVERY_MODE = 'resend';

  let sentCount = 0;
  let failedCount = 0;

  for (const user of pending) {
    const recipientEmail = user.email?.trim();
    if (!recipientEmail) continue;

    const areaRaw = user.user_metadata?.preferred_area;
    const area: 'income' | 'music' = areaRaw === 'music' ? 'music' : 'income';
    const recipientName =
      typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === 'string'
          ? user.user_metadata.name
          : null;

    try {
      const delivery = await sendWelcomeEmail({
        recipientEmail,
        recipientName,
        area,
        siteUrl: SITE_URL,
      });

      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata ?? {}),
          nkl_welcome_email_sent: true,
          nkl_welcome_email_delivery: delivery,
          nkl_welcome_email_sent_at: new Date().toISOString(),
        },
      });

      if (updateError) {
        failedCount += 1;
        console.error(`Metadata update failed for user index ${sentCount + failedCount}: ${updateError.message}`);
      } else {
        sentCount += 1;
      }
    } catch (sendError) {
      failedCount += 1;
      console.error(
        `Welcome send failed for user index ${sentCount + failedCount}:`,
        sendError instanceof Error ? sendError.message : 'erro desconhecido',
      );
    }

    await delay(250);
  }

  console.log(
    JSON.stringify({
      finished: true,
      sent: sentCount,
      failed: failedCount,
    }),
  );

  if (failedCount > 0) {
    process.exitCode = 1;
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Erro desconhecido no backfill.');
  process.exit(1);
});

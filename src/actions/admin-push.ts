'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/db';
import { notifications, pushSubscriptions, userProfiles } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';

const APP_SCOPES = ['all', 'portal', 'renda-extra', 'musica', 'idiomas', 'ia'] as const;

const dispatchSchema = z.object({
  appScope: z.enum(APP_SCOPES),
  title: z.string().trim().min(3).max(160),
  message: z.string().trim().min(5).max(1200),
});

export async function dispatchSubAppNotification(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error('Autenticação obrigatória.');
  }

  const [profile] = await db
    .select({ role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  if (profile?.role !== 'admin') {
    throw new Error('Apenas administradores podem enviar notificações.');
  }

  const parsed = dispatchSchema.safeParse({
    appScope: formData.get('appScope'),
    title: formData.get('title'),
    message: formData.get('message'),
  });

  if (!parsed.success) {
    throw new Error('Preencha área, título e mensagem válidos.');
  }

  const { appScope, title, message } = parsed.data;

  let targetUserIds: string[] = [];
  if (appScope === 'all') {
    const subs = await db
      .select({ userId: pushSubscriptions.userId })
      .from(pushSubscriptions);
    targetUserIds = Array.from(new Set(subs.map((row) => row.userId)));
    if (targetUserIds.length === 0) {
      const profiles = await db.select({ id: userProfiles.id }).from(userProfiles);
      targetUserIds = profiles.map((row) => row.id);
    }
  } else {
    const subs = await db
      .select({ userId: pushSubscriptions.userId })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.appScope, appScope));
    targetUserIds = Array.from(new Set(subs.map((row) => row.userId)));
  }

  if (targetUserIds.length > 0) {
    await db.insert(notifications).values(
      targetUserIds.map((targetUserId) => ({
        userId: targetUserId,
        type: `app:${appScope}`.slice(0, 30),
        title,
        message,
      })),
    );
  }

  revalidatePath('/admin');
  revalidatePath('/perfil/notificacoes');
}

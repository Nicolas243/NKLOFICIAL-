'use server';

import { revalidatePath } from 'next/cache';
import { and, count, desc, eq } from 'drizzle-orm';
import * as webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { notifications, pushSubscriptions } from '@/db/schema';
import { isUuid } from '@/lib/uuid';
import { getServerPushConfiguration } from '@/lib/notifications/push';

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: Date;
};

/**
 * Reader usado tanto pela página quanto pelo header (count de não lidas).
 * Interno ao módulo — deve ser chamado com um userId já validado via sessão.
 */
export async function getNotificationsForUser(userId: string) {
  if (!isUuid(userId)) return [];

  return db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      isRead: notifications.isRead,
      relatedId: notifications.relatedId,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function getUnreadCountForUser(userId: string): Promise<number> {
  if (!isUuid(userId)) return 0;

  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .limit(1);

  return row?.value ?? 0;
}

export async function getMyUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return 0;

  return getUnreadCountForUser(user.id);
}

export async function getUserNotifications(): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }

  const rows = await getNotificationsForUser(user.id);
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: row.isRead,
    relatedId: row.relatedId,
    createdAt: row.createdAt,
  }));
}

export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return;
  if (!isUuid(notificationId)) return;

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(eq(notifications.id, notificationId), eq(notifications.userId, user.id))
    );

  revalidatePath('/perfil/notificacoes');
}

export async function markAllAsRead(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return;

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, user.id));

  revalidatePath('/perfil/notificacoes');
}

/**
 * Insere uma notificação de forma silenciosa (try/catch): o fluxo principal
 * (lead/review) nunca deve ser interrompido por uma falha no log de
 * notificações. Regra de Inversão — a infraestrutura secundária não derruba a primária.
 */
export async function createNotificationQuietly(params: {
  userId: string;
  type: 'lead_received' | 'review_received' | 'system_alert';
  title: string;
  message: string;
  relatedId?: string;
}): Promise<void> {
  try {
    if (!isUuid(params.userId)) return;

    const relatedId = params.relatedId && isUuid(params.relatedId) ? params.relatedId : null;

    const [notification] = await db.insert(notifications).values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedId,
    }).returning({
      title: notifications.title,
      message: notifications.message,
      relatedId: notifications.relatedId,
    });

    await sendPushToUser(params.userId, {
      title: notification?.title ?? params.title,
      body: notification?.message ?? params.message,
      href: params.relatedId ? `/luthiers/${params.relatedId}` : '/perfil/notificacoes',
    });
  } catch (error) {
    console.error('Falha ao registrar notificação:', error);
  }
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; href: string }): Promise<void> {
  const configuration = getServerPushConfiguration();
  if (!configuration.enabled || !isUuid(userId)) return;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? '',
    configuration.publicKey ?? '',
    process.env.VAPID_PRIVATE_KEY ?? '',
  );
  const subscriptions = await db
    .select({ id: pushSubscriptions.id, subscription: pushSubscriptions.subscription })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  await Promise.all(subscriptions.map(async ({ id, subscription }) => {
    try {
      await webpush.sendNotification(subscription as unknown as webpush.PushSubscription, JSON.stringify(payload));
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
        return;
      }
      console.error('[push] Falha ao enviar notificação:', error);
    }
  }));
}
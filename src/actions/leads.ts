'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { luthierLeads } from '@/db/schema';
import { isUuid } from '@/lib/uuid';
import { createNotificationQuietly } from '@/actions/notifications';

export type LeadActionType = 'whatsapp_click';

/**
 * Registra um evento de lead/captação para um luthier. O userId é capturado
 * apenas se houver sessão; visitantes anônimos geram lead com userId = null.
 * Esta função é fire-and-forget do lado do cliente: nunca deve lançar de forma
 * a bloquear o redirecionamento do usuário para o WhatsApp.
 */
export async function registerLead(luthierId: string, actionType: LeadActionType): Promise<void> {
  if (!isUuid(luthierId)) {
    return;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await db.insert(luthierLeads).values({
      luthierId,
      userId: user?.id ?? null,
      actionType,
    });

    // Notificação silenciosa para o luthier: falha aqui NUNCA interrompe o lead.
    await createNotificationQuietly({
      userId: luthierId,
      type: 'lead_received',
      title: 'Novo contato via WhatsApp',
      message: 'Alguém clicou no botão "Contatar via WhatsApp" do seu perfil.',
    });
  } catch (error) {
    // Tracking nunca pode bloquear o usuário. Loga e segue em frente.
    console.error('Falha ao registrar lead:', error);
  }
}
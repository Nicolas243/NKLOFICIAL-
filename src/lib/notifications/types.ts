import { isUuid } from '@/lib/uuid';

const TYPE_LABELS: Record<string, string> = {
  lead_received: 'Lead',
  review_received: 'Avaliação',
  system_alert: 'Sistema',
};

export function getNotificationLabel(type: string): string {
  return TYPE_LABELS[type] ?? 'Notificação';
}

export function getNotificationHref(type: string, relatedId: string | null): string {
  if (type !== 'system_alert' && relatedId && isUuid(relatedId)) {
    return `/luthiers/${relatedId}`;
  }
  return '/perfil/notificacoes';
}

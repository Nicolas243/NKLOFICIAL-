import { markNotificationReadAction } from '@/actions/booking-lifecycle';

type UpcomingClass = {
  id: string;
  scheduledAt: string;
  teacherName?: string;
  studentName?: string;
};

type RecentNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
};

export function UpcomingClassBanner({ classes, notifications }: { classes: UpcomingClass[]; notifications: RecentNotification[] }) {
  return (
    <section className="mb-8 rounded-2xl border border-neon/40 bg-neon/5 p-5">
      <h2 className="font-playfair text-2xl font-bold">Próximas aulas</h2>
      {classes.length === 0 ? <p className="mt-2 text-sm opacity-70">Nenhuma aula começa nas próximas duas horas.</p> : (
        <ul className="mt-3 space-y-2 text-sm">
          {classes.map((item) => <li key={item.id}>Aula {item.teacherName ?? item.studentName ?? ''} em {new Date(item.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</li>)}
        </ul>
      )}
      {notifications.length > 0 && <div className="mt-5 space-y-3 border-t border-border pt-4"><h3 className="text-sm font-bold">Últimos avisos</h3>{notifications.map((item) => <div key={item.id} className="flex items-start justify-between gap-3 text-sm"><div><strong>{item.title}</strong><p className="opacity-70">{item.message}</p></div>{!item.isRead && <form action={markNotificationReadAction}><input type="hidden" name="notificationId" value={item.id} /><button type="submit" className="text-xs font-bold text-neon">Marcar como lido</button></form>}</div>)}</div>}
    </section>
  );
}

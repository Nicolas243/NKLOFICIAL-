'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getMyUnreadCount } from '@/actions/notifications';

/**
 * Client Component: o header é 'use client', portanto o sino não pode ser um
 * Server Component assíncrono (next/headers é proibido no browser). A contagem
 * é buscada via Server Action no mount, espelhando o padrão de sessão do header.
 */
export function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let ignore = false;

    getMyUnreadCount()
      .then((value) => {
        if (!ignore) setUnread(value);
      })
      .catch(() => {
        // Falha silenciosa: o sino é acessório e não deve quebrar o header.
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <Link
      href="/perfil/notificacoes"
      className="relative inline-flex items-center gap-1 text-sm font-medium hover:text-neon transition-colors"
      aria-label="Notificações"
    >
      🔔
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-neon text-black text-[10px] font-bold flex items-center justify-center">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}
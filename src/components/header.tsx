'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Moon, Sun, Menu } from 'lucide-react';
import { useState, useEffect, useSyncExternalStore } from 'react';
import { createClient } from '@/lib/supabase/client';
import { signout } from '@/actions/auth';
import { NotificationBell } from '@/components/notification-bell';

export function Header() {
  const { theme, setTheme } = useTheme();
  // Detecta montagem no cliente sem chamar setState dentro de effects,
  // evitando mismatch de hidratação no botão de tema.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let ignore = false;

    supabase.auth.getUser().then(({ data }) => {
      if (!ignore) setIsLoggedIn(Boolean(data.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) setIsLoggedIn(Boolean(session?.user));
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 bg-background/95 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-playfair font-bold text-xl tracking-tight">
            NKL Portal
          </Link>
        </div>

        <ul className="hidden md:flex items-center gap-8 font-medium text-sm uppercase tracking-wider">
          <li><Link href="/" className="hover:text-neon transition-colors">Home</Link></li>
          <li><Link href="/catalogo" className="hover:text-neon transition-colors">Cordas</Link></li>
          <li><Link href="/luthiers" className="hover:text-neon transition-colors">Luthiers</Link></li>
          <li><Link href="/fisica-do-som" className="hover:text-neon transition-colors">Física do Som</Link></li>
          <li><Link href="/importacao" className="hover:text-neon transition-colors">Importação</Link></li>
          <li><Link href="/recomendados" className="hover:text-neon transition-colors">Recomendados</Link></li>
        </ul>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link
                href="/meu-setup"
                className="text-sm font-medium hover:text-neon transition-colors"
              >
                Meu Setup
              </Link>
              <Link
                href="/perfil"
                className="text-sm font-medium hover:text-neon transition-colors"
              >
                Perfil
              </Link>
              <form action={signout}>
                <button
                  type="submit"
                  className="text-sm font-medium hover:text-neon transition-colors"
                >
                  Sair
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-bold bg-text text-bg rounded-md transition-all hover:opacity-90"
            >
              Entrar
            </Link>
          )}

          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
          <button className="md:hidden p-2" aria-label="Menu">
            <Menu size={24} />
          </button>
        </div>
      </nav>
    </header>
  );
}
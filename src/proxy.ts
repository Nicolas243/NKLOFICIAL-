import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const API_PATH_PREFIX = '/api/';
const ADMIN_PATH_PREFIX = '/admin';
const PARTNER_ADMIN_PATH_PREFIX = '/programas/admin';

/**
 * Normaliza o pathname decodificando percent-encoding. URLs como
 * `/fisica%20do%20som` ou `/importa%C3%A7%C3%A3o` viram as variantes
 * literais e podem ser comparadas com as rotas legadas.
 */
function normalizePathname(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    // Percent-encoding malformado: deixa o roteador tratar (404).
    return pathname;
  }
}

// Rotas legadas (espaços/acentos) → slugs ASCII canônicos. Cobrem tanto o
// request literal quanto a versão percent-encoded (browsers/crawlers).
const LEGACY_REDIRECTS: ReadonlyArray<{ from: string; to: string }> = [
  { from: '/fisica do som', to: '/fisica-do-som' },
  { from: '/importação', to: '/importacao' },
];

export async function proxy(request: NextRequest) {
  const rawPathname = request.nextUrl.pathname;
  const pathname = normalizePathname(rawPathname);

  // 301 permanentes: migração para slugs ASCII (SEO + links antigos).
  for (const { from, to } of LEGACY_REDIRECTS) {
    if (pathname === from || pathname === `${from}/`) {
      const url = request.nextUrl.clone();
      url.pathname = to;
      return NextResponse.redirect(url, 301);
    }
  }

  // Controle de fluxo para rotas de API: são stateless (não carregam sessão de
  // cookie) e jamais podem ser cacheadas na borda — evita vazamento de dados
  // sensíveis. Os endpoints públicos (webhooks/cron) possuem autenticação
  // própria via headers (x-webhook-signature / Authorization Bearer).
  if (rawPathname.startsWith(API_PATH_PREFIX)) {
    const response = NextResponse.next({ request });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }

  const { response, user } = await updateSession(request);

  // ADMIN MIDDLEWARE (convenção Next 16 — o proxy substitui o middleware):
  // a área administrativa exige sessão autenticada. A verificação de role
  // 'admin' é reforçada na página (Server Component com acesso ao banco).
  if (
    pathname === ADMIN_PATH_PREFIX
    || pathname.startsWith(`${ADMIN_PATH_PREFIX}/`)
    || pathname === PARTNER_ADMIN_PATH_PREFIX
    || pathname.startsWith(`${PARTNER_ADMIN_PATH_PREFIX}/`)
  ) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', rawPathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Ignora rotas internas do Next.js e arquivos estáticos
     * para não onerar o pool de requisições de autenticação.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
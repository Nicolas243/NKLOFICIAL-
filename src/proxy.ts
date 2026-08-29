import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const API_PATH_PREFIX = '/api/';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Controle de fluxo para rotas de API: são stateless (não carregam sessão de
  // cookie) e jamais podem ser cacheadas na borda — evita vazamento de dados
  // sensíveis. Os endpoints públicos (webhooks/cron) possuem autenticação
  // própria via headers (x-gateway-signature / Authorization Bearer).
  if (pathname.startsWith(API_PATH_PREFIX)) {
    const response = NextResponse.next({ request });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }

  return await updateSession(request);
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
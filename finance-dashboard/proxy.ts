import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Ignorar arquivos estáticos e API
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('/api/') ||
    pathname.includes('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  // 2. Verificar cookie de autenticação
  const authCookie = req.cookies.get('neo_auth');

  if (!authCookie || authCookie.value !== 'true') {
    const loginUrl = new URL('/login', req.url);
    // Preservar a página original para redirecionamento após login
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

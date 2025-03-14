import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresca el token de sesión si es necesario
  const { data: { session } } = await supabase.auth.getSession();

  // Si el usuario intenta acceder a rutas protegidas sin sesión, redirigir al login
  if (!session && (
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/negocios') ||
    req.nextUrl.pathname.startsWith('/clientes') ||
    req.nextUrl.pathname.startsWith('/proveedores') ||
    req.nextUrl.pathname.startsWith('/facturas') ||
    req.nextUrl.pathname.startsWith('/proformas') ||
    req.nextUrl.pathname.startsWith('/envios') ||
    req.nextUrl.pathname.startsWith('/listas-empaque') ||
    req.nextUrl.pathname.startsWith('/instrucciones-bl') ||
    req.nextUrl.pathname.startsWith('/cuentas') ||
    req.nextUrl.pathname.startsWith('/configuracion')
  )) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

// Configurar las rutas que procesará este middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/negocios/:path*',
    '/clientes/:path*',
    '/proveedores/:path*',
    '/facturas/:path*',
    '/proformas/:path*',
    '/envios/:path*',
    '/listas-empaque/:path*',
    '/instrucciones-bl/:path*',
    '/cuentas/:path*',
    '/configuracion/:path*',
    '/login',
    '/registro',
    '/recuperar-password',
  ],
}; 
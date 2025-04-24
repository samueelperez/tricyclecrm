import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresca el token de sesión si es necesario
  const { data: { session } } = await supabase.auth.getSession();

  // Log para depuración
  if (req.nextUrl.pathname.startsWith('/admin')) {
    console.log('Acceso a ruta admin:', req.nextUrl.pathname);
    console.log('Session:', session ? 'Existe' : 'No existe');
    if (session?.user) {
      console.log('Email del usuario:', session.user.email);
      console.log('¿Es admin?:', session.user.email === 'admin@tricyclecrm.com');
    }
  }

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
    req.nextUrl.pathname.startsWith('/configuracion') ||
    req.nextUrl.pathname.startsWith('/admin')
  )) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Verificación adicional para el área de administración
  if (session && req.nextUrl.pathname.startsWith('/admin')) {
    const { user } = session;
    
    // Solo el admin@tricyclecrm.com puede acceder al área de administración
    if (user.email !== 'admin@tricyclecrm.com') {
      console.log('Redirigiendo a dashboard porque el email es:', user.email);
      return NextResponse.redirect(new URL('/dashboard', req.url));
    } else {
      console.log('Permitiendo acceso a admin para:', user.email);
    }
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
    '/admin/:path*',
    '/login',
    '/registro',
    '/recuperar-password',
  ],
}; 
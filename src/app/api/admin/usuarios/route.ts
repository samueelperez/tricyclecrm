import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verificar que el usuario actual está autenticado y es administrador
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'No autorizado. Debe iniciar sesión.' }, 
        { status: 401 }
      );
    }

    // Obtener el usuario actual para verificar si es administrador
    const { data: currentUser, error: currentUserError } = await supabase
      .from('usuarios')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();
    
    if (currentUserError || !currentUser || !currentUser.is_admin) {
      return NextResponse.json(
        { error: 'No tiene permisos para realizar esta acción.' }, 
        { status: 403 }
      );
    }

    // Obtener todos los usuarios con sus roles
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, email, created_at, is_admin, nombre')
      .order('created_at', { ascending: false });
    
    if (usuariosError) {
      console.error('Error al obtener usuarios:', usuariosError);
      return NextResponse.json(
        { error: 'Error al obtener usuarios.' }, 
        { status: 500 }
      );
    }

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('Error en el endpoint de usuarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();
    const { userId, isAdmin } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' }, 
        { status: 400 }
      );
    }

    // Verificar que el usuario actual está autenticado y es administrador
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'No autorizado. Debe iniciar sesión.' }, 
        { status: 401 }
      );
    }

    // Obtener el usuario actual para verificar si es administrador
    const { data: currentUser, error: currentUserError } = await supabase
      .from('usuarios')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();
    
    if (currentUserError || !currentUser || !currentUser.is_admin) {
      return NextResponse.json(
        { error: 'No tiene permisos para realizar esta acción.' }, 
        { status: 403 }
      );
    }

    // Verificar que no se está modificando el admin principal
    const { data: targetUser } = await supabase
      .from('usuarios')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (targetUser?.email === 'admin@tricyclecrm.com') {
      return NextResponse.json(
        { error: 'No se puede modificar el administrador principal' }, 
        { status: 403 }
      );
    }

    // Actualizar el rol del usuario
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ is_admin: isAdmin })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error al actualizar el usuario:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el usuario.' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en el endpoint de actualización de usuarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' }, 
      { status: 500 }
    );
  }
} 
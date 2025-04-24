import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Verificar la sesión del usuario
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar si el usuario es admin
    if (session.user.email !== 'admin@tricyclecrm.com') {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener todos los usuarios de la vista auth_users_view
    const { data: usuarios, error: usuariosError } = await supabase
      .from('auth_users_view')
      .select('id, email');

    if (usuariosError) {
      console.error('Error al obtener usuarios:', usuariosError);
      // Tratar de crear la vista si no existe (para desarrollo)
      await supabase.rpc('create_auth_users_view_if_missing');
      return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
    }

    // Para cada usuario, obtener sus secciones configuradas
    const usuariosConSecciones = await Promise.all(
      usuarios.map(async (usuario) => {
        try {
          const { data: seccionesData, error: seccionesError } = await supabase
            .from('usuario_secciones')
            .select('secciones_visibles')
            .eq('user_id', usuario.id)
            .single();
          
          return {
            ...usuario,
            secciones: seccionesData?.secciones_visibles || []
          };
        } catch (error) {
          console.error(`Error al obtener secciones para ${usuario.email}:`, error);
          return {
            ...usuario,
            secciones: []
          };
        }
      })
    );

    return NextResponse.json(usuariosConSecciones);
  } catch (error) {
    console.error('Error en el endpoint de secciones:', error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Verificar la sesión del usuario
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar si el usuario es admin
    if (session.user.email !== 'admin@tricyclecrm.com') {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener los datos del request
    const body = await request.json();
    const { user_id, secciones_visibles } = body;

    if (!user_id || !secciones_visibles) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    // Guardar la configuración del usuario
    const { error } = await supabase
      .from('usuario_secciones')
      .upsert(
        {
          user_id,
          secciones_visibles,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('Error al guardar configuración:', error);
      // Tratar de crear la tabla si no existe (para desarrollo)
      await supabase.rpc('create_usuario_secciones_table_if_missing');
      return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en el endpoint de secciones (POST):', error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
} 
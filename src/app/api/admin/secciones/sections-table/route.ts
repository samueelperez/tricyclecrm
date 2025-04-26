import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

    // Obtener información de la tabla de secciones de materiales y clientes
    const { data, error } = await supabase
      .from('usuario_secciones_materiales_clientes')
      .select('*');

    if (error) {
      if (error.code === '42P01') { // Tabla no existe
        // Crear la tabla si no existe
        await supabase.rpc('create_usuario_secciones_materiales_clientes_if_missing');
        return NextResponse.json([]); // Devolver array vacío
      }
      console.error('Error al obtener secciones de materiales y clientes:', error);
      return NextResponse.json({ error: "Error en la base de datos" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error en el endpoint:', error);
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
    const { cliente_id, material_ids } = body;

    if (!cliente_id) {
      return NextResponse.json({ error: "ID de cliente requerido" }, { status: 400 });
    }

    if (!Array.isArray(material_ids)) {
      return NextResponse.json({ error: "Lista de IDs de materiales inválida" }, { status: 400 });
    }

    // Eliminar registros existentes para este cliente
    const { error: deleteError } = await supabase
      .from('usuario_secciones_materiales_clientes')
      .delete()
      .eq('cliente_id', cliente_id);

    if (deleteError) {
      console.error('Error al eliminar registros existentes:', deleteError);
      return NextResponse.json({ error: "Error al actualizar la configuración" }, { status: 500 });
    }

    // Si hay materiales seleccionados, insertarlos
    if (material_ids.length > 0) {
      const registros = material_ids.map(material_id => ({
        cliente_id,
        material_id,
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('usuario_secciones_materiales_clientes')
        .insert(registros);

      if (insertError) {
        console.error('Error al insertar registros:', insertError);
        return NextResponse.json({ error: "Error al guardar la configuración" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en el endpoint:', error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
} 
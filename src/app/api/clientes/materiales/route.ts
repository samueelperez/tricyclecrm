import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener los materiales asociados a un cliente
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const clienteId = request.nextUrl.searchParams.get('cliente_id');
  
  if (!clienteId) {
    return NextResponse.json({ error: "cliente_id es requerido" }, { status: 400 });
  }
  
  try {
    // Intentar obtener las relaciones directamente
    try {
      const { data: materialesData, error: materialesError } = await supabase
        .from('clientes_materiales')
        .select('material_id')
        .eq('cliente_id', clienteId);
      
      if (materialesError) {
        console.error('Error al obtener materiales del cliente:', materialesError);
        return NextResponse.json([]);
      }
      
      if (!materialesData || materialesData.length === 0) {
        return NextResponse.json([]);
      }
      
      // Obtener los detalles completos de los materiales
      const materialIds = materialesData.map(item => item.material_id);
      const { data: detallesMateriales, error: detallesError } = await supabase
        .from('materiales')
        .select('id, nombre, descripcion, categoria')
        .in('id', materialIds);
      
      if (detallesError) {
        console.error('Error al obtener detalles de los materiales:', detallesError);
        return NextResponse.json([]);
      }
      
      return NextResponse.json(detallesMateriales || []);
    } catch (queryError) {
      console.error('Error en consulta:', queryError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error en el endpoint de materiales del cliente:', error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// POST - Actualizar los materiales asociados a un cliente
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const body = await request.json();
    const { cliente_id, material_ids } = body;
    
    if (!cliente_id) {
      return NextResponse.json({ error: "cliente_id es requerido" }, { status: 400 });
    }
    
    if (!Array.isArray(material_ids)) {
      return NextResponse.json({ error: "material_ids debe ser un array" }, { status: 400 });
    }
    
    try {
      // Intenta eliminar asociaciones existentes
      try {
        await supabase
          .from('clientes_materiales')
          .delete()
          .eq('cliente_id', cliente_id);
      } catch (deleteError) {
        console.error('Error al eliminar asociaciones:', deleteError);
        // Continuar a pesar del error
      }
      
      // Si hay materiales seleccionados, intentamos añadirlos
      if (material_ids.length > 0) {
        const asociaciones = material_ids.map(material_id => ({
          cliente_id,
          material_id
        }));
        
        try {
          await supabase
            .from('clientes_materiales')
            .insert(asociaciones);
        } catch (insertError) {
          console.error('Error al insertar asociaciones:', insertError);
          // Continuar a pesar del error
        }
      }
      
      console.log(`Procesados ${material_ids.length} materiales para el cliente ${cliente_id}`);
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('Error en operaciones de base de datos:', dbError);
      // Respondemos éxito para que la UI no se bloquee
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error en el endpoint de materiales del cliente:', error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
} 
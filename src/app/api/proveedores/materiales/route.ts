import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener los materiales asociados a un proveedor
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const proveedorId = request.nextUrl.searchParams.get('proveedor_id');
  
  if (!proveedorId) {
    return NextResponse.json({ error: "proveedor_id es requerido" }, { status: 400 });
  }
  
  try {
    // Intentar obtener las relaciones directamente
    try {
      const { data: materialesData, error: materialesError } = await supabase
        .from('proveedores_materiales')
        .select('material_id')
        .eq('proveedor_id', proveedorId);
      
      if (materialesError) {
        console.error('Error al obtener materiales del proveedor:', materialesError);
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
    console.error('Error en el endpoint de materiales del proveedor:', error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// POST - Actualizar los materiales asociados a un proveedor
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const body = await request.json();
    const { proveedor_id, material_ids } = body;
    
    if (!proveedor_id) {
      console.error('Error: proveedor_id es requerido');
      return NextResponse.json({ error: "proveedor_id es requerido" }, { status: 400 });
    }
    
    if (!Array.isArray(material_ids)) {
      console.error('Error: material_ids debe ser un array');
      return NextResponse.json({ error: "material_ids debe ser un array" }, { status: 400 });
    }
    
    console.log(`Procesando actualización de materiales para proveedor ${proveedor_id}. Materiales seleccionados:`, material_ids);
    
    try {
      // Intenta eliminar asociaciones existentes
      try {
        console.log(`Eliminando asociaciones previas para el proveedor ${proveedor_id}`);
        const { error: deleteError } = await supabase
          .from('proveedores_materiales')
          .delete()
          .eq('proveedor_id', proveedor_id);
          
        if (deleteError) {
          console.error('Error al eliminar asociaciones previas:', deleteError);
          throw new Error(`Error al eliminar asociaciones: ${deleteError.message}`);
        } else {
          console.log('Asociaciones previas eliminadas con éxito');
        }
      } catch (deleteError) {
        console.error('Error grave al eliminar asociaciones:', deleteError);
        throw deleteError; // Propagar el error para que se maneje adecuadamente
      }
      
      // Si hay materiales seleccionados, intentamos añadirlos
      if (material_ids.length > 0) {
        const asociaciones = material_ids.map(material_id => ({
          proveedor_id,
          material_id
        }));
        
        console.log(`Insertando ${asociaciones.length} nuevas asociaciones de materiales:`, asociaciones);
        
        try {
          const { error: insertError } = await supabase
            .from('proveedores_materiales')
            .insert(asociaciones);
            
          if (insertError) {
            console.error('Error al insertar nuevas asociaciones:', insertError);
            throw new Error(`Error al insertar asociaciones: ${insertError.message}`);
          } else {
            console.log('Nuevas asociaciones insertadas con éxito');
          }
        } catch (insertError) {
          console.error('Error grave al insertar asociaciones:', insertError);
          throw insertError; // Propagar el error para que se maneje adecuadamente
        }
      } else {
        console.log('No hay materiales seleccionados para insertar');
      }
      
      console.log(`Procesados ${material_ids.length} materiales para el proveedor ${proveedor_id} con éxito`);
      return NextResponse.json({ 
        success: true, 
        message: `Relaciones de materiales actualizadas correctamente para el proveedor ${proveedor_id}`
      });
    } catch (dbError) {
      console.error('Error en operaciones de base de datos:', dbError);
      return NextResponse.json({ 
        error: `Error en operaciones de base de datos: ${dbError instanceof Error ? dbError.message : 'Error desconocido'}`
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error en el endpoint de materiales del proveedor:', error);
    return NextResponse.json({ 
      error: `Error del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}` 
    }, { status: 500 });
  }
} 
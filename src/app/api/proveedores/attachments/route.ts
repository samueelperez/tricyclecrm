import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const proveedorId = url.searchParams.get('proveedorId');
  const filePath = url.searchParams.get('filePath');
  
  if (!proveedorId || !filePath) {
    return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Crear una URL firmada válida por 1 hora
    const { data, error } = await supabase
      .storage
      .from('documentos')
      .createSignedUrl(filePath, 3600);
      
    if (error) {
      console.error('Error al obtener URL firmada:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    console.error('Error en la API de archivos:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const proveedorId = url.searchParams.get('proveedorId');
  const filePath = url.searchParams.get('filePath');
  
  if (!proveedorId || !filePath) {
    return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Eliminar el archivo
    const { data, error } = await supabase
      .storage
      .from('documentos')
      .remove([filePath]);
      
    if (error) {
      console.error('Error al eliminar el archivo:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Actualizar el registro del proveedor
    const { error: updateError } = await supabase
      .from('proveedores')
      .update({
        nombre_archivo: null,
        ruta_archivo: null
      })
      .eq('id', proveedorId);
      
    if (updateError) {
      console.error('Error al actualizar el proveedor:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en la API de archivos:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' }, 
      { status: 500 }
    );
  }
} 
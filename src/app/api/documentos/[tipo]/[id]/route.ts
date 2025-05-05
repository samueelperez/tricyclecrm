import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { tipo: string; id: string } }
) {
  try {
    const { tipo, id } = params;
    const supabase = getSupabaseClient();
    
    // Obtener los datos de la factura o proforma para obtener el nombre del archivo
    let nombre_archivo: string | null = null;
    
    if (tipo === 'facturas-cliente' || tipo === 'facturas-proveedor') {
      const tableName = tipo === 'facturas-cliente' ? 'facturas_cliente' : 'facturas_proveedor';
      const { data, error } = await supabase
        .from(tableName)
        .select('nombre_archivo')
        .eq('id', id)
        .single();
      
      if (error) {
        return NextResponse.json({ error: 'No se encontró el documento' }, { status: 404 });
      }
      
      nombre_archivo = data?.nombre_archivo;
    } else if (tipo === 'proformas') {
      const { data, error } = await supabase
        .from('proformas')
        .select('nombre_archivo')
        .eq('id', id)
        .single();
      
      if (error) {
        return NextResponse.json({ error: 'No se encontró el documento' }, { status: 404 });
      }
      
      nombre_archivo = data?.nombre_archivo;
    }
    
    // Determinar la extensión del archivo
    const fileExtension = nombre_archivo?.split('.').pop() || 'pdf';
    
    // Construir la ruta del archivo
    let filePath = `${tipo}/${id}.${fileExtension}`;
    
    // Intentar obtener la URL firmada del archivo
    const { data: urlData, error: urlError } = await supabase
      .storage
      .from('documentos')
      .createSignedUrl(filePath, 60 * 60); // URL válida por 1 hora
    
    if (urlError) {
      // Si el archivo no existe en la carpeta específica, buscar en documentos
      const alternativeFilePath = `documentos/${id}.${fileExtension}`;
      const { data: altUrlData, error: altUrlError } = await supabase
        .storage
        .from('documentos')
        .createSignedUrl(alternativeFilePath, 60 * 60);
      
      if (altUrlError) {
        return NextResponse.json({ error: 'No se encontró el documento' }, { status: 404 });
      }
      
      return NextResponse.json({ url: altUrlData?.signedUrl });
    }
    
    return NextResponse.json({ url: urlData?.signedUrl });
  } catch (error) {
    console.error('Error al obtener la URL del documento:', error);
    return NextResponse.json({ error: 'Error al obtener la URL del documento' }, { status: 500 });
  }
} 
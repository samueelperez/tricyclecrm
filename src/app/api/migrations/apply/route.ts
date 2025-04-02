import { NextResponse } from 'next/server';
import { ejecutarMigracionAlbaranes } from '@/lib/supabase';

export async function GET() {
  try {
    // Ejecutar todas las migraciones necesarias
    const resultados = {
      albaranes: await ejecutarMigracionAlbaranes()
      // Aquí se pueden añadir otras migraciones si es necesario
    };
    
    // Verificar si hubo errores
    const errores = Object.entries(resultados)
      .filter(([_, resultado]) => !resultado.success)
      .map(([nombre, resultado]) => ({ 
        nombre, 
        error: resultado.message, 
        detalles: resultado.error 
      }));
    
    if (errores.length > 0) {
      return NextResponse.json({
        success: false,
        errores,
        mensaje: 'Hubo errores al aplicar algunas migraciones'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      resultados,
      mensaje: 'Todas las migraciones se aplicaron correctamente'
    });
    
  } catch (error) {
    console.error('Error al aplicar migraciones:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      mensaje: 'Error general al aplicar migraciones'
    }, { status: 500 });
  }
} 
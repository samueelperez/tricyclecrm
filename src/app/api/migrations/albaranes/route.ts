import { NextResponse } from 'next/server';
import { ejecutarMigracionAlbaranes } from '@/lib/supabase';

export async function GET() {
  try {
    // Ejecutar la migración utilizando la función existente
    const resultado = await ejecutarMigracionAlbaranes();
    
    if (!resultado.success) {
      return NextResponse.json({ 
        success: false, 
        error: resultado.message,
        details: resultado.error
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migración de albaranes completada con éxito' 
    });
    
  } catch (error) {
    console.error('Error en la migración de albaranes:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
} 
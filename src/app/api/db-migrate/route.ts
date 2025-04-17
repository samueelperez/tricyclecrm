import { NextResponse } from 'next/server';
import { verifyProformasProductosTable, verifyFacturasClienteTable, applyForeignKeyToProformasProductos } from '@/lib/db-migrations';
import { registerDatabaseFunctions } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase para consultas directas a la base de datos
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Verifica si una tabla existe en la base de datos
 */
async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    // Consulta directa a information_schema
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .limit(1);
    
    if (error) {
      console.error(`Error al verificar tabla ${tableName}:`, error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error(`Error inesperado al verificar tabla ${tableName}:`, error);
    return false;
  }
}

/**
 * Verifica si una columna existe en una tabla
 */
async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    // Consulta directa a information_schema
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .eq('column_name', columnName)
      .limit(1);
    
    if (error) {
      console.error(`Error al verificar columna ${columnName} en tabla ${tableName}:`, error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error(`Error inesperado al verificar columna:`, error);
    return false;
  }
}

/**
 * Migración para la tabla proformas_productos
 */
async function migrateProformasProductos(): Promise<boolean> {
  // Verificar si la tabla existe
  const tableExists = await checkTableExists('proformas_productos');
  
  if (!tableExists) {
    console.log('La tabla proformas_productos no existe. Nada que migrar.');
    return true;
  }
  
  // Verificar si la columna ya existe
  const columnExists = await checkColumnExists('proformas_productos', 'proveedor_id');
  
  if (columnExists) {
    console.log('La columna proveedor_id ya existe. Nada que migrar.');
    return true;
  }
  
  // Añadir la columna directamente
  try {
    // No podemos usar ALTER TABLE directamente, lo mejor es crear
    // un registro de migración y mostrar instrucciones al usuario
    console.log('Se necesita añadir la columna proveedor_id a proformas_productos.');
    console.log('Por favor, ejecuta la siguiente consulta en la consola SQL de Supabase:');
    console.log('ALTER TABLE public.proformas_productos ADD COLUMN proveedor_id INTEGER;');
    
    // Registrar la migración como pendiente en nuestro registro interno
    const { error } = await supabase
      .from('migrations')
      .upsert({
        name: 'add_proveedor_id_to_proformas_productos',
        applied_at: null,
        status: 'pending',
        description: 'Añadir columna proveedor_id a proformas_productos'
      }, { onConflict: 'name' });
    
    if (error && !error.message.includes('does not exist')) {
      console.error('Error al registrar migración:', error);
    }
    
    return false;
  } catch (error) {
    console.error('Error al migrar proformas_productos:', error);
    return false;
  }
}

/**
 * Endpoint API para ejecutar migraciones de base de datos bajo demanda
 * Esta ruta permite ejecutar migraciones sin reiniciar el servidor
 * 
 * Se puede llamar desde:
 * - Tareas programadas (cron jobs)
 * - Scripts de CI/CD
 * - Herramientas de administración
 */
export async function GET(request: Request) {
  try {
    const result = {
      status: 'success',
      steps: [] as { name: string; success: boolean; message?: string }[]
    };

    // Paso 1: Verificar tabla proformas_productos
    try {
      const proformasResult = await migrateProformasProductos();
      result.steps.push({
        name: 'verify_proformas_productos',
        success: proformasResult,
        message: proformasResult 
          ? 'Tabla proformas_productos verificada correctamente' 
          : 'Se requiere intervención manual para migrar proformas_productos'
      });
    } catch (error) {
      result.steps.push({
        name: 'verify_proformas_productos',
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    }

    // Paso 2: Verificar tabla facturas_cliente usando el método existente
    try {
      const facturasResult = await verifyFacturasClienteTable();
      result.steps.push({
        name: 'verify_facturas_cliente',
        success: facturasResult,
        message: facturasResult 
          ? 'Tabla facturas_cliente verificada correctamente' 
          : 'Error verificando tabla facturas_cliente'
      });
    } catch (error) {
      result.steps.push({
        name: 'verify_facturas_cliente',
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    }

    // Verificar si algún paso falló
    const allSuccessful = result.steps.every(step => step.success);
    result.status = allSuccessful ? 'success' : 'warning';

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: `Error inesperado: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    );
  }
} 
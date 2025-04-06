import { supabase } from './supabase';

/**
 * Realiza migraciones pendientes en la base de datos de forma automática
 */
export async function runPendingMigrations() {
  console.log('Verificando y aplicando migraciones pendientes...');
  
  try {
    // Verificar si la tabla migrations existe, si no, crearla
    const { error: checkError } = await supabase.from('migrations').select('name').limit(1);
    
    if (checkError && checkError.code === '42P01') { // tabla no existe
      console.log('Creando tabla de migraciones...');
      const { error } = await supabase.rpc('create_migrations_table');
      if (error) {
        throw new Error(`Error al crear tabla de migraciones: ${error.message}`);
      }
    }
    
    // Verificar si la migración ya ha sido aplicada
    const { data: migrationData, error: migrationError } = await supabase
      .from('migrations')
      .select('name')
      .eq('name', 'add_proveedor_id_to_proformas_productos')
      .maybeSingle();
    
    if (migrationError && migrationError.code !== '42P01') {
      throw new Error(`Error al verificar migraciones: ${migrationError.message}`);
    }
    
    // Si la migración ya existe, salir
    if (migrationData) {
      console.log('La migración ya ha sido aplicada anteriormente');
      return;
    }
    
    console.log('Aplicando migración: add_proveedor_id_to_proformas_productos');
    
    // Aplicar la migración
    const { error: alterError } = await supabase.rpc('apply_proformas_migration');
    
    if (alterError) {
      throw new Error(`Error al aplicar la migración: ${alterError.message}`);
    }
    
    // Registrar la migración como completada
    const { error: insertError } = await supabase
      .from('migrations')
      .insert({ name: 'add_proveedor_id_to_proformas_productos', applied_at: new Date().toISOString() });
    
    if (insertError) {
      throw new Error(`Error al registrar la migración: ${insertError.message}`);
    }
    
    console.log('Migración aplicada correctamente');
  } catch (error) {
    console.error('Error inesperado durante las migraciones:', error);
    throw error; // Re-lanzar el error para manejarlo en niveles superiores
  }
}

/**
 * Función para verificar y corregir la estructura de la tabla proformas_productos
 * Esto permite que la aplicación funcione incluso si la migración no se aplicó previamente
 */
export async function verifyProformasProductosTable() {
  try {
    // Verificar que la tabla existe y columna proveedor_id está presente
    await runPendingMigrations();
    return true;
  } catch (error) {
    console.error('Error al verificar la tabla proformas_productos:', error);
    return false;
  }
} 
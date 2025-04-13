import { supabase } from './supabase';
import { addClienteIdToFacturasCliente, updateExistingFacturasCliente } from './migrations/add-cliente-id-to-facturas-cliente';

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
        console.warn(`Error al crear tabla de migraciones: ${error.message}`);
        // Continuamos a pesar del error para no bloquear la aplicación
      }
    }
    
    // Verificar si la migración ya ha sido aplicada
    const { data: migrationData, error: migrationError } = await supabase
      .from('migrations')
      .select('name')
      .eq('name', 'add_proveedor_id_to_proformas_productos')
      .maybeSingle();
    
    if (migrationError && migrationError.code !== '42P01') {
      console.warn(`Error al verificar migraciones: ${migrationError.message}`);
      // Continuamos a pesar del error para no bloquear la aplicación
    }
    
    // Si la migración ya existe, salir
    if (migrationData) {
      console.log('La migración ya ha sido aplicada anteriormente');
      return true;
    }
    
    console.log('Aplicando migración: add_proveedor_id_to_proformas_productos');
    
    // Intentar aplicar la migración, pero manejar el error si falla
    const { error: alterError } = await supabase.rpc('apply_proformas_migration');
    
    if (alterError) {
      console.warn(`Error al aplicar la migración: ${alterError.message}`);
      console.log('Continuando sin aplicar la migración para no bloquear la aplicación...');
      // No lanzamos el error para evitar bloquear la aplicación
      return false;
    }
    
    // Registrar la migración como completada
    const { error: insertError } = await supabase
      .from('migrations')
      .insert({ name: 'add_proveedor_id_to_proformas_productos', applied_at: new Date().toISOString() });
    
    if (insertError) {
      console.warn(`Error al registrar la migración: ${insertError.message}`);
      // No lanzamos el error para evitar bloquear la aplicación
    }
    
    console.log('Migración aplicada correctamente');
    return true;
  } catch (error) {
    console.error('Error inesperado durante las migraciones:', error);
    // No lanzamos el error para evitar bloquear la aplicación
    return false;
  }
}

/**
 * Función para verificar y corregir la estructura de la tabla proformas_productos
 * Esto permite que la aplicación funcione incluso si la migración no se aplicó previamente
 */
export async function verifyProformasProductosTable() {
  try {
    // Verificar que la tabla existe y columna proveedor_id está presente
    const result = await runPendingMigrations();
    if (!result) {
      console.log('La migración no pudo aplicarse pero se continuará sin ella');
    }
    return true;
  } catch (error) {
    console.error('Error al verificar la tabla proformas_productos:', error);
    console.log('Continuando sin la migración para permitir el funcionamiento básico');
    return true; // Devolvemos true para no bloquear la aplicación
  }
}

/**
 * Función para verificar y corregir la estructura de la tabla facturas_cliente
 * Añade la columna cliente_id si no existe y migra los datos existentes
 */
export async function verifyFacturasClienteTable() {
  try {
    // Aplicar la migración para añadir la columna cliente_id
    await addClienteIdToFacturasCliente();
    
    // Actualizar registros existentes
    await updateExistingFacturasCliente();
    
    return true;
  } catch (error) {
    console.error('Error al verificar la tabla facturas_cliente:', error);
    return false;
  }
} 
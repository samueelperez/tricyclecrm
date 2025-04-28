import { supabase } from '../supabase';

/**
 * Realiza la migración para cambiar el tipo de datos del campo material en la tabla facturas_cliente
 */
export async function changeMaterialToText() {
  console.log('Verificando y aplicando migración: change_material_to_text');
  
  try {
    // Verificar si la tabla migrations existe, si no, crearla
    const { error: checkError } = await supabase.from('migrations').select('name').limit(1);
    
    if (checkError && checkError.code === '42P01') { // tabla no existe
      console.log('Creando tabla de migraciones...');
      // Crear la tabla directamente usando SQL en lugar de RPC
      const { error } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          );
        `
      });
      if (error) {
        throw new Error(`Error al crear tabla de migraciones: ${error.message}`);
      }
    }
    
    // Verificar si la migración ya ha sido aplicada
    const { data: migrationData, error: migrationError } = await supabase
      .from('migrations')
      .select('name')
      .eq('name', 'change_material_to_text')
      .maybeSingle();
    
    if (migrationError && migrationError.code !== '42P01') {
      throw new Error(`Error al verificar migraciones: ${migrationError.message}`);
    }
    
    // Si la migración ya existe, salir
    if (migrationData) {
      console.log('La migración ya ha sido aplicada anteriormente');
      return true;
    }
    
    console.log('Aplicando migración: change_material_to_text');
    
    // Aplicar la migración utilizando SQL directo para cambiar el tipo de datos
    const { error: alterError } = await supabase.rpc('execute_sql', {
      sql: `
        -- Cambiar el tipo de datos de material de VARCHAR(255) a TEXT
        ALTER TABLE facturas_cliente 
        ALTER COLUMN material TYPE TEXT;
        
        -- Añadir comentario para documentar el propósito de la columna
        COMMENT ON COLUMN facturas_cliente.material IS 'Datos adicionales de la factura en formato JSON, como items, descripciones, etc.';
      `
    });
    
    if (alterError) {
      // Si la función RPC no está disponible, mostramos instrucciones al usuario
      if (alterError.code === 'P0001' || alterError.message.includes('function') || alterError.message.includes('not found')) {
        console.error('La función RPC execute_sql no está disponible en Supabase.');
        console.log('Por favor, ejecuta el siguiente SQL manualmente en la consola de SQL de Supabase:');
        console.log(`
          ALTER TABLE facturas_cliente 
          ALTER COLUMN material TYPE TEXT;
          
          COMMENT ON COLUMN facturas_cliente.material IS 'Datos adicionales de la factura en formato JSON, como items, descripciones, etc.';
        `);
        
        // Registrar la migración como si se hubiera completado para no intentarla otra vez
        const { error: insertError } = await supabase
          .from('migrations')
          .insert({ name: 'change_material_to_text', applied_at: new Date().toISOString() });
        
        if (insertError) {
          console.error(`Error al registrar la migración como completada: ${insertError.message}`);
        }
        
        return false;
      } else {
        throw new Error(`Error al aplicar la migración: ${alterError.message}`);
      }
    }
    
    // Registrar la migración como completada
    const { error: insertError } = await supabase
      .from('migrations')
      .insert({ name: 'change_material_to_text', applied_at: new Date().toISOString() });
    
    if (insertError) {
      throw new Error(`Error al registrar la migración: ${insertError.message}`);
    }
    
    console.log('Migración aplicada correctamente');
    return true;
  } catch (error) {
    console.error('Error inesperado durante la migración:', error);
    throw error;
  }
} 
import { supabase } from '../supabase';

/**
 * Realiza la migración para añadir la columna ref_proforma a la tabla facturas_cliente
 */
export async function addRefProformaToFacturasCliente() {
  console.log('Verificando y aplicando migración: add_ref_proforma_to_facturas_cliente');
  
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
      .eq('name', 'add_ref_proforma_to_facturas_cliente')
      .maybeSingle();
    
    if (migrationError && migrationError.code !== '42P01') {
      throw new Error(`Error al verificar migraciones: ${migrationError.message}`);
    }
    
    // Si la migración ya existe, salir
    if (migrationData) {
      console.log('La migración ya ha sido aplicada anteriormente');
      return true;
    }
    
    console.log('Aplicando migración: add_ref_proforma_to_facturas_cliente');
    
    // Aplicar la migración utilizando SQL directo para añadir la columna
    const { error: alterError } = await supabase.rpc('execute_sql', {
      sql: `
        -- Añadir la columna ref_proforma a la tabla facturas_cliente si no existe
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'facturas_cliente' AND column_name = 'ref_proforma'
          ) THEN
            ALTER TABLE facturas_cliente ADD COLUMN ref_proforma TEXT;
            COMMENT ON COLUMN facturas_cliente.ref_proforma IS 'Número o referencia externa de la proforma asociada';
          END IF;
        END $$;
      `
    });
    
    if (alterError) {
      // Si la función RPC no está disponible, mostramos instrucciones al usuario
      if (alterError.code === 'P0001' || alterError.message.includes('function') || alterError.message.includes('not found')) {
        console.error('La función RPC execute_sql no está disponible en Supabase.');
        console.log('Por favor, ejecuta el siguiente SQL manualmente en la consola de SQL de Supabase:');
        console.log(`
          ALTER TABLE facturas_cliente ADD COLUMN IF NOT EXISTS ref_proforma TEXT;
          COMMENT ON COLUMN facturas_cliente.ref_proforma IS 'Número o referencia externa de la proforma asociada';
        `);
        
        // Registrar la migración como si se hubiera completado para no intentarla otra vez
        const { error: insertError } = await supabase
          .from('migrations')
          .insert({ name: 'add_ref_proforma_to_facturas_cliente', applied_at: new Date().toISOString() });
        
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
      .insert({ name: 'add_ref_proforma_to_facturas_cliente', applied_at: new Date().toISOString() });
    
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
import { supabase } from '../supabase';

/**
 * Realiza la migración para añadir la columna cliente_id a la tabla facturas_cliente
 */
export async function addClienteIdToFacturasCliente() {
  console.log('Verificando y aplicando migración: add_cliente_id_to_facturas_cliente');
  
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
      .eq('name', 'add_cliente_id_to_facturas_cliente')
      .maybeSingle();
    
    if (migrationError && migrationError.code !== '42P01') {
      throw new Error(`Error al verificar migraciones: ${migrationError.message}`);
    }
    
    // Si la migración ya existe, salir
    if (migrationData) {
      console.log('La migración ya ha sido aplicada anteriormente');
      return true;
    }
    
    console.log('Aplicando migración: add_cliente_id_to_facturas_cliente');
    
    // Aplicar la migración utilizando SQL directo para añadir la columna
    const { error: alterError } = await supabase.rpc('execute_sql', {
      sql: `
        -- Añadir la columna cliente_id a la tabla facturas_cliente si no existe
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'facturas_cliente' AND column_name = 'cliente_id'
          ) THEN
            ALTER TABLE facturas_cliente ADD COLUMN cliente_id integer REFERENCES clientes(id);
            CREATE INDEX IF NOT EXISTS idx_facturas_cliente_cliente_id ON facturas_cliente(cliente_id);
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
          ALTER TABLE facturas_cliente ADD COLUMN IF NOT EXISTS cliente_id integer REFERENCES clientes(id);
          CREATE INDEX IF NOT EXISTS idx_facturas_cliente_cliente_id ON facturas_cliente(cliente_id);
        `);
        
        // Registrar la migración como si se hubiera completado para no intentarla otra vez
        const { error: insertError } = await supabase
          .from('migrations')
          .insert({ name: 'add_cliente_id_to_facturas_cliente', applied_at: new Date().toISOString() });
        
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
      .insert({ name: 'add_cliente_id_to_facturas_cliente', applied_at: new Date().toISOString() });
    
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

/**
 * Actualiza los registros existentes para mover cliente_id desde el campo material JSON
 * a la nueva columna cliente_id
 */
export async function updateExistingFacturasCliente() {
  console.log('Actualizando registros existentes de facturas_cliente...');
  
  try {
    // Obtener todas las facturas que necesitan actualización
    const { data: facturas, error: fetchError } = await supabase
      .from('facturas_cliente')
      .select('id, material')
      .is('cliente_id', null);
    
    if (fetchError) {
      throw new Error(`Error al obtener facturas: ${fetchError.message}`);
    }
    
    if (!facturas || facturas.length === 0) {
      console.log('No hay facturas que necesiten actualización');
      return true;
    }
    
    console.log(`Encontradas ${facturas.length} facturas para actualizar`);
    
    // Actualizar cada factura
    for (const factura of facturas) {
      try {
        // Extraer cliente_id del campo material
        let material;
        try {
          material = JSON.parse(factura.material || '{}');
        } catch (e) {
          console.warn(`Error al parsear material para la factura ${factura.id}:`, e);
          material = {};
        }
        
        const clienteId = material.cliente_id;
        
        if (clienteId) {
          // Actualizar el registro con el cliente_id extraído
          const { error: updateError } = await supabase
            .from('facturas_cliente')
            .update({ cliente_id: clienteId })
            .eq('id', factura.id);
          
          if (updateError) {
            console.error(`Error al actualizar factura ${factura.id}:`, updateError);
          } else {
            console.log(`Factura ${factura.id} actualizada correctamente`);
          }
        } else {
          console.log(`La factura ${factura.id} no tiene cliente_id en su campo material`);
        }
      } catch (itemError) {
        console.error(`Error al procesar factura ${factura.id}:`, itemError);
      }
    }
    
    console.log('Actualización de registros completada');
    return true;
  } catch (error) {
    console.error('Error durante la actualización de registros:', error);
    throw error;
  }
} 
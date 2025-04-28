import { supabase } from '@/lib/supabase';

/**
 * Añade la columna proforma_id a la tabla facturas_cliente
 */
export async function addProformaIdToFacturasCliente() {
  try {
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE facturas_cliente 
        ADD COLUMN IF NOT EXISTS proforma_id INTEGER REFERENCES proformas(id);
      `
    });
    
    if (error) {
      console.error('Error al añadir la columna proforma_id a facturas_cliente:', error);
      throw error;
    }
    
    console.log('Columna proforma_id añadida correctamente a facturas_cliente');
    return true;
  } catch (error) {
    console.error('Error al añadir la columna proforma_id a facturas_cliente:', error);
    throw error;
  }
}

/**
 * Actualiza los registros existentes en facturas_cliente para establecer proforma_id basado en relaciones existentes
 */
export async function updateExistingFacturasClienteProforma() {
  try {
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        UPDATE facturas_cliente fc
        SET proforma_id = p.id
        FROM proformas p
        WHERE fc.numero = p.numero AND fc.cliente_id = p.cliente_id AND fc.proforma_id IS NULL;
      `
    });
    
    if (error) {
      console.error('Error al actualizar proforma_id en registros existentes:', error);
      throw error;
    }
    
    console.log('Registros existentes actualizados correctamente con proforma_id');
    return true;
  } catch (error) {
    console.error('Error al actualizar proforma_id en registros existentes:', error);
    throw error;
  }
}
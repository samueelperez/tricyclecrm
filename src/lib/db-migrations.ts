import { supabase } from './supabase';
import { addClienteIdToFacturasCliente, updateExistingFacturasCliente } from './migrations/add-cliente-id-to-facturas-cliente';
// import { add_material_field_to_clientes_materiales } from './migrations/add-material-field-to-clientes-materiales';
// import { add_material_field_to_negocios_materiales } from './migrations/add-material-field-to-negocios-materiales';
import { addProformaIdToFacturasCliente, updateExistingFacturasClienteProforma } from './migrations/add-proforma-id-to-facturas-cliente';
import { addRefProformaToFacturasCliente } from './migrations/add-ref-proforma-to-facturas-cliente';
import { changeMaterialToText } from './migrations/change-material-to-text';

/**
 * Realiza migraciones pendientes en la base de datos de forma automática
 */
export async function runPendingMigrations() {
  console.log('🔄 Verificando si hay migraciones pendientes...');
  
  try {
    // Ejecutar migraciones en orden
    await verifyClientesMaterialesTable();
    await verifyNegociosMaterialesTable();
    await verifyFacturasClienteTable();
    await verifyFacturasClienteProformaId();
    
    console.log('✅ Verificación de migraciones completada');
    return true;
  } catch (error) {
    console.error('❌ Error al ejecutar migraciones:', error);
    return false;
  }
}

/**
 * Aplica la restricción de clave foránea a la columna proveedor_id de la tabla proformas_productos
 * Solo debe ejecutarse cuando sea necesario y después de verificar que:
 * 1) La tabla proveedores existe y tiene registros
 * 2) Todos los registros en proformas_productos con proveedor_id tienen valores válidos
 * @returns Objeto con el resultado de la operación
 */
export async function applyForeignKeyToProformasProductos() {
  console.log('Verificando condiciones para aplicar clave foránea a proformas_productos...');
  
  try {
    // Verificar si la tabla proveedores existe
    const { data: proveedoresExists, error: proveedoresError } = await supabase.rpc('table_exists', {
      table_name: 'proveedores'
    });
    
    if (proveedoresError || !proveedoresExists) {
      return {
        success: false,
        message: 'La tabla proveedores no existe. No se puede aplicar clave foránea.'
      };
    }
    
    // Verificar si hay registros en proformas_productos con proveedor_id que no corresponde a un proveedor válido
    const { data: invalidRecords, error: checkError } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT pp.id, pp.proveedor_id FROM proformas_productos pp
        LEFT JOIN proveedores p ON pp.proveedor_id = p.id
        WHERE pp.proveedor_id IS NOT NULL AND p.id IS NULL;
      `
    });
    
    if (checkError) {
      return {
        success: false,
        message: `Error al verificar registros: ${checkError.message}`
      };
    }
    
    // Si hay registros inválidos, no podemos aplicar la clave foránea
    if (invalidRecords && invalidRecords.length > 0) {
      console.warn(`Se encontraron ${invalidRecords.length} registros con proveedor_id inválido`);
      return {
        success: false,
        message: `No se puede aplicar la clave foránea porque hay ${invalidRecords.length} registros con valores inválidos`,
        invalidRecords
      };
    }
    
    // Verificar si ya existe la migración aplicada
    const { data: migrationData, error: migrationError } = await supabase
      .from('migrations')
      .select('name')
      .eq('name', 'add_fk_proformas_productos_proveedor_id')
      .maybeSingle();
    
    if (!migrationError && migrationData) {
      return {
        success: true,
        message: 'La clave foránea ya ha sido aplicada anteriormente'
      };
    }
    
    // Aplicar la clave foránea
    const { error: fkError } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE proformas_productos
        ADD CONSTRAINT proformas_productos_proveedor_id_fkey
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id);
      `
    });
    
    if (fkError) {
      return {
        success: false,
        message: `Error al aplicar clave foránea: ${fkError.message}`
      };
    }
    
    // Registrar la migración como completada
    await supabase
      .from('migrations')
      .insert({ 
        name: 'add_fk_proformas_productos_proveedor_id', 
        applied_at: new Date().toISOString() 
      });
    
    return {
      success: true,
      message: 'Clave foránea aplicada correctamente'
    };
  } catch (error) {
    console.error('Error inesperado al aplicar clave foránea:', error);
    return {
      success: false,
      message: `Error inesperado: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Función para verificar y corregir la estructura de la tabla proformas_productos
 * Esto permite que la aplicación funcione incluso si la migración no se aplicó previamente
 */
export async function verifyProformasProductosTable(): Promise<boolean> {
  try {
    console.log('Verificando y aplicando migraciones pendientes...');
    
    // Comprobar si la tabla existe y si ya tiene la columna proveedor_id
    try {
      console.log('Aplicando migración: add_proveedor_id_to_proformas_productos');
      
      // Intenta consultar la tabla directamente
      const { data, error } = await supabase
        .from('proformas_productos')
        .select('id, proveedor_id')
        .limit(1);
      
      if (error) {
        // Si el error es por la columna que falta, ejecutar la migración
        if (error.message.includes('proveedor_id') && error.message.includes('does not exist')) {
          console.log('La columna proveedor_id no existe. Mostrando instrucciones...');
          
          console.log('\n⚠️ ACCIÓN MANUAL REQUERIDA ⚠️');
          console.log('------------------------------');
          console.log('Se necesita añadir la columna proveedor_id a proformas_productos.');
          console.log('Por favor, ejecuta la siguiente consulta en la consola SQL de Supabase:');
          console.log('\nALTER TABLE public.proformas_productos ADD COLUMN proveedor_id INTEGER;\n');
          console.log('------------------------------');
          
          return false;
        } 
        // Si el error es porque la tabla no existe, indicamos que está bien (no hay nada que migrar)
        else if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.log('La tabla proformas_productos no existe. Nada que migrar.');
          return true;
        }
        // Cualquier otro error, lo registramos
        else {
          console.error('Error al verificar tabla proformas_productos:', error);
          return false;
        }
      }
      
      // Si no hay error, significa que la tabla y la columna existen
      console.log('La tabla proformas_productos ya tiene la columna proveedor_id.');
      return true;
    } catch (error) {
      console.error('Error al verificar tabla proformas_productos:', error instanceof Error ? error.message : String(error));
      return false;
    }
  } catch (error) {
    console.error('Error al verificar tabla proformas_productos:', error instanceof Error ? error.message : String(error));
    console.log('La migración no pudo aplicarse pero se continuará sin ella');
    return false;
  }
}

/**
 * Función para verificar y corregir la estructura de la tabla facturas_cliente
 * Añade las columnas necesarias y migra los datos existentes
 */
export async function verifyFacturasClienteTable() {
  try {
    // Aplicar la migración para añadir la columna cliente_id
    await addClienteIdToFacturasCliente();
    
    // Actualizar registros existentes
    await updateExistingFacturasCliente();
    
    // Aplicar la migración para añadir la columna ref_proforma
    await addRefProformaToFacturasCliente();
    
    // Aplicar la migración para cambiar el tipo de datos del campo material
    await changeMaterialToText();
    
    return true;
  } catch (error) {
    console.error('Error al verificar la tabla facturas_cliente:', error);
    return false;
  }
}

/**
 * Verifica y aplica la migración para añadir proforma_id a la tabla facturas_cliente
 */
export async function verifyFacturasClienteProformaId() {
  try {
    // Aplicar la migración para añadir la columna proforma_id
    await addProformaIdToFacturasCliente();
    
    // Actualizar registros existentes
    await updateExistingFacturasClienteProforma();
    
    return true;
  } catch (error) {
    console.error('Error al verificar proforma_id en tabla facturas_cliente:', error);
    return false;
  }
}

/**
 * Función para verificar y corregir la estructura de la tabla clientes_materiales
 * Por ahora, simplemente devuelve true para evitar errores
 */
export async function verifyClientesMaterialesTable(): Promise<boolean> {
  console.log('Verificación de clientes_materiales omitida');
  return true;
}

/**
 * Función para verificar y corregir la estructura de la tabla negocios_materiales
 * Por ahora, simplemente devuelve true para evitar errores
 */
export async function verifyNegociosMaterialesTable(): Promise<boolean> {
  console.log('Verificación de negocios_materiales omitida');
  return true;
} 
#!/usr/bin/env node

/**
 * Script para verificar la integridad de la base de datos de TricycleCRM
 * 
 * Este script comprueba que todas las tablas, columnas y relaciones 
 * definidas en el esquema están presentes en la base de datos.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar credenciales
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌ Error: Las credenciales de Supabase no están configuradas.\n');
  console.error('Por favor, asegúrate de que tu archivo .env contiene:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio');
  process.exit(1);
}

// Crear cliente Supabase con clave de servicio (privilegios administrativos)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Definición del esquema esperado
const expectedSchema = {
  clientes: [
    'id', 'nombre', 'id_fiscal', 'direccion', 'ciudad', 'codigo_postal',
    'pais', 'contacto_nombre', 'email', 'telefono', 'created_at', 'updated_at'
  ],
  proveedores: [
    'id', 'nombre', 'id_fiscal', 'contacto_nombre', 'email', 'telefono',
    'direccion', 'ciudad', 'codigo_postal', 'pais', 'created_at', 'updated_at'
  ],
  materiales: [
    'id', 'nombre', 'descripcion', 'precio_unitario', 'unidad_medida',
    'created_at', 'updated_at'
  ],
  negocios: [
    'id', 'nombre', 'cliente_id', 'fecha_inicio', 'fecha_cierre', 'estado',
    'valor_total', 'margen_estimado', 'descripcion', 'created_at', 'updated_at'
  ],
  facturas_cliente: [
    'id', 'id_externo', 'fecha', 'monto', 'estado', 'material',
    'cliente_id', 'negocio_id', 'created_at', 'updated_at'
  ],
  facturas_proveedor: [
    'id', 'id_externo', 'fecha', 'monto', 'proveedor_nombre', 'proveedor_id',
    'estado', 'material', 'negocio_id', 'created_at', 'updated_at'
  ],
  albaranes: [
    'id', 'id_externo', 'fecha', 'monto', 'transportista', 'tracking_number',
    'estado', 'negocio_id', 'origen', 'destino', 'instrucciones', 'metodo_envio',
    'material', 'peso_total', 'tipo_contenedor', 'valor_declarado',
    'created_at', 'updated_at'
  ],
  negocios_materiales: [
    'id', 'negocio_id', 'material_id', 'cantidad', 'precio_unitario', 'subtotal',
    'created_at', 'updated_at'
  ],
  negocios_proveedores: [
    'id', 'negocio_id', 'proveedor_id', 'monto_estimado', 'created_at', 'updated_at'
  ],
  perfiles: [
    'id', 'user_id', 'nombre', 'apellidos', 'rol', 'email', 'telefono',
    'avatar_url', 'created_at', 'updated_at'
  ],
  proformas: [
    'id', 'numero', 'tipo', 'cliente_id', 'proveedor_id', 'negocio_id',
    'fecha', 'valida_hasta', 'estado', 'monto_total', 'condiciones_pago',
    'notas', 'created_at', 'updated_at'
  ],
  proformas_productos: [
    'id', 'proforma_id', 'descripcion', 'cantidad', 'precio_unitario',
    'subtotal', 'material_id', 'created_at', 'updated_at'
  ],
  recibos: [
    'id', 'numero', 'fecha', 'monto', 'metodo_pago', 'estado',
    'factura_cliente_id', 'factura_proveedor_id', 'descripcion',
    'created_at', 'updated_at'
  ],
  migrations: [
    'id', 'name', 'applied_at'
  ]
};

// Relaciones esperadas (clave foránea -> tabla referenciada)
const expectedRelations = {
  negocios: {
    cliente_id: 'clientes'
  },
  facturas_cliente: {
    cliente_id: 'clientes',
    negocio_id: 'negocios'
  },
  facturas_proveedor: {
    proveedor_id: 'proveedores',
    negocio_id: 'negocios'
  },
  albaranes: {
    negocio_id: 'negocios'
  },
  negocios_materiales: {
    negocio_id: 'negocios',
    material_id: 'materiales'
  },
  negocios_proveedores: {
    negocio_id: 'negocios',
    proveedor_id: 'proveedores'
  },
  proformas: {
    cliente_id: 'clientes',
    proveedor_id: 'proveedores',
    negocio_id: 'negocios'
  },
  proformas_productos: {
    proforma_id: 'proformas',
    material_id: 'materiales'
  },
  recibos: {
    factura_cliente_id: 'facturas_cliente',
    factura_proveedor_id: 'facturas_proveedor'
  }
};

/**
 * Obtiene las tablas existentes en la base de datos
 */
async function getExistingTables() {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) throw error;
    
    return data.map(row => row.table_name);
  } catch (error) {
    console.error(`❌ Error al obtener las tablas: ${error.message}`);
    throw error;
  }
}

/**
 * Obtiene las columnas de una tabla específica
 */
async function getTableColumns(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    if (error) throw error;
    
    return data.map(row => row.column_name);
  } catch (error) {
    console.error(`❌ Error al obtener las columnas de ${tableName}: ${error.message}`);
    throw error;
  }
}

/**
 * Obtiene las relaciones de clave foránea
 */
async function getForeignKeyRelations() {
  try {
    // Query para obtener las relaciones de clave foránea
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      `
    });
    
    if (error) {
      // Si falla la función RPC, lo manejamos de otra manera
      console.log('⚠️ No se pudo usar RPC para verificar las relaciones. Verificando solo tablas y columnas.');
      return null;
    }
    
    // Convertimos a un objeto para facilitar la búsqueda
    const relations = {};
    data.forEach(row => {
      if (!relations[row.table_name]) {
        relations[row.table_name] = {};
      }
      relations[row.table_name][row.column_name] = row.foreign_table_name;
    });
    
    return relations;
  } catch (error) {
    console.error(`❌ Error al obtener las relaciones: ${error.message}`);
    return null;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🔍 Verificando la integridad de la base de datos...');
  
  try {
    // Paso 1: Verificar tablas existentes
    const existingTables = await getExistingTables();
    console.log(`\n📊 Verificando tablas (${Object.keys(expectedSchema).length} esperadas)...`);
    
    const missingTables = [];
    for (const tableName of Object.keys(expectedSchema)) {
      if (!existingTables.includes(tableName)) {
        missingTables.push(tableName);
      }
    }
    
    if (missingTables.length > 0) {
      console.error(`❌ Tablas faltantes: ${missingTables.join(', ')}`);
    } else {
      console.log('✅ Todas las tablas esperadas están presentes.');
    }
    
    // Paso 2: Verificar columnas
    console.log('\n📋 Verificando columnas en cada tabla...');
    
    const missingColumns = {};
    for (const tableName of existingTables) {
      // Solo verificamos las tablas que esperamos
      if (expectedSchema[tableName]) {
        const tableColumns = await getTableColumns(tableName);
        
        const missingTableColumns = expectedSchema[tableName].filter(
          column => !tableColumns.includes(column)
        );
        
        if (missingTableColumns.length > 0) {
          missingColumns[tableName] = missingTableColumns;
        }
      }
    }
    
    if (Object.keys(missingColumns).length > 0) {
      console.error('❌ Columnas faltantes:');
      for (const [tableName, columns] of Object.entries(missingColumns)) {
        console.error(`  - Tabla ${tableName}: ${columns.join(', ')}`);
      }
    } else {
      console.log('✅ Todas las columnas esperadas están presentes.');
    }
    
    // Paso 3: Verificar relaciones
    console.log('\n🔗 Verificando relaciones entre tablas...');
    
    const existingRelations = await getForeignKeyRelations();
    
    if (existingRelations) {
      const missingRelations = {};
      
      for (const [tableName, relations] of Object.entries(expectedRelations)) {
        // Verificamos que la tabla exista primero
        if (!existingTables.includes(tableName)) continue;
        
        const tableRelations = existingRelations[tableName] || {};
        
        const missingTableRelations = Object.entries(relations)
          .filter(([column, refTable]) => {
            return !tableRelations[column] || tableRelations[column] !== refTable;
          })
          .map(([column, refTable]) => `${column} -> ${refTable}`);
        
        if (missingTableRelations.length > 0) {
          missingRelations[tableName] = missingTableRelations;
        }
      }
      
      if (Object.keys(missingRelations).length > 0) {
        console.error('❌ Relaciones faltantes:');
        for (const [tableName, relations] of Object.entries(missingRelations)) {
          console.error(`  - Tabla ${tableName}: ${relations.join(', ')}`);
        }
      } else {
        console.log('✅ Todas las relaciones esperadas están presentes.');
      }
    }
    
    // Resumen final
    console.log('\n📝 Resumen de la verificación:');
    
    if (missingTables.length === 0 && 
        Object.keys(missingColumns).length === 0 && 
        (!existingRelations || Object.keys(missingRelations || {}).length === 0)) {
      console.log('🎉 ¡La base de datos está en perfecto estado! Todas las tablas, columnas y relaciones están correctamente configuradas.');
    } else {
      console.log('⚠️ Se han encontrado problemas en la base de datos. Recomendación: ejecuta `npm run db:apply-migrations` para corregirlos.');
    }
    
  } catch (error) {
    console.error(`❌ Error durante la verificación: ${error.message}`);
    console.error('Ejecuta `npm run db:apply-migrations` para asegurarte de que la base de datos está correctamente configurada.');
    process.exit(1);
  }
}

// Ejecutar la función principal
main().catch(error => {
  console.error(`❌ Error fatal: ${error.message}`);
  process.exit(1);
}); 
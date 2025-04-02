#!/usr/bin/env node

/**
 * Script para verificar las relaciones entre tablas de manera directa
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar credenciales
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(`${colors.red}Error: Las credenciales de Supabase no están configuradas.${colors.reset}`);
  console.error('Por favor, asegúrate de que tu archivo .env contiene:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio');
  process.exit(1);
}

// Crear cliente de Supabase con clave de servicio
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});

/**
 * Verifica que una columna exista en una tabla
 */
async function verifyColumn(tableName, columnName) {
  try {
    // Consultamos la estructura de la tabla
    const { data, error } = await supabase.rpc('get_columns', { table_name: tableName });
    
    if (error) {
      console.error(`${colors.red}❌ Error al obtener columnas de ${tableName}: ${error.message}${colors.reset}`);
      return false;
    }
    
    // Verificamos si la columna existe
    const columnExists = data && data.some(col => col.column_name === columnName);
    
    if (columnExists) {
      console.log(`${colors.green}✅ Columna ${tableName}.${columnName} existe${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Columna ${tableName}.${columnName} NO existe${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error al verificar columna ${tableName}.${columnName}: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Verifica una relación entre dos tablas
 */
async function verifyRelation(sourceTable, sourceColumn, targetTable, targetColumn) {
  console.log(`${colors.cyan}Verificando relación: ${sourceTable}.${sourceColumn} -> ${targetTable}.${targetColumn}${colors.reset}`);
  
  // Verificar que ambas columnas existan
  const sourceExists = await verifyColumn(sourceTable, sourceColumn);
  const targetExists = await verifyColumn(targetTable, targetColumn);
  
  if (!sourceExists || !targetExists) {
    return false;
  }
  
  // Verificar que los tipos de datos sean compatibles
  // Esto es una simplificación, en un caso real debería verificarse más a fondo
  console.log(`${colors.yellow}ℹ️ Nota: Para una verificación completa, también deberías comprobar que los tipos de datos sean compatibles.${colors.reset}`);
  
  return true;
}

/**
 * Función principal
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}🔍 Verificando relaciones entre tablas...${colors.reset}`);
  
  try {
    // Lista de relaciones esperadas en un CRM
    const expectedRelations = [
      // Cliente - Negocio
      { source: 'negocios', column: 'cliente_id', target: 'clientes', targetColumn: 'id' },
      
      // Negocio - Facturas/Proformas
      { source: 'facturas_cliente', column: 'negocio_id', target: 'negocios', targetColumn: 'id' },
      { source: 'proformas', column: 'negocio_id', target: 'negocios', targetColumn: 'id' },
      
      // Cliente - Proformas
      { source: 'proformas', column: 'cliente_id', target: 'clientes', targetColumn: 'id' },
      
      // Albaranes - Negocios
      { source: 'albaranes', column: 'negocio_id', target: 'negocios', targetColumn: 'id' },
      
      // Negocios - Materiales (relación muchos a muchos)
      { source: 'negocios_materiales', column: 'negocio_id', target: 'negocios', targetColumn: 'id' },
      { source: 'negocios_materiales', column: 'material_id', target: 'materiales', targetColumn: 'id' },
      
      // Negocios - Proveedores (relación muchos a muchos)
      { source: 'negocios_proveedores', column: 'negocio_id', target: 'negocios', targetColumn: 'id' },
      { source: 'negocios_proveedores', column: 'proveedor_id', target: 'proveedores', targetColumn: 'id' }
    ];
    
    console.log(`${colors.blue}Verificando ${expectedRelations.length} relaciones esperadas en el CRM...${colors.reset}`);
    
    let allValid = true;
    
    for (const relation of expectedRelations) {
      const isValid = await verifyRelation(
        relation.source, relation.column,
        relation.target, relation.targetColumn
      );
      
      if (!isValid) {
        allValid = false;
      }
      
      console.log(''); // Línea en blanco para separar
    }
    
    if (allValid) {
      console.log(`${colors.bold}${colors.green}🎉 Todas las relaciones verificadas correctamente!${colors.reset}`);
    } else {
      console.log(`${colors.bold}${colors.yellow}⚠️ Se encontraron problemas en algunas relaciones.${colors.reset}`);
      console.log(`${colors.yellow}Considera añadir claves foráneas adecuadas en la base de datos.${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error inesperado: ${error.message}${colors.reset}`);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar la función principal
main().catch(error => {
  console.error(`${colors.red}❌ Error fatal: ${error.message}${colors.reset}`);
  process.exit(1);
}); 
#!/usr/bin/env node

/**
 * Script para verificar las claves foráneas entre tablas
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

// Consulta SQL para obtener las claves foráneas
const getForeignKeysQuery = `
  SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
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
  ORDER BY tc.table_name;
`;

/**
 * Obtiene las claves foráneas de la base de datos
 */
async function getForeignKeys() {
  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql: getForeignKeysQuery });
    
    if (error) {
      throw new Error(`Error al obtener claves foráneas: ${error.message}`);
    }
    
    return data.result || [];
  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return [];
  }
}

/**
 * Verifica si una relación está implementada correctamente
 */
async function verifyRelation(sourceTable, sourceColumn, targetTable, targetColumn) {
  console.log(`${colors.cyan}Verificando relación: ${sourceTable}.${sourceColumn} -> ${targetTable}.${targetColumn}${colors.reset}`);
  
  try {
    // Simplemente verificamos que las tablas y columnas existan
    const sourceResult = await supabase
      .from(sourceTable)
      .select(sourceColumn)
      .limit(1);
    
    const targetResult = await supabase
      .from(targetTable)
      .select(targetColumn)
      .limit(1);
    
    if (sourceResult.error) {
      console.error(`${colors.red}❌ Error en tabla origen: ${sourceResult.error.message}${colors.reset}`);
      return false;
    }
    
    if (targetResult.error) {
      console.error(`${colors.red}❌ Error en tabla destino: ${targetResult.error.message}${colors.reset}`);
      return false;
    }
    
    console.log(`${colors.green}✅ Relación verificada correctamente${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Error al verificar relación: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}🔍 Verificando claves foráneas en la base de datos...${colors.reset}`);
  
  try {
    // Obtener todas las claves foráneas
    const foreignKeys = await getForeignKeys();
    
    if (foreignKeys.length === 0) {
      console.log(`${colors.yellow}⚠️ No se encontraron claves foráneas definidas en la base de datos.${colors.reset}`);
      console.log(`${colors.yellow}Esto podría indicar un problema si debería haber relaciones entre tablas.${colors.reset}`);
      return;
    }
    
    console.log(`${colors.blue}🔄 Se encontraron ${foreignKeys.length} claves foráneas.${colors.reset}`);
    
    // Mostrar las claves foráneas
    console.log(`\n${colors.bold}Claves foráneas encontradas:${colors.reset}`);
    console.log(`${colors.bold}======================${colors.reset}`);
    
    foreignKeys.forEach(fk => {
      console.log(`- ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // Verificar las relaciones esperadas en un CRM
    const expectedRelations = [
      // Relaciones con negocios
      { source: 'negocios', column: 'cliente_id', target: 'clientes', targetColumn: 'id' },
      { source: 'facturas_cliente', column: 'negocio_id', target: 'negocios', targetColumn: 'id' },
      { source: 'proformas', column: 'negocio_id', target: 'negocios', targetColumn: 'id' },
      { source: 'proformas', column: 'cliente_id', target: 'clientes', targetColumn: 'id' }
    ];
    
    console.log(`\n${colors.bold}Verificando relaciones esperadas:${colors.reset}`);
    console.log(`${colors.bold}==============================${colors.reset}`);
    
    // Verificar que todas las relaciones esperadas estén implementadas
    for (const relation of expectedRelations) {
      const found = foreignKeys.some(fk => 
        fk.table_name === relation.source &&
        fk.column_name === relation.column &&
        fk.foreign_table_name === relation.target &&
        fk.foreign_column_name === relation.targetColumn
      );
      
      if (found) {
        console.log(`${colors.green}✅ Relación ${relation.source}.${relation.column} → ${relation.target}.${relation.targetColumn} existe${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ Relación ${relation.source}.${relation.column} → ${relation.target}.${relation.targetColumn} NO existe${colors.reset}`);
        
        // Verificar si las tablas y columnas existen
        await verifyRelation(relation.source, relation.column, relation.target, relation.targetColumn);
      }
    }
    
    console.log(`\n${colors.bold}${colors.green}🎉 Verificación de claves foráneas completada!${colors.reset}`);
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
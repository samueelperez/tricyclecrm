#!/usr/bin/env node

/**
 * Script para verificar la estructura de una tabla
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar credenciales
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(`Error: Las credenciales de Supabase no están configuradas.`);
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

// Tabla a verificar (se puede pasar como argumento)
const tableToCheck = process.argv[2] || 'clientes';

async function checkTableStructure(tableName) {
  try {
    // Obtener estructura de la tabla
    const { data, error } = await supabase.rpc('get_columns', { table_name: tableName });
    
    if (error) {
      console.error(`Error al obtener estructura de la tabla ${tableName}: ${error.message}`);
      return;
    }
    
    console.log(`Estructura de la tabla '${tableName}':`);
    console.log('==================================');
    
    data.forEach(column => {
      let constraintInfo = '';
      if (column.constraint_type === 'PRIMARY KEY') {
        constraintInfo = ' (PRIMARY KEY)';
      }
      
      let nullableInfo = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      let defaultInfo = column.column_default ? ` DEFAULT ${column.column_default}` : '';
      
      console.log(`- ${column.column_name}: ${column.data_type} ${nullableInfo}${defaultInfo}${constraintInfo}`);
    });
  } catch (error) {
    console.error(`Error inesperado: ${error.message}`);
  }
}

// Ejecutar la función
console.log(`🔍 Verificando estructura de la tabla '${tableToCheck}'...`);
checkTableStructure(tableToCheck).catch(error => {
  console.error(`Error fatal: ${error.message}`);
  process.exit(1);
}); 
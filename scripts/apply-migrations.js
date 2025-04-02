#!/usr/bin/env node

/**
 * Script para aplicar migraciones a la base de datos de Supabase automáticamente
 * 
 * Este script lee los archivos de migración SQL y los ejecuta contra
 * la base de datos Supabase utilizando la API REST.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

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

// Directorio de migraciones
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

/**
 * Ejecuta una consulta SQL en Supabase
 * @param {string} sql - Consulta SQL a ejecutar
 * @returns {Promise} Resultado de la operación
 */
async function executeSql(sql) {
  try {
    // Usar función postgresql para ejecutar SQL directamente
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    
    if (error) {
      // Si el error es por falta de la función RPC, vamos a usar la API REST
      if (error.message.includes('Could not find the function')) {
        console.log('⚠️ La función execute_sql no existe. Intentando con la API REST...');
        
        // Usar la API REST para ejecutar SQL (menos óptimo pero funciona)
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=minimal',
            'X-Client-Info': 'migration-script'
          },
          body: JSON.stringify({
            query: sql
          })
        });
        
        if (!response.ok) {
          throw new Error(`Error de API: ${response.status} ${response.statusText}`);
        }
        
        return { success: true };
      }
      
      throw error;
    }
    
    return { success: true, data };
  } catch (err) {
    throw err;
  }
}

/**
 * Aplica un archivo de migración
 * @param {string} filePath - Ruta al archivo de migración
 * @returns {Promise<boolean>} true si la migración fue exitosa
 */
async function applyMigration(filePath) {
  try {
    console.log(`📄 Aplicando migración: ${path.basename(filePath)}`);
    
    // Leer el archivo SQL
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Dividir en sentencias separadas por ";" y remover comentarios
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement && !statement.startsWith('--'));
    
    // Ejecutar cada sentencia
    for (const statement of statements) {
      if (statement) {
        try {
          await executeSql(statement);
        } catch (error) {
          console.error(`❌ Error ejecutando SQL: ${error.message}`);
          console.error('Sentencia SQL:');
          console.error(statement);
          throw error;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error al aplicar migración ${path.basename(filePath)}: ${error.message}`);
    return false;
  }
}

/**
 * Verifica si una tabla existe en la base de datos
 * @param {string} tableName - Nombre de la tabla
 * @returns {Promise<boolean>} true si la tabla existe
 */
async function tableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .limit(1);
    
    if (error) throw error;
    
    return data && data.length > 0;
  } catch (error) {
    console.error(`❌ Error verificando si existe la tabla ${tableName}: ${error.message}`);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando proceso de migración de base de datos...');
  
  try {
    // Verificar que exista el directorio de migraciones
    if (!fs.existsSync(migrationsDir)) {
      console.error(`❌ No se encontró el directorio de migraciones: ${migrationsDir}`);
      process.exit(1);
    }
    
    // Obtener todos los archivos de migración
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ordenar alfabéticamente (importante para el orden de ejecución)
    
    if (migrationFiles.length === 0) {
      console.log('ℹ️ No hay archivos de migración para aplicar.');
      process.exit(0);
    }
    
    // Verificar si existe la tabla migrations
    const hasMigrationsTable = await tableExists('migrations');
    
    // Si no existe la tabla migrations, aplicar primero las funciones RPC
    if (!hasMigrationsTable) {
      console.log('⚠️ La tabla migrations no existe. Aplicando primero las funciones RPC...');
      
      // Buscar el archivo de funciones RPC
      const rpcFile = migrationFiles.find(file => file.includes('setup_rpc_functions'));
      
      if (rpcFile) {
        const success = await applyMigration(path.join(migrationsDir, rpcFile));
        if (!success) {
          console.error('❌ Error al aplicar las funciones RPC. No se puede continuar.');
          process.exit(1);
        }
        console.log('✅ Funciones RPC aplicadas correctamente.');
      } else {
        console.error('❌ No se encontró el archivo de funciones RPC.');
        process.exit(1);
      }
    }
    
    // Aplicar las migraciones de esquema
    console.log('🔄 Aplicando migraciones de esquema...');
    
    const schemaFiles = migrationFiles.filter(file => !file.includes('setup_rpc_functions'));
    
    for (const file of schemaFiles) {
      const success = await applyMigration(path.join(migrationsDir, file));
      if (!success) {
        console.error(`❌ Error al aplicar la migración ${file}.`);
        process.exit(1);
      }
      console.log(`✅ Migración ${file} aplicada correctamente.`);
    }
    
    console.log('🎉 Proceso de migración completado con éxito!');
  } catch (error) {
    console.error(`❌ Error inesperado: ${error.message}`);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar la función principal
main().catch(error => {
  console.error(`❌ Error fatal: ${error.message}`);
  process.exit(1);
}); 
#!/usr/bin/env node

/**
 * Script para aplicar migraciones a Supabase usando el cliente REST
 */

const fs = require('fs');
const path = require('path');
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
  console.error(`${colors.red}❌ Error: Las credenciales de Supabase no están configuradas.${colors.reset}`);
  console.error('Por favor, asegúrate de que tu archivo .env contiene:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio');
  process.exit(1);
}

// Crear cliente de Supabase con clave de servicio
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Directorio de migraciones
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

/**
 * Verifica si una tabla existe
 */
async function tableExists(tableName) {
  try {
    // Intentamos una consulta que fallará si la tabla no existe
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
}

/**
 * Ejecuta una consulta SQL
 */
async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    
    if (error) {
      throw new Error(`Error al ejecutar SQL: ${error.message}`);
    }
    
    if (data && data.success === false) {
      throw new Error(`Error en SQL: ${data.error}`);
    }
    
    return data;
  } catch (error) {
    throw new Error(`Error ejecutando SQL: ${error.message}`);
  }
}

/**
 * Registra una migración aplicada
 */
async function registerMigration(migrationName) {
  try {
    // Intentamos insertar en la tabla de migraciones
    const { error } = await supabase
      .from('migrations')
      .insert({ name: migrationName });
    
    if (error) {
      console.error(`${colors.yellow}⚠️ No se pudo registrar la migración: ${error.message}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.yellow}⚠️ Error al registrar migración: ${error.message}${colors.reset}`);
  }
}

/**
 * Verifica si una migración ya fue aplicada
 */
async function isMigrationApplied(migrationName) {
  try {
    const { data, error } = await supabase
      .from('migrations')
      .select('*')
      .eq('name', migrationName)
      .single();
    
    if (error) {
      return false;
    }
    
    return !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Aplica un archivo de migración
 */
async function applyMigration(filePath) {
  const fileName = path.basename(filePath);
  
  try {
    console.log(`${colors.cyan}📄 Aplicando migración: ${fileName}${colors.reset}`);
    
    // Comprobar si ya está aplicada
    const isApplied = await isMigrationApplied(fileName.replace('.sql', ''));
    if (isApplied) {
      console.log(`${colors.yellow}ℹ️ La migración ${fileName} ya fue aplicada anteriormente.${colors.reset}`);
      return true;
    }
    
    // Leer el archivo SQL
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Ejecutar el SQL usando la función RPC
    await executeSQL(sql);
    
    // Registrar la migración
    await registerMigration(fileName.replace('.sql', ''));
    
    console.log(`${colors.green}✅ Migración ${fileName} aplicada con éxito${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Error al aplicar migración ${fileName}: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Crea la tabla de migraciones si no existe
 */
async function ensureMigrationsTable() {
  try {
    const migrationTableExists = await tableExists('migrations');
    
    if (!migrationTableExists) {
      console.log(`${colors.yellow}⚠️ La tabla migrations no existe. Creándola...${colors.reset}`);
      
      const sql = `
        CREATE TABLE IF NOT EXISTS public.migrations (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_migrations_name ON public.migrations (name);
      `;
      
      await executeSQL(sql);
      console.log(`${colors.green}✅ Tabla migrations creada correctamente.${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error al verificar/crear tabla migrations: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}🚀 Iniciando proceso de migración de base de datos...${colors.reset}`);
  
  try {
    // Verificar que exista el directorio de migraciones
    if (!fs.existsSync(migrationsDir)) {
      console.error(`${colors.red}❌ No se encontró el directorio de migraciones: ${migrationsDir}${colors.reset}`);
      process.exit(1);
    }
    
    // Obtener todos los archivos de migración
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ordenar alfabéticamente
    
    if (migrationFiles.length === 0) {
      console.log(`${colors.yellow}ℹ️ No hay archivos de migración para aplicar.${colors.reset}`);
      process.exit(0);
    }
    
    // Primero, aplicar las funciones RPC
    console.log(`${colors.cyan}🔧 Aplicando primero las funciones RPC...${colors.reset}`);
    
    // Buscar el archivo de funciones RPC
    const rpcFile = migrationFiles.find(file => file.includes('setup_rpc_functions'));
    
    if (rpcFile) {
      const success = await applyMigration(path.join(migrationsDir, rpcFile));
      if (!success) {
        console.error(`${colors.red}❌ Error al aplicar las funciones RPC. Intentando continuar de todos modos...${colors.reset}`);
      } else {
        console.log(`${colors.green}✅ Funciones RPC aplicadas correctamente.${colors.reset}`);
      }
    } else {
      console.error(`${colors.red}❌ No se encontró el archivo de funciones RPC.${colors.reset}`);
    }
    
    // Crear la tabla de migraciones si no existe
    try {
      await ensureMigrationsTable();
    } catch (error) {
      console.error(`${colors.red}❌ No se pudo crear la tabla de migraciones. Continuando de todos modos...${colors.reset}`);
    }
    
    // Aplicar las migraciones de esquema (excepto las RPC que ya aplicamos)
    console.log(`${colors.cyan}🔄 Aplicando migraciones de esquema...${colors.reset}`);
    
    const schemaFiles = migrationFiles.filter(file => !file.includes('setup_rpc_functions'));
    
    let allSuccessful = true;
    
    for (const file of schemaFiles) {
      const success = await applyMigration(path.join(migrationsDir, file));
      if (!success) {
        console.error(`${colors.red}❌ Error al aplicar la migración ${file}.${colors.reset}`);
        allSuccessful = false;
      } else {
        console.log(`${colors.green}✅ Migración ${file} aplicada correctamente.${colors.reset}`);
      }
    }
    
    if (allSuccessful) {
      console.log(`${colors.bold}${colors.green}🎉 Proceso de migración completado con éxito!${colors.reset}`);
    } else {
      console.log(`${colors.bold}${colors.yellow}⚠️ Proceso de migración completado con algunos errores.${colors.reset}`);
      console.log(`Por favor, revisa los mensajes anteriores para más detalles.`);
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
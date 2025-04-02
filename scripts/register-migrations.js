#!/usr/bin/env node

/**
 * Script para registrar migraciones existentes
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
  console.error(`${colors.red}Error: Las credenciales de Supabase no están configuradas.${colors.reset}`);
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
 * Verifica si una migración ya está registrada
 */
async function isMigrationRegistered(migrationName) {
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
 * Registra una migración
 */
async function registerMigration(migrationName) {
  try {
    // Comprobar si ya está registrada
    const isRegistered = await isMigrationRegistered(migrationName);
    if (isRegistered) {
      console.log(`${colors.yellow}ℹ️ La migración ${migrationName} ya está registrada.${colors.reset}`);
      return true;
    }
    
    // Registrar la migración
    const { error } = await supabase
      .from('migrations')
      .insert({ name: migrationName });
    
    if (error) {
      console.error(`${colors.red}❌ Error al registrar la migración ${migrationName}: ${error.message}${colors.reset}`);
      return false;
    }
    
    console.log(`${colors.green}✅ Migración ${migrationName} registrada correctamente.${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Error al registrar la migración ${migrationName}: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}🚀 Registrando migraciones existentes...${colors.reset}`);
  
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
      console.log(`${colors.yellow}ℹ️ No hay archivos de migración para registrar.${colors.reset}`);
      process.exit(0);
    }
    
    // Registrar cada migración
    for (const file of migrationFiles) {
      const migrationName = file.replace('.sql', '');
      await registerMigration(migrationName);
    }
    
    console.log(`${colors.bold}${colors.green}🎉 Proceso de registro de migraciones completado!${colors.reset}`);
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
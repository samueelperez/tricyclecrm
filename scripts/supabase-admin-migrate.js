#!/usr/bin/env node

/**
 * Script para aplicar migraciones a Supabase usando la API de administración
 * 
 * Este script utiliza la API de administración de Supabase para ejecutar
 * SQL directamente sin las limitaciones de la API REST.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
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
const SUPABASE_PROJECT_ID = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

// Verificar credenciales
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(`${colors.red}❌ Error: Las credenciales básicas de Supabase no están configuradas.${colors.reset}`);
  console.error('Por favor, asegúrate de que tu archivo .env contiene:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio');
  process.exit(1);
}

// Verificar credenciales de administración
if (!SUPABASE_PROJECT_ID || !SUPABASE_ACCESS_TOKEN) {
  console.error(`${colors.red}❌ Error: Las credenciales de administración de Supabase no están configuradas.${colors.reset}`);
  console.error('Para usar la API de administración, necesitas añadir estas variables a tu .env:');
  console.error('  NEXT_PUBLIC_SUPABASE_PROJECT_ID=tu-id-de-proyecto');
  console.error('  SUPABASE_ACCESS_TOKEN=tu-token-de-acceso');
  console.error('');
  console.error(`${colors.yellow}Para obtener estas credenciales:${colors.reset}`);
  console.error('1. El ID del proyecto está en la URL de tu proyecto: https://app.supabase.com/project/<ID_PROYECTO>');
  console.error('2. Para el token de acceso:');
  console.error('   - Ve a https://app.supabase.com/account/tokens');
  console.error('   - Crea un nuevo token con los permisos adecuados');
  process.exit(1);
}

// Directorio de migraciones
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

/**
 * Cliente para la API de Administración de Supabase
 */
class SupabaseAdminClient {
  constructor(projectId, accessToken) {
    this.projectId = projectId;
    this.accessToken = accessToken;
    this.baseURL = 'https://api.supabase.com';
  }

  /**
   * Obtiene el cliente HTTP configurado con las credenciales
   */
  getClient() {
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Ejecuta una consulta SQL en la base de datos
   */
  async executeSQL(sql) {
    try {
      const client = this.getClient();
      const response = await client.post(`/v1/projects/${this.projectId}/sql`, { query: sql });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Error ejecutando SQL: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Verifica si la tabla existe en la base de datos
   */
  async tableExists(tableName) {
    try {
      const sql = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        );
      `;
      const result = await this.executeSQL(sql);
      return result.result && result.result[0] && result.result[0].exists;
    } catch (error) {
      console.error(`${colors.red}Error verificando si existe la tabla ${tableName}: ${error.message}${colors.reset}`);
      return false;
    }
  }
}

/**
 * Aplica un archivo de migración
 */
async function applyMigration(adminClient, filePath) {
  try {
    console.log(`${colors.cyan}📄 Aplicando migración: ${path.basename(filePath)}${colors.reset}`);
    
    // Leer el archivo SQL
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Ejecutar el SQL completo (la API de administración puede manejar múltiples sentencias)
    await adminClient.executeSQL(sql);
    
    console.log(`${colors.green}✅ Migración aplicada con éxito${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Error al aplicar migración ${path.basename(filePath)}: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}🚀 Iniciando proceso de migración de base de datos usando API de administración...${colors.reset}`);
  
  try {
    // Crear cliente de administración
    const adminClient = new SupabaseAdminClient(SUPABASE_PROJECT_ID, SUPABASE_ACCESS_TOKEN);
    
    // Verificar que exista el directorio de migraciones
    if (!fs.existsSync(migrationsDir)) {
      console.error(`${colors.red}❌ No se encontró el directorio de migraciones: ${migrationsDir}${colors.reset}`);
      process.exit(1);
    }
    
    // Obtener todos los archivos de migración
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ordenar alfabéticamente (importante para el orden de ejecución)
    
    if (migrationFiles.length === 0) {
      console.log(`${colors.yellow}ℹ️ No hay archivos de migración para aplicar.${colors.reset}`);
      process.exit(0);
    }
    
    // Verificar si existe la tabla migrations
    const hasMigrationsTable = await adminClient.tableExists('migrations');
    
    if (!hasMigrationsTable) {
      console.log(`${colors.yellow}⚠️ La tabla migrations no existe. Aplicando primero las funciones RPC...${colors.reset}`);
      
      // Buscar el archivo de funciones RPC
      const rpcFile = migrationFiles.find(file => file.includes('setup_rpc_functions'));
      
      if (rpcFile) {
        const success = await applyMigration(adminClient, path.join(migrationsDir, rpcFile));
        if (!success) {
          console.error(`${colors.red}❌ Error al aplicar las funciones RPC. No se puede continuar.${colors.reset}`);
          process.exit(1);
        }
        console.log(`${colors.green}✅ Funciones RPC aplicadas correctamente.${colors.reset}`);
      } else {
        console.error(`${colors.red}❌ No se encontró el archivo de funciones RPC.${colors.reset}`);
        process.exit(1);
      }
    }
    
    // Aplicar las migraciones de esquema
    console.log(`${colors.cyan}🔄 Aplicando migraciones de esquema...${colors.reset}`);
    
    const schemaFiles = migrationFiles.filter(file => !file.includes('setup_rpc_functions'));
    
    for (const file of schemaFiles) {
      const success = await applyMigration(adminClient, path.join(migrationsDir, file));
      if (!success) {
        console.error(`${colors.red}❌ Error al aplicar la migración ${file}.${colors.reset}`);
        process.exit(1);
      }
      console.log(`${colors.green}✅ Migración ${file} aplicada correctamente.${colors.reset}`);
    }
    
    console.log(`${colors.bold}${colors.green}🎉 Proceso de migración completado con éxito!${colors.reset}`);
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
#!/usr/bin/env node

/**
 * Script para ejecutar SQL directamente en Supabase
 * 
 * Este script toma un archivo SQL y lo envía a la API REST de Supabase
 * para ser ejecutado directamente.
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
  cyan: '\x1b[36m'
};

// Verificar argumentos
if (process.argv.length < 3) {
  console.log(`${colors.red}Error: Se requiere la ruta al archivo SQL${colors.reset}`);
  console.log(`${colors.yellow}Uso: node execute-sql.js <ruta-archivo-sql>${colors.reset}`);
  process.exit(1);
}

// Obtener ruta del archivo
const sqlFilePath = process.argv[2];
if (!fs.existsSync(sqlFilePath)) {
  console.log(`${colors.red}Error: No se encontró el archivo: ${sqlFilePath}${colors.reset}`);
  process.exit(1);
}

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

// Crear cliente Supabase con clave de servicio
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Leer el archivo SQL
console.log(`${colors.cyan}Leyendo archivo SQL: ${sqlFilePath}${colors.reset}`);
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Dividir el SQL en sentencias individuales
const statements = sqlContent
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt && !stmt.startsWith('--'));

console.log(`${colors.cyan}Se encontraron ${statements.length} sentencias SQL${colors.reset}`);

/**
 * Ejecuta una sentencia SQL en Supabase
 */
async function executeStatement(sql) {
  try {
    console.log(`${colors.yellow}Ejecutando SQL: ${sql.substring(0, 50)}...${colors.reset}`);
    
    // Hacer una solicitud POST directa a la API REST de Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'X-Client-Info': 'tricyclecrm-sql-executor'
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error de API (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`${colors.green}✓ SQL ejecutado correctamente${colors.reset}`);
    return result;
  } catch (error) {
    console.error(`${colors.red}❌ Error al ejecutar SQL: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}=== Ejecutando SQL en Supabase ===${colors.reset}`);
  console.log(`URL: ${SUPABASE_URL}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      console.log(`\n${colors.cyan}[${i+1}/${statements.length}] Ejecutando sentencia...${colors.reset}`);
      await executeStatement(statement);
      successCount++;
    } catch (error) {
      console.error(`${colors.red}Error en sentencia #${i+1}: ${error.message}${colors.reset}`);
      errorCount++;
      
      // Preguntar si continuar
      if (i < statements.length - 1) {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const shouldContinue = await new Promise(resolve => {
          readline.question(`${colors.yellow}¿Continuar con la siguiente sentencia? (s/n): ${colors.reset}`, answer => {
            readline.close();
            return resolve(answer.toLowerCase() === 's');
          });
        });
        
        if (!shouldContinue) {
          console.log(`${colors.yellow}Operación cancelada por el usuario${colors.reset}`);
          break;
        }
      }
    }
  }
  
  console.log(`\n${colors.bold}${colors.blue}=== Resultados ===${colors.reset}`);
  console.log(`Total de sentencias: ${statements.length}`);
  console.log(`${colors.green}Ejecutadas correctamente: ${successCount}${colors.reset}`);
  
  if (errorCount > 0) {
    console.log(`${colors.red}Fallidas: ${errorCount}${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bold}¡Todas las sentencias se ejecutaron correctamente!${colors.reset}`);
  }
}

// Ejecutar la función principal
main().catch(error => {
  console.error(`${colors.red}Error fatal: ${error.message}${colors.reset}`);
  process.exit(1);
}); 
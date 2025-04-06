#!/usr/bin/env node

/**
 * Script simple para verificar la integridad de la base de datos
 */

const { spawn } = require('child_process');
const path = require('path');

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

/**
 * Ejecuta un script y devuelve la promesa
 */
function runScript(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    
    if (args.length > 0) {
      console.log(`${colors.cyan}🔄 Ejecutando ${scriptName} con argumentos: ${args.join(' ')}...${colors.reset}`);
    } else {
      console.log(`${colors.cyan}🔄 Ejecutando ${scriptName}...${colors.reset}`);
    }
    
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`El script ${scriptName} salió con código ${code}`));
      }
    });
  });
}

/**
 * Función principal
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}🔍 Verificando la integridad de la base de datos...${colors.reset}`);
  
  try {
    // Verificar tablas existentes
    await runScript('check-tables.js');
    
    // Verificar migraciones aplicadas
    await runScript('check-applied-migrations.js');
    
    // Verificar estructura de tablas principales
    console.log(`${colors.cyan}\n🔍 Verificando estructuras de tablas principales...${colors.reset}`);
    
    const mainTables = ['clientes', 'proveedores', 'negocios', 'facturas_cliente', 'proformas'];
    for (const table of mainTables) {
      await runScript('check-table-structure.js', [table]);
      console.log(''); // Línea en blanco para separar
    }
    
    console.log(`${colors.bold}${colors.green}🎉 Verificación completada con éxito!${colors.reset}`);
    console.log(`${colors.green}La base de datos parece estar correctamente configurada.${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Error durante la verificación: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Ejecutar la función principal
main().catch(error => {
  console.error(`${colors.red}❌ Error fatal: ${error.message}${colors.reset}`);
  process.exit(1);
}); 
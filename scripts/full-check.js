#!/usr/bin/env node

/**
 * Script para realizar una verificación completa del sistema
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
 * Ejecuta un comando y devuelve la promesa
 */
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.cyan}🔄 Ejecutando: ${command} ${args.join(' ')}${colors.reset}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`El comando salió con código ${code}`));
      }
    });
  });
}

/**
 * Función principal
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}🔍 Iniciando verificación completa del sistema...${colors.reset}`);
  
  const steps = [
    { name: 'Verificar tablas existentes', command: 'npm', args: ['run', 'db:check-tables'] },
    { name: 'Verificar migraciones aplicadas', command: 'npm', args: ['run', 'db:check-migrations'] },
    { name: 'Verificar relaciones entre tablas', command: 'npm', args: ['run', 'db:check-relationships'] },
    { name: 'Verificar coherencia con la estructura del proyecto', command: 'npm', args: ['run', 'db:check-consistency'] }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  console.log(`${colors.blue}Se ejecutarán ${steps.length} verificaciones...${colors.reset}`);
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`\n${colors.bold}${colors.magenta}[${i+1}/${steps.length}] ${step.name}${colors.reset}`);
    console.log(`${colors.magenta}${'='.repeat(80)}${colors.reset}`);
    
    try {
      await runCommand(step.command, step.args);
      console.log(`${colors.green}✅ ${step.name} completado con éxito${colors.reset}`);
      successCount++;
    } catch (error) {
      console.error(`${colors.red}❌ ${step.name} falló: ${error.message}${colors.reset}`);
      failCount++;
    }
  }
  
  // Resultado final
  console.log(`\n${colors.bold}${colors.blue}📊 Resultado de la verificación completa${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}=================================${colors.reset}`);
  console.log(`${colors.green}✅ Verificaciones exitosas: ${successCount}/${steps.length}${colors.reset}`);
  
  if (failCount > 0) {
    console.log(`${colors.red}❌ Verificaciones fallidas: ${failCount}/${steps.length}${colors.reset}`);
    console.log(`${colors.yellow}⚠️ Se han encontrado problemas. Revisa los mensajes anteriores para más detalles.${colors.reset}`);
  } else {
    console.log(`${colors.bold}${colors.green}🎉 Todas las verificaciones completadas con éxito!${colors.reset}`);
    console.log(`${colors.green}El sistema parece estar correctamente configurado y coherente.${colors.reset}`);
  }
}

// Ejecutar la función principal
main().catch(error => {
  console.error(`${colors.red}❌ Error fatal: ${error.message}${colors.reset}`);
  process.exit(1);
}); 
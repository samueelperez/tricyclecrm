#!/usr/bin/env node

/**
 * Script de configuración inicial para la base de datos de TricycleCRM
 * 
 * Este script ejecuta todos los pasos necesarios para configurar la base de datos:
 * 1. Verificar credenciales de Supabase
 * 2. Aplicar migraciones
 * 3. Verificar integridad
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Configurar interfaz para preguntas
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Cargar variables de entorno
dotenv.config();

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Imprime un mensaje con formato
 */
function print(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Verifica las credenciales de Supabase en el archivo .env
 */
function checkSupabaseCredentials() {
  print('\n🔑 Verificando credenciales de Supabase...', colors.cyan);
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingVars = [];
  const incompleteVars = [];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value) {
      missingVars.push(varName);
    } else if (
      value.includes('tu-proyecto') || 
      value.includes('tu-clave') || 
      value === 'https://project.supabase.co'
    ) {
      incompleteVars.push(varName);
    }
  }
  
  if (missingVars.length > 0 || incompleteVars.length > 0) {
    print('\n❌ Algunas variables de entorno no están configuradas correctamente:', colors.red);
    
    if (missingVars.length > 0) {
      print(`   Variables faltantes: ${missingVars.join(', ')}`, colors.red);
    }
    
    if (incompleteVars.length > 0) {
      print(`   Variables con valores predeterminados: ${incompleteVars.join(', ')}`, colors.red);
    }
    
    print('\nPor favor, configura estas variables en el archivo .env con tus credenciales de Supabase.', colors.yellow);
    print('Puedes encontrar tus credenciales en el panel de control de Supabase:', colors.yellow);
    print('  - Project Settings > API', colors.dim);
    
    return false;
  }
  
  print('✅ Credenciales de Supabase configuradas correctamente.', colors.green);
  return true;
}

/**
 * Ejecuta un comando y maneja los errores
 */
function executeCommand(command, message) {
  try {
    print(`\n${message}`, colors.cyan);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    print(`\n❌ Error al ejecutar: ${command}`, colors.red);
    if (error.message) {
      print(error.message, colors.dim);
    }
    return false;
  }
}

/**
 * Imprime el resumen del proceso
 */
function printSummary(steps) {
  print('\n📋 Resumen del proceso:', colors.bright);
  
  let allSuccess = true;
  
  for (const [step, success] of Object.entries(steps)) {
    const status = success ? '✅' : '❌';
    const color = success ? colors.green : colors.red;
    print(`   ${status} ${step}`, color);
    
    if (!success) {
      allSuccess = false;
    }
  }
  
  print('\n');
  
  if (allSuccess) {
    print('🎉 ¡Configuración completada con éxito!', colors.green + colors.bright);
    print('Ahora puedes ejecutar `npm run dev` para iniciar la aplicación.', colors.green);
  } else {
    print('⚠️ La configuración se completó con algunos errores.', colors.yellow + colors.bright);
    print('Por favor, revisa los mensajes de error anteriores y corrige los problemas.', colors.yellow);
    print('Después, puedes volver a ejecutar este script o los comandos individuales.', colors.yellow);
  }
}

/**
 * Función principal
 */
async function main() {
  print('\n🚀 Iniciando configuración de la base de datos de TricycleCRM...', colors.bright + colors.cyan);
  
  const steps = {
    'Verificación de credenciales': false,
    'Aplicación de migraciones': false,
    'Verificación de integridad': false
  };
  
  // Paso 1: Verificar credenciales
  steps['Verificación de credenciales'] = checkSupabaseCredentials();
  
  if (!steps['Verificación de credenciales']) {
    print('\n⚠️ No se puede continuar sin las credenciales correctas de Supabase.', colors.yellow);
    printSummary(steps);
    rl.close();
    return;
  }
  
  // Paso 2: Aplicar migraciones
  steps['Aplicación de migraciones'] = executeCommand(
    'npm run db:apply-migrations',
    '🔄 Aplicando migraciones a la base de datos...'
  );
  
  if (!steps['Aplicación de migraciones']) {
    print('\n⚠️ No se pudieron aplicar todas las migraciones. Continuando con la verificación...', colors.yellow);
  }
  
  // Paso 3: Verificar integridad
  steps['Verificación de integridad'] = executeCommand(
    'npm run db:check',
    '🔍 Verificando integridad de la base de datos...'
  );
  
  // Imprimir resumen
  printSummary(steps);
  
  rl.close();
}

// Ejecutar la función principal
main().catch(error => {
  print(`\n❌ Error fatal: ${error.message}`, colors.red);
  if (error.stack) {
    print(error.stack, colors.dim);
  }
  process.exit(1);
}); 
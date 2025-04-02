#!/usr/bin/env node

/**
 * Script para vigilancia continua del esquema de base de datos de TricycleCRM
 * 
 * Este script vigila los cambios en los archivos de definición del esquema
 * y ejecuta automáticamente la sincronización cuando se detectan modificaciones.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chokidar = require('chokidar');

// Rutas de archivos a vigilar
const SCHEMA_FILE_PATHS = [
  '.cursor/dbManager.mdc',
  '.cursor/supabaseManager.mdc',
  '.cursor/crmDatabaseCLI.mdc'
];

// Función para ejecutar la auto-sincronización
function runAutoSync() {
  console.log('🔔 Cambios detectados en el esquema. Iniciando auto-sincronización...');
  
  const autoSyncProcess = spawn('node', ['scripts/db-auto-sync.js'], {
    stdio: 'inherit'
  });
  
  autoSyncProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ La auto-sincronización falló con código ${code}`);
      return;
    }
    
    console.log('👀 Continuando vigilancia de cambios en el esquema...');
  });
}

// Función para iniciar la vigilancia
function startWatching() {
  console.log('👀 Iniciando vigilancia de cambios en el esquema de base de datos...');
  console.log('📂 Archivos monitorizados:');
  SCHEMA_FILE_PATHS.forEach(file => console.log(`  - ${file}`));
  
  // Controlar debounce para no ejecutar múltiples sincronizaciones
  let timeoutId = null;
  
  // Configurar vigilancia de archivos
  const watcher = chokidar.watch(SCHEMA_FILE_PATHS, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100
    }
  });
  
  // Eventos de cambio, creación o eliminación
  watcher.on('change', handleFileChange);
  watcher.on('add', handleFileChange);
  watcher.on('unlink', handleFileChange);
  
  function handleFileChange(filePath) {
    console.log(`🔄 Cambio detectado en: ${filePath}`);
    
    // Debounce para evitar múltiples ejecuciones
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      runAutoSync();
    }, 2000); // Esperar 2 segundos después del último cambio
  }
  
  // Manejar señales de terminación
  process.on('SIGINT', () => {
    console.log('\n⏹️ Deteniendo la vigilancia del esquema...');
    watcher.close();
    process.exit(0);
  });
  
  console.log('✅ Vigilancia iniciada. Presiona Ctrl+C para detener.');
}

// Verificar si chokidar está instalado
try {
  require.resolve('chokidar');
  // Iniciar vigilancia
  startWatching();
} catch (err) {
  console.error('❌ Error: El módulo "chokidar" no está instalado.');
  console.error('Instálalo con el comando:');
  console.error('  npm install chokidar');
  process.exit(1);
} 
#!/usr/bin/env node

/**
 * Script de pre-commit de Husky para TricycleCRM
 * 
 * Actualiza los tipos TypeScript de Supabase antes de cada commit.
 */

const { spawn } = require('child_process');

// Función para ejecutar el proceso
async function main() {
  console.log('🔄 Ejecutando hook pre-commit para la base de datos...');
  
  try {
    // Ejecutar el script de actualización de tipos directamente
    const procesoUpdate = spawn('bash', ['scripts/update-supabase-types.sh'], {
      stdio: 'inherit'
    });
    
    procesoUpdate.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ La actualización de tipos falló con código ${code}`);
        process.exit(code);
      }
      
      console.log('✅ Actualización de tipos completada correctamente.');
    });
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    process.exit(1);
  }
}

// Ejecutar la función principal
main().catch(err => {
  console.error('❌ Error inesperado:', err);
  process.exit(1);
}); 
#!/usr/bin/env node

/**
 * Script de pre-build para TricycleCRM
 * 
 * Verifica el esquema de la base de datos antes de la compilación
 * para asegurarse de que esté actualizado.
 */

const { spawn } = require('child_process');

// Función principal
async function main() {
  console.log('🔍 Verificando esquema de base de datos antes de la compilación...');
  
  try {
    // Cargar el hook de base de datos a través de un proceso Node.js
    const procesoVerificacion = spawn('node', [
      '-e',
      `
      // Cargar el hook de base de datos
      const { buildHook } = require('../.cursor/crmDatabaseHooks.mdc');
      
      // Ejecutar hook
      async function verificarEsquema() {
        try {
          const resultado = await buildHook();
          
          if (!resultado.success) {
            console.error('❌ Error en la verificación de esquema:', resultado.message);
            process.exit(1);
          }
          
          if (resultado.isSchemaUpdated === false) {
            // En entorno local, solo advertimos
            if (process.env.NODE_ENV !== 'production') {
              console.warn('⚠️ El esquema de la base de datos no está actualizado.');
              console.warn('❗ Se recomienda sincronizar la base de datos antes de desplegar.');
              process.exit(0); // No fallar en desarrollo
            } else {
              // En producción, fallamos el build
              console.error('❌ ERROR: El esquema de la base de datos no está actualizado.');
              console.error('❗ Es obligatorio sincronizar la base de datos antes de desplegar.');
              process.exit(1);
            }
          }
          
          console.log('✅ Esquema de base de datos verificado correctamente.');
        } catch (error) {
          console.error('❌ Error inesperado:', error.message);
          
          // Solo fallamos en producción
          if (process.env.NODE_ENV === 'production') {
            process.exit(1);
          }
        }
      }
      
      verificarEsquema();
      `
    ], {
      stdio: 'inherit',
      env: process.env
    });
    
    procesoVerificacion.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ La verificación de esquema falló con código ${code}`);
        process.exit(code);
      }
      
      console.log('🎉 Verificación pre-build completada.');
    });
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    
    // Solo fallamos en producción
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// Ejecutar función principal
main().catch(err => {
  console.error('❌ Error inesperado:', err);
  
  // Solo fallamos en producción
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}); 
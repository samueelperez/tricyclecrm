#!/usr/bin/env node

/**
 * Script para auto-sincronización de la base de datos de TricycleCRM
 * 
 * Este script detecta cambios en el esquema, genera migraciones y las aplica
 * automáticamente sin intervención manual.
 */

// Importar módulos necesarios
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuración desde archivo .env o variables de entorno
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Asegurarse de que existan las credenciales
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Las credenciales de Supabase no están configuradas.');
  console.error('Asegúrate de que NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  console.error('estén definidas en tu archivo .env o en las variables de entorno.');
  process.exit(1);
}

// Función principal
async function main() {
  console.log('🔄 Auto-sincronizando esquema de base de datos TricycleCRM...');
  
  try {
    // Cargar módulos MDC a través de un proceso Node.js
    const procesoAutoSync = spawn('node', [
      '-e',
      `
      // Cargamos los gestores
      const { 
        compareDatabaseSchemas, 
        getCurrentDatabaseSchema, 
        createMigrationFile,
        ensureMigrationsTable,
        applyMigration,
        updateDatabaseTypes
      } = require('../.cursor/supabaseManager.mdc');
      
      // Crear cliente Supabase
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      
      // Auto-sincronización y aplicación
      async function autoSync() {
        try {
          // Preparar directorio de migraciones
          const dir = './supabase/migrations';
          if (!require('fs').existsSync(dir)){
              require('fs').mkdirSync(dir, { recursive: true });
          }
          
          // Asegurar que existe la tabla de migraciones
          console.log('🔧 Verificando tabla de migraciones...');
          await ensureMigrationsTable(supabase);
          
          // Obtener esquema actual
          console.log('📊 Obteniendo esquema actual de la base de datos...');
          const currentSchema = await getCurrentDatabaseSchema(supabase);
          
          if (!currentSchema) {
            throw new Error('No se pudo obtener el esquema de la base de datos');
          }
          
          // Comparar esquemas
          console.log('🔍 Comparando con esquema local...');
          const comparison = compareDatabaseSchemas(currentSchema);
          
          // Si no hay cambios, terminar
          if (!comparison.changes.description || comparison.changes.description.length === 0) {
            console.log('✅ El esquema está actualizado. No hay cambios que sincronizar.');
            return;
          }
          
          // Hay cambios, generar y aplicar migración
          console.log('📝 Cambios detectados:');
          comparison.changes.description.forEach(change => console.log('  - ' + change));
          
          // Generar migración
          const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const migrationName = 'auto_sync_' + timestamp + '_' + Math.floor(Math.random() * 1000);
          const migrationResult = createMigrationFile(migrationName, comparison.changes);
          
          // Guardar archivo de migración
          require('fs').writeFileSync(
            migrationResult.filePath,
            migrationResult.content
          );
          
          console.log('📄 Migración generada en: ' + migrationResult.filePath);
          
          // Aplicar migración automáticamente
          console.log('🚀 Aplicando migración automáticamente...');
          const resultado = await applyMigration(supabase, migrationResult.content);
          
          if (!resultado) {
            throw new Error('Error al aplicar la migración');
          }
          
          // Actualizar tipos TypeScript
          console.log('🔄 Actualizando tipos TypeScript...');
          const typesUpdate = updateDatabaseTypes();
          
          // Guardar tipos actualizados
          require('fs').writeFileSync(typesUpdate.filePath, typesUpdate.content);
          
          console.log('✅ Sincronización automática completada con éxito.');
          console.log('✅ Base de datos actualizada y tipos TypeScript regenerados.');
        } catch (error) {
          console.error('❌ Error:', error.message);
          process.exit(1);
        }
      }
      
      autoSync();
      `
    ], {
      env: process.env,
      stdio: 'inherit'
    });
    
    procesoAutoSync.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ El proceso terminó con código ${code}`);
        process.exit(code);
      }
      
      console.log('🎉 Proceso de auto-sincronización completado.');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar función principal
main().catch(err => {
  console.error('❌ Error inesperado:', err);
  process.exit(1);
}); 
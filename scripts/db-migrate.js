#!/usr/bin/env node

/**
 * Script para aplicar migraciones a la base de datos de TricycleCRM
 * 
 * Este script aplica las migraciones pendientes a la base de datos Supabase
 * y actualiza los tipos TypeScript.
 */

// Importar módulos necesarios
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

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

// Configurar interfaz de lectura de consola
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función auxiliar para preguntar
function pregunta(texto) {
  return new Promise((resolve) => {
    rl.question(texto, (respuesta) => {
      resolve(respuesta);
    });
  });
}

// Función para buscar archivos de migración
function buscarMigraciones() {
  const dirMigraciones = path.join(process.cwd(), 'supabase', 'migrations');
  
  // Verificar si el directorio existe
  if (!fs.existsSync(dirMigraciones)) {
    console.log('📁 Creando directorio de migraciones...');
    fs.mkdirSync(dirMigraciones, { recursive: true });
    return [];
  }
  
  // Leer archivos de migración
  return fs.readdirSync(dirMigraciones)
    .filter(archivo => archivo.endsWith('.sql'))
    .map(archivo => ({
      nombre: archivo,
      ruta: path.join(dirMigraciones, archivo),
      contenido: fs.readFileSync(path.join(dirMigraciones, archivo), 'utf8')
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre)); // Ordenar por nombre (que contiene timestamp)
}

// Función principal
async function main() {
  console.log('🚀 Aplicando migraciones a la base de datos TricycleCRM...');
  
  try {
    // Buscar migraciones pendientes
    const migraciones = buscarMigraciones();
    
    if (migraciones.length === 0) {
      console.log('ℹ️ No hay migraciones pendientes.');
      rl.close();
      return;
    }
    
    console.log(`📋 Encontradas ${migraciones.length} migraciones:`);
    migraciones.forEach((migracion, index) => {
      console.log(`  ${index + 1}. ${migracion.nombre}`);
    });
    
    // Confirmar aplicación de migraciones
    const confirmar = await pregunta('\n¿Deseas aplicar estas migraciones? (s/n): ');
    
    if (confirmar.toLowerCase() !== 's') {
      console.log('❌ Operación cancelada por el usuario.');
      rl.close();
      return;
    }
    
    console.log('\n🔄 Aplicando migraciones...');
    
    // Ejecutar proceso para aplicar migraciones
    const procesoMigrar = spawn('node', [
      '-e',
      `
      // Cargamos el gestor de Supabase
      const { ensureMigrationsTable, getAppliedMigrations, applyMigration, updateDatabaseTypes } = require('../.cursor/supabaseManager.mdc');
      
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
      
      // Migraciones encontradas
      const migraciones = ${JSON.stringify(migraciones)};
      
      // Aplicar migraciones
      async function aplicarMigraciones() {
        try {
          // Asegurar que existe la tabla de migraciones
          console.log('🔧 Verificando tabla de migraciones...');
          await ensureMigrationsTable(supabase);
          
          // Obtener migraciones ya aplicadas
          console.log('📊 Obteniendo migraciones aplicadas...');
          const migracionesAplicadas = await getAppliedMigrations(supabase);
          const nombresMigracionesAplicadas = migracionesAplicadas.map(m => m.name);
          
          // Filtrar migraciones pendientes
          const migracionesPendientes = migraciones.filter(
            m => !nombresMigracionesAplicadas.includes(m.nombre.replace('.sql', ''))
          );
          
          if (migracionesPendientes.length === 0) {
            console.log('✅ Todas las migraciones ya han sido aplicadas.');
            return;
          }
          
          console.log(\`🔄 Aplicando \${migracionesPendientes.length} migraciones pendientes...\`);
          
          // Aplicar cada migración
          for (const migracion of migracionesPendientes) {
            console.log(\`  - Aplicando: \${migracion.nombre}\`);
            const resultado = await applyMigration(supabase, migracion.contenido);
            
            if (!resultado) {
              throw new Error(\`Error al aplicar la migración: \${migracion.nombre}\`);
            }
          }
          
          console.log('✅ Todas las migraciones han sido aplicadas correctamente.');
          
          // Actualizar tipos TypeScript
          console.log('🔄 Actualizando tipos TypeScript...');
          const typesUpdate = updateDatabaseTypes();
          
          // Guardar tipos actualizados
          require('fs').writeFileSync(typesUpdate.filePath, typesUpdate.content);
          
          console.log('✅ Tipos TypeScript actualizados.');
        } catch (error) {
          console.error('❌ Error:', error.message);
          process.exit(1);
        }
      }
      
      aplicarMigraciones();
      `
    ], {
      env: process.env,
      stdio: 'inherit'
    });
    
    procesoMigrar.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ El proceso terminó con código ${code}`);
        process.exit(code);
      }
      
      console.log('\n🎉 Proceso de migración completado.');
      rl.close();
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Ejecutar función principal
main().catch(err => {
  console.error('❌ Error inesperado:', err);
  rl.close();
  process.exit(1);
}); 
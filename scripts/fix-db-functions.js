#!/usr/bin/env node

/**
 * Script para arreglar funciones SQL problemáticas en la base de datos.
 * Este script elimina las funciones conflictivas y las reconstruye desde cero.
 * 
 * Uso:
 * node scripts/fix-db-functions.js
 */

const http = require('http');
const https = require('https');
require('dotenv').config();

// URL del API
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

/**
 * Ejecuta SQL a través del endpoint API
 */
async function executeSQLViaAPI(sql) {
  return new Promise((resolve, reject) => {
    // Construir cuerpo de la petición
    const postData = JSON.stringify({
      sql,
      mode: 'execute' // Modo de ejecución directa
    });
    
    // Construir URL
    const url = new URL(`${API_URL}/api/db-sql`);
    
    // Opciones de la petición
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    // Crear petición
    const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (error) {
            reject(new Error(`Error al procesar la respuesta: ${error.message}`));
          }
        } else {
          reject(new Error(`Error HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.log(`⚠️ No se pudo conectar al servidor en ${API_URL}`);
        console.log('Por favor, asegúrate de que el servidor de desarrollo esté en ejecución.');
        
        // Alternativa: Intentar solución directa
        console.log('Intentando crear un script SQL para ejecutar manualmente...');
        require('fs').writeFileSync(
          'fix-db-functions.sql',
          getFunctionsSQLScript(),
          'utf8'
        );
        console.log('✅ Script SQL creado en fix-db-functions.sql');
        resolve({ success: false, error: 'Conexión rechazada' });
      } else {
        reject(error);
      }
    });
    
    // Enviar datos
    req.write(postData);
    req.end();
  });
}

/**
 * Obtiene el script SQL completo
 */
function getFunctionsSQLScript() {
  return `
  -- Script para corregir funciones problemáticas
  -- Ejecuta este script directamente en la consola SQL de Supabase
  
  -- Eliminar funciones existentes
  DROP FUNCTION IF EXISTS public.table_exists(text);
  DROP FUNCTION IF EXISTS public.get_columns(text);
  DROP FUNCTION IF EXISTS public.execute_sql(text);
  
  -- Recrear función table_exists
  CREATE OR REPLACE FUNCTION public.table_exists(table_name_param text)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $func$
  DECLARE
    exists_bool BOOLEAN;
  BEGIN
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = table_name_param
    ) INTO exists_bool;
    
    RETURN exists_bool;
  END;
  $func$;
  
  -- Recrear función get_columns
  CREATE OR REPLACE FUNCTION public.get_columns(table_name_param text)
  RETURNS TABLE (
    column_name text,
    data_type text,
    is_nullable text,
    column_default text,
    constraint_type text
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $func$
  BEGIN
    RETURN QUERY
    SELECT 
      c.column_name::text,
      c.data_type::text,
      c.is_nullable::text,
      c.column_default::text,
      tc.constraint_type::text
    FROM 
      information_schema.columns c
    LEFT JOIN 
      information_schema.constraint_column_usage ccu 
      ON c.column_name = ccu.column_name 
      AND c.table_name = ccu.table_name
    LEFT JOIN 
      information_schema.table_constraints tc 
      ON ccu.constraint_name = tc.constraint_name
    WHERE 
      c.table_schema = 'public' 
      AND c.table_name = table_name_param;
  END;
  $func$;
  
  -- Recrear función execute_sql
  CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
  RETURNS SETOF json
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $func$
  BEGIN
    EXECUTE sql;
    RETURN;
  END;
  $func$;
  `;
}

/**
 * Reconstruye todas las funciones SQL problemáticas
 */
async function rebuildProblemFunctions() {
  console.log('🔧 Reconstruyendo funciones SQL problemáticas...');
  
  try {
    // Si el API está disponible, usarlo
    if (API_URL) {
      console.log(`Ejecutando correcciones a través del API en ${API_URL}...`);
      
      // Obtener script SQL
      const sqlScript = getFunctionsSQLScript();
      
      // Ejecutar a través del API
      const result = await executeSQLViaAPI(sqlScript);
      
      if (result.success) {
        console.log('✅ Funciones SQL reconstruidas correctamente');
      } else {
        console.warn(`⚠️ Hubo problemas al reconstruir las funciones: ${result.error || 'Error desconocido'}`);
      }
    } else {
      console.warn('⚠️ No se ha definido API_URL. Generando script SQL...');
      
      // Crear archivo SQL
      require('fs').writeFileSync(
        'fix-db-functions.sql',
        getFunctionsSQLScript(),
        'utf8'
      );
      
      console.log('✅ Script SQL creado en fix-db-functions.sql');
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    
    // Crear archivo SQL como alternativa
    require('fs').writeFileSync(
      'fix-db-functions.sql',
      getFunctionsSQLScript(),
      'utf8'
    );
    
    console.log('✅ Script SQL creado en fix-db-functions.sql (ejecutar manualmente)');
  }
}

// Ejecutar el script
rebuildProblemFunctions()
  .then(() => {
    console.log('✅ Proceso completado');
    process.exit(0);
  })
  .catch(error => {
    console.error(`❌ Error en el proceso: ${error.message}`);
    process.exit(1);
  }); 
#!/usr/bin/env node

/**
 * Script para sincronizar el esquema de la base de datos de TricycleCRM
 * 
 * Este script detecta cambios en el esquema local y genera un archivo de migración
 * para aplicar a la base de datos Supabase.
 */

// Importar módulos necesarios
const fs = require('fs');
const path = require('path');

// Configuración desde archivo .env o variables de entorno
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Asegurarse de que existan las credenciales
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌ Error: Las credenciales de Supabase no están configuradas.\n');
  console.error('Para configurar correctamente la conexión a Supabase:');
  console.error('1. Copia el archivo .env.example a .env:');
  console.error('   cp .env.example .env');
  console.error('2. Edita el archivo .env y añade tus credenciales de Supabase:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio\n');
  console.error('Puedes encontrar estas credenciales en:');
  console.error('- Dashboard de Supabase > Project Settings > API');
  console.error('- La Service Role Key está en la sección "Project API keys"\n');
  process.exit(1);
}

// Función principal
async function main() {
  console.log('🔄 Sincronizando esquema de base de datos TricycleCRM...');
  
  try {
    // Importar directamente los módulos simplificados
    const dbManager = require('../.cursor/simplifiedDbManager');
    
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
    
    try {
      console.log('📊 Verificando estado de la base de datos...');
      
      // Intentar obtener información de la base de datos
      const { data: tablesResponse, error: tablesError } = await supabase
        .from('pg_catalog.pg_tables')
        .select('schemaname, tablename')
        .eq('schemaname', 'public');
        
      // Si falla, es posible que las funciones RPC no estén configuradas
      if (tablesError) {
        console.log('⚠️ No se pudieron obtener tablas, posiblemente las funciones RPC no están configuradas');
        console.log('🔧 Generando esquema completo basado en el esquema local');
        
        // Generar esquema completo para una base de datos nueva
        const migrationScript = dbManager.generateDatabaseScript(true);
        
        // Generar archivo de migración
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        const migrationName = `${timestamp}_full_schema_migration`;
        const migrationFilePath = `supabase/migrations/${migrationName}.sql`;
        
        // Asegurar que existe el directorio
        const dir = './supabase/migrations';
        if (!fs.existsSync(dir)){
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Guardar archivo de migración
        fs.writeFileSync(migrationFilePath, migrationScript);
        
        console.log('✅ Migración de esquema completo generada en:', migrationFilePath);
        console.log('');
        console.log('Para aplicar esta migración, debes:');
        console.log('1. Acceder al dashboard de Supabase');
        console.log('2. Ir a Database > SQL Editor');
        console.log('3. Pegar el contenido del archivo de migración y ejecutarlo');
        console.log('');
        console.log('También necesitarás configurar las funciones RPC necesarias.');
        
        // Generar también un archivo con las funciones RPC
        const rpcFunctionsSQL = `
-- Función para verificar si una tabla existe
CREATE OR REPLACE FUNCTION public.table_exists(table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = table_exists.table_name
  );
END;
$$;

-- Función para ejecutar SQL arbitrario (restringido a administradores)
CREATE OR REPLACE FUNCTION public.execute_sql(sql TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta función debe estar restringida a administradores
  -- mediante políticas de seguridad en Supabase
  EXECUTE sql;
END;
$$;

-- Función para obtener todas las tablas
CREATE OR REPLACE FUNCTION public.get_tables()
RETURNS TABLE(table_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT tables.table_name::TEXT
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
END;
$$;

-- Función para obtener las columnas de una tabla
CREATE OR REPLACE FUNCTION public.get_columns(table_name TEXT)
RETURNS TABLE(
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT,
  constraint_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    columns.column_name::TEXT,
    columns.data_type::TEXT,
    columns.is_nullable::TEXT,
    columns.column_default::TEXT,
    tc.constraint_type::TEXT
  FROM information_schema.columns
  LEFT JOIN information_schema.key_column_usage kcu
    ON columns.column_name = kcu.column_name
    AND columns.table_name = kcu.table_name
    AND columns.table_schema = kcu.table_schema
  LEFT JOIN information_schema.table_constraints tc
    ON kcu.constraint_name = tc.constraint_name
    AND kcu.table_schema = tc.table_schema
    AND tc.constraint_type = 'PRIMARY KEY'
  WHERE columns.table_schema = 'public'
  AND columns.table_name = get_columns.table_name;
END;
$$;

-- Función para obtener los índices de una tabla
CREATE OR REPLACE FUNCTION public.get_indexes(table_name TEXT)
RETURNS TABLE(
  index_name TEXT,
  column_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.relname::TEXT AS index_name,
    a.attname::TEXT AS column_name
  FROM
    pg_index idx
  JOIN pg_class i ON i.oid = idx.indexrelid
  JOIN pg_attribute a ON a.attrelid = idx.indrelid AND a.attnum = ANY(idx.indkey)
  JOIN pg_class t ON t.oid = idx.indrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE
    n.nspname = 'public'
    AND t.relname = get_indexes.table_name;
END;
$$;

-- Crear tabla de migraciones si no existe
CREATE TABLE IF NOT EXISTS public.migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_migrations_name ON public.migrations (name);
`;
        
        // Guardar archivo con las funciones RPC
        const rpcFilePath = `supabase/migrations/${timestamp}_setup_rpc_functions.sql`;
        fs.writeFileSync(rpcFilePath, rpcFunctionsSQL);
        
        console.log('✅ Funciones RPC generadas en:', rpcFilePath);
        
        return;
      }
      
      // Si podemos listar tablas, pero no usar las funciones RPC
      console.log('🔧 Generando script de actualización incremental basado en el esquema local');
      
      // Generar script de actualización incremental
      const updateScript = dbManager.generateDatabaseScript(false);
      
      // Generar archivo de migración incremental
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const migrationName = `${timestamp}_update_schema`;
      const migrationFilePath = `supabase/migrations/${migrationName}.sql`;
      
      // Asegurar que existe el directorio
      const dir = './supabase/migrations';
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Guardar archivo de migración
      fs.writeFileSync(
        migrationFilePath,
        `-- Actualización del esquema de base de datos
-- Generado automáticamente: ${new Date().toISOString()}

${updateScript}

-- Registrar migración
INSERT INTO public.migrations (name, applied_at) 
VALUES ('${migrationName}', NOW())
ON CONFLICT (name) DO NOTHING;
`
      );
      
      console.log('✅ Migración de actualización generada en:', migrationFilePath);
      console.log('');
      console.log('Para aplicar esta migración, puedes:');
      console.log('1. Acceder al dashboard de Supabase');
      console.log('2. Ir a Database > SQL Editor');
      console.log('3. Pegar el contenido del archivo de migración y ejecutarlo');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
    
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
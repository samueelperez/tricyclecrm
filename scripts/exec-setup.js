#!/usr/bin/env node

/**
 * Script para establecer las funciones RPC en Supabase
 * 
 * Este script crea las funciones RPC básicas necesarias para la
 * gestión de la base de datos de TricycleCRM.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

// Cargar variables de entorno
dotenv.config();

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar credenciales
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌ Error: Las credenciales de Supabase no están configuradas.\n');
  console.error('Por favor, asegúrate de que tu archivo .env contiene:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio');
  process.exit(1);
}

// Crear cliente Supabase con clave de servicio
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Funciones SQL a crear
const sqlFunctions = [
  {
    name: 'table_exists',
    sql: `
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
    `
  },
  {
    name: 'get_tables',
    sql: `
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
    `
  },
  {
    name: 'get_columns',
    sql: `
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
    `
  },
  {
    name: 'get_indexes',
    sql: `
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
    `
  },
  {
    name: 'execute_sql',
    sql: `
      CREATE OR REPLACE FUNCTION public.execute_sql(sql TEXT)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result JSONB;
      BEGIN
        EXECUTE sql;
        result := jsonb_build_object('success', true);
        RETURN result;
      EXCEPTION WHEN OTHERS THEN
        result := jsonb_build_object(
          'success', false,
          'error', SQLERRM,
          'error_code', SQLSTATE
        );
        RETURN result;
      END;
      $$;
    `
  },
  {
    name: 'migrations_table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_migrations_name ON public.migrations (name);
      
      INSERT INTO public.migrations (name) 
      VALUES ('20250330165628_setup_rpc_functions') 
      ON CONFLICT (name) DO NOTHING;
    `
  }
];

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Configurando funciones RPC en Supabase...');
  
  try {
    // Verificar si ya existen las funciones
    console.log('\n🔍 Verificando funciones existentes...');
    const { data: existingFunctions, error } = await supabase.rpc('get_tables');
    
    if (error && error.message.includes('get_tables')) {
      console.log('ℹ️ Las funciones RPC no están configuradas. Procediendo a crearlas...');
    } else {
      console.log('ℹ️ Algunas funciones RPC ya existen. Se actualizarán todas para asegurar coherencia.');
    }
    
    // Crear/actualizar cada función
    for (const func of sqlFunctions) {
      console.log(`\n🔄 Configurando función: ${func.name}`);
      
      try {
        // Usar REST API directamente para mayor fiabilidad
        const url = `${SUPABASE_URL}/rest/v1/`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: func.sql
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error API (${response.status}): ${errorText}`);
        }
        
        console.log(`✅ Función ${func.name} creada/actualizada correctamente`);
      } catch (error) {
        console.error(`❌ Error al configurar ${func.name}: ${error.message}`);
        if (error.message.includes('apikey')) {
          console.error('   Es posible que tus credenciales de Supabase sean incorrectas.');
          process.exit(1);
        }
      }
    }
    
    console.log('\n🎉 Configuración de funciones RPC completada!');
  } catch (error) {
    console.error(`\n❌ Error inesperado: ${error.message}`);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar la función principal
main().catch(error => {
  console.error(`\n❌ Error fatal: ${error.message}`);
  process.exit(1);
}); 
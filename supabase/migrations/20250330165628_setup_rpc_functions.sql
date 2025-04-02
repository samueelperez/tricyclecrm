-- Configuración de funciones RPC para TricycleCRM
-- Versión optimizada sin transacciones para compatibilidad con la API REST

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

-- Función para ejecutar SQL (separada para que pueda funcionar con la API REST)
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

-- Crear tabla de migraciones si no existe
CREATE TABLE IF NOT EXISTS public.migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_migrations_name ON public.migrations (name);

-- Registrar esta migración
INSERT INTO public.migrations (name) 
VALUES ('20250330165628_setup_rpc_functions') 
ON CONFLICT (name) DO NOTHING;

-- Función para aplicar la migración de proformas_productos de forma segura
CREATE OR REPLACE FUNCTION public.apply_proformas_migration()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar si la columna ya existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'proformas_productos' 
    AND column_name = 'proveedor_id'
  ) THEN
    -- Añadir la columna sin restricción de clave foránea
    EXECUTE 'ALTER TABLE public.proformas_productos ADD COLUMN proveedor_id INTEGER';
  END IF;
  
  -- No añadimos la restricción de clave foránea automáticamente para evitar errores
  -- Esta se añadirá mediante la función applyForeignKeyToProformasProductos cuando sea seguro
END;
$$;

-- Función para crear la tabla de migraciones si no existe
CREATE OR REPLACE FUNCTION public.create_migrations_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.migrations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  
  -- Políticas RLS para la tabla migrations
  ALTER TABLE public.migrations ENABLE ROW LEVEL SECURITY;
  
  -- Permitir que usuarios autenticados puedan ver las migraciones
  CREATE POLICY IF NOT EXISTS "Cualquier usuario puede ver migraciones" 
    ON public.migrations 
    FOR SELECT 
    USING (true);
  
  -- Permitir que solo los usuarios autenticados puedan modificar migraciones
  CREATE POLICY IF NOT EXISTS "Solo usuarios autenticados pueden modificar migraciones" 
    ON public.migrations 
    FOR ALL 
    USING (auth.role() = 'authenticated');
END;
$$;

-- Función para ejecutar SQL directamente
CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
  RETURN;
END;
$$;

-- Función para verificar si una tabla existe
CREATE OR REPLACE FUNCTION public.table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  exists_bool BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = table_name
  ) INTO exists_bool;
  
  RETURN exists_bool;
END;
$$;

-- Función para obtener las columnas de una tabla
CREATE OR REPLACE FUNCTION public.get_columns(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable text,
  column_default text,
  constraint_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    AND c.table_name = table_name;
END;
$$; 
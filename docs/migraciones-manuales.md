# Guía de Migraciones Manuales en Supabase

Esta guía proporciona instrucciones para ejecutar manualmente las migraciones necesarias en la base de datos Supabase cuando no pueden realizarse automáticamente.

## Tabla de Contenidos

1. [Migración proformas_productos](#migración-proformas_productos)
2. [Migración facturas_cliente](#migración-facturas_cliente)
3. [Creación de Funciones SQL Necesarias](#creación-de-funciones-sql-necesarias)

## Migración proformas_productos

Para añadir la columna `proveedor_id` a la tabla `proformas_productos`:

1. Accede al panel de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor" en el menú de la izquierda
4. Crea una nueva consulta haciendo clic en "New Query"
5. Pega y ejecuta la siguiente consulta SQL:

```sql
ALTER TABLE public.proformas_productos ADD COLUMN IF NOT EXISTS proveedor_id INTEGER;
```

## Migración facturas_cliente

Para añadir la columna `cliente_id` a la tabla `facturas_cliente` con referencia a `clientes`:

1. Accede al panel de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor" en el menú de la izquierda
4. Crea una nueva consulta haciendo clic en "New Query"
5. Pega y ejecuta la siguiente consulta SQL:

```sql
ALTER TABLE public.facturas_cliente ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES public.clientes(id);
```

## Creación de Funciones SQL Necesarias

Si necesitas crear las funciones SQL utilizadas por el sistema de migraciones automáticas:

1. Accede al panel de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor" en el menú de la izquierda
4. Crea una nueva consulta haciendo clic en "New Query"
5. Pega y ejecuta las siguientes consultas SQL:

```sql
-- Eliminar funciones existentes si hay problemas
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

-- Crear tabla de migraciones si no existe
CREATE TABLE IF NOT EXISTS public.migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'applied'
);

-- Políticas RLS para la tabla migrations
ALTER TABLE public.migrations ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'migrations' 
    AND policyname = 'Cualquier usuario puede ver migraciones'
  ) THEN
    CREATE POLICY "Cualquier usuario puede ver migraciones" 
      ON public.migrations 
      FOR SELECT 
      USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'migrations' 
    AND policyname = 'Solo usuarios autenticados pueden modificar migraciones'
  ) THEN
    CREATE POLICY "Solo usuarios autenticados pueden modificar migraciones" 
      ON public.migrations 
      FOR ALL 
      USING (auth.role() = 'authenticated');
  END IF;
END;
$$;
```

## Verificación de Migraciones

Para verificar si las migraciones se han aplicado correctamente:

1. Accede al panel de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "Table Editor" en el menú de la izquierda
4. Selecciona la tabla correspondiente (proformas_productos o facturas_cliente)
5. Verifica que las columnas nuevas aparezcan en la estructura de la tabla 
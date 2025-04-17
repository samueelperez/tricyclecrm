
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
  
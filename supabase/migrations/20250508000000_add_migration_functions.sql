-- Función para crear la tabla de migraciones si no existe
CREATE OR REPLACE FUNCTION public.create_migrations_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
  );
  
  -- Asegurar que la tabla tiene permisos correctos
  ALTER TABLE public.migrations ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Permitir acceso completo a todos los usuarios autenticados" ON public.migrations;
  CREATE POLICY "Permitir acceso completo a todos los usuarios autenticados" 
  ON public.migrations
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);
END;
$$;

-- Función para aplicar la migración de la tabla proformas_productos
CREATE OR REPLACE FUNCTION public.apply_proformas_migration()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar si la columna proveedor_id existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'proformas_productos' 
                AND column_name = 'proveedor_id') THEN
      -- Añadir columna proveedor_id
      ALTER TABLE public.proformas_productos ADD COLUMN proveedor_id integer;
      
      -- Crear índice para proveedor_id si no existe
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'proformas_productos' 
        AND indexname = 'idx_proformas_productos_proveedor_id'
      ) THEN
        CREATE INDEX idx_proformas_productos_proveedor_id ON public.proformas_productos (proveedor_id);
      END IF;
  END IF;
  
  -- Asegurarse de que las tablas tienen habilitado Row Level Security
  ALTER TABLE public.proformas_productos ENABLE ROW LEVEL SECURITY;
  
  -- Eliminar políticas existentes para evitar conflictos
  DROP POLICY IF EXISTS "Permitir acceso completo a todos los usuarios autenticados" ON public.proformas_productos;
  
  -- Crear políticas de acceso para permitir todas las operaciones a usuarios autenticados
  CREATE POLICY "Permitir acceso completo a todos los usuarios autenticados" 
  ON public.proformas_productos
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);
END;
$$; 
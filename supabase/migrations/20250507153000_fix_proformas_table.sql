-- Migración para corregir la tabla de proformas y establecer permisos
-- Fecha: 2025-05-07

-- Modificamos la tabla de proformas para ajustarla a los tipos actuales
-- Primero comprobamos si la tabla ya tiene las columnas necesarias
DO $$
BEGIN
    -- Verificar si la columna id_externo existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'proformas' 
                  AND column_name = 'id_externo') THEN
        -- Añadir columna id_externo
        ALTER TABLE public.proformas ADD COLUMN id_externo text;
        
        -- Actualizar los registros existentes para usar numero como id_externo
        UPDATE public.proformas SET id_externo = numero WHERE id_externo IS NULL;
        
        -- Hacer id_externo NOT NULL después de los datos actualizados
        ALTER TABLE public.proformas ALTER COLUMN id_externo SET NOT NULL;
    END IF;

    -- Verificar si la columna peso_total existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'proformas' 
                  AND column_name = 'peso_total') THEN
        -- Añadir columna peso_total
        ALTER TABLE public.proformas ADD COLUMN peso_total numeric;
    END IF;
    
    -- Verificar si la columna cantidad_contenedores existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'proformas' 
                  AND column_name = 'cantidad_contenedores') THEN
        -- Añadir columna cantidad_contenedores
        ALTER TABLE public.proformas ADD COLUMN cantidad_contenedores integer;
    END IF;
    
    -- Verificar si la columna origen existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'proformas' 
                  AND column_name = 'origen') THEN
        -- Añadir columna origen
        ALTER TABLE public.proformas ADD COLUMN origen text;
    END IF;
    
    -- Verificar si la columna puerto existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'proformas' 
                  AND column_name = 'puerto') THEN
        -- Añadir columna puerto
        ALTER TABLE public.proformas ADD COLUMN puerto text;
    END IF;
    
    -- Verificar si la columna id_fiscal existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'proformas' 
                  AND column_name = 'id_fiscal') THEN
        -- Añadir columna id_fiscal
        ALTER TABLE public.proformas ADD COLUMN id_fiscal text;
    END IF;
    
    -- Verificar si la columna cuenta_bancaria existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'proformas' 
                  AND column_name = 'cuenta_bancaria') THEN
        -- Añadir columna cuenta_bancaria
        ALTER TABLE public.proformas ADD COLUMN cuenta_bancaria text;
    END IF;
    
    -- Verificar si la columna terminos_pago existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'proformas' 
                  AND column_name = 'terminos_pago') THEN
        -- Añadir columna terminos_pago
        ALTER TABLE public.proformas ADD COLUMN terminos_pago text;
    END IF;
    
    -- Verificar si la columna terminos_entrega existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'proformas' 
                  AND column_name = 'terminos_entrega') THEN
        -- Añadir columna terminos_entrega
        ALTER TABLE public.proformas ADD COLUMN terminos_entrega text;
    END IF;
    
    -- Renombrar monto_total a monto si es necesario
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'proformas' 
              AND column_name = 'monto_total') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'proformas' 
                   AND column_name = 'monto') THEN
        -- Renombrar la columna
        ALTER TABLE public.proformas RENAME COLUMN monto_total TO monto;
    END IF;
    
    -- Renombrar condiciones_pago a terminos_pago si es necesario y la columna terminos_pago no existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'proformas' 
              AND column_name = 'condiciones_pago') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'proformas' 
                   AND column_name = 'terminos_pago') THEN
        -- Renombrar la columna
        ALTER TABLE public.proformas RENAME COLUMN condiciones_pago TO terminos_pago;
    END IF;
END$$;

-- Modificar la tabla de proformas_productos para que coincida con la implementación del frontend
DO $$
BEGIN
    -- Verificar si la columna proveedor_id existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'proformas_productos' 
                  AND column_name = 'proveedor_id') THEN
        -- Añadir columna proveedor_id
        ALTER TABLE public.proformas_productos ADD COLUMN proveedor_id integer;
    END IF;
    
    -- Verificar si la columna peso existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'proformas_productos' 
                  AND column_name = 'peso') THEN
        -- Añadir columna peso
        ALTER TABLE public.proformas_productos ADD COLUMN peso numeric;
    END IF;
    
    -- Verificar si la columna tipo_empaque existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'proformas_productos' 
                  AND column_name = 'tipo_empaque') THEN
        -- Añadir columna tipo_empaque
        ALTER TABLE public.proformas_productos ADD COLUMN tipo_empaque text;
    END IF;
    
    -- Verificar si la columna valor_total existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'proformas_productos' 
                  AND column_name = 'valor_total') THEN
        -- Añadir columna valor_total y establecer valores actuales desde subtotal
        ALTER TABLE public.proformas_productos ADD COLUMN valor_total numeric;
        
        -- Actualizar los registros existentes para usar subtotal como valor_total
        UPDATE public.proformas_productos SET valor_total = subtotal WHERE valor_total IS NULL;
    END IF;
END$$;

-- Asegurarse de que las tablas tienen habilitado Row Level Security
ALTER TABLE public.proformas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proformas_productos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Permitir acceso completo a todos los usuarios autenticados" ON public.proformas;
DROP POLICY IF EXISTS "Permitir acceso completo a todos los usuarios autenticados" ON public.proformas_productos;

-- Crear políticas de acceso para permitir todas las operaciones a usuarios autenticados
CREATE POLICY "Permitir acceso completo a todos los usuarios autenticados" 
ON public.proformas
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir acceso completo a todos los usuarios autenticados" 
ON public.proformas_productos
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Crear índices para mejorar el rendimiento si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_proformas_id_externo') THEN
        CREATE INDEX idx_proformas_id_externo ON public.proformas (id_externo);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_proformas_negocio_id') THEN
        CREATE INDEX idx_proformas_negocio_id ON public.proformas (negocio_id);
    END IF;

    -- Crear índice para proveedor_id si no existe y la columna existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'proformas_productos' 
              AND column_name = 'proveedor_id')
      AND NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'proformas_productos' 
        AND indexname = 'idx_proformas_productos_proveedor_id'
      ) THEN
        CREATE INDEX idx_proformas_productos_proveedor_id ON public.proformas_productos (proveedor_id);
    END IF;
END$$;

-- Registrar esta migración
INSERT INTO public.migrations (name) 
VALUES ('20250507153000_fix_proformas_table') 
ON CONFLICT (name) DO NOTHING; 
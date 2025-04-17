-- Script para añadir la columna cliente_nombre a la tabla proformas
-- Ejecutar este script en la consola SQL de Supabase

-- Verificar si la columna ya existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'proformas' 
        AND column_name = 'cliente_nombre'
    ) THEN
        -- Añadir la columna cliente_nombre
        ALTER TABLE public.proformas ADD COLUMN cliente_nombre TEXT;
        
        -- Comentario para la columna
        COMMENT ON COLUMN public.proformas.cliente_nombre IS 'Nombre del cliente asociado a la proforma para facilitar búsquedas';
        
        -- Actualizar la columna cliente_nombre con datos existentes
        UPDATE public.proformas p
        SET cliente_nombre = c.nombre
        FROM public.clientes c
        WHERE p.cliente_id = c.id AND p.cliente_id IS NOT NULL;
        
        RAISE NOTICE 'Columna cliente_nombre añadida correctamente a la tabla proformas';
    ELSE
        RAISE NOTICE 'La columna cliente_nombre ya existe en la tabla proformas';
    END IF;
END $$;

-- Añadir la columna 'categoria' a la tabla 'materiales' si no existe
ALTER TABLE materiales ADD COLUMN IF NOT EXISTS categoria TEXT;

-- Actualizar registros existentes para que tengan un valor por defecto en la columna 'categoria'
UPDATE materiales SET categoria = 'Sin categoría' WHERE categoria IS NULL;

-- Nota: Esta migración debe ejecutarse en el panel SQL de Supabase
-- o mediante la CLI de Supabase si está configurada correctamente. 
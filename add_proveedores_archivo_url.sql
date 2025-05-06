-- Añadir la columna archivo_url a la tabla proveedores si no existe
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS archivo_url TEXT;

-- Actualizar los registros existentes para generar la URL pública donde sea posible
UPDATE proveedores 
SET archivo_url = CONCAT('https://xxx.supabase.co/storage/v1/object/public/documentos/', ruta_archivo) 
WHERE ruta_archivo IS NOT NULL AND archivo_url IS NULL;

-- Nota: Reemplaza 'xxx.supabase.co' con la URL real de tu proyecto Supabase
-- Puedes encontrar esta URL en la configuración de tu proyecto en el dashboard de Supabase 
-- Agregar las columnas relacionadas con archivos adjuntos a la tabla proveedores si no existen
ALTER TABLE proveedores 
ADD COLUMN IF NOT EXISTS nombre_archivo TEXT,
ADD COLUMN IF NOT EXISTS ruta_archivo TEXT,
ADD COLUMN IF NOT EXISTS archivo_url TEXT;

-- Actualizar los datos existentes para evitar valores nulos
UPDATE proveedores
SET 
  nombre_archivo = NULL,
  ruta_archivo = NULL,
  archivo_url = NULL
WHERE nombre_archivo IS NULL OR ruta_archivo IS NULL OR archivo_url IS NULL;

-- Nota: El bucket de almacenamiento 'documentos' debe crearse desde la interfaz de Supabase
-- o usando las APIs de Supabase, no directamente por SQL.
-- Una vez creado el bucket, asegúrate de establecer las políticas de acceso apropiadas:
-- 1. Permitir lectura pública para el bucket 'documentos'
-- 2. Permitir escritura solo para usuarios autenticados 
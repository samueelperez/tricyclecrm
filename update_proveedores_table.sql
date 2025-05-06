-- Actualización de la tabla proveedores para corregir la gestión de archivos
-- Eliminar la columna archivo_url que ya no es necesaria
ALTER TABLE proveedores DROP COLUMN IF EXISTS archivo_url;

-- Asegurar que tenemos las columnas correctas para los archivos
ALTER TABLE proveedores 
  ADD COLUMN IF NOT EXISTS nombre_archivo TEXT,
  ADD COLUMN IF NOT EXISTS ruta_archivo TEXT;

-- Actualizar los registros que puedan tener valores nulos
UPDATE proveedores 
SET nombre_archivo = NULL, ruta_archivo = NULL
WHERE (nombre_archivo = '' OR ruta_archivo = '');

-- Actualizar la estructura de la tabla para mantener la consistencia
COMMENT ON COLUMN proveedores.nombre_archivo IS 'Nombre original del archivo subido';
COMMENT ON COLUMN proveedores.ruta_archivo IS 'Ruta del archivo en el almacenamiento de Supabase'; 
-- Migración para añadir las columnas sitio_web y comentarios a la tabla clientes
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS sitio_web TEXT,
ADD COLUMN IF NOT EXISTS comentarios TEXT;

-- Actualizar los clientes existentes con valores vacíos
UPDATE clientes
SET 
  sitio_web = '',
  comentarios = ''
WHERE sitio_web IS NULL OR comentarios IS NULL; 
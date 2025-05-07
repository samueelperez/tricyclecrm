-- Añadir columna para almacenar URLs de archivos adjuntos
ALTER TABLE facturas_proveedor 
ADD COLUMN IF NOT EXISTS url_adjunto TEXT;

-- Actualizar registros existentes con NULL
UPDATE facturas_proveedor
SET url_adjunto = NULL
WHERE url_adjunto IS NULL;

-- Agregar índice para búsquedas rápidas por URL
CREATE INDEX IF NOT EXISTS idx_facturas_proveedor_url_adjunto
ON facturas_proveedor(url_adjunto); 
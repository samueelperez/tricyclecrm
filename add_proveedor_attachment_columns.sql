-- Añadir columnas para manejo de archivos adjuntos a la tabla proveedores
ALTER TABLE proveedores 
ADD COLUMN IF NOT EXISTS nombre_archivo TEXT,
ADD COLUMN IF NOT EXISTS ruta_archivo TEXT;

-- Actualizar proveedor_id en nombre_archivo para asegurar que sea único
UPDATE proveedores
SET ruta_archivo = CONCAT('proveedores/', id, '_', EXTRACT(EPOCH FROM NOW())::text, '.', 
    (CASE 
        WHEN nombre_archivo LIKE '%.pdf' THEN 'pdf' 
        WHEN nombre_archivo LIKE '%.jpg' THEN 'jpg'
        WHEN nombre_archivo LIKE '%.jpeg' THEN 'jpeg'
        WHEN nombre_archivo LIKE '%.png' THEN 'png'
        ELSE 'pdf'
    END))
WHERE nombre_archivo IS NOT NULL AND ruta_archivo IS NULL; 
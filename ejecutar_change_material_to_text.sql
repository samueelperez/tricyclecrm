-- Este script se debe ejecutar en la consola SQL de Supabase para cambiar
-- el tipo de datos del campo material en la tabla facturas_cliente

-- 1. Cambiar el tipo de datos de material de VARCHAR(255) a TEXT
ALTER TABLE facturas_cliente 
ALTER COLUMN material TYPE TEXT;

-- 2. Añadir comentario para documentar el propósito de la columna
COMMENT ON COLUMN facturas_cliente.material IS 'Datos adicionales de la factura en formato JSON, como items, descripciones, etc.';

-- 3. Verificar que el cambio se haya aplicado correctamente
SELECT 
  column_name, 
  data_type,
  character_maximum_length
FROM 
  information_schema.columns 
WHERE 
  table_name = 'facturas_cliente' 
  AND column_name = 'material'; 
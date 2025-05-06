-- Este script se debe ejecutar en la consola SQL de Supabase para añadir
-- la columna ref_proforma a la tabla facturas_cliente

-- 1. Añadir la columna ref_proforma si no existe
ALTER TABLE facturas_cliente 
ADD COLUMN IF NOT EXISTS ref_proforma TEXT;

-- 2. Añadir comentario para documentar el propósito de la columna
COMMENT ON COLUMN facturas_cliente.ref_proforma IS 'Número o referencia externa de la proforma asociada';

-- 3. Verificar que la columna ha sido creada correctamente
SELECT 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_name = 'facturas_cliente' 
  AND column_name = 'ref_proforma'; 
-- Script para añadir el campo cuenta_bancaria a la tabla facturas_cliente

-- Añadir campo a la tabla facturas_cliente si no existe
ALTER TABLE facturas_cliente
ADD COLUMN IF NOT EXISTS cuenta_bancaria TEXT;

-- Actualizar facturas que no tengan la columna pero sí tengan la información en el campo material
UPDATE facturas_cliente
SET cuenta_bancaria = (
  CASE 
    WHEN material IS NOT NULL AND material::json->>'bankAccount' IS NOT NULL 
    THEN material::json->>'bankAccount' 
    ELSE cuenta_bancaria 
  END
)
WHERE cuenta_bancaria IS NULL AND material IS NOT NULL AND material::json->>'bankAccount' IS NOT NULL; 
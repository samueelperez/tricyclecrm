-- Añade las columnas puerto_origen y puerto_destino a la tabla facturas_cliente si no existen
ALTER TABLE facturas_cliente 
ADD COLUMN IF NOT EXISTS puerto_origen TEXT,
ADD COLUMN IF NOT EXISTS puerto_destino TEXT;

-- Añadir comentarios para documentar el propósito de las columnas
COMMENT ON COLUMN facturas_cliente.puerto_origen IS 'Puerto de origen para la factura';
COMMENT ON COLUMN facturas_cliente.puerto_destino IS 'Puerto de destino para la factura'; 
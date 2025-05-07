-- Crear tabla para los ítems de facturas
CREATE TABLE IF NOT EXISTS facturas_items (
  id SERIAL PRIMARY KEY,
  factura_id INTEGER NOT NULL,
  descripcion TEXT NOT NULL,
  cantidad DECIMAL(12,2) DEFAULT 1,
  peso DECIMAL(12,3),
  peso_unidad TEXT DEFAULT 'MT',
  precio_unitario DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  codigo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_facturas_items_factura_id ON facturas_items(factura_id);

-- Comentarios de la tabla
COMMENT ON TABLE facturas_items IS 'Almacena los items o líneas de las facturas';
COMMENT ON COLUMN facturas_items.factura_id IS 'ID de la factura a la que pertenece este item';
COMMENT ON COLUMN facturas_items.descripcion IS 'Descripción del producto o servicio';
COMMENT ON COLUMN facturas_items.cantidad IS 'Cantidad de unidades';
COMMENT ON COLUMN facturas_items.peso IS 'Peso en caso de productos vendidos por peso';
COMMENT ON COLUMN facturas_items.peso_unidad IS 'Unidad de medida del peso (MT por defecto)';
COMMENT ON COLUMN facturas_items.precio_unitario IS 'Precio por unidad o por unidad de peso';
COMMENT ON COLUMN facturas_items.total IS 'Valor total de la línea (precio_unitario * cantidad o peso)';
COMMENT ON COLUMN facturas_items.codigo IS 'Código de producto opcional';

-- Ejemplo de inserción de un item para una factura
/*
INSERT INTO facturas_items 
  (factura_id, descripcion, cantidad, peso, peso_unidad, precio_unitario, total, codigo) 
VALUES 
  (1, 'PP PLASTIC SCRAP', 1, 20.5, 'MT', 500.00, 10250.00, 'PP-001');
*/

-- Consulta para verificar si hay items de una factura
/*
SELECT * FROM facturas_items WHERE factura_id = 123;
*/

-- Ejemplo para migrar items desde el campo JSON en facturas_cliente
/*
-- Paso 1: Obtener facturas que tengan items en el campo material (JSON)
WITH facturas_con_items AS (
  SELECT 
    id,
    material->>'items_completos' AS items_json
  FROM facturas_cliente
  WHERE material->>'items_completos' IS NOT NULL
)

-- Paso 2: Para cada factura, extraer los items y convertirlos al formato de la nueva tabla
INSERT INTO facturas_items (factura_id, descripcion, cantidad, peso, precio_unitario, total, codigo)
SELECT 
  f.id AS factura_id,
  i->>'description' AS descripcion,
  (i->>'quantity')::DECIMAL AS cantidad,
  (i->>'weight')::DECIMAL AS peso,
  (i->>'unitPrice')::DECIMAL AS precio_unitario,
  (i->>'totalValue')::DECIMAL AS total,
  i->>'packaging' AS codigo
FROM facturas_con_items f,
JSONB_ARRAY_ELEMENTS(f.items_json::JSONB) AS i;
*/ 
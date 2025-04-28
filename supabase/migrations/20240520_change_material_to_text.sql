-- Cambia el tipo de datos del campo material de VARCHAR(255) a TEXT en la tabla facturas_cliente
ALTER TABLE facturas_cliente 
ALTER COLUMN material TYPE TEXT;

-- Añadir comentario para documentar el propósito de la columna
COMMENT ON COLUMN facturas_cliente.material IS 'Datos adicionales de la factura en formato JSON, como items, descripciones, etc.';

-- Registrar esta migración en la tabla migrations
INSERT INTO migrations (name, applied_at)
VALUES ('20240520_change_material_to_text', NOW())
ON CONFLICT (name) DO NOTHING; 
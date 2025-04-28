-- Añade la columna ref_proforma a la tabla facturas_cliente si no existe
ALTER TABLE facturas_cliente 
ADD COLUMN IF NOT EXISTS ref_proforma TEXT;

-- Añadir comentario para documentar el propósito de la columna
COMMENT ON COLUMN facturas_cliente.ref_proforma IS 'Número o referencia externa de la proforma asociada';

-- Registrar esta migración en la tabla migrations
INSERT INTO migrations (name, applied_at)
VALUES ('20240520_add_ref_proforma_to_facturas_cliente', NOW())
ON CONFLICT (name) DO NOTHING; 
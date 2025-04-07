-- Script para añadir la columna monto_estimado a la tabla negocios_proveedores
ALTER TABLE negocios_proveedores
ADD COLUMN IF NOT EXISTS monto_estimado DECIMAL(15, 2) DEFAULT 0;

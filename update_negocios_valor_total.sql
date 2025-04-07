-- Script para añadir la columna valor_total a la tabla negocios
ALTER TABLE negocios
ADD COLUMN IF NOT EXISTS valor_total DECIMAL(15, 2) DEFAULT 0;

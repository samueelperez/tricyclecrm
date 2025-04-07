-- Script para añadir columnas faltantes a la tabla negocios
ALTER TABLE negocios
ADD COLUMN IF NOT EXISTS nombre TEXT,
ADD COLUMN IF NOT EXISTS fecha_inicio DATE,
ADD COLUMN IF NOT EXISTS descripcion TEXT;

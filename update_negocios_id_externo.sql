-- Script para añadir la columna id_externo a la tabla negocios
ALTER TABLE negocios
ADD COLUMN IF NOT EXISTS id_externo TEXT NOT NULL DEFAULT 'CON-' || to_char(now(), 'YYYY-MM-DD');

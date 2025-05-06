-- Este script actualiza la tabla negocios_materiales para incluir todas las columnas necesarias
-- Ejecutar este script en la consola SQL de Supabase para reparar la estructura de la tabla

-- Asegurarse de que todas las columnas existan
ALTER TABLE negocios_materiales 
ADD COLUMN IF NOT EXISTS material_nombre TEXT NOT NULL DEFAULT 'Material desconocido';

-- Opcional: Agregar las columnas precio_unitario y subtotal para futuras implementaciones
-- Estas no son utilizadas actualmente por la aplicación, pero podrían añadirse en el futuro
ALTER TABLE negocios_materiales 
ADD COLUMN IF NOT EXISTS precio_unitario NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0;

-- Actualizar tipos de la tabla en la caché del esquema
-- Esto resuelve el error "Could not find the 'precio_unitario' column of 'negocios_materiales' in the schema cache"
SELECT pg_notify('pgrst', 'reload schema'); 
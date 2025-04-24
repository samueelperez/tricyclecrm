-- Migration: crear tabla de secciones para administrar visibilidad
-- Descripción: Crea la tabla 'sections' para gestionar qué secciones son visibles en la barra lateral

-- Crear la tabla sections si no existe
CREATE TABLE IF NOT EXISTS secciones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  route TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  visible BOOLEAN DEFAULT true,
  orden INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_secciones_visible ON secciones(visible);
CREATE INDEX IF NOT EXISTS idx_secciones_orden ON secciones(orden);

-- Trigger para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON secciones;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON secciones
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Insertar datos iniciales para las secciones principales
INSERT INTO secciones (id, name, route, icon, description, visible, orden)
SELECT * FROM (
  VALUES
    ('dashboard', 'Dashboard', '/dashboard', 'FiHome', 'Panel principal', true, 10),
    ('negocios', 'Negocios', '/negocios', 'FiTag', 'Gestión de negocios', true, 20),
    ('proformas', 'Proformas', '/proformas', 'FiFileText', 'Gestión de proformas', true, 30),
    ('facturas', 'Facturas', '/facturas', 'FiFileText', 'Gestión de facturas', true, 40),
    ('clientes', 'Clientes', '/clientes', 'FiUsers', 'Gestión de clientes', true, 50),
    ('proveedores', 'Proveedores', '/proveedores', 'FiUsers', 'Gestión de proveedores', true, 60),
    ('materiales', 'Materiales', '/materiales', 'FiPackage', 'Gestión de materiales', true, 70),
    ('albaranes', 'Albaranes', '/albaranes', 'FiClipboard', 'Gestión de albaranes', true, 80),
    ('envios', 'Envíos', '/envios', 'FiTruck', 'Gestión de envíos', true, 90),
    ('packing-lists', 'Listas de Empaque', '/packing-lists', 'FiList', 'Gestión de listas de empaque', true, 100),
    ('recibos', 'Recibos', '/recibos', 'FiCreditCard', 'Gestión de recibos', true, 110),
    ('instrucciones_bl', 'Instrucciones BL', '/instrucciones-bl', 'FiFileText', 'Gestión de instrucciones BL', true, 120),
    ('almacenamiento', 'Almacenamiento', '/archivos', 'FiCloud', 'Gestión de almacenamiento', true, 130),
    ('organizacion', 'Organización', '/organizacion', 'FiLayers', 'Gestión de organización', true, 140),
    ('chatbot', 'Asistente AI', '/chatbot', 'FiMessageCircle', 'Asistente virtual', true, 150),
    ('configuracion', 'Configuración', '/configuracion', 'FiSettings', 'Configuración del sistema', true, 160)
) AS default_values
WHERE 
  NOT EXISTS (SELECT 1 FROM secciones);

-- Función para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  SELECT email = 'admin@tricyclecrm.com' INTO is_admin_user
  FROM auth.users
  WHERE id = user_id;
  
  RETURN COALESCE(is_admin_user, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table names (para verificar si la tabla existe)
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE (table_name text) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT tablename::text FROM pg_tables 
  WHERE schemaname = 'public';
END;
$$; 
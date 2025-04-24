-- Migración: Crear tabla usuario_secciones para gestionar visibilidad por usuario
-- Descripción: Crea la tabla 'usuario_secciones' para almacenar qué secciones son visibles para cada usuario

-- Crear la tabla usuario_secciones si no existe
CREATE TABLE IF NOT EXISTS usuario_secciones (
  id SERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secciones_visibles TEXT[] NOT NULL DEFAULT '{}',
  actualizado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT usuario_secciones_usuario_id_key UNIQUE (usuario_id)
);

-- Índice para mejorar el rendimiento de las consultas por usuario
CREATE INDEX IF NOT EXISTS idx_usuario_secciones_usuario_id ON usuario_secciones(usuario_id);

-- Trigger para actualizar automáticamente el campo actualizado_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp_usuario_secciones()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_usuario_secciones ON usuario_secciones;
CREATE TRIGGER set_timestamp_usuario_secciones
BEFORE UPDATE ON usuario_secciones
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp_usuario_secciones();

-- Función para obtener las secciones visibles de un usuario
CREATE OR REPLACE FUNCTION get_visible_sections(user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  sections TEXT[];
BEGIN
  -- Si es el administrador, devolver todas las secciones
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id AND email = 'admin@tricyclecrm.com'
  ) THEN
    RETURN ARRAY[
      'dashboard', 'negocios', 'proformas', 'facturas', 'clientes', 
      'proveedores', 'materiales', 'albaranes', 'envios', 'packing-lists',
      'recibos', 'instrucciones_bl', 'almacenamiento', 'organizacion',
      'chatbot', 'configuracion'
    ];
  END IF;

  -- Para usuarios normales, obtener sus secciones específicas
  SELECT secciones_visibles INTO sections
  FROM usuario_secciones
  WHERE usuario_id = user_id;
  
  -- Si no tiene configuración, asignar secciones por defecto
  IF sections IS NULL OR array_length(sections, 1) IS NULL THEN
    sections := ARRAY[
      'dashboard', 'negocios', 'facturas', 'clientes', 'configuracion'
    ];
  END IF;
  
  RETURN sections;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
-- Migración: Crear tabla clientes_materiales
-- Descripción: Este script crea una tabla para relacionar clientes con los materiales que compran

-- Eliminar tabla si existe (para actualizaciones limpias)
DROP TABLE IF EXISTS clientes_materiales;

-- Crear tabla para gestionar la relación entre clientes y materiales
CREATE TABLE clientes_materiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_material FOREIGN KEY (material_id) REFERENCES materiales(id) ON DELETE CASCADE,
  CONSTRAINT uq_cliente_material UNIQUE (cliente_id, material_id)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_clientes_materiales_cliente_id ON clientes_materiales(cliente_id);
CREATE INDEX idx_clientes_materiales_material_id ON clientes_materiales(material_id);

-- Configurar Row Level Security (RLS)
ALTER TABLE clientes_materiales ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Primero eliminar si existen
DROP POLICY IF EXISTS "Todos pueden ver relaciones cliente-material" ON clientes_materiales;
DROP POLICY IF EXISTS "Usuarios autenticados pueden modificar relaciones cliente-material" ON clientes_materiales;

-- Crear políticas RLS
CREATE POLICY "Todos pueden ver relaciones cliente-material"
  ON clientes_materiales
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden modificar relaciones cliente-material"
  ON clientes_materiales
  USING (true);

-- Eliminar función y trigger si existen
DROP TRIGGER IF EXISTS set_updated_at_clientes_materiales ON clientes_materiales;
DROP FUNCTION IF EXISTS handle_updated_at_clientes_materiales();

-- Función para actualizar automáticamente updated_at
CREATE FUNCTION handle_updated_at_clientes_materiales()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente updated_at
CREATE TRIGGER set_updated_at_clientes_materiales
BEFORE UPDATE ON clientes_materiales
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at_clientes_materiales();

-- Función para obtener los materiales de un cliente
CREATE OR REPLACE FUNCTION get_cliente_materiales(cliente_id_param INTEGER)
RETURNS TABLE (
  material_id INTEGER,
  material_nombre TEXT,
  material_descripcion TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id AS material_id,
    m.nombre AS material_nombre,
    m.descripcion AS material_descripcion
  FROM 
    clientes_materiales cm
  JOIN 
    materiales m ON cm.material_id = m.id
  WHERE 
    cm.cliente_id = cliente_id_param;
END;
$$ LANGUAGE plpgsql; 
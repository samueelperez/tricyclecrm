-- Script para crear la tabla que relaciona clientes con materiales
-- Ejecutar este script en la consola SQL de Supabase

-- Eliminar tabla si existe (para actualización limpia)
DROP TABLE IF EXISTS clientes_materiales;

-- Crear tabla para relacionar clientes con materiales
CREATE TABLE clientes_materiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
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
DROP POLICY IF EXISTS "Cualquiera puede ver las relaciones cliente-material" ON clientes_materiales;
DROP POLICY IF EXISTS "Cualquiera puede administrar las relaciones cliente-material" ON clientes_materiales;

-- Crear políticas RLS
CREATE POLICY "Cualquiera puede ver las relaciones cliente-material"
  ON clientes_materiales
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cualquiera puede administrar las relaciones cliente-material"
  ON clientes_materiales
  USING (true);

-- Eliminar función y trigger si existen
DROP TRIGGER IF EXISTS set_updated_at_clientes_materiales ON clientes_materiales;
DROP FUNCTION IF EXISTS handle_updated_at_clientes_materiales();

-- Función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION handle_updated_at_clientes_materiales()
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
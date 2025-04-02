-- Migración para crear las tablas del módulo de Albaranes
-- Fecha: 2025-05-10

-- Crear tabla para albaranes
CREATE TABLE IF NOT EXISTS albaranes (
  id SERIAL PRIMARY KEY,
  id_externo VARCHAR(20) NOT NULL DEFAULT 'AUTO-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 16),
  numero_albaran VARCHAR(50),
  fecha DATE,
  estado VARCHAR(20) DEFAULT 'pendiente',
  notas TEXT,
  id_cliente INTEGER,
  id_proveedor INTEGER,
  total NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE albaranes IS 'Albaranes de clientes y proveedores';
COMMENT ON COLUMN albaranes.id_externo IS 'Identificador externo único para el albarán';
COMMENT ON COLUMN albaranes.numero_albaran IS 'Número de albarán, visible para el usuario';
COMMENT ON COLUMN albaranes.fecha IS 'Fecha del albarán';
COMMENT ON COLUMN albaranes.estado IS 'Estado del albarán: pendiente, completado, cancelado';
COMMENT ON COLUMN albaranes.notas IS 'Notas adicionales sobre el albarán';
COMMENT ON COLUMN albaranes.id_cliente IS 'ID del cliente (si es un albarán de cliente)';
COMMENT ON COLUMN albaranes.id_proveedor IS 'ID del proveedor (si es un albarán de proveedor)';
COMMENT ON COLUMN albaranes.total IS 'Total del albarán';

-- Crear tabla para los ítems de albaranes
CREATE TABLE IF NOT EXISTS albaran_items (
  id SERIAL PRIMARY KEY,
  id_albaran INTEGER NOT NULL REFERENCES albaranes(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  cantidad NUMERIC(10,2) DEFAULT 1,
  precio_unitario NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE albaran_items IS 'Ítems incluidos en los albaranes';
COMMENT ON COLUMN albaran_items.id_albaran IS 'ID del albarán al que pertenece el ítem';
COMMENT ON COLUMN albaran_items.descripcion IS 'Descripción del producto o servicio';
COMMENT ON COLUMN albaran_items.cantidad IS 'Cantidad del producto o servicio';
COMMENT ON COLUMN albaran_items.precio_unitario IS 'Precio unitario sin impuestos';
COMMENT ON COLUMN albaran_items.total IS 'Total del ítem (cantidad * precio_unitario)';

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_albaranes_id_cliente ON albaranes(id_cliente);
CREATE INDEX IF NOT EXISTS idx_albaranes_id_proveedor ON albaranes(id_proveedor);
CREATE INDEX IF NOT EXISTS idx_albaranes_numero_albaran ON albaranes(numero_albaran);
CREATE INDEX IF NOT EXISTS idx_albaranes_fecha ON albaranes(fecha);
CREATE INDEX IF NOT EXISTS idx_albaranes_estado ON albaranes(estado);
CREATE INDEX IF NOT EXISTS idx_albaran_items_id_albaran ON albaran_items(id_albaran);

-- Crear función para actualizar el total del albarán cuando se modifican los ítems
CREATE OR REPLACE FUNCTION actualizar_total_albaran()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE albaranes
  SET total = (
    SELECT COALESCE(SUM(total), 0)
    FROM albaran_items
    WHERE id_albaran = NEW.id_albaran
  )
  WHERE id = NEW.id_albaran;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar el total automáticamente
DROP TRIGGER IF EXISTS trigger_actualizar_total_albaran ON albaran_items;
CREATE TRIGGER trigger_actualizar_total_albaran
AFTER INSERT OR UPDATE OR DELETE ON albaran_items
FOR EACH ROW
EXECUTE FUNCTION actualizar_total_albaran();

-- Función para generar automáticamente el id_externo si es NULL
CREATE OR REPLACE FUNCTION set_default_id_externo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id_externo IS NULL THEN
    NEW.id_externo := 'AUTO-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 16);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para generar id_externo automáticamente
DROP TRIGGER IF EXISTS trigger_set_default_id_externo ON albaranes;
CREATE TRIGGER trigger_set_default_id_externo
BEFORE INSERT ON albaranes
FOR EACH ROW
EXECUTE FUNCTION set_default_id_externo();

-- Función para mantener el campo updated_at actualizado
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS trigger_update_albaranes_timestamp ON albaranes;
CREATE TRIGGER trigger_update_albaranes_timestamp
BEFORE UPDATE ON albaranes
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS trigger_update_albaran_items_timestamp ON albaran_items;
CREATE TRIGGER trigger_update_albaran_items_timestamp
BEFORE UPDATE ON albaran_items
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 
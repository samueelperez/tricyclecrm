-- Eliminar el índice problemático si existe
DROP INDEX IF EXISTS idx_facturas_cliente_cliente_id;

-- Crear tabla principal para listas de empaque
CREATE TABLE IF NOT EXISTS packing_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_externo TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  cliente_id TEXT, -- Cambiado de UUID a TEXT para compatibilidad con la tabla existente
  cliente_nombre TEXT NOT NULL,
  cliente_direccion TEXT,
  peso_total NUMERIC(12, 2) DEFAULT 0,
  bales_total INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas por id_externo
CREATE INDEX IF NOT EXISTS idx_packing_lists_id_externo ON packing_lists(id_externo);
CREATE INDEX IF NOT EXISTS idx_packing_lists_cliente ON packing_lists(cliente_id);

-- Crear tabla para los items de la lista de empaque (contenedores)
CREATE TABLE IF NOT EXISTS packing_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packing_list_id UUID NOT NULL REFERENCES packing_lists(id) ON DELETE CASCADE,
  container TEXT NOT NULL,
  precinto TEXT NOT NULL,
  bales INTEGER NOT NULL DEFAULT 0,
  weight NUMERIC(12, 2) NOT NULL DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para relación con listas de empaque
CREATE INDEX IF NOT EXISTS idx_packing_list_items_packing_list_id ON packing_list_items(packing_list_id);

-- Función para actualizar el timestamp de actualización automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el timestamp de la tabla packing_lists
CREATE TRIGGER update_packing_lists_updated_at
BEFORE UPDATE ON packing_lists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar el timestamp de la tabla packing_list_items
CREATE TRIGGER update_packing_list_items_updated_at
BEFORE UPDATE ON packing_list_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar peso_total y bales_total en la tabla packing_lists
CREATE OR REPLACE FUNCTION update_packing_list_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se está eliminando un registro, actualizar los totales
  IF (TG_OP = 'DELETE') THEN
    UPDATE packing_lists
    SET 
      peso_total = (SELECT COALESCE(SUM(weight), 0) FROM packing_list_items WHERE packing_list_id = OLD.packing_list_id),
      bales_total = (SELECT COALESCE(SUM(bales), 0) FROM packing_list_items WHERE packing_list_id = OLD.packing_list_id)
    WHERE id = OLD.packing_list_id;
    RETURN OLD;
  ELSE
    -- Si se está insertando o actualizando, actualizar los totales
    UPDATE packing_lists
    SET 
      peso_total = (SELECT COALESCE(SUM(weight), 0) FROM packing_list_items WHERE packing_list_id = NEW.packing_list_id),
      bales_total = (SELECT COALESCE(SUM(bales), 0) FROM packing_list_items WHERE packing_list_id = NEW.packing_list_id)
    WHERE id = NEW.packing_list_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers para mantener actualizados los totales cuando se modifican los items
CREATE TRIGGER update_totals_on_insert
AFTER INSERT ON packing_list_items
FOR EACH ROW
EXECUTE FUNCTION update_packing_list_totals();

CREATE TRIGGER update_totals_on_update
AFTER UPDATE ON packing_list_items
FOR EACH ROW
EXECUTE FUNCTION update_packing_list_totals();

CREATE TRIGGER update_totals_on_delete
AFTER DELETE ON packing_list_items
FOR EACH ROW
EXECUTE FUNCTION update_packing_list_totals();

-- Crear políticas RLS para seguridad
ALTER TABLE packing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_list_items ENABLE ROW LEVEL SECURITY;

-- Política que permite acceso a todos los usuarios autenticados (ajustar según necesidades)
CREATE POLICY "Permitir acceso completo a usuarios autenticados" 
ON packing_lists FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir acceso completo a usuarios autenticados" 
ON packing_list_items FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true); 
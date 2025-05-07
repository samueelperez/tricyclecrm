-- Script para migrar los items de facturas almacenados en el campo material (JSON)
-- a la nueva tabla facturas_items

-- Asegurarse de que la tabla facturas_items existe
CREATE TABLE IF NOT EXISTS facturas_items (
  id SERIAL PRIMARY KEY,
  factura_id INTEGER NOT NULL,
  descripcion TEXT NOT NULL,
  cantidad DECIMAL(12,2) DEFAULT 1,
  peso DECIMAL(12,3),
  peso_unidad TEXT DEFAULT 'MT',
  precio_unitario DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  codigo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice si no existe
CREATE INDEX IF NOT EXISTS idx_facturas_items_factura_id ON facturas_items(factura_id);

-- Paso 1: Migrar items desde factura_cliente, campo material->items_completos
DO $$
DECLARE
  factura_record RECORD;
  items_json JSONB;
  item_record JSONB;
BEGIN
  -- Recorrer todas las facturas de cliente
  FOR factura_record IN 
    SELECT id, material FROM facturas_cliente 
    WHERE material IS NOT NULL AND material != '{}'
  LOOP
    -- Intentar extraer el array de items_completos
    BEGIN
      items_json := (factura_record.material::JSONB)->>'items_completos';
      
      -- Si hay items, procesarlos
      IF items_json IS NOT NULL AND items_json != 'null' THEN
        -- Convertir a JSONB si está como string
        IF jsonb_typeof(items_json) = 'string' THEN
          items_json := items_json::JSONB;
        END IF;
        
        -- Recorrer cada item en el array JSON
        IF jsonb_typeof(items_json) = 'array' THEN
          FOR item_record IN SELECT * FROM jsonb_array_elements(items_json)
          LOOP
            -- Insertar en la tabla facturas_items
            INSERT INTO facturas_items (
              factura_id, 
              descripcion, 
              cantidad, 
              peso, 
              precio_unitario, 
              total, 
              codigo
            ) VALUES (
              factura_record.id,
              COALESCE(item_record->>'description', 'Sin descripción'),
              COALESCE((item_record->>'quantity')::DECIMAL, 1),
              NULLIF((item_record->>'weight')::DECIMAL, 0),
              COALESCE((item_record->>'unitPrice')::DECIMAL, 0),
              COALESCE((item_record->>'totalValue')::DECIMAL, 0),
              item_record->>'packaging'
            )
            ON CONFLICT DO NOTHING; -- Evitar duplicados
          END LOOP;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error procesando factura ID %: %', factura_record.id, SQLERRM;
      -- Continuar con la siguiente factura
      CONTINUE;
    END;
  END LOOP;
END $$;

-- Verificar resultados
SELECT 'Migración completada. Items migrados: ' || COUNT(*)::TEXT 
FROM facturas_items; 
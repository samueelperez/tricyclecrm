-- Esta migración actualiza los datos de las facturas_cliente para asegurar que
-- los valores de puerto_origen y puerto_destino estén correctamente establecidos
-- en sus columnas específicas, extrayendo los valores del campo material cuando sea necesario.

-- Primero, establece NULL en lugar de cadenas vacías para mantener consistencia
UPDATE facturas_cliente
SET puerto_origen = NULL
WHERE puerto_origen = '';

UPDATE facturas_cliente
SET puerto_destino = NULL
WHERE puerto_destino = '';

-- A continuación, actualiza facturas donde los puertos solo están en el campo material
DO $$
DECLARE
    factura_record RECORD;
BEGIN
    FOR factura_record IN 
        SELECT 
            id, 
            material 
        FROM 
            facturas_cliente 
        WHERE 
            (puerto_origen IS NULL OR puerto_destino IS NULL) 
            AND material IS NOT NULL
    LOOP
        -- Extrae información del campo material
        DECLARE
            material_data JSONB;
            puerto_origen_valor TEXT;
            puerto_destino_valor TEXT;
        BEGIN
            -- Intentar parsear material como JSON
            BEGIN
                material_data := factura_record.material::JSONB;
            EXCEPTION WHEN OTHERS THEN
                -- Si falla, continuar con la siguiente factura
                CONTINUE;
            END;
            
            -- Buscar puerto_origen bajo diferentes claves
            puerto_origen_valor := material_data->>'puerto_origen';
            IF puerto_origen_valor IS NULL THEN
                puerto_origen_valor := material_data->>'po';
            END IF;
            
            -- Buscar puerto_destino bajo diferentes claves
            puerto_destino_valor := material_data->>'puerto_destino';
            IF puerto_destino_valor IS NULL THEN
                puerto_destino_valor := material_data->>'pd';
            END IF;
            
            -- Actualizar solo si encontramos información de puertos
            IF puerto_origen_valor IS NOT NULL OR puerto_destino_valor IS NOT NULL THEN
                UPDATE facturas_cliente
                SET 
                    puerto_origen = CASE 
                        WHEN puerto_origen IS NULL AND puerto_origen_valor != '' 
                        THEN puerto_origen_valor 
                        ELSE puerto_origen 
                    END,
                    puerto_destino = CASE 
                        WHEN puerto_destino IS NULL AND puerto_destino_valor != '' 
                        THEN puerto_destino_valor 
                        ELSE puerto_destino 
                    END
                WHERE id = factura_record.id;
            END IF;
        END;
    END LOOP;
END $$;

-- Registrar esta migración en la tabla migrations
INSERT INTO migrations (name, applied_at)
VALUES ('20240520_update_puertos_facturas_cliente', NOW())
ON CONFLICT (name) DO NOTHING; 
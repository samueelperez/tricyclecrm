-- Este script se debe ejecutar en la consola SQL de Supabase para actualizar
-- registros existentes y asegurar que los valores de puerto_origen y puerto_destino
-- estén correctamente establecidos en sus columnas específicas.

-- 1. Primero, asegurarse de que las columnas existan
ALTER TABLE facturas_cliente 
ADD COLUMN IF NOT EXISTS puerto_origen TEXT,
ADD COLUMN IF NOT EXISTS puerto_destino TEXT;

-- 2. Actualizar puerto_origen y puerto_destino para registros
-- donde el material JSON contiene esta información
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
            material IS NOT NULL
    LOOP
        -- Extraer información del campo material
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
                        WHEN (puerto_origen IS NULL OR puerto_origen = '') AND puerto_origen_valor != '' 
                        THEN puerto_origen_valor 
                        ELSE puerto_origen 
                    END,
                    puerto_destino = CASE 
                        WHEN (puerto_destino IS NULL OR puerto_destino = '') AND puerto_destino_valor != '' 
                        THEN puerto_destino_valor 
                        ELSE puerto_destino 
                    END
                WHERE id = factura_record.id;
            END IF;
        END;
    END LOOP;
END $$;

-- 3. Eliminar valores vacíos, cambiando a NULL
UPDATE facturas_cliente
SET puerto_origen = NULL
WHERE puerto_origen = '';

UPDATE facturas_cliente
SET puerto_destino = NULL
WHERE puerto_destino = '';

-- 4. Verificar los resultados
SELECT 
    id, 
    id_externo, 
    puerto_origen, 
    puerto_destino
FROM 
    facturas_cliente 
ORDER BY 
    id DESC 
LIMIT 20; 
-- Verificar si el índice existe y eliminarlo si es así
DROP INDEX IF EXISTS idx_facturas_cliente_cliente_id;

-- Verificar la estructura de la tabla facturas_cliente
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Comprobar si la columna cliente_id existe
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'facturas_cliente'
        AND column_name = 'cliente_id'
    ) INTO column_exists;
    
    -- Si la columna no existe, verificar si existe una columna alternativa como cliente o id_cliente
    IF NOT column_exists THEN
        -- Verificar si existe la columna 'cliente'
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'facturas_cliente'
            AND column_name = 'cliente'
        ) INTO column_exists;
        
        -- Si existe la columna 'cliente', crear un índice en ella
        IF column_exists THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_facturas_cliente_cliente ON public.facturas_cliente (cliente)';
            RAISE NOTICE 'Creado índice en la columna "cliente"';
        ELSE
            -- Verificar si existe la columna 'id_cliente'
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public'
                AND table_name = 'facturas_cliente'
                AND column_name = 'id_cliente'
            ) INTO column_exists;
            
            -- Si existe la columna 'id_cliente', crear un índice en ella
            IF column_exists THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_facturas_cliente_id_cliente ON public.facturas_cliente (id_cliente)';
                RAISE NOTICE 'Creado índice en la columna "id_cliente"';
            ELSE
                RAISE NOTICE 'No se encontró una columna adecuada para crear un índice de cliente en facturas_cliente';
            END IF;
        END IF;
    ELSE
        -- Si la columna cliente_id existe, crear el índice
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_facturas_cliente_cliente_id ON public.facturas_cliente (cliente_id)';
        RAISE NOTICE 'Creado índice en la columna "cliente_id"';
    END IF;
END $$; 
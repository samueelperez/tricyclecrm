-- Migración para añadir la relación entre tareas y perfiles (usuarios)
-- Fecha: 2025-04-01

-- Verificar si ya existe la restricción
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_tareas_asignado_a'
        AND table_name = 'tareas'
    ) THEN
        -- Agregar restricción de clave foránea para asignado_a en tareas
        ALTER TABLE tareas
        ADD CONSTRAINT fk_tareas_asignado_a
        FOREIGN KEY (asignado_a)
        REFERENCES perfiles(id)
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Restricción fk_tareas_asignado_a añadida correctamente';
    ELSE
        RAISE NOTICE 'La restricción fk_tareas_asignado_a ya existe';
    END IF;
END $$;

-- Crear índice para mejorar el rendimiento de las consultas con esta relación
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_tareas_asignado_a'
    ) THEN
        CREATE INDEX idx_tareas_asignado_a ON tareas(asignado_a);
        RAISE NOTICE 'Índice idx_tareas_asignado_a creado correctamente';
    ELSE
        RAISE NOTICE 'El índice idx_tareas_asignado_a ya existe';
    END IF;
END $$;

-- Registrar esta migración en la tabla de migraciones
INSERT INTO migrations (name, applied_at) 
VALUES ('20250401120500_add_task_user_relation', NOW())
ON CONFLICT (name) DO NOTHING; 
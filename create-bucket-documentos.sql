-- Script para crear el bucket "documentos" en Supabase
-- Este script debe ejecutarse en la consola SQL de Supabase

-- Verificar si existe el bucket "documentos"
DO $$
DECLARE
    bucket_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM storage.buckets WHERE name = 'documentos'
    ) INTO bucket_exists;

    IF bucket_exists THEN
        RAISE NOTICE 'El bucket "documentos" ya existe.';
    ELSE
        -- Crear el bucket "documentos"
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('documentos', 'documentos', false);
        
        RAISE NOTICE 'Bucket "documentos" creado correctamente.';
        
        -- Configurar políticas de acceso para el bucket
        -- Política para permitir a usuarios autenticados leer archivos
        INSERT INTO storage.policies (name, definition, bucket_id)
        VALUES (
            'Acceso de lectura para usuarios autenticados',
            '(auth.role() = ''authenticated'')',
            'documentos'
        );
        
        -- Política para permitir a usuarios autenticados subir archivos
        INSERT INTO storage.policies (name, definition, bucket_id)
        VALUES (
            'Acceso de escritura para usuarios autenticados',
            '(auth.role() = ''authenticated'')',
            'documentos'
        );
        
        RAISE NOTICE 'Políticas de acceso configuradas correctamente.';
    END IF;
END
$$; 
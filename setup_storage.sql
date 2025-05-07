-- Script para configurar el bucket 'documentos' en Supabase Storage
-- Crear el bucket si no existe (NOTA: Esto debe ejecutarse desde Cloud Functions o desde el lado del servidor,
-- ya que las operaciones de buckets son administrativas)

-- Asegurar que las tablas tienen los campos necesarios para manejar archivos adjuntos

-- Para la tabla proveedores
ALTER TABLE IF EXISTS public.proveedores 
ADD COLUMN IF NOT EXISTS nombre_archivo TEXT,
ADD COLUMN IF NOT EXISTS ruta_archivo TEXT;

-- Verificar que las políticas de seguridad permiten el acceso a Storage
-- Esto debe configurarse manualmente en el panel de Supabase:

/*
1. Ve a la consola de Supabase: app.supabase.com
2. Selecciona tu proyecto
3. Ve a Storage en el menú lateral
4. Crea un bucket llamado 'documentos' si no existe
5. Configura las siguientes políticas:

Para SELECT (Leer archivos):
- Nombre: "Usuarios autenticados pueden leer cualquier archivo"
- Rol: authenticated
- Definición de la política: true

Para INSERT (Subir archivos):
- Nombre: "Usuarios autenticados pueden subir archivos"
- Rol: authenticated
- Definición de la política: true

Para UPDATE:
- Nombre: "Usuarios autenticados pueden actualizar archivos"
- Rol: authenticated
- Definición de la política: true

Para DELETE:
- Nombre: "Usuarios autenticados pueden eliminar archivos"
- Rol: authenticated
- Definición de la política: true
*/

-- Instrucciones para configurar manualmente el bucket en Supabase:
-- 1. Inicia sesión en la consola de Supabase
-- 2. Ve a Storage > Buckets
-- 3. Haz clic en "New Bucket"
-- 4. Nombre: documentos
-- 5. Configuración Public: NO (privado, requerirá autenticación)
-- 6. Haz clic en "Create Bucket"

-- Configuración de políticas de ejemplo (esto debe hacerse desde la UI de Supabase):
-- SELECT: true
-- INSERT: true
-- UPDATE: true
-- DELETE: true 
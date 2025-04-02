# Guía para ejecutar migraciones manualmente en Supabase

Debido a las limitaciones de la API REST de Supabase para ejecutar ciertos comandos SQL, a veces es necesario ejecutar las migraciones manualmente a través de la interfaz de Supabase.

## Alternativa automática (Recomendada)

Ahora contamos con un método automatizado que utiliza la API de administración de Supabase para aplicar las migraciones sin intervención manual:

```bash
npm run db:admin-migrate
```

Para que este método funcione, necesitas configurar correctamente las siguientes variables en tu archivo `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio
NEXT_PUBLIC_SUPABASE_PROJECT_ID=tu-id-de-proyecto
SUPABASE_ACCESS_TOKEN=tu-token-de-acceso
```

Para obtener el token de acceso:
1. Ve a [https://app.supabase.com/account/tokens](https://app.supabase.com/account/tokens)
2. Crea un nuevo token con los permisos necesarios
3. Cópialo a tu archivo `.env`

El ID del proyecto está en la URL de tu proyecto: `https://app.supabase.com/project/<ID_PROYECTO>`

## Alternativa utilizando el cliente REST

Si encuentras problemas con la API de administración, puedes utilizar una implementación alternativa que usa el cliente REST normal:

```bash
npm run db:direct-migrate
```

Esta implementación intentará aplicar las migraciones utilizando la función RPC `execute_sql`. Requiere que la función RPC ya esté instalada.

## Verificación y registro de migraciones

Para verificar qué tablas existen en la base de datos:

```bash
npm run db:check-tables
```

Para verificar qué migraciones se han aplicado:

```bash
npm run db:check-migrations
```

Para registrar las migraciones en la tabla `migrations` (útil cuando has aplicado migraciones manualmente):

```bash
npm run db:register-migrations
```

## Pasos para aplicar las migraciones manualmente

### 1. Acceder al panel de Supabase

1. Ve a [https://app.supabase.com/](https://app.supabase.com/) e inicia sesión en tu cuenta.
2. Selecciona el proyecto de TricycleCRM.

### 2. Configurar las funciones RPC

1. En el menú lateral izquierdo, haz clic en "SQL Editor".
2. Haz clic en "New Query" (o "Nueva Consulta").
3. Copia y pega el siguiente código SQL:

```sql
-- Función para verificar si una tabla existe
CREATE OR REPLACE FUNCTION public.table_exists(table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = table_exists.table_name
  );
END;
$$;

-- Función para obtener todas las tablas
CREATE OR REPLACE FUNCTION public.get_tables()
RETURNS TABLE(table_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT tables.table_name::TEXT
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
END;
$$;

-- Función para obtener las columnas de una tabla
CREATE OR REPLACE FUNCTION public.get_columns(table_name TEXT)
RETURNS TABLE(
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT,
  constraint_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    columns.column_name::TEXT,
    columns.data_type::TEXT,
    columns.is_nullable::TEXT,
    columns.column_default::TEXT,
    tc.constraint_type::TEXT
  FROM information_schema.columns
  LEFT JOIN information_schema.key_column_usage kcu
    ON columns.column_name = kcu.column_name
    AND columns.table_name = kcu.table_name
    AND columns.table_schema = kcu.table_schema
  LEFT JOIN information_schema.table_constraints tc
    ON kcu.constraint_name = tc.constraint_name
    AND kcu.table_schema = tc.table_schema
    AND tc.constraint_type = 'PRIMARY KEY'
  WHERE columns.table_schema = 'public'
  AND columns.table_name = get_columns.table_name;
END;
$$;

-- Función para obtener los índices de una tabla
CREATE OR REPLACE FUNCTION public.get_indexes(table_name TEXT)
RETURNS TABLE(
  index_name TEXT,
  column_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.relname::TEXT AS index_name,
    a.attname::TEXT AS column_name
  FROM
    pg_index idx
  JOIN pg_class i ON i.oid = idx.indexrelid
  JOIN pg_attribute a ON a.attrelid = idx.indrelid AND a.attnum = ANY(idx.indkey)
  JOIN pg_class t ON t.oid = idx.indrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE
    n.nspname = 'public'
    AND t.relname = get_indexes.table_name;
END;
$$;

-- Función para ejecutar SQL
CREATE OR REPLACE FUNCTION public.execute_sql(sql TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE sql;
  result := jsonb_build_object('success', true);
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
  RETURN result;
END;
$$;

-- Crear tabla de migraciones si no existe
CREATE TABLE IF NOT EXISTS public.migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_migrations_name ON public.migrations (name);

-- Registrar esta migración
INSERT INTO public.migrations (name) 
VALUES ('20250330165628_setup_rpc_functions') 
ON CONFLICT (name) DO NOTHING;
```

4. Haz clic en "Run" (o "Ejecutar") para ejecutar el código SQL.
5. Verifica que no haya errores en la ejecución.

### 3. Aplicar la migración del esquema completo

1. Crea una nueva consulta SQL (haciendo clic en "New Query" o "Nueva Consulta").
2. Abre el archivo `supabase/migrations/20250330165628_full_schema_migration.sql` en tu editor local.
3. Copia todo el contenido del archivo y pégalo en la ventana de consulta SQL de Supabase.
4. Haz clic en "Run" (o "Ejecutar") para ejecutar el código SQL.
5. Si hay errores, lee atentamente los mensajes de error y corrige los problemas.

### 4. Verificar la migración

1. Después de ejecutar las migraciones, puedes verificar que las tablas se hayan creado correctamente yendo a la sección "Table Editor" (o "Editor de Tablas").
2. Deberías ver todas las tablas definidas en la migración: `clientes`, `proveedores`, `materiales`, `negocios`, etc.

### 5. Verificar la integridad de la base de datos

1. Una vez que hayas aplicado manualmente las migraciones, puedes verificar la integridad de la base de datos usando el comando:

```bash
npx tricycle-db check
```

2. Este comando comprobará que todas las tablas, columnas y relaciones estén correctamente configuradas.

## Solución de problemas

### Error "relation already exists"

Si encuentras errores como "relation already exists" (la relación ya existe), es posible que algunas tablas ya se hayan creado. Puedes:

1. Eliminar las tablas manualmente antes de ejecutar la migración, o
2. Editar el script SQL para eliminar los comandos que crean tablas que ya existen.

### Error con claves foráneas

Si encuentras errores relacionados con claves foráneas, asegúrate de:

1. Crear primero todas las tablas.
2. Aplicar las restricciones de clave foránea después de que todas las tablas estén creadas.

### Consulta el equipo de desarrollo

Si continúas teniendo problemas con las migraciones manuales, consulta con el equipo de desarrollo para obtener asistencia específica para tu caso. 
-- Migración para eliminar columnas no existentes de la tabla facturas_proveedor
-- Esta migración corrige el error "Could not find the X column of 'facturas_proveedor' in the schema cache"

-- Paso 1: Verificar si la columna invoice_id existe en la tabla facturas_proveedor
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'facturas_proveedor' 
    AND column_name = 'invoice_id'
  ) THEN
    -- Si existe, eliminar la columna
    EXECUTE 'ALTER TABLE facturas_proveedor DROP COLUMN IF EXISTS invoice_id';
    RAISE NOTICE 'La columna invoice_id ha sido eliminada de la tabla facturas_proveedor.';
  ELSE
    -- Si no existe, informar que no es necesario hacer nada
    RAISE NOTICE 'La columna invoice_id no existe en la tabla facturas_proveedor. No se requiere ninguna acción.';
  END IF;
END $$;

-- Paso 2: Verificar si la columna descripcion existe en la tabla facturas_proveedor
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'facturas_proveedor' 
    AND column_name = 'descripcion'
  ) THEN
    -- Si existe, eliminar la columna
    EXECUTE 'ALTER TABLE facturas_proveedor DROP COLUMN IF EXISTS descripcion';
    RAISE NOTICE 'La columna descripcion ha sido eliminada de la tabla facturas_proveedor.';
  ELSE
    -- Si no existe, informar que no es necesario hacer nada
    RAISE NOTICE 'La columna descripcion no existe en la tabla facturas_proveedor. No se requiere ninguna acción.';
  END IF;
END $$;

-- Paso 3: Verificar si la columna importe existe en la tabla facturas_proveedor
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'facturas_proveedor' 
    AND column_name = 'importe'
  ) THEN
    -- Si existe, eliminar la columna
    EXECUTE 'ALTER TABLE facturas_proveedor DROP COLUMN IF EXISTS importe';
    RAISE NOTICE 'La columna importe ha sido eliminada de la tabla facturas_proveedor.';
  ELSE
    -- Si no existe, informar que no es necesario hacer nada
    RAISE NOTICE 'La columna importe no existe en la tabla facturas_proveedor. No se requiere ninguna acción.';
  END IF;
END $$;

-- Paso 4: Verificar si la columna divisa existe en la tabla facturas_proveedor
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'facturas_proveedor' 
    AND column_name = 'divisa'
  ) THEN
    -- Si existe, eliminar la columna
    EXECUTE 'ALTER TABLE facturas_proveedor DROP COLUMN IF EXISTS divisa';
    RAISE NOTICE 'La columna divisa ha sido eliminada de la tabla facturas_proveedor.';
  ELSE
    -- Si no existe, informar que no es necesario hacer nada
    RAISE NOTICE 'La columna divisa no existe en la tabla facturas_proveedor. No se requiere ninguna acción.';
  END IF;
END $$;

-- Paso 5: Verificar que la columna numero_factura existe en la tabla facturas_proveedor
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'facturas_proveedor' 
    AND column_name = 'numero_factura'
  ) THEN
    -- Si no existe, agregar la columna
    EXECUTE 'ALTER TABLE facturas_proveedor ADD COLUMN numero_factura TEXT';
    RAISE NOTICE 'La columna numero_factura ha sido agregada a la tabla facturas_proveedor.';
  ELSE
    -- Si ya existe, informar que no es necesario hacer nada
    RAISE NOTICE 'La columna numero_factura ya existe en la tabla facturas_proveedor. No se requiere ninguna acción.';
  END IF;
END $$;

-- Paso 6: Registrar esta migración en la tabla de migraciones (si existe)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'migrations'
  ) THEN
    INSERT INTO migrations (name, applied_at)
    VALUES ('remove_unused_columns_from_facturas_proveedor', NOW())
    ON CONFLICT (name) DO NOTHING;
    RAISE NOTICE 'Migración registrada en la tabla migrations.';
  END IF;
END $$; 
/**
 * Gestor de Supabase para TricycleCRM (Versión simplificada)
 * 
 * Este archivo contiene utilidades para administrar la base de datos de Supabase,
 * incluyendo migraciones, actualizaciones y sincronización del esquema.
 */

// Importar el gestor de base de datos simplificado
const dbManager = require('./simplifiedDbManager');

/**
 * Genera un script de migración SQL para aplicar a Supabase
 * @param {string} name - Nombre descriptivo de la migración
 * @param {Object} changes - Cambios a realizar (tablas a crear, modificar, etc.)
 * @returns {Object} Información sobre la migración generada
 */
function generateMigration(name, changes = {}) {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const migrationName = `${timestamp}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  
  let sqlScript = `-- Migration: ${name}\n`;
  sqlScript += `-- Created at: ${new Date().toISOString()}\n\n`;
  
  // Procesar cambios
  if (changes.createTables) {
    for (const tableName of changes.createTables) {
      if (dbManager.dbSchema.tables[tableName]) {
        sqlScript += `-- Crear tabla: ${tableName}\n`;
        sqlScript += dbManager.generateCreateTableSQL(tableName, dbManager.dbSchema.tables[tableName]);
        sqlScript += '\n';
      } else {
        sqlScript += `-- ERROR: La tabla '${tableName}' no está definida en el esquema\n\n`;
      }
    }
  }
  
  if (changes.alterTables) {
    for (const [tableName, columns] of Object.entries(changes.alterTables)) {
      if (dbManager.dbSchema.tables[tableName]) {
        sqlScript += `-- Modificar tabla: ${tableName}\n`;
        sqlScript += dbManager.generateAlterTableSQL(tableName, dbManager.dbSchema.tables[tableName].columns, columns);
        sqlScript += '\n';
      } else {
        sqlScript += `-- ERROR: La tabla '${tableName}' no existe en el esquema\n\n`;
      }
    }
  }
  
  if (changes.dropTables) {
    for (const tableName of changes.dropTables) {
      sqlScript += `-- Eliminar tabla: ${tableName}\n`;
      sqlScript += `DROP TABLE IF EXISTS public.${tableName};\n\n`;
    }
  }
  
  if (changes.customSQL) {
    sqlScript += `-- SQL personalizado\n`;
    sqlScript += changes.customSQL;
    sqlScript += '\n\n';
  }
  
  // Registrar la migración en el sistema
  sqlScript += `-- Registrar la migración en el sistema\n`;
  sqlScript += `INSERT INTO public.migrations (name, applied_at) VALUES ('${migrationName}', NOW());\n`;
  
  return {
    name: migrationName,
    sql: sqlScript,
    timestamp
  };
}

/**
 * Genera un archivo de migración que puede ser ejecutado en Supabase
 * @param {string} migrationName - Nombre de la migración
 * @param {Object} changes - Cambios a realizar
 * @returns {Object} Información del archivo de migración
 */
function createMigrationFile(migrationName, changes) {
  const migration = generateMigration(migrationName, changes);
  
  const filePath = `supabase/migrations/${migration.name}.sql`;
  const content = migration.sql;
  
  return {
    filePath,
    content,
    migration
  };
}

/**
 * Comprueba si la tabla de migraciones existe en la base de datos
 * y la crea si no existe
 * @param {Object} supabaseClient - Cliente de Supabase
 * @returns {Promise<boolean>} true si la tabla existía o se creó correctamente
 */
async function ensureMigrationsTable(supabaseClient) {
  try {
    // Comprobar si la tabla existe
    const { data, error } = await supabaseClient.rpc('table_exists', { 
      table_name: 'migrations' 
    });
    
    if (error) throw error;
    
    // Si la tabla no existe, crearla
    if (!data) {
      const createTableSQL = `
CREATE TABLE IF NOT EXISTS public.migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_migrations_name ON public.migrations (name);
      `;
      
      const { error: createError } = await supabaseClient.rpc('execute_sql', { 
        sql: createTableSQL 
      });
      
      if (createError) throw createError;
    }
    
    return true;
  } catch (error) {
    console.error('Error al verificar/crear la tabla de migraciones:', error);
    return false;
  }
}

/**
 * Obtiene las migraciones ya aplicadas en la base de datos
 * @param {Object} supabaseClient - Cliente de Supabase
 * @returns {Promise<Array>} Lista de migraciones aplicadas
 */
async function getAppliedMigrations(supabaseClient) {
  try {
    await ensureMigrationsTable(supabaseClient);
    
    const { data, error } = await supabaseClient
      .from('migrations')
      .select('name, applied_at')
      .order('applied_at', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error al obtener migraciones aplicadas:', error);
    return [];
  }
}

/**
 * Aplica una migración específica a la base de datos
 * @param {Object} supabaseClient - Cliente de Supabase
 * @param {string} migrationSQL - SQL de la migración a aplicar
 * @returns {Promise<boolean>} true si la migración se aplicó correctamente
 */
async function applyMigration(supabaseClient, migrationSQL) {
  try {
    const { error } = await supabaseClient.rpc('execute_sql', { sql: migrationSQL });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error al aplicar migración:', error);
    return false;
  }
}

/**
 * Actualiza el archivo de tipos TypeScript de la base de datos
 * @returns {Object} Información sobre la actualización
 */
function updateDatabaseTypes() {
  const typesContent = dbManager.generateDatabaseTypes();
  const filePath = 'src/lib/supabase/database.types.ts';
  
  return {
    filePath,
    content: typesContent
  };
}

/**
 * Obtiene el esquema actual de la base de datos en Supabase
 * @param {Object} supabaseClient - Cliente de Supabase
 * @returns {Promise<Object>} Esquema actual de la base de datos
 */
async function getCurrentDatabaseSchema(supabaseClient) {
  try {
    // Obtener información de las tablas
    const { data: tables, error: tablesError } = await supabaseClient.rpc('get_tables');
    
    if (tablesError) throw tablesError;
    
    const schema = { tables: {} };
    
    // Para cada tabla, obtener sus columnas
    for (const table of tables) {
      const { data: columns, error: columnsError } = await supabaseClient.rpc('get_columns', {
        table_name: table.table_name
      });
      
      if (columnsError) throw columnsError;
      
      schema.tables[table.table_name] = {
        columns: {},
        indexes: []
      };
      
      // Procesar columnas
      for (const column of columns) {
        schema.tables[table.table_name].columns[column.column_name] = {
          type: column.data_type,
          notNull: column.is_nullable === 'NO',
          default: column.column_default,
          primaryKey: column.constraint_type === 'PRIMARY KEY'
        };
      }
      
      // Obtener índices
      const { data: indexes, error: indexesError } = await supabaseClient.rpc('get_indexes', {
        table_name: table.table_name
      });
      
      if (indexesError) throw indexesError;
      
      // Procesar índices
      for (const index of indexes) {
        schema.tables[table.table_name].indexes.push(index.column_name);
      }
    }
    
    return schema;
  } catch (error) {
    console.error('Error al obtener el esquema actual de la base de datos:', error);
    return null;
  }
}

/**
 * Compara el esquema actual de la base de datos con el definido en la aplicación
 * y genera un script SQL con las diferencias
 * @param {Object} currentSchema - Esquema actual obtenido de la base de datos
 * @returns {Object} Script SQL con las diferencias y descripción de cambios
 */
function compareDatabaseSchemas(currentSchema) {
  if (!currentSchema) {
    // Si no hay esquema actual, generar uno completo
    return {
      changes: { fullSchema: true },
      script: dbManager.generateDatabaseScript(true)
    };
  }
  
  const changes = {
    createTables: [],
    alterTables: {},
    dropTables: [],
    description: []
  };
  
  // Buscar tablas a crear (están en el esquema local pero no en el actual)
  for (const tableName in dbManager.dbSchema.tables) {
    if (!currentSchema.tables[tableName]) {
      changes.createTables.push(tableName);
      changes.description.push(`Crear tabla: ${tableName}`);
    }
  }
  
  // Buscar tablas a modificar (están en ambos esquemas pero con diferencias)
  for (const tableName in dbManager.dbSchema.tables) {
    if (currentSchema.tables[tableName]) {
      const localColumns = dbManager.dbSchema.tables[tableName].columns;
      const remoteColumns = currentSchema.tables[tableName].columns;
      const columnsToAdd = {};
      
      // Buscar columnas nuevas
      for (const columnName in localColumns) {
        if (!remoteColumns[columnName]) {
          columnsToAdd[columnName] = localColumns[columnName];
          if (!changes.description.includes(`Modificar tabla: ${tableName}`)) {
            changes.description.push(`Modificar tabla: ${tableName}`);
          }
        }
      }
      
      if (Object.keys(columnsToAdd).length > 0) {
        changes.alterTables[tableName] = columnsToAdd;
      }
    }
  }
  
  // Generar script SQL con los cambios
  let sqlScript = '';
  
  if (changes.createTables.length > 0) {
    for (const tableName of changes.createTables) {
      sqlScript += dbManager.generateCreateTableSQL(tableName, dbManager.dbSchema.tables[tableName]);
      sqlScript += '\n';
    }
  }
  
  if (Object.keys(changes.alterTables).length > 0) {
    for (const [tableName, columns] of Object.entries(changes.alterTables)) {
      sqlScript += dbManager.generateAlterTableSQL(tableName, currentSchema.tables[tableName].columns, columns);
      sqlScript += '\n';
    }
  }
  
  return {
    changes,
    script: sqlScript
  };
}

/**
 * Implementa funciones RPC personalizadas en Supabase para administración
 * @param {Object} supabaseClient - Cliente de Supabase con permisos administrativos
 * @returns {Promise<boolean>} true si se implementaron correctamente
 */
async function setupDatabaseManagementFunctions(supabaseClient) {
  const functionsSQL = `
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

-- Función para ejecutar SQL arbitrario (restringido a administradores)
CREATE OR REPLACE FUNCTION public.execute_sql(sql TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta función debe estar restringida a administradores
  -- mediante políticas de seguridad en Supabase
  EXECUTE sql;
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
  `;
  
  try {
    const { error } = await supabaseClient.rpc('execute_sql', { sql: functionsSQL });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error al configurar funciones de administración:', error);
    return false;
  }
}

// Exportar funciones
module.exports = {
  generateMigration,
  createMigrationFile,
  ensureMigrationsTable,
  getAppliedMigrations,
  applyMigration,
  updateDatabaseTypes,
  getCurrentDatabaseSchema,
  compareDatabaseSchemas,
  setupDatabaseManagementFunctions
}; 
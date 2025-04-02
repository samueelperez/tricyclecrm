/**
 * Gestor de base de datos para TricycleCRM
 * 
 * Este archivo contiene el esquema de la base de datos y funciones
 * para generar scripts SQL y tipos de TypeScript.
 */

// Importar el validador de consistencia y el cliente de Supabase
const { crmSections } = require('./crmConsistencyValidator.mdc.js');

// Definir el esquema de la base de datos
const dbSchema = {
  // Tablas actuales
  tables: {
    albaranes: {
      columns: {
        id: { type: 'integer', primaryKey: true, autoIncrement: true },
        id_externo: { type: 'text', notNull: true },
        fecha: { type: 'date', notNull: true },
        monto: { type: 'numeric', notNull: true },
        transportista: { type: 'text', notNull: true },
        tracking_number: { type: 'text' },
        estado: { type: 'text' },
        negocio_id: { type: 'integer', references: 'negocios(id)' },
        origen: { type: 'text' },
        destino: { type: 'text' },
        instrucciones: { type: 'text' },
        metodo_envio: { type: 'text' },
        material: { type: 'text' },
        peso_total: { type: 'numeric' },
        tipo_contenedor: { type: 'text' },
        valor_declarado: { type: 'numeric' },
        created_at: { type: 'timestamp with time zone' },
        updated_at: { type: 'timestamp with time zone' }
      },
      indexes: ['id_externo', 'negocio_id']
    },
    clientes: {
      columns: {
        id: { type: 'integer', primaryKey: true, autoIncrement: true },
        nombre: { type: 'text', notNull: true },
        id_fiscal: { type: 'text' },
        direccion: { type: 'text' },
        ciudad: { type: 'text' },
        codigo_postal: { type: 'text' },
        pais: { type: 'text' },
        contacto_nombre: { type: 'text' },
        email: { type: 'text' },
        telefono: { type: 'text' },
        created_at: { type: 'timestamp with time zone' },
        updated_at: { type: 'timestamp with time zone' }
      },
      indexes: ['nombre', 'id_fiscal']
    },
    facturas_cliente: {
      columns: {
        id: { type: 'integer', primaryKey: true, autoIncrement: true },
        id_externo: { type: 'text', notNull: true },
        fecha: { type: 'date', notNull: true },
        monto: { type: 'numeric', notNull: true },
        estado: { type: 'text' },
        material: { type: 'text' },
        cliente_id: { type: 'integer', references: 'clientes(id)' },
        negocio_id: { type: 'integer', references: 'negocios(id)' },
        created_at: { type: 'timestamp with time zone' },
        updated_at: { type: 'timestamp with time zone' }
      },
      indexes: ['id_externo', 'negocio_id', 'cliente_id']
    },
    facturas_proveedor: {
      columns: {
        id: { type: 'integer', primaryKey: true, autoIncrement: true },
        id_externo: { type: 'text', notNull: true },
        fecha: { type: 'date', notNull: true },
        monto: { type: 'numeric', notNull: true },
        proveedor_nombre: { type: 'text', notNull: true },
        proveedor_id: { type: 'integer', references: 'proveedores(id)' },
        estado: { type: 'text' },
        material: { type: 'text' },
        negocio_id: { type: 'integer', references: 'negocios(id)' },
        created_at: { type: 'timestamp with time zone' },
        updated_at: { type: 'timestamp with time zone' }
      },
      indexes: ['id_externo', 'proveedor_id', 'negocio_id']
    },
    materiales: {
      columns: {
        id: { type: 'integer', primaryKey: true, autoIncrement: true },
        nombre: { type: 'text', notNull: true },
        descripcion: { type: 'text' },
        precio_unitario: { type: 'numeric' },
        unidad_medida: { type: 'text' },
        created_at: { type: 'timestamp with time zone' },
        updated_at: { type: 'timestamp with time zone' }
      },
      indexes: ['nombre']
    },
    negocios: {
      columns: {
        id: { type: 'integer', primaryKey: true, autoIncrement: true },
        nombre: { type: 'text', notNull: true },
        cliente_id: { type: 'integer', references: 'clientes(id)' },
        fecha_inicio: { type: 'date' },
        fecha_cierre: { type: 'date' },
        estado: { type: 'text' },
        valor_total: { type: 'numeric' },
        margen_estimado: { type: 'numeric' },
        descripcion: { type: 'text' },
        created_at: { type: 'timestamp with time zone' },
        updated_at: { type: 'timestamp with time zone' }
      },
      indexes: ['cliente_id', 'estado']
    },
    negocios_materiales: {
      columns: {
        id: { type: 'integer', primaryKey: true, autoIncrement: true },
        negocio_id: { type: 'integer', references: 'negocios(id)', notNull: true },
        material_id: { type: 'integer', references: 'materiales(id)', notNull: true },
        cantidad: { type: 'numeric', notNull: true },
        precio_unitario: { type: 'numeric', notNull: true },
        subtotal: { type: 'numeric', notNull: true },
        created_at: { type: 'timestamp with time zone' },
        updated_at: { type: 'timestamp with time zone' }
      },
      indexes: ['negocio_id', 'material_id']
    },
    negocios_proveedores: {
      columns: {
        id: { type: 'integer', primaryKey: true, autoIncrement: true },
        negocio_id: { type: 'integer', references: 'negocios(id)', notNull: true },
        proveedor_id: { type: 'integer', references: 'proveedores(id)', notNull: true },
        monto_estimado: { type: 'numeric' },
        created_at: { type: 'timestamp with time zone' },
        updated_at: { type: 'timestamp with time zone' }
      },
      indexes: ['negocio_id', 'proveedor_id']
    },
    perfiles: {
      columns: {
        id: { type: 'integer', primaryKey: true, autoIncrement: true },
        user_id: { type: 'uuid', notNull: true, references: 'auth.users(id)' },
        nombre: { type: 'text', notNull: true },
        apellidos: { type: 'text' },
        rol: { type: 'text', notNull: true },
        email: { type: 'text', notNull: true },
        telefono: { type: 'text' },
        avatar_url: { type: 'text' },
        created_at: { type: 'timestamp with time zone' },
        updated_at: { type: 'timestamp with time zone' }
      },
      indexes: ['user_id', 'email']
    },
    proformas: {
      columns: {
        id: { type: 'integer', primaryKey: true, autoIncrement: true },
        numero: { type: 'text', notNull: true },
        tipo: { type: 'text', notNull: true, default: "'customer'" },
        cliente_id: { type: 'integer', references: 'clientes(id)' },
        proveedor_id: { type: 'integer', references: 'proveedores(id)' },
        negocio_id: { type: 'integer', references: 'negocios(id)' },
        fecha: { type: 'date', notNull: true },
        valida_hasta: { type: 'date' },
        estado: { type: 'text' },
        monto_total: { type: 'numeric', notNull: true },
        condiciones_pago: { type: 'text' },
        notas: { type: 'text' },
        created_at: { type: 'timestamp with time zone' },
        updated_at: { type: 'timestamp with time zone' }
      },
      indexes: ['numero', 'cliente_id', 'proveedor_id', 'negocio_id', 'tipo']
    },
    proformas_productos: {
      columns: {
        id: { type: 'integer', primaryKey: true, autoIncrement: true },
        proforma_id: { type: 'integer', references: 'proformas(id)', notNull: true },
        descripcion: { type: 'text', notNull: true },
        cantidad: { type: 'numeric', notNull: true },
        precio_unitario: { type: 'numeric', notNull: true },
        subtotal: { type: 'numeric', notNull: true },
        material_id: { type: 'integer', references: 'materiales(id)' },
        created_at: { type: 'timestamp with time zone' },
        updated_at: { type: 'timestamp with time zone' }
      },
      indexes: ['proforma_id', 'material_id']
    },
    proveedores: {
      columns: {
        id: { type: 'integer', primaryKey: true, autoIncrement: true },
        nombre: { type: 'text', notNull: true },
        id_fiscal: { type: 'text' },
        contacto_nombre: { type: 'text' },
        email: { type: 'text' },
        telefono: { type: 'text' },
        direccion: { type: 'text' },
        ciudad: { type: 'text' },
        codigo_postal: { type: 'text' },
        pais: { type: 'text' },
        created_at: { type: 'timestamp with time zone' },
        updated_at: { type: 'timestamp with time zone' }
      },
      indexes: ['nombre', 'id_fiscal']
    },
    recibos: {
      columns: {
        id: { type: 'integer', primaryKey: true, autoIncrement: true },
        numero: { type: 'text', notNull: true },
        fecha: { type: 'date', notNull: true },
        monto: { type: 'numeric', notNull: true },
        metodo_pago: { type: 'text', notNull: true },
        estado: { type: 'text' },
        factura_cliente_id: { type: 'integer', references: 'facturas_cliente(id)' },
        factura_proveedor_id: { type: 'integer', references: 'facturas_proveedor(id)' },
        descripcion: { type: 'text' },
        created_at: { type: 'timestamp with time zone' },
        updated_at: { type: 'timestamp with time zone' }
      },
      indexes: ['numero', 'factura_cliente_id', 'factura_proveedor_id']
    }
  },
  
  // Funciones para gestionar RLS (Row Level Security)
  securityPolicies: {
    restrictToUser: {
      tables: ['perfiles'],
      policy: "auth.uid() = user_id"
    },
    // Otras políticas de seguridad
  }
};

/**
 * Genera el SQL para crear una tabla en la base de datos de Supabase
 * @param {string} tableName - Nombre de la tabla a crear
 * @param {Object} tableDefinition - Definición de la tabla con columnas, índices, etc.
 * @returns {string} SQL para crear la tabla
 */
function generateCreateTableSQL(tableName, tableDefinition) {
  // Generar SQL para crear la tabla
  let sql = `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
  
  // Añadir columnas
  const columns = Object.entries(tableDefinition.columns).map(([columnName, columnDef]) => {
    let columnSQL = `  ${columnName} ${columnDef.type}`;
    
    if (columnDef.primaryKey) columnSQL += ' PRIMARY KEY';
    if (columnDef.autoIncrement) columnSQL += ' GENERATED BY DEFAULT AS IDENTITY';
    if (columnDef.notNull) columnSQL += ' NOT NULL';
    if (columnDef.references) columnSQL += ` REFERENCES ${columnDef.references}`;
    if (columnDef.default) columnSQL += ` DEFAULT ${columnDef.default}`;
    
    return columnSQL;
  });
  
  sql += columns.join(',\n');
  sql += '\n);\n\n';
  
  // Añadir índices
  if (tableDefinition.indexes && tableDefinition.indexes.length > 0) {
    tableDefinition.indexes.forEach(indexColumn => {
      sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_${indexColumn} ON public.${tableName} (${indexColumn});\n`;
    });
  }
  
  // Añadir triggers para created_at y updated_at
  if (tableDefinition.columns.created_at || tableDefinition.columns.updated_at) {
    sql += `\n-- Trigger para actualizar automáticamente created_at y updated_at\n`;
    
    if (tableDefinition.columns.updated_at) {
      sql += `CREATE OR REPLACE FUNCTION public.update_${tableName}_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_${tableName}_updated_at
BEFORE UPDATE ON public.${tableName}
FOR EACH ROW
EXECUTE FUNCTION public.update_${tableName}_updated_at();\n`;
    }
  }
  
  return sql;
}

/**
 * Genera el SQL para modificar una tabla existente
 * @param {string} tableName - Nombre de la tabla a modificar
 * @param {Object} currentColumns - Columnas actuales de la tabla
 * @param {Object} newColumns - Nuevas columnas que deben añadirse
 * @returns {string} SQL para modificar la tabla
 */
function generateAlterTableSQL(tableName, currentColumns, newColumns) {
  let sql = `-- Modificaciones a la tabla ${tableName}\n`;
  
  // Encontrar columnas nuevas para añadir
  for (const [columnName, columnDef] of Object.entries(newColumns)) {
    if (!currentColumns[columnName]) {
      sql += `ALTER TABLE public.${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnDef.type}`;
      
      if (columnDef.notNull) sql += ' NOT NULL';
      if (columnDef.default) sql += ` DEFAULT ${columnDef.default}`;
      if (columnDef.references) sql += ` REFERENCES ${columnDef.references}`;
      
      sql += ';\n';
    }
  }
  
  return sql;
}

/**
 * Genera un script SQL para crear o actualizar toda la base de datos
 * @param {boolean} isNewDatabase - Si es una base de datos nueva o existente
 * @returns {string} Script SQL completo
 */
function generateDatabaseScript(isNewDatabase = false) {
  let sql = `-- Script de creación/actualización de la base de datos para TricycleCRM\n`;
  sql += `-- Generado automáticamente: ${new Date().toISOString()}\n\n`;
  
  // Para una nueva base de datos, crear todas las tablas
  if (isNewDatabase) {
    for (const [tableName, tableDefinition] of Object.entries(dbSchema.tables)) {
      sql += generateCreateTableSQL(tableName, tableDefinition);
      sql += '\n';
    }
    
    // Crear políticas de seguridad
    sql += '-- Configuración de políticas de seguridad\n';
    for (const [policyName, policyDef] of Object.entries(dbSchema.securityPolicies)) {
      policyDef.tables.forEach(tableName => {
        sql += `ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;\n`;
        sql += `CREATE POLICY ${policyName}_${tableName} ON public.${tableName} FOR ALL USING (${policyDef.policy});\n\n`;
      });
    }
  } 
  // Para una base de datos existente, generar actualizaciones
  else {
    sql += '-- Este script solo contiene las modificaciones necesarias para actualizar la base de datos\n\n';
    
    // Aquí se añadirían las actualizaciones basadas en la comparación con el estado actual
    // Este código requeriría acceso a la base de datos actual
    
    sql += '-- Nota: Para ejecutar este script correctamente, se necesita conectar a la base de datos\n';
    sql += '-- y comparar el esquema actual con el deseado.\n';
  }
  
  return sql;
}

/**
 * Crea una nueva tabla en la base de datos para una nueva entidad del CRM
 * @param {string} tableName - Nombre de la tabla a crear
 * @param {Object} columnDefinitions - Definiciones de las columnas
 * @returns {Object} Resultado de la operación
 */
function addEntityTable(tableName, columnDefinitions) {
  // Asegurarse de que no exista ya la tabla
  if (dbSchema.tables[tableName]) {
    return {
      success: false,
      message: `La tabla '${tableName}' ya existe en el esquema.`
    };
  }
  
  // Verificar que la tabla incluya al menos columnas básicas
  const requiredColumns = ['id', 'created_at', 'updated_at'];
  const missingColumns = requiredColumns.filter(col => !columnDefinitions[col]);
  
  if (missingColumns.length > 0) {
    // Añadir columnas faltantes automáticamente
    missingColumns.forEach(colName => {
      if (colName === 'id') {
        columnDefinitions.id = { 
          type: 'integer', 
          primaryKey: true, 
          autoIncrement: true 
        };
      } else if (colName === 'created_at' || colName === 'updated_at') {
        columnDefinitions[colName] = { 
          type: 'timestamp with time zone' 
        };
      }
    });
  }
  
  // Añadir la tabla al esquema
  dbSchema.tables[tableName] = {
    columns: columnDefinitions,
    indexes: ['id'] // Por defecto indexamos el ID
  };
  
  // Generar SQL para crear la tabla
  const sql = generateCreateTableSQL(tableName, dbSchema.tables[tableName]);
  
  return {
    success: true,
    message: `Tabla '${tableName}' añadida al esquema.`,
    sql,
    needsExecution: true
  };
}

/**
 * Actualiza el esquema de una tabla existente
 * @param {string} tableName - Nombre de la tabla a actualizar
 * @param {Object} newColumns - Nuevas columnas a añadir
 * @returns {Object} Resultado de la operación
 */
function updateEntityTable(tableName, newColumns) {
  // Verificar que la tabla exista
  if (!dbSchema.tables[tableName]) {
    return {
      success: false,
      message: `La tabla '${tableName}' no existe en el esquema.`
    };
  }
  
  // Generar SQL para alterar la tabla
  const sql = generateAlterTableSQL(
    tableName, 
    dbSchema.tables[tableName].columns,
    newColumns
  );
  
  // Actualizar el esquema
  for (const [columnName, columnDef] of Object.entries(newColumns)) {
    if (!dbSchema.tables[tableName].columns[columnName]) {
      dbSchema.tables[tableName].columns[columnName] = columnDef;
    }
  }
  
  return {
    success: true,
    message: `Tabla '${tableName}' actualizada en el esquema.`,
    sql,
    needsExecution: true
  };
}

/**
 * Añade una nueva sección al CRM con sus tablas correspondientes
 * @param {string} sectionName - Nombre de la nueva sección
 * @param {Array} entities - Entidades/tablas asociadas a la sección
 * @param {string} route - Ruta principal de la sección
 * @param {string} description - Descripción de la sección
 * @returns {Object} Resultado de la operación
 */
function addCRMSection(sectionName, entities, route, description) {
  // Verificar que la sección no exista
  if (crmSections[sectionName]) {
    return {
      success: false,
      message: `La sección '${sectionName}' ya existe en el CRM.`
    };
  }
  
  // Añadir la sección al validador de consistencia
  // Note: Esto requeriría modificar el archivo crmConsistencyValidator.mdc
  
  return {
    success: true,
    message: `Sección '${sectionName}' añadida al CRM.`,
    needsConsistencyUpdate: true,
    entities
  };
}

/**
 * Sincroniza los cambios del esquema con la base de datos real
 * @param {Object} supabaseClient - Cliente de Supabase con permisos para modificar la base de datos
 * @returns {Promise<Object>} Resultado de la operación
 */
async function syncDatabaseSchema(supabaseClient) {
  // Generar script SQL para las actualizaciones necesarias
  const updateScript = generateDatabaseScript(false);
  
  try {
    // Ejecutar el script SQL en Supabase
    // Nota: Esto requiere permisos administrativos en Supabase
    const { error } = await supabaseClient.rpc('execute_sql', { sql: updateScript });
    
    if (error) {
      return {
        success: false,
        message: `Error al sincronizar la base de datos: ${error.message}`,
        script: updateScript
      };
    }
    
    return {
      success: true,
      message: 'Base de datos sincronizada correctamente.',
      script: updateScript
    };
  } catch (error) {
    return {
      success: false,
      message: `Error inesperado al sincronizar la base de datos: ${error.message}`,
      script: updateScript
    };
  }
}

/**
 * Genera tipos TypeScript actualizados basados en el esquema de la base de datos
 * @returns {string} Contenido del archivo de tipos TypeScript
 */
function generateDatabaseTypes() {
  let typesContent = `// Tipos generados automáticamente para la base de datos de TricycleCRM
// Última actualización: ${new Date().toISOString()}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {`;
  
  // Generar definiciones de tipos para cada tabla
  for (const [tableName, tableDefinition] of Object.entries(dbSchema.tables)) {
    typesContent += `
      ${tableName}: {
        Row: {`;
    
    // Añadir tipos para cada columna
    for (const [columnName, columnDef] of Object.entries(tableDefinition.columns)) {
      let tsType = 'string';
      
      // Mapear tipos SQL a TypeScript
      if (columnDef.type.includes('integer') || columnDef.type.includes('numeric')) {
        tsType = 'number';
      } else if (columnDef.type.includes('boolean')) {
        tsType = 'boolean';
      } else if (columnDef.type.includes('json')) {
        tsType = 'Json';
      }
      
      // Determinar si es opcional
      const isOptional = !columnDef.notNull && columnName !== 'id';
      
      typesContent += `
          ${columnName}: ${tsType}${isOptional ? ' | null' : ''}`;
    }
    
    typesContent += `
        }
        Insert: {`;
    
    // Añadir tipos para inserción
    for (const [columnName, columnDef] of Object.entries(tableDefinition.columns)) {
      let tsType = 'string';
      
      if (columnDef.type.includes('integer') || columnDef.type.includes('numeric')) {
        tsType = 'number';
      } else if (columnDef.type.includes('boolean')) {
        tsType = 'boolean';
      } else if (columnDef.type.includes('json')) {
        tsType = 'Json';
      }
      
      const isOptional = columnDef.autoIncrement || !columnDef.notNull || columnName === 'created_at' || columnName === 'updated_at';
      
      typesContent += `
          ${columnName}${isOptional ? '?' : ''}: ${tsType}${isOptional ? ' | null' : ''}`;
    }
    
    typesContent += `
        }
        Update: {`;
    
    // Añadir tipos para actualización
    for (const [columnName, columnDef] of Object.entries(tableDefinition.columns)) {
      let tsType = 'string';
      
      if (columnDef.type.includes('integer') || columnDef.type.includes('numeric')) {
        tsType = 'number';
      } else if (columnDef.type.includes('boolean')) {
        tsType = 'boolean';
      } else if (columnDef.type.includes('json')) {
        tsType = 'Json';
      }
      
      typesContent += `
          ${columnName}?: ${tsType}${!columnDef.notNull ? ' | null' : ''}`;
    }
    
    typesContent += `
        }
        Relationships: [`;
        
    // Añadir relaciones si existen
    for (const [columnName, columnDef] of Object.entries(tableDefinition.columns)) {
      if (columnDef.references) {
        const [refTable, refColumn] = columnDef.references.split('(');
        const cleanRefColumn = refColumn.replace(')', '');
        
        typesContent += `
          {
            foreignKeyName: "${tableName}_${columnName}_fkey"
            columns: ["${columnName}"]
            isOneToOne: false
            referencedRelation: "${refTable}"
            referencedColumns: ["${cleanRefColumn}"]
          },`;
      }
    }
    
    typesContent += `
        ]
      }`;
  }
  
  typesContent += `
    }
    Functions: {
      // Funciones personalizadas
    }
    Enums: {
      // Enumeraciones personalizadas
    }
  }
}`;
  
  return typesContent;
}

// Exportar funciones
return {
  dbSchema,
  addEntityTable,
  updateEntityTable,
  addCRMSection,
  syncDatabaseSchema,
  generateDatabaseScript,
  generateDatabaseTypes
}; 
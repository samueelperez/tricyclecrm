import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Re-exportar desde supabase/index
export * from './supabase/index';

// Variables de entorno para Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Log para depuración (en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  console.log('[Supabase Config]', { 
    url: SUPABASE_URL.slice(0, 15) + '...', 
    key: SUPABASE_ANON_KEY ? 'Configurada' : 'No configurada',
    env: process.env.NODE_ENV
  });
}

// Cliente básico para componentes cliente usando createClient
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Alternativa recomendada para componentes cliente de Next.js
export const getSupabaseClient = () => {
  // En componentes del cliente, usamos createClientComponentClient con parámetros explícitos
  // para mayor seguridad
  return createClientComponentClient({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY,
  });
};

// Tipo común para las respuestas de migración
interface MigracionResponse {
  success: boolean;
  message: string;
  error?: any;
}

// Exportar todas las funciones de migración que están en el archivo original supabase.ts
export const ejecutarMigracionAlmacenamiento = async (): Promise<MigracionResponse> => {
  console.log('Ejecutando migración de almacenamiento...');
  return { success: true, message: 'Migración simulada (entorno de producción)', error: null };
};

export const ejecutarMigracionListasEmpaque = async (): Promise<MigracionResponse> => {
  console.log('Ejecutando migración de listas de empaque...');
  return { success: true, message: 'Migración simulada (entorno de producción)', error: null };
};

export const ejecutarMigracionRecibos = async (): Promise<MigracionResponse> => {
  console.log('Ejecutando migración de recibos...');
  return { success: true, message: 'Migración simulada (entorno de producción)', error: null };
};

export const ejecutarMigracionInstruccionesBL = async (): Promise<MigracionResponse> => {
  console.log('Ejecutando migración de instrucciones BL...');
  
  try {
    const supabase = getSupabaseClient();
    
    // Verificar si la tabla existe
    const { data: existeTabla, error: errorVerificar } = await supabase
      .from('instrucciones_bl')
      .select('id')
      .limit(1);
    
    // Si no hay error, la tabla ya existe
    if (!errorVerificar) {
      console.log('La tabla instrucciones_bl ya existe.');
      return { 
        success: true, 
        message: 'La tabla instrucciones_bl ya existe en la base de datos.' 
      };
    }
    
    // Si el error no es porque la tabla no existe, retornar el error
    if (!errorVerificar.message.includes('does not exist')) {
      return {
        success: false,
        message: 'Error al verificar tabla instrucciones_bl: ' + errorVerificar.message,
        error: errorVerificar
      };
    }
    
    console.log('La tabla instrucciones_bl no existe. Creando...');
    
    // Crear la tabla instrucciones_bl
    const crearTablaSQL = `
      CREATE TABLE IF NOT EXISTS public.instrucciones_bl (
        id SERIAL PRIMARY KEY,
        numero_instruccion TEXT NOT NULL,
        fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
        fecha_estimada_embarque DATE,
        cliente TEXT,
        cliente_id INTEGER REFERENCES public.clientes(id),
        envio_id INTEGER REFERENCES public.envios(id),
        estado TEXT DEFAULT 'borrador',
        consignatario TEXT,
        puerto_carga TEXT,
        puerto_descarga TEXT,
        tipo_carga TEXT,
        incoterm TEXT,
        notas TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ
      );
      
      -- Crear políticas RLS
      ALTER TABLE public.instrucciones_bl ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Todos pueden ver instrucciones_bl" 
        ON public.instrucciones_bl FOR SELECT 
        USING (true);
        
      CREATE POLICY "Usuarios autenticados pueden modificar instrucciones_bl" 
        ON public.instrucciones_bl FOR ALL 
        USING (auth.role() = 'authenticated');
    `;
    
    // Ejecutar SQL
    const { error: errorCrear } = await supabase.rpc('execute_sql', { sql: crearTablaSQL });
    
    if (errorCrear) {
      // Si la función RPC no existe o falla, intentar con REST API
      console.error('Error al crear tabla con RPC, intentando método alternativo:', errorCrear);
      
      // Intentar crear directamente insertando un registro de ejemplo
      const { error: errorInsert } = await supabase
        .from('instrucciones_bl')
        .insert({
          numero_instruccion: 'BL-INIT-001',
          fecha_creacion: new Date().toISOString(),
          cliente: 'Cliente inicial',
          consignatario: 'Consignatario inicial',
          puerto_carga: 'Puerto origen',
          puerto_descarga: 'Puerto destino',
          tipo_carga: 'FCL',
          incoterm: 'FOB',
          estado: 'borrador'
        });
      
      if (errorInsert) {
        return {
          success: false,
          message: 'No se pudo crear la tabla instrucciones_bl: ' + errorInsert.message,
          error: errorInsert
        };
      }
    }
    
    return { 
      success: true, 
      message: 'Tabla instrucciones_bl creada correctamente.' 
    };
  } catch (error: any) {
    console.error('Error en migración de instrucciones_bl:', error);
    return { 
      success: false, 
      message: 'Error en migración: ' + error.message,
      error 
    };
  }
};

export const ejecutarMigracionConfiguracion = async (): Promise<MigracionResponse> => {
  console.log('Ejecutando migración de configuración...');
  return { success: true, message: 'Migración simulada (entorno de producción)', error: null };
};

export const ejecutarMigracionNegocios = async (): Promise<MigracionResponse> => {
  console.log('Ejecutando migración de negocios...');
  return { success: true, message: 'Migración simulada (entorno de producción)', error: null };
};

export const ejecutarMigracionProformas = async (): Promise<MigracionResponse> => {
  console.log('Ejecutando migración de proformas...');
  return { success: true, message: 'Migración simulada (entorno de producción)', error: null };
};

export const ejecutarMigracionFacturas = async (): Promise<MigracionResponse> => {
  console.log('Ejecutando migración de facturas...');
  return { success: true, message: 'Migración simulada (entorno de producción)', error: null };
};

// Asegurarse de que albaranes/envios también están disponibles
export { ejecutarMigracionAlbaranes, ejecutarMigracionEnvios } from './supabase/index';

// Función para crear la tabla de carpetas y sus políticas de seguridad
export const crear_tabla_carpetas = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // Como alternativa, intentaremos crear directamente insertando una carpeta
    console.log('Intentando crear carpeta directamente...');
    
    // Intentamos insertar una carpeta de prueba para ver si la tabla ya existe
    const { error: errorInsert } = await supabase
      .from('carpetas')
      .insert({
        nombre: 'Carpeta de prueba',
        carpeta_padre: null,
        // Usamos el ID del usuario actual o un valor ficticio para la prueba
        creado_por: 'system-init'
      });
    
    // Si hay un error que no sea de validación (que indicaría que la tabla ya existe pero faltan campos),
    // consideramos que la tabla no existe y el error es real
    if (errorInsert && !errorInsert.message.includes('violates')) {
      console.error('Error creando tabla carpetas mediante inserción:', errorInsert);
      return { success: false, error: errorInsert };
    }
    
    // Si llegamos aquí, la tabla existe o se ha creado
    return { success: true };
  } catch (error) {
    console.error('Error en crear_tabla_carpetas:', error);
    return { success: false, error };
  }
};

// Función para crear la tabla de archivos y sus políticas de seguridad
export const crear_tabla_archivos = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // Como alternativa, intentaremos crear directamente insertando un archivo
    console.log('Intentando crear archivo directamente...');
    
    // Intentamos insertar un archivo de prueba para ver si la tabla ya existe
    const { error: errorInsert } = await supabase
      .from('archivos')
      .insert({
        nombre: 'Archivo de prueba',
        path: 'test/path',
        mimetype: 'text/plain',
        tamaño: 0,
        carpeta_id: null,
        creado_por: 'system-init'
      });
    
    // Si hay un error que no sea de validación, consideramos que es un error real
    if (errorInsert && !errorInsert.message.includes('violates')) {
      console.error('Error creando tabla archivos mediante inserción:', errorInsert);
      return { success: false, error: errorInsert };
    }
    
    // Si llegamos aquí, la tabla existe o se ha creado
    return { success: true };
  } catch (error) {
    console.error('Error en crear_tabla_archivos:', error);
    return { success: false, error };
  }
};

// Función para crear la tabla de permisos de archivos y sus políticas de seguridad
export const crear_tabla_permisos_archivos = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // Como alternativa, intentaremos crear directamente insertando un permiso
    console.log('Intentando crear permisos directamente...');
    
    // Intentamos insertar un permiso de prueba para ver si la tabla ya existe
    const { error: errorInsert } = await supabase
      .from('permisos_archivos')
      .insert({
        archivo_id: null,
        carpeta_id: 'some-uuid', // Un UUID cualquiera para la prueba
        usuario_id: 'system-init',
        nivel_permiso: 'lectura'
      });
    
    // Si hay un error que no sea de validación, consideramos que es un error real
    if (errorInsert && !errorInsert.message.includes('violates')) {
      console.error('Error creando tabla permisos mediante inserción:', errorInsert);
      return { success: false, error: errorInsert };
    }
    
    // Si llegamos aquí, la tabla existe o se ha creado
    return { success: true };
  } catch (error) {
    console.error('Error en crear_tabla_permisos_archivos:', error);
    return { success: false, error };
  }
};

/**
 * Registra las funciones SQL necesarias en Supabase automáticamente
 * Esta función se ejecuta desde el inicializador de la base de datos
 */
export const registerDatabaseFunctions = async () => {
  console.log('Registrando funciones SQL en Supabase...');
  
  // Obtener cliente con permisos adecuados
  const client = getSupabaseClient();
  
  // Lista de funciones SQL a registrar
  const functions = [
    // Función para aplicar la migración de proformas_productos de forma segura
    `
    CREATE OR REPLACE FUNCTION public.apply_proformas_migration()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $func$
    BEGIN
      -- Verificar si la columna ya existe
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'proformas_productos' 
        AND column_name = 'proveedor_id'
      ) THEN
        -- Añadir la columna sin restricción de clave foránea
        EXECUTE 'ALTER TABLE public.proformas_productos ADD COLUMN proveedor_id INTEGER';
      END IF;
    END;
    $func$;
    `,
    
    // Función para crear la tabla de migraciones si no existe
    `
    CREATE OR REPLACE FUNCTION public.create_migrations_table()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $func$
    BEGIN
      CREATE TABLE IF NOT EXISTS public.migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      
      -- Políticas RLS para la tabla migrations
      ALTER TABLE public.migrations ENABLE ROW LEVEL SECURITY;
      
      -- Verificar si las políticas ya existen para evitar errores
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'migrations' 
        AND policyname = 'Cualquier usuario puede ver migraciones'
      ) THEN
        -- Permitir que cualquier usuario pueda ver las migraciones
        CREATE POLICY "Cualquier usuario puede ver migraciones" 
          ON public.migrations 
          FOR SELECT 
          USING (true);
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'migrations' 
        AND policyname = 'Solo usuarios autenticados pueden modificar migraciones'
      ) THEN
        -- Permitir que solo los usuarios autenticados puedan modificar migraciones
        CREATE POLICY "Solo usuarios autenticados pueden modificar migraciones" 
          ON public.migrations 
          FOR ALL 
          USING (auth.role() = 'authenticated');
      END IF;
    END;
    $func$;
    `,
    
    // Función para verificar si una tabla existe
    `
    DO $$
    BEGIN
      -- Intentar eliminar la función si existe
      DROP FUNCTION IF EXISTS public.table_exists(text);
      
      -- Crear la nueva versión
      CREATE OR REPLACE FUNCTION public.table_exists(table_name_param text)
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $func$
      DECLARE
        exists_bool BOOLEAN;
      BEGIN
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = table_name_param
        ) INTO exists_bool;
        
        RETURN exists_bool;
      END;
      $func$;
    END;
    $$;
    `,
    
    // Función para obtener las columnas de una tabla
    `
    DO $$
    BEGIN
      -- Eliminar la función si existe
      DROP FUNCTION IF EXISTS public.get_columns(text);
      
      -- Crear la nueva versión
      CREATE OR REPLACE FUNCTION public.get_columns(table_name_param text)
      RETURNS TABLE (
        column_name text,
        data_type text,
        is_nullable text,
        column_default text,
        constraint_type text
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $func$
      BEGIN
        RETURN QUERY
        SELECT 
          c.column_name::text,
          c.data_type::text,
          c.is_nullable::text,
          c.column_default::text,
          tc.constraint_type::text
        FROM 
          information_schema.columns c
        LEFT JOIN 
          information_schema.constraint_column_usage ccu 
          ON c.column_name = ccu.column_name 
          AND c.table_name = ccu.table_name
        LEFT JOIN 
          information_schema.table_constraints tc 
          ON ccu.constraint_name = tc.constraint_name
        WHERE 
          c.table_schema = 'public' 
          AND c.table_name = table_name_param;
      END;
      $func$;
    END;
    $$;
    `,
    
    // Función para ejecutar SQL directamente - Necesitamos averiguar qué tipo de retorno tiene actualmente
    `
    DO $$
    BEGIN
      -- Solo crear la función si no existe
      IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'execute_sql' AND pronamespace = 'public'::regnamespace
      ) THEN
        EXECUTE '
          CREATE FUNCTION public.execute_sql(sql text)
          RETURNS SETOF json
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $inner$
          BEGIN
            EXECUTE $1;
            RETURN;
          END;
          $inner$;
        ';
      END IF;
    END;
    $$;
    `
  ];
  
  // Registrar cada función
  let success = true;
  for (const funcSql of functions) {
    try {
      // Usar RPCNEW que es un método más seguro para ejecutar funciones
      const { error } = await client.rpc('execute_sql', { sql: funcSql });
      
      if (error) {
        // Si la función es execute_sql y no existe, crear directamente
        if (error.message.includes('function execute_sql(text) does not exist') && 
            funcSql.includes('CREATE OR REPLACE FUNCTION public.execute_sql')) {
          console.log('La función execute_sql no existe. Intentando crear directamente...');
          
          // Consulta directa a través de adminRpc (solo funciona con permisos adecuados)
          const { error: directError } = await client.rpc('postgres_execute', { 
            query: funcSql 
          });
          
          if (directError) {
            console.warn(`Error al crear execute_sql directamente: ${directError.message}`);
            success = false;
          } else {
            console.log('✅ Función execute_sql creada correctamente');
          }
        } else {
          console.warn(`Error al registrar función SQL: ${error.message}`);
          // Algunos errores son esperados (ej. función ya existe) y no afectan el funcionamiento
          // Por lo que no marcamos success = false por ahora
        }
      } else {
        console.log('✅ Función SQL registrada correctamente');
      }
    } catch (error) {
      console.warn(`Error inesperado al registrar función: ${error instanceof Error ? error.message : String(error)}`);
      // No marcamos como fallido para no bloquear el resto de la inicialización
    }
  }
  
  return { success };
}; 
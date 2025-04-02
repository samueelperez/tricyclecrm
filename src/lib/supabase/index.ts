import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Cliente básico para componentes cliente usando createClient
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Alternativa recomendada para componentes cliente de Next.js
export const getSupabaseClient = () => {
  return createClientComponentClient();
};

// Función para ejecutar migraciones SQL
export const ejecutarMigracionAlbaranes = async () => {
  console.log('Iniciando migración de albaranes (versión revisada)...');
  
  try {
    const client = getSupabaseClient();
    
    // Verificar si la tabla albaranes existe
    try {
      console.log('Verificando si existe la tabla albaranes...');
      const { data: existeTablaData, error: errorVerificar } = await client.rpc('execute_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'albaranes'
          );
        `
      });
      
      let tablaExiste = false;
      
      // Verificar el formato de la respuesta y extraer el valor correctamente
      if (existeTablaData && Array.isArray(existeTablaData)) {
        // El formato puede variar, así que verificamos diferentes estructuras posibles
        if (Array.isArray(existeTablaData[0]) && existeTablaData[0].length > 0 && 'exists' in existeTablaData[0][0]) {
          tablaExiste = existeTablaData[0][0].exists;
        } else if (existeTablaData[0] && typeof existeTablaData[0] === 'object' && 'exists' in existeTablaData[0]) {
          tablaExiste = existeTablaData[0].exists;
        } else if (existeTablaData.length > 0 && typeof existeTablaData[0] === 'boolean') {
          tablaExiste = existeTablaData[0];
        }
      }
      
      console.log('¿Existe tabla albaranes? (según verificación):', tablaExiste);
      
      // Si la tabla no existe, crearla
      if (!tablaExiste) {
        console.log('Creando tabla albaranes...');
        
        // Verificación adicional antes de intentar crear la tabla
        let debeCrearTabla = true;
        try {
          // Intento más directo para verificar si la tabla existe
          const { data: checkData, error: checkError } = await client.rpc('execute_sql', {
            sql: `SELECT to_regclass('public.albaranes') IS NOT NULL AS exists;`
          });
          
          let existeDirecto = false;
          if (checkData && Array.isArray(checkData) && checkData.length > 0) {
            if (Array.isArray(checkData[0]) && checkData[0].length > 0) {
              existeDirecto = checkData[0][0].exists;
            } else if (checkData[0] && typeof checkData[0].exists !== 'undefined') {
              existeDirecto = checkData[0].exists;
            }
          }
          
          console.log('Verificación directa de tabla albaranes:', existeDirecto);
          
          // Si la tabla existe según esta verificación, saltamos la creación
          if (existeDirecto) {
            console.log('La tabla albaranes existe según verificación directa, omitiendo creación');
            tablaExiste = true;
            debeCrearTabla = false;
          }
        } catch (checkErr) {
          console.warn('Error en verificación directa, continuando con creación normal:', checkErr);
        }
        
        // Si llegamos aquí y debeCrearTabla es true, intentamos crear la tabla
        if (debeCrearTabla) {
          const { error: errorCrear } = await client.rpc('execute_sql', {
            sql: `
              CREATE TABLE albaranes (
                id SERIAL PRIMARY KEY,
                id_externo VARCHAR(20) NOT NULL DEFAULT 'ALB-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 10),
                numero_albaran VARCHAR(50),
                fecha DATE DEFAULT CURRENT_DATE,
                estado VARCHAR(20) DEFAULT 'pendiente',
                notas TEXT,
                id_cliente INTEGER,
                id_proveedor INTEGER,
                transportista VARCHAR(100) NOT NULL DEFAULT 'N/A',
                total NUMERIC(10,2) DEFAULT 0,
                monto NUMERIC(10,2) NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              );
            `
          });
          
          if (errorCrear) {
            // Si el error es que la tabla ya existe (42P07), lo tratamos como un no-error
            if (errorCrear.code === '42P07') {
              console.log('La tabla albaranes ya existe, continuando con la migración...');
            } else {
              console.error('Error creando tabla albaranes:', errorCrear);
              return {
                success: false,
                message: 'Error creando tabla albaranes',
                error: errorCrear
              };
            }
          }
          
          console.log('Tabla albaranes creada correctamente');
        }
      } else {
        // Si la tabla existe, verificar y añadir columnas que falten
        console.log('Verificando columnas de la tabla albaranes...');
        
        // Lista de columnas a verificar
        const columnas = [
          { nombre: 'id_externo', tipo: 'VARCHAR(20)', defecto: "'AUTO-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 10)" },
          { nombre: 'numero_albaran', tipo: 'VARCHAR(50)', defecto: "NULL" },
          { nombre: 'fecha', tipo: 'DATE', defecto: "CURRENT_DATE" },
          { nombre: 'estado', tipo: 'VARCHAR(20)', defecto: "'pendiente'" },
          { nombre: 'notas', tipo: 'TEXT', defecto: "NULL" },
          { nombre: 'id_cliente', tipo: 'INTEGER', defecto: "NULL" },
          { nombre: 'id_proveedor', tipo: 'INTEGER', defecto: "NULL" },
          { nombre: 'transportista', tipo: 'VARCHAR(100)', defecto: "'N/A'" },
          { nombre: 'total', tipo: 'NUMERIC(10,2)', defecto: "0" },
          { nombre: 'monto', tipo: 'NUMERIC(10,2)', defecto: "0" },
          { nombre: 'created_at', tipo: 'TIMESTAMP WITH TIME ZONE', defecto: "CURRENT_TIMESTAMP" },
          { nombre: 'updated_at', tipo: 'TIMESTAMP WITH TIME ZONE', defecto: "CURRENT_TIMESTAMP" }
        ];
        
        // Verificar cada columna
        for (const col of columnas) {
          try {
            console.log(`Verificando columna ${col.nombre}...`);
            const { error } = await client.rpc('execute_sql', {
              sql: `
                ALTER TABLE albaranes
                ADD COLUMN IF NOT EXISTS ${col.nombre} ${col.tipo} DEFAULT ${col.defecto};
              `
            });
            
            if (error) {
              console.warn(`Error al verificar columna ${col.nombre}:`, error);
              
              // Intentar sin valor por defecto
              try {
                await client.rpc('execute_sql', {
                  sql: `ALTER TABLE albaranes ADD COLUMN IF NOT EXISTS ${col.nombre} ${col.tipo};`
                });
                console.log(`Columna ${col.nombre} añadida sin valor por defecto`);
              } catch (err) {
                console.error(`No se pudo añadir columna ${col.nombre}:`, err);
              }
            } else {
              console.log(`Columna ${col.nombre} verificada correctamente`);
            }
          } catch (columnError) {
            console.error(`Error al procesar columna ${col.nombre}:`, columnError);
          }
        }
      }
      
      // Verificar si existe la tabla albaran_items
      console.log('Verificando si existe la tabla albaran_items...');
      const { data: existeItemsData, error: errorVerificarItems } = await client.rpc('execute_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'albaran_items'
          );
        `
      });
      
      let tablaItemsExiste = false;
      
      // Verificar el formato de la respuesta y extraer el valor correctamente
      if (existeItemsData && Array.isArray(existeItemsData)) {
        // El formato puede variar, así que verificamos diferentes estructuras posibles
        if (Array.isArray(existeItemsData[0]) && existeItemsData[0].length > 0 && 'exists' in existeItemsData[0][0]) {
          tablaItemsExiste = existeItemsData[0][0].exists;
        } else if (existeItemsData[0] && typeof existeItemsData[0] === 'object' && 'exists' in existeItemsData[0]) {
          tablaItemsExiste = existeItemsData[0].exists;
        } else if (existeItemsData.length > 0 && typeof existeItemsData[0] === 'boolean') {
          tablaItemsExiste = existeItemsData[0];
        }
      }
      
      console.log('¿Existe tabla albaran_items? (según verificación):', tablaItemsExiste);
      
      // Si la tabla de items no existe, crearla
      if (!tablaItemsExiste) {
        console.log('Creando tabla albaran_items...');
        
        // Verificación adicional antes de intentar crear la tabla
        let debeCrearTablaItems = true;
        try {
          // Intento más directo para verificar si la tabla existe
          const { data: checkItemsData, error: checkItemsError } = await client.rpc('execute_sql', {
            sql: `SELECT to_regclass('public.albaran_items') IS NOT NULL AS exists;`
          });
          
          let existeItemsDirecto = false;
          if (checkItemsData && Array.isArray(checkItemsData) && checkItemsData.length > 0) {
            if (Array.isArray(checkItemsData[0]) && checkItemsData[0].length > 0) {
              existeItemsDirecto = checkItemsData[0][0].exists;
            } else if (checkItemsData[0] && typeof checkItemsData[0].exists !== 'undefined') {
              existeItemsDirecto = checkItemsData[0].exists;
            }
          }
          
          console.log('Verificación directa de tabla albaran_items:', existeItemsDirecto);
          
          // Si la tabla existe según esta verificación, saltamos la creación
          if (existeItemsDirecto) {
            console.log('La tabla albaran_items existe según verificación directa, omitiendo creación');
            tablaItemsExiste = true;
            debeCrearTablaItems = false;
          }
        } catch (checkErr) {
          console.warn('Error en verificación directa de albaran_items, continuando con creación normal:', checkErr);
        }
        
        // Si debemos crear la tabla, procedemos
        if (debeCrearTablaItems) {
          const { error: errorCrearItems } = await client.rpc('execute_sql', {
            sql: `
              CREATE TABLE albaran_items (
                id SERIAL PRIMARY KEY,
                id_albaran INTEGER,
                descripcion TEXT NOT NULL,
                cantidad NUMERIC(10,2) DEFAULT 1,
                precio_unitario NUMERIC(10,2) DEFAULT 0,
                total NUMERIC(10,2) DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              );
            `
          });
          
          if (errorCrearItems) {
            // Si el error es que la tabla ya existe (42P07), lo tratamos como un no-error
            if (errorCrearItems.code === '42P07') {
              console.log('La tabla albaran_items ya existe, continuando con la migración...');
            } else {
              console.error('Error creando tabla albaran_items:', errorCrearItems);
              return {
                success: false,
                message: 'Error creando tabla albaran_items',
                error: errorCrearItems
              };
            }
          }
          
          console.log('Tabla albaran_items creada correctamente');
        }
      }
      
      // Opcional: Crear índices
      try {
        console.log('Creando índices...');
        await client.rpc('execute_sql', {
          sql: `
            CREATE INDEX IF NOT EXISTS idx_albaranes_id_cliente ON albaranes(id_cliente);
            CREATE INDEX IF NOT EXISTS idx_albaranes_id_proveedor ON albaranes(id_proveedor);
            CREATE INDEX IF NOT EXISTS idx_albaranes_numero_albaran ON albaranes(numero_albaran);
            CREATE INDEX IF NOT EXISTS idx_albaran_items_id_albaran ON albaran_items(id_albaran);
          `
        });
        console.log('Índices creados correctamente');
      } catch (indexError) {
        console.warn('Error al crear índices:', indexError);
      }
      
      console.log('Migración de albaranes completada correctamente');
      return {
        success: true,
        message: 'Migración de albaranes completada con éxito'
      };
      
    } catch (error) {
      console.error('Error durante la migración:', error);
      return {
        success: false,
        message: 'Error durante la migración',
        error
      };
    }
  } catch (error) {
    console.error('Error general durante la migración:', error);
    return {
      success: false,
      message: 'Error general en la migración',
      error
    };
  }
};

// Función para migrar la tabla envios
export const ejecutarMigracionEnvios = async () => {
  console.log('Iniciando migración de envíos...');
  
  try {
    const client = getSupabaseClient();
    
    // Verificar si existe la tabla envios
    try {
      console.log('Verificando si existe la tabla envios...');
      const { data: existeTablaData, error: errorVerificar } = await client.rpc('execute_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'envios'
          );
        `
      });
      
      let tablaExiste = false;
      
      // Verificar el formato de la respuesta y extraer el valor correctamente
      if (existeTablaData && Array.isArray(existeTablaData)) {
        // El formato puede variar, así que verificamos diferentes estructuras posibles
        if (Array.isArray(existeTablaData[0]) && existeTablaData[0].length > 0 && 'exists' in existeTablaData[0][0]) {
          tablaExiste = existeTablaData[0][0].exists;
        } else if (existeTablaData[0] && typeof existeTablaData[0] === 'object' && 'exists' in existeTablaData[0]) {
          tablaExiste = existeTablaData[0].exists;
        } else if (existeTablaData.length > 0 && typeof existeTablaData[0] === 'boolean') {
          tablaExiste = existeTablaData[0];
        }
      }
      
      console.log('¿Existe tabla envios? (según verificación):', tablaExiste);
      
      // Si la tabla no existe, crearla
      if (!tablaExiste) {
        console.log('Creando tabla envios...');
        
        // Verificación adicional antes de intentar crear la tabla
        let debeCrearTabla = true;
        try {
          // Intento más directo para verificar si la tabla existe
          const { data: checkData, error: checkError } = await client.rpc('execute_sql', {
            sql: `SELECT to_regclass('public.envios') IS NOT NULL AS exists;`
          });
          
          let existeDirecto = false;
          if (checkData && Array.isArray(checkData) && checkData.length > 0) {
            if (Array.isArray(checkData[0]) && checkData[0].length > 0) {
              existeDirecto = checkData[0][0].exists;
            } else if (checkData[0] && typeof checkData[0].exists !== 'undefined') {
              existeDirecto = checkData[0].exists;
            }
          }
          
          console.log('Verificación directa de tabla envios:', existeDirecto);
          
          // Si la tabla existe según esta verificación, saltamos la creación
          if (existeDirecto) {
            console.log('La tabla envios existe según verificación directa, omitiendo creación');
            tablaExiste = true;
            debeCrearTabla = false;
          }
        } catch (checkErr) {
          console.warn('Error en verificación directa, continuando con creación normal:', checkErr);
        }
        
        // Si debemos crear la tabla, procedemos
        if (debeCrearTabla) {
          const { error: errorCrear } = await client.rpc('execute_sql', {
            sql: `
              CREATE TABLE envios (
                id SERIAL PRIMARY KEY,
                numero_envio VARCHAR(50) NOT NULL,
                fecha_envio DATE DEFAULT CURRENT_DATE,
                cliente VARCHAR(100) NOT NULL,
                destino VARCHAR(100) NOT NULL,
                estado VARCHAR(20) DEFAULT 'pendiente',
                transportista VARCHAR(100) NOT NULL,
                peso_total NUMERIC(10,2) DEFAULT 0,
                num_paquetes INTEGER DEFAULT 1,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              );
            `
          });
          
          if (errorCrear) {
            // Si el error es que la tabla ya existe (42P07), lo tratamos como un no-error
            if (errorCrear.code === '42P07') {
              console.log('La tabla envios ya existe, continuando con la migración...');
            } else {
              console.error('Error creando tabla envios:', errorCrear);
              return {
                success: false,
                message: 'Error creando tabla envios',
                error: errorCrear
              };
            }
          }
          
          console.log('Tabla envios creada correctamente');
        }
      } else {
        // Si la tabla existe, verificar y añadir columnas que falten
        console.log('Verificando columnas de la tabla envios...');
        
        // Lista de columnas a verificar
        const columnas = [
          { nombre: 'numero_envio', tipo: 'VARCHAR(50)', defecto: "'ENV-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || LPAD(nextval('envios_id_seq')::text, 3, '0')" },
          { nombre: 'fecha_envio', tipo: 'DATE', defecto: "CURRENT_DATE" },
          { nombre: 'cliente', tipo: 'VARCHAR(100)', defecto: "'Cliente pendiente'" },
          { nombre: 'destino', tipo: 'VARCHAR(100)', defecto: "'Pendiente'" },
          { nombre: 'estado', tipo: 'VARCHAR(20)', defecto: "'pendiente'" },
          { nombre: 'transportista', tipo: 'VARCHAR(100)', defecto: "'Pendiente'" },
          { nombre: 'peso_total', tipo: 'NUMERIC(10,2)', defecto: "0" },
          { nombre: 'num_paquetes', tipo: 'INTEGER', defecto: "1" },
          { nombre: 'created_at', tipo: 'TIMESTAMP WITH TIME ZONE', defecto: "CURRENT_TIMESTAMP" },
          { nombre: 'updated_at', tipo: 'TIMESTAMP WITH TIME ZONE', defecto: "CURRENT_TIMESTAMP" }
        ];
        
        // Verificar cada columna
        for (const col of columnas) {
          try {
            console.log(`Verificando columna ${col.nombre}...`);
            const { error } = await client.rpc('execute_sql', {
              sql: `
                ALTER TABLE envios
                ADD COLUMN IF NOT EXISTS ${col.nombre} ${col.tipo} DEFAULT ${col.defecto};
              `
            });
            
            if (error) {
              console.warn(`Error al verificar columna ${col.nombre}:`, error);
              
              // Intentar sin valor por defecto
              try {
                await client.rpc('execute_sql', {
                  sql: `ALTER TABLE envios ADD COLUMN IF NOT EXISTS ${col.nombre} ${col.tipo};`
                });
                console.log(`Columna ${col.nombre} añadida sin valor por defecto`);
              } catch (err) {
                console.error(`No se pudo añadir columna ${col.nombre}:`, err);
              }
            } else {
              console.log(`Columna ${col.nombre} verificada correctamente`);
            }
          } catch (columnError) {
            console.error(`Error al procesar columna ${col.nombre}:`, columnError);
          }
        }
      }
      
      // Crear índices para mejorar el rendimiento
      try {
        console.log('Creando índices...');
        await client.rpc('execute_sql', {
          sql: `
            CREATE INDEX IF NOT EXISTS idx_envios_numero_envio ON envios(numero_envio);
            CREATE INDEX IF NOT EXISTS idx_envios_fecha_envio ON envios(fecha_envio);
            CREATE INDEX IF NOT EXISTS idx_envios_cliente ON envios(cliente);
            CREATE INDEX IF NOT EXISTS idx_envios_estado ON envios(estado);
          `
        });
        console.log('Índices creados correctamente');
      } catch (indexError) {
        console.warn('Error al crear índices:', indexError);
      }
      
      // Insertar datos de ejemplo si no hay registros
      try {
        const { data: conteoData } = await client.rpc('execute_sql', {
          sql: `SELECT COUNT(*) FROM envios;`
        });
        
        let count = 0;
        if (conteoData && Array.isArray(conteoData) && conteoData.length > 0) {
          if (Array.isArray(conteoData[0]) && conteoData[0].length > 0) {
            count = parseInt(conteoData[0][0].count);
          }
        }
        
        if (count === 0) {
          console.log('No hay registros, insertando datos de ejemplo...');
          
          // Datos de ejemplo
          const datosEjemplo = [
            {
              numero_envio: "ENV-2023-001",
              fecha_envio: "2023-05-15",
              cliente: "Comercial Acme, S.L.",
              destino: "Barcelona, España",
              estado: "entregado",
              transportista: "Seur",
              peso_total: 125.5,
              num_paquetes: 3
            },
            {
              numero_envio: "ENV-2023-002",
              fecha_envio: "2023-05-28",
              cliente: "Distribuciones García",
              destino: "Madrid, España",
              estado: "en_transito",
              transportista: "MRW",
              peso_total: 45.2,
              num_paquetes: 1
            },
            {
              numero_envio: "ENV-2023-003",
              fecha_envio: "2023-06-05",
              cliente: "Industrias Martínez, S.A.",
              destino: "Valencia, España",
              estado: "pendiente",
              transportista: "DHL",
              peso_total: 230.0,
              num_paquetes: 5
            }
          ];
          
          // Insertar ejemplos
          for (const ejemplo of datosEjemplo) {
            await client.rpc('execute_sql', {
              sql: `
                INSERT INTO envios (
                  numero_envio, fecha_envio, cliente, destino, estado, 
                  transportista, peso_total, num_paquetes
                ) VALUES (
                  '${ejemplo.numero_envio}', 
                  '${ejemplo.fecha_envio}', 
                  '${ejemplo.cliente}', 
                  '${ejemplo.destino}', 
                  '${ejemplo.estado}', 
                  '${ejemplo.transportista}', 
                  ${ejemplo.peso_total}, 
                  ${ejemplo.num_paquetes}
                );
              `
            });
          }
          
          console.log('Datos de ejemplo insertados correctamente');
        }
      } catch (datosError) {
        console.warn('Error al insertar datos de ejemplo:', datosError);
      }
      
      console.log('Migración de envíos completada correctamente');
      return {
        success: true,
        message: 'Migración de envíos completada con éxito'
      };
      
    } catch (error) {
      console.error('Error durante la migración:', error);
      return {
        success: false,
        message: 'Error durante la migración',
        error
      };
    }
  } catch (error) {
    console.error('Error general durante la migración:', error);
    return {
      success: false,
      message: 'Error general en la migración',
      error
    };
  }
};

// NOTA: Para componentes de servidor (Server Components), usa:
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
// import { cookies } from 'next/headers';
//
// const supabaseServer = createServerComponentClient({ cookies });

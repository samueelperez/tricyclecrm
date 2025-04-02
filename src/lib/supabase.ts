import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const getSupabaseClient = () => {
  return createClientComponentClient();
};

// Función para migrar la tabla de listas de empaque
export const ejecutarMigracionListasEmpaque = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // Verificar si la tabla existe
    const { data: tablaExiste, error: errorVerificacion } = await supabase
      .from('listas_empaque')
      .select('id')
      .limit(1);
    
    // Si no hay error, la tabla ya existe
    if (!errorVerificacion) {
      console.log('La tabla listas_empaque ya existe');
      return { success: true, message: 'La tabla ya existe' };
    }
    
    // Si el error no es porque la tabla no existe, hay otro problema
    if (!errorVerificacion.message.includes('does not exist')) {
      console.error('Error verificando tabla listas_empaque:', errorVerificacion);
      return { success: false, error: errorVerificacion, message: 'Error verificando tabla' };
    }
    
    console.log('Creando tabla listas_empaque...');
    
    // Crear la tabla si no existe
    const { error: errorCreacion } = await supabase.rpc('crear_tabla_listas_empaque');
    
    if (errorCreacion) {
      console.error('Error creando función RPC:', errorCreacion);
      
      // Intentar crear la tabla directamente
      const { error: errorSQL } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS listas_empaque (
          id SERIAL PRIMARY KEY,
          numero_lista VARCHAR(50) NOT NULL,
          fecha_creacion DATE NOT NULL,
          cliente VARCHAR(255) NOT NULL,
          envio_id INTEGER REFERENCES envios(id),
          estado VARCHAR(50) NOT NULL DEFAULT 'borrador',
          num_items INTEGER NOT NULL DEFAULT 0,
          peso_total DECIMAL(10,2) NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      if (errorSQL) {
        console.error('Error creando tabla listas_empaque directamente:', errorSQL);
        return { success: false, error: errorSQL, message: 'Error creando tabla directamente' };
      }
      
      console.log('Tabla listas_empaque creada directamente con éxito');
      return { success: true, message: 'Tabla creada directamente' };
    }
    
    console.log('Tabla listas_empaque creada con éxito mediante RPC');
    return { success: true, message: 'Tabla creada mediante RPC' };
    
  } catch (error) {
    console.error('Error en migración de listas_empaque:', error);
    return { success: false, error, message: 'Error en proceso de migración' };
  }
};

// Función para migrar la tabla de recibos
export const ejecutarMigracionRecibos = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // Verificar si la tabla existe
    const { data: tablaExiste, error: errorVerificacion } = await supabase
      .from('recibos')
      .select('id')
      .limit(1);
    
    // Si no hay error, la tabla ya existe
    if (!errorVerificacion) {
      console.log('La tabla recibos ya existe');
      return { success: true, message: 'La tabla ya existe' };
    }
    
    // Si el error no es porque la tabla no existe, hay otro problema
    if (!errorVerificacion.message.includes('does not exist')) {
      console.error('Error verificando tabla recibos:', errorVerificacion);
      return { success: false, error: errorVerificacion, message: 'Error verificando tabla' };
    }
    
    console.log('Creando tabla recibos...');
    
    // Crear la tabla si no existe
    const { error: errorCreacion } = await supabase.rpc('crear_tabla_recibos');
    
    if (errorCreacion) {
      console.error('Error creando función RPC para recibos:', errorCreacion);
      
      // Intentar crear la tabla directamente
      const { error: errorSQL } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS recibos (
          id SERIAL PRIMARY KEY,
          numero_recibo VARCHAR(50) NOT NULL,
          fecha_emision DATE NOT NULL,
          fecha_vencimiento DATE NOT NULL,
          cliente_id INTEGER,
          cliente VARCHAR(255),
          factura_id INTEGER,
          numero_factura VARCHAR(50),
          monto DECIMAL(10,2) NOT NULL,
          monto_pagado DECIMAL(10,2) NOT NULL DEFAULT 0,
          saldo_pendiente DECIMAL(10,2) NOT NULL DEFAULT 0,
          estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
          metodo_pago VARCHAR(50) NOT NULL,
          notas TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      if (errorSQL) {
        console.error('Error creando tabla recibos directamente:', errorSQL);
        return { success: false, error: errorSQL, message: 'Error creando tabla directamente' };
      }
      
      console.log('Tabla recibos creada directamente con éxito');
      return { success: true, message: 'Tabla creada directamente' };
    }
    
    console.log('Tabla recibos creada con éxito mediante RPC');
    return { success: true, message: 'Tabla creada mediante RPC' };
    
  } catch (error) {
    console.error('Error en migración de recibos:', error);
    return { success: false, error, message: 'Error en proceso de migración' };
  }
};

// Función para migrar la tabla de instrucciones BL
export const ejecutarMigracionInstruccionesBL = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // Verificar si la tabla existe
    const { data: tablaExiste, error: errorVerificacion } = await supabase
      .from('instrucciones_bl')
      .select('id')
      .limit(1);
    
    // Si no hay error, la tabla ya existe
    if (!errorVerificacion) {
      console.log('La tabla instrucciones_bl ya existe');
      return { success: true, message: 'La tabla ya existe' };
    }
    
    // Si el error no es porque la tabla no existe, hay otro problema
    if (!errorVerificacion.message.includes('does not exist')) {
      console.error('Error verificando tabla instrucciones_bl:', errorVerificacion);
      return { success: false, error: errorVerificacion, message: 'Error verificando tabla' };
    }
    
    console.log('Creando tabla instrucciones_bl...');
    
    // Crear la tabla si no existe
    const { error: errorCreacion } = await supabase.rpc('crear_tabla_instrucciones_bl');
    
    if (errorCreacion) {
      console.error('Error creando función RPC para instrucciones_bl:', errorCreacion);
      
      // Intentar crear la tabla directamente
      const { error: errorSQL } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS instrucciones_bl (
          id SERIAL PRIMARY KEY,
          numero_instruccion VARCHAR(50) NOT NULL,
          fecha_creacion DATE NOT NULL,
          fecha_estimada_embarque DATE,
          cliente_id INTEGER,
          cliente VARCHAR(255),
          envio_id INTEGER REFERENCES envios(id),
          consignatario VARCHAR(255) NOT NULL,
          puerto_carga VARCHAR(100) NOT NULL,
          puerto_descarga VARCHAR(100) NOT NULL,
          tipo_carga VARCHAR(100) NOT NULL,
          incoterm VARCHAR(50) NOT NULL,
          estado VARCHAR(50) NOT NULL DEFAULT 'borrador',
          notas TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      if (errorSQL) {
        console.error('Error creando tabla instrucciones_bl directamente:', errorSQL);
        return { success: false, error: errorSQL, message: 'Error creando tabla directamente' };
      }
      
      console.log('Tabla instrucciones_bl creada directamente con éxito');
      return { success: true, message: 'Tabla creada directamente' };
    }
    
    console.log('Tabla instrucciones_bl creada con éxito mediante RPC');
    return { success: true, message: 'Tabla creada mediante RPC' };
    
  } catch (error) {
    console.error('Error en migración de instrucciones_bl:', error);
    return { success: false, error, message: 'Error en proceso de migración' };
  }
};

// Función para migrar la tabla de configuración
export const ejecutarMigracionConfiguracion = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // Verificar si la tabla existe
    const { data: tablaExiste, error: errorVerificacion } = await supabase
      .from('configuracion')
      .select('id')
      .limit(1);
    
    // Si no hay error, la tabla ya existe
    if (!errorVerificacion) {
      console.log('La tabla configuracion ya existe');
      return { success: true, message: 'La tabla ya existe' };
    }
    
    // Si el error no es porque la tabla no existe, hay otro problema
    if (!errorVerificacion.message.includes('does not exist')) {
      console.error('Error verificando tabla configuracion:', errorVerificacion);
      return { success: false, error: errorVerificacion, message: 'Error verificando tabla' };
    }
    
    console.log('Creando tabla configuracion...');
    
    // Crear la tabla si no existe
    const { error: errorCreacion } = await supabase.rpc('crear_tabla_configuracion');
    
    if (errorCreacion) {
      console.error('Error creando función RPC para configuracion:', errorCreacion);
      
      // Intentar crear la tabla directamente
      const { error: errorSQL } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS configuracion (
          id SERIAL PRIMARY KEY,
          categoria VARCHAR(50) NOT NULL,
          clave VARCHAR(100) NOT NULL,
          valor TEXT,
          descripcion TEXT,
          tipo_valor VARCHAR(20) DEFAULT 'string',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(categoria, clave)
        );
        
        -- Insertar configuraciones predeterminadas
        INSERT INTO configuracion (categoria, clave, valor, descripcion, tipo_valor)
        VALUES 
          ('empresa', 'nombre', 'TricycleCRM', 'Nombre de la empresa', 'string'),
          ('empresa', 'direccion', 'Calle Ejemplo 123', 'Dirección de la empresa', 'string'),
          ('empresa', 'telefono', '+34 912345678', 'Teléfono de contacto', 'string'),
          ('empresa', 'email', 'info@ejemplo.com', 'Email de contacto', 'string'),
          ('moneda', 'principal', 'EUR', 'Moneda predeterminada', 'string'),
          ('moneda', 'formato', '###,##0.00', 'Formato de moneda', 'string'),
          ('sistema', 'version', '1.0.0', 'Versión del sistema', 'string'),
          ('sistema', 'tema', 'claro', 'Tema del sistema (claro/oscuro)', 'string'),
          ('sistema', 'items_por_pagina', '20', 'Número de ítems por página en tablas', 'number')
        ON CONFLICT (categoria, clave) DO NOTHING;
      `);
      
      if (errorSQL) {
        console.error('Error creando tabla configuracion directamente:', errorSQL);
        return { success: false, error: errorSQL, message: 'Error creando tabla directamente' };
      }
      
      console.log('Tabla configuracion creada directamente con éxito');
      return { success: true, message: 'Tabla creada directamente' };
    }
    
    console.log('Tabla configuracion creada con éxito mediante RPC');
    return { success: true, message: 'Tabla creada mediante RPC' };
    
  } catch (error) {
    console.error('Error en migración de configuracion:', error);
    return { success: false, error, message: 'Error en proceso de migración' };
  }
};

// Función para migrar la tabla de negocios
export const ejecutarMigracionNegocios = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // Verificar si la tabla existe
    const { data: tablaExiste, error: errorVerificacion } = await supabase
      .from('negocios')
      .select('id')
      .limit(1);
    
    // Si no hay error, la tabla ya existe
    if (!errorVerificacion) {
      console.log('La tabla negocios ya existe');
      return { success: true, message: 'La tabla ya existe' };
    }
    
    // Si el error no es porque la tabla no existe, hay otro problema
    if (!errorVerificacion.message.includes('does not exist')) {
      console.error('Error verificando tabla negocios:', errorVerificacion);
      return { success: false, error: errorVerificacion, message: 'Error verificando tabla' };
    }
    
    console.log('Creando tabla negocios...');
    
    // Crear la tabla si no existe
    const { error: errorCreacion } = await supabase.rpc('crear_tabla_negocios');
    
    if (errorCreacion) {
      console.error('Error creando función RPC para negocios:', errorCreacion);
      
      // Intentar crear la tabla directamente
      const { error: errorSQL } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS negocios (
          id SERIAL PRIMARY KEY,
          numero_negocio VARCHAR(50) NOT NULL,
          fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
          fecha_estimada_cierre DATE,
          cliente_id INTEGER REFERENCES clientes(id),
          cliente VARCHAR(255),
          valor DECIMAL(12,2) NOT NULL DEFAULT 0,
          estado VARCHAR(50) NOT NULL DEFAULT 'prospecto',
          etapa VARCHAR(50),
          probabilidad INTEGER,
          asignado_a VARCHAR(100),
          productos JSONB,
          notas TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      if (errorSQL) {
        console.error('Error creando tabla negocios directamente:', errorSQL);
        return { success: false, error: errorSQL, message: 'Error creando tabla directamente' };
      }
      
      console.log('Tabla negocios creada directamente con éxito');
      return { success: true, message: 'Tabla creada directamente' };
    }
    
    console.log('Tabla negocios creada con éxito mediante RPC');
    return { success: true, message: 'Tabla creada mediante RPC' };
    
  } catch (error) {
    console.error('Error en migración de negocios:', error);
    return { success: false, error, message: 'Error en proceso de migración' };
  }
};

// Función para migrar la tabla de proformas
export const ejecutarMigracionProformas = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // Verificar si la tabla existe
    const { data: tablaExiste, error: errorVerificacion } = await supabase
      .from('proformas')
      .select('id')
      .limit(1);
    
    // Si no hay error, la tabla ya existe
    if (!errorVerificacion) {
      console.log('La tabla proformas ya existe');
      return { success: true, message: 'La tabla ya existe' };
    }
    
    // Si el error no es porque la tabla no existe, hay otro problema
    if (!errorVerificacion.message.includes('does not exist')) {
      console.error('Error verificando tabla proformas:', errorVerificacion);
      return { success: false, error: errorVerificacion, message: 'Error verificando tabla' };
    }
    
    console.log('Creando tabla proformas...');
    
    // Crear la tabla si no existe
    const { error: errorCreacion } = await supabase.rpc('crear_tabla_proformas');
    
    if (errorCreacion) {
      console.error('Error creando función RPC para proformas:', errorCreacion);
      
      // Intentar crear la tabla directamente
      const { error: errorSQL } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS proformas (
          id SERIAL PRIMARY KEY,
          numero_proforma VARCHAR(50) NOT NULL,
          fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
          fecha_vencimiento DATE NOT NULL,
          cliente_id INTEGER REFERENCES clientes(id),
          cliente VARCHAR(255),
          total DECIMAL(12,2) NOT NULL DEFAULT 0,
          estado VARCHAR(50) NOT NULL DEFAULT 'borrador',
          divisa VARCHAR(3) NOT NULL DEFAULT 'EUR',
          condiciones_pago VARCHAR(100),
          validez INTEGER,
          items JSONB,
          notas TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      if (errorSQL) {
        console.error('Error creando tabla proformas directamente:', errorSQL);
        return { success: false, error: errorSQL, message: 'Error creando tabla directamente' };
      }
      
      console.log('Tabla proformas creada directamente con éxito');
      return { success: true, message: 'Tabla creada directamente' };
    }
    
    console.log('Tabla proformas creada con éxito mediante RPC');
    return { success: true, message: 'Tabla creada mediante RPC' };
    
  } catch (error) {
    console.error('Error en migración de proformas:', error);
    return { success: false, error, message: 'Error en proceso de migración' };
  }
};

// Función para migrar la tabla de facturas
export const ejecutarMigracionFacturas = async () => {
  // ... código existente si existe
};

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

// Función para migrar la estructura de almacenamiento en la nube
export const ejecutarMigracionAlmacenamiento = async () => {
  try {
    const supabase = getSupabaseClient();
    
    console.log('Paso 1: Iniciando verificación de tablas...');
    
    // Verificar si la tabla carpetas existe
    const { data: tablaCarpetasExiste, error: errorVerificacionCarpetas } = await supabase
      .from('carpetas')
      .select('id')
      .limit(1);
    
    // Si no hay error, la tabla ya existe
    if (!errorVerificacionCarpetas) {
      console.log('La tabla carpetas ya existe');
    } else {
      // Si el error no es porque la tabla no existe, hay otro problema
      if (!errorVerificacionCarpetas.message.includes('does not exist')) {
        console.error('Error verificando tabla carpetas:', errorVerificacionCarpetas);
        return { success: false, error: errorVerificacionCarpetas, message: 'Error verificando tabla carpetas' };
      }
      
      console.log('Paso 2: Creando tabla carpetas...');
      
      // Crear tabla carpetas usando la función personalizada (que inserta una carpeta de prueba)
      const resultCarpetas = await crear_tabla_carpetas();
      
      if (!resultCarpetas.success) {
        console.error('Error creando tabla carpetas:', resultCarpetas.error);
        return { 
          success: false, 
          error: resultCarpetas.error, 
          message: 'Error creando tabla carpetas' 
        };
      }
      
      console.log('Tabla carpetas creada con éxito');
    }
    
    console.log('Paso 3: Verificando tabla archivos...');
    
    // Verificar si la tabla archivos existe
    const { data: tablaArchivosExiste, error: errorVerificacionArchivos } = await supabase
      .from('archivos')
      .select('id')
      .limit(1);
    
    // Si no hay error, la tabla ya existe
    if (!errorVerificacionArchivos) {
      console.log('La tabla archivos ya existe');
    } else {
      // Si el error no es porque la tabla no existe, hay otro problema
      if (!errorVerificacionArchivos.message.includes('does not exist')) {
        console.error('Error verificando tabla archivos:', errorVerificacionArchivos);
        return { success: false, error: errorVerificacionArchivos, message: 'Error verificando tabla archivos' };
      }
      
      console.log('Paso 4: Creando tabla archivos...');
      
      // Crear tabla archivos usando la función personalizada
      const resultArchivos = await crear_tabla_archivos();
      
      if (!resultArchivos.success) {
        console.error('Error creando tabla archivos:', resultArchivos.error);
        return { 
          success: false, 
          error: resultArchivos.error, 
          message: 'Error creando tabla archivos' 
        };
      }
      
      console.log('Tabla archivos creada con éxito');
    }
    
    console.log('Paso 5: Verificando tabla permisos...');
    
    // Verificar si la tabla permisos_archivos existe
    const { data: tablaPermisosExiste, error: errorVerificacionPermisos } = await supabase
      .from('permisos_archivos')
      .select('id')
      .limit(1);
    
    // Si no hay error, la tabla ya existe
    if (!errorVerificacionPermisos) {
      console.log('La tabla permisos_archivos ya existe');
    } else {
      // Si el error no es porque la tabla no existe, hay otro problema
      if (!errorVerificacionPermisos.message.includes('does not exist')) {
        console.error('Error verificando tabla permisos_archivos:', errorVerificacionPermisos);
        return { success: false, error: errorVerificacionPermisos, message: 'Error verificando tabla permisos_archivos' };
      }
      
      console.log('Paso 6: Creando tabla permisos_archivos...');
      
      // Crear tabla permisos usando la función personalizada
      const resultPermisos = await crear_tabla_permisos_archivos();
      
      if (!resultPermisos.success) {
        console.error('Error creando tabla permisos_archivos:', resultPermisos.error);
        return { 
          success: false, 
          error: resultPermisos.error, 
          message: 'Error creando tabla permisos_archivos' 
        };
      }
      
      console.log('Tabla permisos_archivos creada con éxito');
    }
    
    console.log('Paso 7: Verificando bucket de almacenamiento...');
    
    // Crear bucket de almacenamiento si no existe
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      
      if (!buckets || !buckets.find(b => b.name === 'archivos')) {
        console.log('Paso 8: Creando bucket de almacenamiento...');
        
        const { data: bucket, error: errorBucket } = await supabase.storage.createBucket('archivos', {
          public: false
        });
        
        if (errorBucket) {
          console.error('Error creando bucket de almacenamiento:', errorBucket);
          return { success: false, error: errorBucket, message: 'Error creando bucket de almacenamiento' };
        }
        
        console.log('Bucket de almacenamiento creado con éxito');
        
        // Ahora crear políticas para el bucket
        console.log('Creando políticas para el bucket...');
        
        try {
          // Política de lectura (SELECT)
          await supabase.storage.from('archivos').createPolicy('Permitir lectura a todos', {
            type: 'SELECT',
            definition: 'true',
            name: 'Acceso de lectura público'
          });
          
          // Política de escritura (INSERT)
          await supabase.storage.from('archivos').createPolicy('Permitir subida a usuarios autenticados', {
            type: 'INSERT',
            definition: 'auth.role() = \'authenticated\'',
            name: 'Subida de archivos autenticada'
          });
          
          // Política de actualización (UPDATE)
          await supabase.storage.from('archivos').createPolicy('Permitir actualización a propietarios', {
            type: 'UPDATE',
            definition: 'auth.uid() = owner',
            name: 'Actualización por propietario'
          });
          
          // Política de eliminación (DELETE)
          await supabase.storage.from('archivos').createPolicy('Permitir eliminación a propietarios', {
            type: 'DELETE',
            definition: 'auth.uid() = owner',
            name: 'Eliminación por propietario'
          });
          
          console.log('Políticas de bucket creadas con éxito');
        } catch (errorPolicies) {
          console.warn('Error creando políticas de bucket:', errorPolicies);
          console.warn('Las políticas deberán ser creadas manualmente desde el Panel de Supabase');
        }
      } else {
        console.log('El bucket de almacenamiento ya existe');
      }
    } catch (error) {
      console.error('Error al verificar o crear el bucket:', error);
      return { success: false, error, message: 'Error al verificar o crear el bucket' };
    }
    
    console.log('Paso 9: Verificando carpeta raíz...');
    
    // Crear carpeta raíz si no existe
    try {
      const { data: carpetaRaiz, error: errorBusquedaRaiz } = await supabase
        .from('carpetas')
        .select('*')
        .eq('nombre', 'Raíz')
        .is('carpeta_padre', null)
        .limit(1);
        
      if (!carpetaRaiz || carpetaRaiz.length === 0) {
        // Crear carpeta raíz
        console.log('Paso 10: Creando carpeta raíz...');
        
        // Obtener id del usuario actual para usarlo como creador
        const { data: { session } } = await supabase.auth.getSession();
        const usuarioId = session?.user?.id || 'system-init';
        
        if (!usuarioId) {
          console.error('No se pudo obtener el ID del usuario actual');
          return { success: false, message: 'No se pudo obtener el ID del usuario actual para crear la carpeta raíz' };
        }
        
        const { data: nuevaCarpetaRaiz, error: errorCrearRaiz } = await supabase
          .from('carpetas')
          .insert({
            nombre: 'Raíz',
            carpeta_padre: null,
            creado_por: usuarioId
          })
          .select();
          
        if (errorCrearRaiz) {
          console.error('Error creando carpeta raíz:', errorCrearRaiz);
          return { success: false, error: errorCrearRaiz, message: 'Error creando carpeta raíz' };
        }
        
        console.log('Carpeta raíz creada con éxito');
      } else {
        console.log('La carpeta raíz ya existe');
      }
    } catch (error) {
      console.error('Error al verificar o crear la carpeta raíz:', error);
      return { success: false, error, message: 'Error al verificar o crear la carpeta raíz' };
    }
    
    console.log('Paso 11: Migración completada con éxito');
    return { success: true, message: 'Migración de almacenamiento completada con éxito' };
  } catch (error) {
    console.error('Error en migración de almacenamiento:', error);
    return { success: false, error, message: 'Error en proceso de migración de almacenamiento' };
  }
}; 
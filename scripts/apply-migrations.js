// Script para aplicar migraciones a Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Determinar si estamos en Vercel
const isVercel = process.env.VERCEL === '1';

// Leer las variables de entorno para la conexión a Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Se requieren las variables de entorno NEXT_PUBLIC_SUPABASE_URL y una clave de Supabase (SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ADMIN_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  if (isVercel) {
    console.log('En Vercel: Continuando a pesar del error para no fallar el despliegue');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Mostrar información de conexión
console.log(`Conectando a Supabase en: ${supabaseUrl}`);
console.log(`Usando clave: ${supabaseKey.substring(0, 5)}...${supabaseKey.substring(supabaseKey.length - 5)}`);

// Crear cliente de Supabase con la clave de servicio (service_role)
const supabase = createClient(supabaseUrl, supabaseKey);

// SQL para crear la vista auth_users_view
const createAuthUsersViewSQL = `
CREATE OR REPLACE VIEW public.auth_users_view AS
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users;

ALTER VIEW public.auth_users_view OWNER TO authenticated;
GRANT SELECT ON public.auth_users_view TO authenticated;
`;

// SQL para crear la tabla usuario_secciones
const createUsuarioSeccionesSQL = `
CREATE TABLE IF NOT EXISTS public.usuario_secciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  secciones_visibles TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.usuario_secciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administradores pueden ver todas las configuraciones" 
ON public.usuario_secciones FOR SELECT 
TO authenticated 
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@tricyclecrm.com'
);

CREATE POLICY "Usuarios pueden ver su propia configuración" 
ON public.usuario_secciones FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Administradores pueden insertar configuraciones" 
ON public.usuario_secciones FOR INSERT 
TO authenticated 
WITH CHECK (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@tricyclecrm.com'
);

CREATE POLICY "Administradores pueden actualizar configuraciones" 
ON public.usuario_secciones FOR UPDATE 
TO authenticated 
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@tricyclecrm.com'
);

CREATE POLICY "Administradores pueden eliminar configuraciones" 
ON public.usuario_secciones FOR DELETE 
TO authenticated 
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@tricyclecrm.com'
);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuario_secciones_updated_at
BEFORE UPDATE ON public.usuario_secciones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
`;

async function applyMigrations() {
  try {
    console.log('Aplicando migraciones...');
    
    // Verificar la conexión a Supabase
    console.log('Verificando conexión...');
    try {
      const { data, error } = await supabase.from('_pgrst_reserved_id').select('*').limit(1);
      if (error) {
        console.log('Conexión verificada (es normal ver un error relacionado con _pgrst_reserved_id si la tabla no existe)');
      } else {
        console.log('Conexión verificada');
      }
    } catch (connectionError) {
      console.log('Error al verificar la conexión, pero continuando...');
      console.error(connectionError);
    }
    
    // Intentar crear la vista auth_users_view
    console.log('\nCreando vista auth_users_view...');
    try {
      const { error: viewError } = await supabase.rpc('execute_sql', { 
        sql_statement: createAuthUsersViewSQL 
      });
      
      if (viewError) {
        console.error('Error al crear vista auth_users_view:', viewError);
        throw new Error('No se pudo crear la vista auth_users_view');
      } else {
        console.log('Vista auth_users_view creada correctamente');
      }
    } catch (viewError) {
      console.log('Error al crear la vista. Es posible que la función execute_sql no exista.');
      console.log('Ejecutando plan alternativo...');
      
      // Si no podemos crear la vista, mostrar instrucciones para hacerlo manualmente
      showManualInstructions();
      return;
    }
    
    // Intentar crear la tabla usuario_secciones
    console.log('\nCreando tabla usuario_secciones...');
    try {
      const { error: tableError } = await supabase.rpc('execute_sql', { 
        sql_statement: createUsuarioSeccionesSQL 
      });
      
      if (tableError) {
        console.error('Error al crear tabla usuario_secciones:', tableError);
        throw new Error('No se pudo crear la tabla usuario_secciones');
      } else {
        console.log('Tabla usuario_secciones creada correctamente');
      }
    } catch (tableError) {
      console.log('Error al crear la tabla usuario_secciones.');
      console.log('Ejecutando plan alternativo...');
      
      // Si no podemos crear la tabla, mostrar instrucciones para hacerlo manualmente
      showManualInstructions();
      return;
    }
    
    console.log('\n¡Migración completada con éxito!');
    console.log('Ahora puedes acceder a la aplicación como administrador y configurar las secciones visibles para cada usuario.');
  } catch (error) {
    console.error('\nError durante la migración:', error);
    showManualInstructions();
    
    // En Vercel, nunca fallamos para no interrumpir el despliegue
    if (isVercel) {
      console.log('En Vercel: Continuando a pesar del error para no fallar el despliegue');
      process.exit(0);
    }
  }
}

function showManualInstructions() {
  console.log('\n=== INSTRUCCIONES PARA MIGRACIÓN MANUAL ===');
  console.log('No se pudieron aplicar automáticamente las migraciones. Tienes dos opciones:');
  
  console.log('\nOPCIÓN 1: Usar la interfaz web');
  console.log('1. Inicia sesión en la aplicación como administrador (admin@tricyclecrm.com)');
  console.log('2. Navega a la URL: /admin/secciones');
  console.log('3. El componente AdminSecciones intentará crear automáticamente las tablas necesarias');
  
  console.log('\nOPCIÓN 2: Ejecutar SQL directamente en Supabase Studio');
  console.log('1. Inicia sesión en tu proyecto de Supabase: https://app.supabase.com');
  console.log('2. Ve a la sección SQL Editor');
  console.log('3. Ejecuta el siguiente SQL:');
  
  console.log('\n--- Vista auth_users_view ---');
  console.log(createAuthUsersViewSQL);
  
  console.log('\n--- Tabla usuario_secciones ---');
  console.log(createUsuarioSeccionesSQL);
}

// Ejecutar las migraciones de manera segura
async function safeApplyMigrations() {
  try {
    await applyMigrations();
    
    // Siempre salimos con éxito en Vercel
    if (isVercel) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Error catastrófico durante las migraciones:', error);
    
    // En Vercel, nunca fallamos para no interrumpir el despliegue
    if (isVercel) {
      console.log('En Vercel: Continuando a pesar del error para no fallar el despliegue');
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

// Ejecutar de manera segura
safeApplyMigrations(); 
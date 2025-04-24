import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Verificar la sesión del usuario
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar si el usuario es admin
    if (session.user.email !== 'admin@tricyclecrm.com') {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener los datos del request
    const body = await request.json();
    const { function_name } = body;

    if (!function_name) {
      return NextResponse.json({ error: "Falta el nombre de la función" }, { status: 400 });
    }

    let result;

    // Crear la función según el nombre solicitado
    if (function_name === 'create_auth_users_view_if_missing') {
      result = await createAuthUsersView(supabase);
    } else if (function_name === 'create_usuario_secciones_table_if_missing') {
      result = await createUsuarioSeccionesTable(supabase);
    } else {
      return NextResponse.json({ error: "Función no reconocida" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error al ejecutar función:', error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

async function createAuthUsersView(supabase: any) {
  try {
    // Verificar si la vista ya existe
    const { data, error } = await supabase.rpc('check_if_view_exists', { view_name: 'auth_users_view' });
    
    if (error) {
      console.error('Error al verificar existencia de vista:', error);
      return { success: false, error: 'Error al verificar existencia de vista' };
    }
    
    if (data === true) {
      return { success: true, message: 'La vista ya existe' };
    }
    
    // Crear la vista
    const { error: createError } = await supabase.rpc('execute_sql', {
      sql_statement: `
        CREATE OR REPLACE VIEW public.auth_users_view AS
        SELECT 
          id,
          email,
          raw_user_meta_data
        FROM auth.users;
        
        ALTER VIEW public.auth_users_view OWNER TO authenticated;
        GRANT SELECT ON public.auth_users_view TO authenticated;
      `
    });
    
    if (createError) {
      console.error('Error al crear vista:', createError);
      return { success: false, error: 'Error al crear vista' };
    }
    
    return { success: true, message: 'Vista creada correctamente' };
  } catch (error) {
    console.error('Error en createAuthUsersView:', error);
    return { success: false, error: 'Error interno al crear vista' };
  }
}

async function createUsuarioSeccionesTable(supabase: any) {
  try {
    // Verificar si la tabla ya existe
    const { data, error } = await supabase.rpc('check_if_table_exists', { table_name: 'usuario_secciones' });
    
    if (error) {
      console.error('Error al verificar existencia de tabla:', error);
      return { success: false, error: 'Error al verificar existencia de tabla' };
    }
    
    if (data === true) {
      return { success: true, message: 'La tabla ya existe' };
    }
    
    // Crear la tabla
    const { error: createError } = await supabase.rpc('execute_sql', {
      sql_statement: `
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
      `
    });
    
    if (createError) {
      console.error('Error al crear tabla:', createError);
      return { success: false, error: 'Error al crear tabla' };
    }
    
    return { success: true, message: 'Tabla creada correctamente' };
  } catch (error) {
    console.error('Error en createUsuarioSeccionesTable:', error);
    return { success: false, error: 'Error interno al crear tabla' };
  }
} 
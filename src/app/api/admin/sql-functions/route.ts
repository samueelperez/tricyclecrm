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

    // Crear funciones SQL de utilidad
    const results = await Promise.all([
      createCheckIfTableExistsFunction(supabase),
      createCheckIfViewExistsFunction(supabase),
      createExecuteSqlFunction(supabase)
    ]);

    return NextResponse.json({ 
      success: true, 
      message: "Funciones SQL creadas correctamente",
      results 
    });
  } catch (error) {
    console.error('Error al crear funciones SQL:', error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

async function createCheckIfTableExistsFunction(supabase: any) {
  try {
    const { error } = await supabase.rpc('execute_sql', {
      sql_statement: `
        CREATE OR REPLACE FUNCTION check_if_table_exists(table_name TEXT) 
        RETURNS BOOLEAN AS $$
        DECLARE
          table_exists BOOLEAN;
        BEGIN
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = $1
          ) INTO table_exists;
          
          RETURN table_exists;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    if (error) {
      // Si la función execute_sql aún no existe, crearla directamente
      if (error.message.includes("function execute_sql() does not exist")) {
        const { error: directError } = await supabase.from('_rpc').select('*').rpc('execute_sql', {
          sql_statement: `
            CREATE OR REPLACE FUNCTION check_if_table_exists(table_name TEXT) 
            RETURNS BOOLEAN AS $$
            DECLARE
              table_exists BOOLEAN;
            BEGIN
              SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = $1
              ) INTO table_exists;
              
              RETURN table_exists;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
          `
        });
        
        if (directError) {
          console.error('Error al crear función check_if_table_exists directamente:', directError);
          return { success: false, function: 'check_if_table_exists', error: directError };
        }
      } else {
        console.error('Error al crear función check_if_table_exists:', error);
        return { success: false, function: 'check_if_table_exists', error };
      }
    }
    
    return { success: true, function: 'check_if_table_exists' };
  } catch (error) {
    console.error('Error en createCheckIfTableExistsFunction:', error);
    return { success: false, function: 'check_if_table_exists', error };
  }
}

async function createCheckIfViewExistsFunction(supabase: any) {
  try {
    const { error } = await supabase.rpc('execute_sql', {
      sql_statement: `
        CREATE OR REPLACE FUNCTION check_if_view_exists(view_name TEXT) 
        RETURNS BOOLEAN AS $$
        DECLARE
          view_exists BOOLEAN;
        BEGIN
          SELECT EXISTS (
            SELECT FROM information_schema.views 
            WHERE table_schema = 'public'
            AND table_name = $1
          ) INTO view_exists;
          
          RETURN view_exists;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    if (error) {
      console.error('Error al crear función check_if_view_exists:', error);
      return { success: false, function: 'check_if_view_exists', error };
    }
    
    return { success: true, function: 'check_if_view_exists' };
  } catch (error) {
    console.error('Error en createCheckIfViewExistsFunction:', error);
    return { success: false, function: 'check_if_view_exists', error };
  }
}

async function createExecuteSqlFunction(supabase: any) {
  try {
    // Intentar ejecutar la misma sentencia SQL directamente
    const { error } = await supabase.from('_rpc').select('*').rpc('execute_sql', {
      sql_statement: `
        CREATE OR REPLACE FUNCTION execute_sql(sql_statement TEXT) 
        RETURNS VOID AS $$
        BEGIN
          EXECUTE sql_statement;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    if (error) {
      console.error('Error al crear función execute_sql:', error);
      
      // Si el error es que la función ya existe, lo consideramos un éxito
      if (error.message.includes("already exists")) {
        return { success: true, function: 'execute_sql', message: 'La función ya existe' };
      }
      
      return { success: false, function: 'execute_sql', error };
    }
    
    return { success: true, function: 'execute_sql' };
  } catch (error) {
    console.error('Error en createExecuteSqlFunction:', error);
    return { success: false, function: 'execute_sql', error };
  }
} 
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    // Crear cliente con rol de servicio para tener acceso completo
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string
    );

    // Leer el archivo SQL
    const sqlFilePath = path.join(process.cwd(), 'migrations', 'clientes-materiales', 'create-clientes-materiales.sql');
    let sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Dividir el SQL en comandos individuales para ejecutarlos uno por uno
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0)
      .map(cmd => `${cmd};`);

    console.log(`Ejecutando ${sqlCommands.length} comandos SQL...`);
    
    // Ejecutar cada comando por separado
    for (let i = 0; i < sqlCommands.length; i++) {
      const cmd = sqlCommands[i];
      console.log(`Ejecutando comando ${i + 1}/${sqlCommands.length}`);
      
      try {
        // Intentar primero con pgmeta_execute_sql
        const { error: pgmetaError } = await supabaseAdmin.rpc('pgmeta_execute_sql', {
          query: cmd
        });
        
        if (pgmetaError) {
          console.warn(`Error con pgmeta_execute_sql: ${pgmetaError.message}`);
          
          // Si falla, intentar con execute_sql directo
          const { error: directError } = await supabaseAdmin.rpc('execute_sql', {
            sql: cmd
          });
          
          if (directError) {
            console.warn(`Error con execute_sql: ${directError.message}`);
            // Si ambos métodos fallan, simplemente registrar y continuar
            console.log(`No se pudo ejecutar comando SQL: ${cmd.substring(0, 100)}...`);
          }
        }
      } catch (cmdError) {
        console.error(`Error en comando ${i + 1}: ${cmdError instanceof Error ? cmdError.message : String(cmdError)}`);
        // Continuamos con el siguiente comando incluso si hay error
      }
    }

    // Verificar que la tabla clientes_materiales se haya creado correctamente
    try {
      const { data, error } = await supabaseAdmin
        .from('clientes_materiales')
        .select('count(*)', { count: 'exact', head: true });

      if (error) {
        console.error('La tabla clientes_materiales no se creó correctamente:', error);
        return NextResponse.json({ 
          warning: 'Migración completada con advertencias', 
          details: 'La tabla clientes_materiales puede no haberse creado correctamente' 
        });
      }
    } catch (checkError) {
      console.error('Error al verificar tabla:', checkError);
      return NextResponse.json({ 
        warning: 'Migración completada pero no se pudo verificar', 
        details: 'No se pudo verificar si la tabla se creó correctamente' 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tabla clientes_materiales configurada correctamente'
    });
  } catch (error) {
    console.error('Error en la configuración:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
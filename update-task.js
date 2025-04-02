const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function moveTask() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Obtener columnas
    const { data: columns, error: columnsError } = await supabase
      .from('columnas_tablero')
      .select('id, nombre')
      .in('nombre', ['En progreso', 'Revisión']);
      
    if (columnsError) {
      console.error('Error al obtener columnas:', columnsError);
      return;
    }
    
    // Mapear columnas por nombre
    const columnMap = {};
    columns.forEach(col => {
      columnMap[col.nombre] = col.id;
    });
    
    // Obtener tareas en "En progreso"
    const { data: tasks, error: tasksError } = await supabase
      .from('tareas')
      .select('id, titulo')
      .eq('columna_id', columnMap['En progreso'])
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (tasksError) {
      console.error('Error al obtener tareas:', tasksError);
      return;
    }
    
    if (!tasks || tasks.length === 0) {
      console.log('No hay tareas en la columna "En progreso"');
      return;
    }
    
    // Mover la primera tarea a "Revisión"
    const taskToMove = tasks[0];
    
    // Actualizar la tarea
    const { error: updateError } = await supabase
      .from('tareas')
      .update({ 
        columna_id: columnMap['Revisión'],
        porcentaje_completado: 80 
      })
      .eq('id', taskToMove.id);
      
    if (updateError) {
      console.error('Error al actualizar la tarea:', updateError);
      return;
    }
    
    console.log(`Tarea "${taskToMove.titulo}" movida exitosamente de "En progreso" a "Revisión"`);
    console.log('Porcentaje de completado actualizado a 80%');
    
  } catch (err) {
    console.error('Error general:', err);
  }
}

moveTask(); 
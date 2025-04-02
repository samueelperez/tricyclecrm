const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkKanbanBoard() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Verificar columnas
    const { data: columns, error: columnsError } = await supabase
      .from('columnas_tablero')
      .select('id, nombre, orden')
      .order('orden', { ascending: true });
      
    if (columnsError) {
      console.error('Error al obtener columnas:', columnsError);
      return;
    }
    
    console.log('Columnas del tablero:');
    columns.forEach(col => {
      console.log(`- ${col.nombre} (${col.id})`);
    });
    console.log();
    
    // Verificar tareas
    const { data: tasks, error: tasksError } = await supabase
      .from('tareas')
      .select(`
        id, 
        titulo, 
        descripcion, 
        columna_id, 
        prioridad, 
        porcentaje_completado,
        categoria:categoria_id(nombre, color)
      `);
      
    if (tasksError) {
      console.error('Error al obtener tareas:', tasksError);
      return;
    }
    
    // Agrupar tareas por columna
    const tasksByColumn = {};
    columns.forEach(col => {
      tasksByColumn[col.id] = [];
    });
    
    tasks.forEach(task => {
      if (tasksByColumn[task.columna_id]) {
        tasksByColumn[task.columna_id].push(task);
      }
    });
    
    console.log('Tareas por columna:');
    columns.forEach(col => {
      const columnTasks = tasksByColumn[col.id] || [];
      console.log(`\n${col.nombre} (${columnTasks.length} tareas):`);
      
      if (columnTasks.length === 0) {
        console.log('  No hay tareas en esta columna');
      } else {
        columnTasks.forEach(task => {
          const categoria = task.categoria ? `[${task.categoria.nombre}]` : '';
          const prioridad = task.prioridad.toUpperCase();
          console.log(`  - ${task.titulo} ${categoria} (${prioridad}) - ${task.porcentaje_completado}% completado`);
        });
      }
    });
    
    // Verificar categorías
    const { data: categories, error: categoriesError } = await supabase
      .from('categorias_tareas')
      .select('*');
      
    if (categoriesError) {
      console.error('Error al obtener categorías:', categoriesError);
    } else {
      console.log('\nCategorías disponibles:');
      categories.forEach(cat => {
        console.log(`- ${cat.nombre} (${cat.color})`);
      });
    }
    
    // Verificar etiquetas
    const { data: tags, error: tagsError } = await supabase
      .from('etiquetas_tareas')
      .select('*');
      
    if (tagsError) {
      console.error('Error al obtener etiquetas:', tagsError);
    } else {
      console.log('\nEtiquetas disponibles:');
      tags.forEach(tag => {
        console.log(`- ${tag.nombre} (${tag.color})`);
      });
    }
    
  } catch (err) {
    console.error('Error general:', err);
  }
}

checkKanbanBoard(); 
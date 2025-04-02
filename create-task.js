const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createSampleTasks() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Obtener las columnas del tablero
    const { data: columns, error: columnsError } = await supabase
      .from('columnas_tablero')
      .select('id, nombre')
      .order('orden', { ascending: true });
      
    if (columnsError || !columns || columns.length === 0) {
      console.error('No se encontraron columnas');
      return;
    }
    
    // Obtener las categorías
    const { data: categories, error: categoriesError } = await supabase
      .from('categorias_tareas')
      .select('id, nombre');
    
    if (categoriesError) {
      console.error('Error al obtener categorías:', categoriesError);
      return;
    }
    
    // Obtener las etiquetas
    const { data: tags, error: tagsError } = await supabase
      .from('etiquetas_tareas')
      .select('id, nombre');
    
    if (tagsError) {
      console.error('Error al obtener etiquetas:', tagsError);
      return;
    }
    
    // Mapear columnas por nombre
    const columnMap = {};
    columns.forEach(col => {
      columnMap[col.nombre] = col.id;
    });
    
    // Crear tareas de ejemplo en diferentes columnas
    const sampleTasks = [
      {
        titulo: 'Implementar autenticación',
        descripcion: 'Configurar sistema de autenticación con Supabase Auth',
        columna_id: columnMap['Por hacer'],
        categoria_id: categories.find(c => c.nombre === 'Desarrollo')?.id,
        prioridad: 'alta',
        porcentaje_completado: 0
      },
      {
        titulo: 'Diseñar página de inicio',
        descripcion: 'Crear diseño responsive para la página principal',
        columna_id: columnMap['En progreso'],
        categoria_id: categories.find(c => c.nombre === 'Diseño')?.id,
        prioridad: 'media',
        porcentaje_completado: 50
      },
      {
        titulo: 'Corregir bug en formulario',
        descripcion: 'El formulario de contacto no envía correctamente los datos',
        columna_id: columnMap['En progreso'],
        categoria_id: categories.find(c => c.nombre === 'Desarrollo')?.id,
        prioridad: 'urgente',
        porcentaje_completado: 25
      },
      {
        titulo: 'Preparar campaña de marketing',
        descripcion: 'Definir estrategia para lanzamiento del producto',
        columna_id: columnMap['Por hacer'],
        categoria_id: categories.find(c => c.nombre === 'Marketing')?.id,
        prioridad: 'media',
        porcentaje_completado: 0
      },
      {
        titulo: 'Revisar desempeño del sitio',
        descripcion: 'Analizar métricas de rendimiento y optimizar',
        columna_id: columnMap['Revisión'],
        categoria_id: categories.find(c => c.nombre === 'Desarrollo')?.id,
        prioridad: 'baja',
        porcentaje_completado: 90
      },
      {
        titulo: 'Actualizar documentación',
        descripcion: 'Revisar y actualizar la documentación del proyecto',
        columna_id: columnMap['Completadas'],
        categoria_id: categories.find(c => c.nombre === 'Administración')?.id,
        prioridad: 'baja',
        porcentaje_completado: 100,
        completado: true
      }
    ];
    
    // Insertar las tareas
    for (const taskData of sampleTasks) {
      const { data, error } = await supabase
        .from('tareas')
        .insert(taskData)
        .select();
        
      if (error) {
        console.error(`Error al crear tarea "${taskData.titulo}":`, error);
        continue;
      }
      
      const taskId = data[0].id;
      console.log(`Tarea creada: ${taskData.titulo}`);
      
      // Asignar etiquetas aleatorias a algunas tareas
      if (tags && tags.length > 0 && Math.random() > 0.3) {
        const randomTags = tags
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 3) + 1);
        
        const tagRelations = randomTags.map(tag => ({
          tarea_id: taskId,
          etiqueta_id: tag.id
        }));
        
        const { error: tagError } = await supabase
          .from('tareas_etiquetas')
          .insert(tagRelations);
          
        if (tagError) {
          console.error(`Error al asignar etiquetas a "${taskData.titulo}":`, tagError);
        } else {
          console.log(`  - Etiquetas asignadas: ${randomTags.map(t => t.nombre).join(', ')}`);
        }
      }
    }
    
    console.log('Todas las tareas de ejemplo han sido creadas');
  } catch (err) {
    console.error('Error general:', err);
  }
}

createSampleTasks();

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FiSave, FiArrowLeft, FiAlertCircle, FiCalendar, FiUser, FiTag, FiList, FiCheckSquare, FiClock, FiDatabase, FiCode, FiCopy, FiRefreshCw } from 'react-icons/fi';

// Componente para la configuración inicial (mismo que en page.tsx)
const SetupInstructions = ({ onTryAgain, isLoading, errorMessage }: { onTryAgain: () => void, isLoading: boolean, errorMessage?: string }) => {
  const sqlCode = `
-- Migración para crear las tablas del módulo de Organización
-- Fecha: 2025-04-01

-- Tabla para columnas del tablero
CREATE TABLE IF NOT EXISTS columnas_tablero (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL,
  descripcion TEXT,
  color TEXT DEFAULT '#f3f4f6',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar columnas por defecto
INSERT INTO columnas_tablero (nombre, orden, descripcion, color, icon)
VALUES 
  ('Por hacer', 1, 'Tareas pendientes que aún no se han iniciado', '#f3f4f6', 'clipboard'),
  ('En progreso', 2, 'Tareas que están siendo trabajadas actualmente', '#dbeafe', 'trending-up'),
  ('Revisión', 3, 'Tareas completadas que requieren revisión', '#fef9c3', 'check-circle'),
  ('Completadas', 4, 'Tareas finalizadas y aprobadas', '#dcfce7', 'check-square');

-- Tabla para categorías
CREATE TABLE IF NOT EXISTS categorias_tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar categorías de ejemplo
INSERT INTO categorias_tareas (nombre, color, descripcion)
VALUES 
  ('Desarrollo', '#3b82f6', 'Tareas relacionadas con programación y desarrollo'),
  ('Diseño', '#ec4899', 'Tareas de diseño gráfico e interfaces'),
  ('Marketing', '#f97316', 'Tareas relacionadas con marketing y ventas'),
  ('Administración', '#14b8a6', 'Tareas administrativas y de gestión');

-- Tabla para etiquetas
CREATE TABLE IF NOT EXISTS etiquetas_tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#a855f7',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar etiquetas comunes
INSERT INTO etiquetas_tareas (nombre, color)
VALUES 
  ('Urgente', '#ef4444'),
  ('Bug', '#f97316'),
  ('Mejora', '#3b82f6'),
  ('Documentación', '#8b5cf6'),
  ('Cliente', '#10b981');

-- Tabla principal de tareas
CREATE TABLE IF NOT EXISTS tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  columna_id UUID NOT NULL,
  categoria_id UUID,
  prioridad TEXT NOT NULL DEFAULT 'media',
  fecha_limite TIMESTAMPTZ,
  fecha_inicio TIMESTAMPTZ,
  asignado_a UUID,
  completado BOOLEAN DEFAULT false,
  porcentaje_completado INTEGER DEFAULT 0,
  estimacion_horas NUMERIC(5,2),
  horas_trabajadas NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_columna
    FOREIGN KEY (columna_id)
    REFERENCES columnas_tablero(id)
    ON DELETE CASCADE,
    
  CONSTRAINT fk_categoria
    FOREIGN KEY (categoria_id)
    REFERENCES categorias_tareas(id)
    ON DELETE SET NULL,
    
  CONSTRAINT check_prioridad
    CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente'))
);

-- Tabla para etiquetas de tareas
CREATE TABLE IF NOT EXISTS tareas_etiquetas (
  tarea_id UUID NOT NULL,
  etiqueta_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  PRIMARY KEY (tarea_id, etiqueta_id),
  
  CONSTRAINT fk_tarea
    FOREIGN KEY (tarea_id)
    REFERENCES tareas(id)
    ON DELETE CASCADE,
    
  CONSTRAINT fk_etiqueta
    FOREIGN KEY (etiqueta_id)
    REFERENCES etiquetas_tareas(id)
    ON DELETE CASCADE
);

-- Tabla para comentarios
CREATE TABLE IF NOT EXISTS comentarios_tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL,
  usuario_id UUID NOT NULL,
  contenido TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_tarea
    FOREIGN KEY (tarea_id)
    REFERENCES tareas(id)
    ON DELETE CASCADE
);

-- Tabla para archivos
CREATE TABLE IF NOT EXISTS archivos_tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  ruta TEXT NOT NULL,
  tipo TEXT,
  tamano INTEGER,
  usuario_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_tarea
    FOREIGN KEY (tarea_id)
    REFERENCES tareas(id)
    ON DELETE CASCADE
);

-- Tabla para historial
CREATE TABLE IF NOT EXISTS historial_tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL,
  usuario_id UUID,
  tipo_cambio TEXT NOT NULL,
  valor_anterior JSONB,
  valor_nuevo JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_tarea
    FOREIGN KEY (tarea_id)
    REFERENCES tareas(id)
    ON DELETE CASCADE
);

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers
CREATE TRIGGER update_tareas_updated_at
BEFORE UPDATE ON tareas
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_categorias_tareas_updated_at
BEFORE UPDATE ON categorias_tareas
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_etiquetas_tareas_updated_at
BEFORE UPDATE ON etiquetas_tareas
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_columnas_tablero_updated_at
BEFORE UPDATE ON columnas_tablero
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_comentarios_tareas_updated_at
BEFORE UPDATE ON comentarios_tareas
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  `;

  const migrationInstructions = `
-- También puedes encontrar este archivo en: supabase/migrations/20250401120000_create_organizacion_tables.sql
-- Puedes ejecutarlo directamente desde la interfaz de Supabase o desde la CLI
  `;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode)
      .then(() => {
        alert('SQL copiado al portapapeles correctamente');
      })
      .catch(err => {
        console.error('Error al copiar: ', err);
        alert('Hubo un error al copiar el código. Por favor, selecciona manualmente el código y usa Ctrl+C');
      });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <div className="flex items-center text-blue-600 mb-6">
          <FiDatabase className="text-3xl mr-3" />
          <h1 className="text-2xl font-bold">Configuración del Módulo de Organización</h1>
        </div>
        
        {errorMessage && (
          <div className="mb-6 bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
            <h3 className="font-semibold mb-2 flex items-center">
              <FiAlertCircle className="mr-2" />
              Error en la creación automática
            </h3>
            <p className="mb-2">No se pudieron crear las tablas automáticamente. Error:</p>
            <pre className="bg-red-100 p-2 rounded text-sm overflow-x-auto">
              {errorMessage}
            </pre>
          </div>
        )}
        
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-blue-800 mb-4">
            Es necesario crear algunas tablas en la base de datos para que el tablero Kanban funcione correctamente.
          </p>
          
          <div className="mb-4">
            <button
              onClick={onTryAgain}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md flex items-center justify-center hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                  Creando tablas automáticamente...
                </>
              ) : (
                <>
                  <FiDatabase className="mr-2" />
                  Intentar crear tablas automáticamente
                </>
              )}
            </button>
          </div>
          
          <div className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold mb-2 flex items-center text-yellow-700">
              <FiAlertCircle className="mr-2" />
              Importante: Archivo de migración disponible
            </h3>
            <p className="text-yellow-800 mb-2">
              Hemos creado un archivo de migración SQL que puedes usar para configurar todas las tablas necesarias:
            </p>
            <pre className="bg-yellow-100 p-2 rounded text-sm overflow-x-auto text-yellow-900">
              {migrationInstructions}
            </pre>
          </div>
          
          <p className="text-blue-800 mb-4 font-semibold">
            Si la creación automática no funciona, sigue estas instrucciones manuales:
          </p>
          
          <ol className="list-decimal pl-6 space-y-4 text-gray-700">
            <li>
              <strong>Accede al Panel de Supabase:</strong> 
              <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" 
                className="text-blue-600 hover:underline ml-1">
                app.supabase.com
              </a>
            </li>
            <li>
              <strong>Selecciona tu proyecto</strong> y navega a la sección <strong>SQL Editor</strong>
            </li>
            <li>
              <strong>Crea una nueva consulta</strong> haciendo clic en el botón <strong>+ New query</strong>
            </li>
            <li>
              <strong>Copia y pega el siguiente código SQL</strong> en el editor (puedes usar el botón de abajo para copiar)
            </li>
            <li>
              <strong>Ejecuta el código SQL</strong> haciendo clic en el botón <strong>Run</strong>
            </li>
            <li>
              Cuando finalice la ejecución, <strong>vuelve a esta página y refresca</strong> para ver el tablero Kanban
            </li>
          </ol>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold flex items-center">
              <FiCode className="mr-2" /> 
              Código SQL para copiar
            </h2>
            <button 
              onClick={copyToClipboard}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FiCopy className="mr-2" />
              Copiar código
            </button>
          </div>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <pre className="p-4 text-gray-100 text-sm overflow-x-auto whitespace-pre-wrap">
              {sqlCode}
            </pre>
          </div>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-green-600 text-white rounded-md flex items-center hover:bg-green-700 transition-colors"
          >
            <FiRefreshCw className="mr-2" />
            Refrescar después de ejecutar el SQL
          </button>
        </div>
      </div>
    </div>
  );
};

interface Category {
  id: string;
  nombre: string;
  color: string;
}

interface Column {
  id: string;
  nombre: string;
  orden: number;
}

interface Tag {
  id: string;
  nombre: string;
  color: string;
}

interface User {
  id: string;
  nombre: string;
  email: string;
  avatar_url?: string;
}

export default function NuevaTareaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const columnId = searchParams.get('columna');
  
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isCreatingDatabase, setIsCreatingDatabase] = useState(false);
  const [setupError, setSetupError] = useState<string | undefined>(undefined);
  
  const [task, setTask] = useState({
    titulo: '',
    descripcion: '',
    columna_id: columnId || '',
    categoria_id: '',
    prioridad: 'media',
    fecha_limite: '',
    hora_limite: '',
    fecha_inicio: '',
    asignado_a: '',
    porcentaje_completado: 0,
    estimacion_horas: ''
  });

  // Función para crear las tablas automáticamente
  const createDatabaseTables = async () => {
    setIsCreatingDatabase(true);
    setSetupError(undefined);
    
    try {
      // En lugar de usar execute_sql o la RPC, intentaremos crear las tablas secuencialmente
      // usando las operaciones directas de Supabase
      
      // 1. Intentar crear tabla de columnas
      try {
        await supabase.from('columnas_tablero').select('id').limit(1);
      } catch (error) {
        // La tabla no existe, debemos informar al usuario que debe seguir las instrucciones manuales
        throw new Error('Las tablas necesarias no existen. Para crear las tablas, sigue las instrucciones manuales a continuación.');
      }
      
      // Si llegamos aquí sin error pero no hay datos, intentamos insertar las filas predeterminadas
      const { data: columnsData, error: columnsError } = await supabase
        .from('columnas_tablero')
        .select('*');
        
      if (!columnsError && (!columnsData || columnsData.length === 0)) {
        // Insertar columnas predeterminadas
        const { error: insertError } = await supabase
          .from('columnas_tablero')
          .insert([
            { nombre: 'Por hacer', orden: 1, descripcion: 'Tareas pendientes que aún no se han iniciado', color: '#f3f4f6', icon: 'clipboard' },
            { nombre: 'En progreso', orden: 2, descripcion: 'Tareas que están siendo trabajadas actualmente', color: '#dbeafe', icon: 'trending-up' },
            { nombre: 'Revisión', orden: 3, descripcion: 'Tareas completadas que requieren revisión', color: '#fef9c3', icon: 'check-circle' },
            { nombre: 'Completadas', orden: 4, descripcion: 'Tareas finalizadas y aprobadas', color: '#dcfce7', icon: 'check-square' }
          ]);
          
        if (insertError) throw insertError;
      }
      
      // 2. Intentar crear categorías
      try {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categorias_tareas')
          .select('*');
          
        if (!categoriesError && (!categoriesData || categoriesData.length === 0)) {
          // Insertar categorías predeterminadas
          const { error: insertError } = await supabase
            .from('categorias_tareas')
            .insert([
              { nombre: 'Desarrollo', color: '#3b82f6', descripcion: 'Tareas relacionadas con programación y desarrollo' },
              { nombre: 'Diseño', color: '#ec4899', descripcion: 'Tareas de diseño gráfico e interfaces' },
              { nombre: 'Marketing', color: '#f97316', descripcion: 'Tareas relacionadas con marketing y ventas' },
              { nombre: 'Administración', color: '#14b8a6', descripcion: 'Tareas administrativas y de gestión' }
            ]);
            
          if (insertError) throw insertError;
        }
      } catch (error) {
        console.error('Error verificando o creando categorías:', error);
      }
      
      // 3. Intentar crear etiquetas
      try {
        const { data: tagsData, error: tagsError } = await supabase
          .from('etiquetas_tareas')
          .select('*');
          
        if (!tagsError && (!tagsData || tagsData.length === 0)) {
          // Insertar etiquetas predeterminadas
          const { error: insertError } = await supabase
            .from('etiquetas_tareas')
            .insert([
              { nombre: 'Urgente', color: '#ef4444' },
              { nombre: 'Bug', color: '#f97316' },
              { nombre: 'Mejora', color: '#3b82f6' },
              { nombre: 'Documentación', color: '#8b5cf6' },
              { nombre: 'Cliente', color: '#10b981' }
            ]);
            
          if (insertError) throw insertError;
        }
      } catch (error) {
        console.error('Error verificando o creando etiquetas:', error);
      }
      
      // Si llegamos hasta aquí, todo está configurado correctamente
      setNeedsSetup(false);
      loadInitialData(); // Refrescar los datos
      return;
    } catch (err: any) {
      console.error('Error configurando las tablas:', err);
      
      // Mensaje más amigable para el usuario
      let errorMessage = "No se pueden crear las tablas automáticamente. ";
      
      if (err.message.includes('tablas necesarias')) {
        errorMessage = err.message;
      } else if (err.message.includes('permission') || err.message.includes('permiso')) {
        errorMessage += "No tienes permisos suficientes. Por favor, sigue las instrucciones manuales a continuación.";
      } else {
        errorMessage += err.message || "Error desconocido.";
      }
      
      setSetupError(errorMessage);
    } finally {
      setIsCreatingDatabase(false);
    }
  };

  // Cargar datos necesarios al inicio
  useEffect(() => {
    loadInitialData();
  }, [columnId, supabase, task.columna_id]);

  // Extraer la carga de datos iniciales a una función que podamos reutilizar
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Intentar cargar columnas directamente
      const { data: columnsData, error: columnsError } = await supabase
        .from('columnas_tablero')
        .select('*')
        .order('orden', { ascending: true });
          
      if (columnsError && columnsError.message.includes("relation") && columnsError.message.includes("does not exist")) {
        setNeedsSetup(true);
        setLoading(false);
        // Intentar crear las tablas automáticamente
        createDatabaseTables();
        return;
      }
      
      if (columnsError) throw new Error(columnsError.message);
      setColumns(columnsData || []);
      
      // Si no hay columna seleccionada y hay columnas disponibles, seleccionar la primera
      if (!task.columna_id && columnsData && columnsData.length > 0) {
        setTask(prev => ({ ...prev, columna_id: columnsData[0].id }));
      }
      
      // Cargar categorías
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categorias_tareas')
        .select('*')
        .order('nombre', { ascending: true });
          
      if (categoriesError) throw new Error(categoriesError.message);
      setCategories(categoriesData || []);
      
      // Cargar etiquetas
      const { data: tagsData, error: tagsError } = await supabase
        .from('etiquetas_tareas')
        .select('*')
        .order('nombre', { ascending: true });
          
      if (tagsError) throw new Error(tagsError.message);
      setTags(tagsData || []);
      
      // Cargar usuarios
      const { data: usersData, error: usersError } = await supabase
        .from('perfiles')
        .select('id, nombre, email, avatar_url');
          
      if (usersError) throw new Error(usersError.message);
      setUsers(usersData || []);
        
    } catch (err: any) {
      console.error('Error al cargar datos iniciales:', err);
      setError('No se pudieron cargar los datos necesarios. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTask({ ...task, [name]: value });
  };

  // Manejar cambios en el porcentaje mediante el slider
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTask({ ...task, porcentaje_completado: parseInt(e.target.value, 10) });
  };

  // Manejar selección de etiquetas
  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  // Enviar el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task.titulo.trim()) {
      setError('El título de la tarea es obligatorio');
      return;
    }
    
    if (!task.columna_id) {
      setError('Debe seleccionar una columna para la tarea');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Preparar fecha límite combinando fecha y hora
      let fechaLimite = null;
      if (task.fecha_limite) {
        fechaLimite = task.hora_limite 
          ? `${task.fecha_limite}T${task.hora_limite}:00` 
          : `${task.fecha_limite}T23:59:59`;
      }
      
      // Insertar la tarea
      const { data, error: insertError } = await supabase
        .from('tareas')
        .insert({
          titulo: task.titulo,
          descripcion: task.descripcion,
          columna_id: task.columna_id,
          categoria_id: task.categoria_id || null,
          prioridad: task.prioridad,
          fecha_limite: fechaLimite,
          fecha_inicio: task.fecha_inicio || null,
          asignado_a: task.asignado_a || null,
          porcentaje_completado: task.porcentaje_completado,
          estimacion_horas: task.estimacion_horas ? parseFloat(task.estimacion_horas) : null,
          completado: task.porcentaje_completado === 100
        })
        .select();

      if (insertError) {
        throw new Error(insertError.message);
      }
      
      // Si hay etiquetas seleccionadas, insertarlas en la tabla de relación
      if (selectedTags.length > 0 && data && data.length > 0) {
        const taskId = data[0].id;
        
        const tagRelations = selectedTags.map(tagId => ({
          tarea_id: taskId,
          etiqueta_id: tagId
        }));
        
        const { error: tagError } = await supabase
          .from('tareas_etiquetas')
          .insert(tagRelations);
          
        if (tagError) {
          console.error('Error al insertar etiquetas:', tagError);
        }
        
        // Registrar la creación en el historial
        await supabase
          .from('historial_tareas')
          .insert({
            tarea_id: taskId,
            usuario_id: (await supabase.auth.getUser()).data.user?.id,
            tipo_cambio: 'creacion',
            valor_nuevo: { titulo: task.titulo, columna_id: task.columna_id }
          });
      }
      
      // Redirigir al tablero principal
      router.push('/organizacion');
      router.refresh();
    } catch (err: any) {
      console.error('Error al crear la tarea:', err);
      setError('No se pudo crear la tarea. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Si necesita configuración, mostrar el componente de configuración
  if (needsSetup) {
    return <SetupInstructions 
              onTryAgain={createDatabaseTables} 
              isLoading={isCreatingDatabase} 
              errorMessage={setupError} 
           />;
  }

  // Si está cargando, mostrar spinner
  if (loading && columns.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center py-12">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-3 text-gray-500">Cargando formulario...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-6">
        <button 
          onClick={() => router.push('/organizacion')}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <FiArrowLeft className="mr-2" /> Volver al tablero
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <FiList className="mr-3 text-blue-600" />
          Nueva Tarea
        </h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <FiAlertCircle className="mr-2" />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección de información básica */}
          <div className="p-5 border border-gray-200 rounded-lg bg-gray-50">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Información básica</h2>
            
            <div className="space-y-4">
              {/* Título */}
              <div>
                <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  id="titulo"
                  name="titulo"
                  type="text"
                  value={task.titulo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Título descriptivo de la tarea"
                  required
                />
              </div>
              
              {/* Descripción */}
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={task.descripcion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Descripción detallada de la tarea"
                  rows={5}
                ></textarea>
              </div>
              
              {/* Estado y Categoría */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="columna_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="columna_id"
                    name="columna_id"
                    value={task.columna_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="">Seleccionar estado</option>
                    {columns.map(column => (
                      <option key={column.id} value={column.id}>
                        {column.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="categoria_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    id="categoria_id"
                    name="categoria_id"
                    value={task.categoria_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Prioridad */}
              <div>
                <label htmlFor="prioridad" className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['baja', 'media', 'alta', 'urgente'].map(priority => (
                    <label 
                      key={priority}
                      className={`
                        flex items-center justify-center p-2 border rounded-md cursor-pointer
                        ${task.prioridad === priority 
                          ? priority === 'baja' 
                            ? 'bg-green-100 border-green-500 text-green-800' 
                            : priority === 'media'
                              ? 'bg-blue-100 border-blue-500 text-blue-800'
                              : priority === 'alta'
                                ? 'bg-orange-100 border-orange-500 text-orange-800'
                                : 'bg-red-100 border-red-500 text-red-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="prioridad"
                        value={priority}
                        checked={task.prioridad === priority}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="capitalize">
                        {priority === 'baja' ? 'Baja' : 
                         priority === 'media' ? 'Media' : 
                         priority === 'alta' ? 'Alta' : 'Urgente'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sección de fechas y asignación */}
          <div className="p-5 border border-gray-200 rounded-lg bg-gray-50">
            <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <FiCalendar className="mr-2 text-blue-600" /> Fechas y asignación
            </h2>
            
            <div className="space-y-4">
              {/* Fecha y hora límite */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fecha_limite" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha límite
                  </label>
                  <input
                    id="fecha_limite"
                    name="fecha_limite"
                    type="date"
                    value={task.fecha_limite}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="hora_limite" className="block text-sm font-medium text-gray-700 mb-1">
                    Hora límite
                  </label>
                  <input
                    id="hora_limite"
                    name="hora_limite"
                    type="time"
                    value={task.hora_limite}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
              
              {/* Fecha de inicio */}
              <div>
                <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de inicio
                </label>
                <input
                  id="fecha_inicio"
                  name="fecha_inicio"
                  type="date"
                  value={task.fecha_inicio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              
              {/* Asignado a */}
              <div>
                <label htmlFor="asignado_a" className="block text-sm font-medium text-gray-700 mb-1">
                  Asignado a
                </label>
                <select
                  id="asignado_a"
                  name="asignado_a"
                  value={task.asignado_a}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Sin asignar</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.nombre || user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Sección de progreso y etiquetas */}
          <div className="p-5 border border-gray-200 rounded-lg bg-gray-50">
            <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <FiCheckSquare className="mr-2 text-blue-600" /> Progreso y etiquetas
            </h2>
            
            <div className="space-y-4">
              {/* Porcentaje completado */}
              <div>
                <label htmlFor="porcentaje_completado" className="block text-sm font-medium text-gray-700 mb-1">
                  Progreso: {task.porcentaje_completado}%
                </label>
                <input
                  type="range"
                  id="porcentaje_completado"
                  name="porcentaje_completado"
                  min="0"
                  max="100"
                  step="5"
                  value={task.porcentaje_completado}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
              
              {/* Estimación de horas */}
              <div>
                <label htmlFor="estimacion_horas" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FiClock className="mr-1" /> Estimación (horas)
                </label>
                <input
                  id="estimacion_horas"
                  name="estimacion_horas"
                  type="number"
                  step="0.25"
                  min="0"
                  value={task.estimacion_horas}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Ej. 2.5"
                />
              </div>
              
              {/* Etiquetas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FiTag className="mr-1" /> Etiquetas
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`
                        px-3 py-1 rounded-full text-sm flex items-center
                        ${selectedTags.includes(tag.id) 
                          ? 'opacity-100' 
                          : 'opacity-60 hover:opacity-80'
                        }
                      `}
                      style={{ 
                        backgroundColor: selectedTags.includes(tag.id) 
                          ? tag.color + '30' 
                          : '#f3f4f6',
                        color: selectedTags.includes(tag.id) 
                          ? tag.color 
                          : '#4b5563' 
                      }}
                    >
                      <span>{tag.nombre}</span>
                      {selectedTags.includes(tag.id) && (
                        <FiCheckSquare className="ml-1" size={14} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/organizacion')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" /> Guardar tarea
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
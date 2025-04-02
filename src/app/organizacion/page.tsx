'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format, isToday, isYesterday, isTomorrow, addDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiX, 
  FiAlertCircle,
  FiClock,
  FiTag,
  FiUser,
  FiCalendar,
  FiCheckSquare,
  FiRefreshCw,
  FiClipboard,
  FiTrendingUp,
  FiFilter,
  FiSearch,
  FiMessageSquare,
  FiPaperclip,
  FiDatabase,
  FiCode,
  FiCopy
} from 'react-icons/fi';

// Componente para la configuración inicial
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

-- Crear permisos RLS para acceso público
ALTER TABLE columnas_tablero ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE etiquetas_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas_etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE archivos_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_tareas ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON columnas_tablero FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON categorias_tareas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON etiquetas_tareas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON tareas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON tareas_etiquetas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON comentarios_tareas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON archivos_tareas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON historial_tareas FOR SELECT TO authenticated USING (true);

-- Política para permitir escritura a usuarios autenticados
CREATE POLICY "Permitir escritura a usuarios autenticados" 
ON columnas_tablero FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir escritura a usuarios autenticados" 
ON categorias_tareas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir escritura a usuarios autenticados" 
ON etiquetas_tareas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir escritura a usuarios autenticados" 
ON tareas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir escritura a usuarios autenticados" 
ON tareas_etiquetas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir escritura a usuarios autenticados" 
ON comentarios_tareas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir escritura a usuarios autenticados" 
ON archivos_tareas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir escritura a usuarios autenticados" 
ON historial_tareas FOR INSERT TO authenticated WITH CHECK (true);

-- Política para permitir actualización a usuarios autenticados
CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON columnas_tablero FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON categorias_tareas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON etiquetas_tareas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON tareas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON tareas_etiquetas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON comentarios_tareas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON archivos_tareas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON historial_tareas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Política para permitir eliminación a usuarios autenticados
CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON columnas_tablero FOR DELETE TO authenticated USING (true);

CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON categorias_tareas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON etiquetas_tareas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON tareas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON tareas_etiquetas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON comentarios_tareas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON archivos_tareas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON historial_tareas FOR DELETE TO authenticated USING (true);
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

// Tipos para nuestro tablero Kanban
interface Task {
  id: string;
  titulo: string;
  descripcion: string;
  columna_id: string;
  categoria_id?: string;
  categoria?: {
    nombre: string;
    color: string;
  };
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  fecha_limite?: string;
  asignado_a?: string;
  usuario?: {
    nombre: string;
    avatar_url?: string;
  };
  completado: boolean;
  porcentaje_completado: number;
  comentarios_count: number;
  archivos_count: number;
  etiquetas: {
    id: string;
    nombre: string;
    color: string;
  }[];
}

interface Column {
  id: string;
  nombre: string;
  descripcion?: string;
  color: string;
  icon: React.ReactNode;
  tasks: Task[];
}

interface Board {
  columns: Column[];
}

// Mapeo de iconos
const columnIcons: Record<string, React.ReactNode> = {
  'clipboard': <FiClipboard />,
  'trending-up': <FiTrendingUp />,
  'check-circle': <FiRefreshCw />,
  'check-square': <FiCheckSquare />
};

// Función para formatear fechas de manera legible
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  if (isToday(date)) return `Hoy, ${format(date, 'HH:mm')}`;
  if (isYesterday(date)) return `Ayer, ${format(date, 'HH:mm')}`;
  if (isTomorrow(date)) return `Mañana, ${format(date, 'HH:mm')}`;
  
  // Para otras fechas
  return format(date, 'd MMM', { locale: es });
};

// Función para determinar el color de la fecha límite
const getDateColor = (dateString?: string) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const today = new Date();
  const diffDays = differenceInDays(date, today);
  
  if (diffDays < 0) return 'text-red-600'; // Fecha pasada
  if (diffDays === 0) return 'text-amber-600'; // Hoy
  if (diffDays <= 2) return 'text-orange-500'; // Próximos 2 días
  return 'text-blue-600'; // Más adelante
};

// Función para obtener el color de la prioridad
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'baja': return 'bg-green-100 text-green-800';
    case 'media': return 'bg-blue-100 text-blue-800';
    case 'alta': return 'bg-orange-100 text-orange-800';
    case 'urgente': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Función para obtener el porcentaje de progreso en texto
const getProgressText = (porcentaje: number) => {
  if (porcentaje === 0) return 'Sin iniciar';
  if (porcentaje === 100) return 'Completada';
  return `${porcentaje}% completada`;
};

export default function OrganizacionPage() {
  const [board, setBoard] = useState<Board>({ columns: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [filteredBoard, setFilteredBoard] = useState<Board | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<{id: string, nombre: string, color: string}[]>([]);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isCreatingDatabase, setIsCreatingDatabase] = useState(false);
  const [setupError, setSetupError] = useState<string | undefined>(undefined);
  const supabase = createClientComponentClient();
  
  // Referencia al timeout para debounce en búsqueda
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchBoardData();
  }, []);

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
      fetchBoardData(); // Refrescar los datos
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

  // Efecto para filtrar tareas cuando cambian los filtros
  useEffect(() => {
    if (!board.columns.length) return;
    
    applyFilters();
  }, [searchTerm, filterPriority, filterCategory, board]);

  // Función para aplicar filtros
  const applyFilters = () => {
    if (!searchTerm && !filterPriority && !filterCategory) {
      setFilteredBoard(null);
      return;
    }
    
    const filteredColumns = board.columns.map(column => {
      const filteredTasks = column.tasks.filter(task => {
        // Filtrar por término de búsqueda
        const matchesSearch = !searchTerm || 
          task.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.descripcion && task.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Filtrar por prioridad
        const matchesPriority = !filterPriority || task.prioridad === filterPriority;
        
        // Filtrar por categoría
        const matchesCategory = !filterCategory || task.categoria_id === filterCategory;
        
        return matchesSearch && matchesPriority && matchesCategory;
      });
      
      return {
        ...column,
        tasks: filteredTasks
      };
    });
    
    setFilteredBoard({
      columns: filteredColumns
    });
  };

  // Función para manejar cambios en la búsqueda con debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      setSearchTerm(value);
    }, 300);
  };

  // Función para cargar los datos del tablero
  const fetchBoardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Intentar cargar columnas directamente
      const { data: columnas, error: columnasError } = await supabase
        .from('columnas_tablero')
        .select('*')
        .order('orden', { ascending: true });
      
      // Si no existen las tablas, activar el modo de configuración
      if (columnasError && columnasError.message.includes("relation") && columnasError.message.includes("does not exist")) {
        setNeedsSetup(true);
        setLoading(false);
        // Intentar crear las tablas automáticamente
        createDatabaseTables();
        return;
      }
      
      if (columnasError) throw new Error(columnasError.message);
      
      // 2. Obtener las categorías para filtros
      const { data: categorias, error: categoriasError } = await supabase
        .from('categorias_tareas')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (categoriasError) throw new Error(categoriasError.message);
      
      setCategories(categorias || []);

      // 3. Preparar el tablero con columnas vacías
      const newBoard: Board = {
        columns: (columnas || []).map(col => ({
          id: col.id,
          nombre: col.nombre,
          descripcion: col.descripcion,
          color: col.color || '#f3f4f6',
          icon: columnIcons[col.icon] || <FiClipboard />,
          tasks: []
        }))
      };

      if (newBoard.columns.length === 0) {
        // Si no hay columnas, es porque aún no se ha inicializado correctamente
        // Reintentar la operación después de un tiempo
        setTimeout(() => {
          fetchBoardData();
        }, 2000);
        return;
      }

      // 4. Obtener todas las tareas con relaciones (método robusto con manejo de errores)
      let tareas = [];
      try {
        // Intentar primero con la relación completa
        const { data, error } = await supabase
          .from('tareas')
          .select(`
            *,
            categoria:categoria_id(nombre, color),
            usuario:asignado_a(nombre, avatar_url),
            comentarios_count:comentarios_tareas(count),
            archivos_count:archivos_tareas(count)
          `)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.warn('Error con la relación de usuarios, usando consulta alternativa:', error.message);
          
          // Si hay un error específico con la relación, usar una consulta alternativa
          const { data: altData, error: altError } = await supabase
            .from('tareas')
            .select(`
              *,
              categoria:categoria_id(nombre, color),
              comentarios_count:comentarios_tareas(count),
              archivos_count:archivos_tareas(count)
            `)
            .order('created_at', { ascending: false });
            
          if (altError) throw altError;
          tareas = altData || [];
          
          // Si hay usuarios asignados, obtenerlos manualmente
          const userIds = tareas
            .filter(t => t.asignado_a)
            .map(t => t.asignado_a);
            
          if (userIds.length > 0) {
            const { data: users } = await supabase
              .from('perfiles')
              .select('id, nombre, avatar_url')
              .in('id', userIds);
              
            // Asignar usuarios manualmente
            if (users) {
              const userMap: Record<string, { id: string, nombre: string, avatar_url?: string }> = {};
              users.forEach(u => { userMap[u.id] = u; });
              
              tareas.forEach(tarea => {
                if (tarea.asignado_a && userMap[tarea.asignado_a]) {
                  tarea.usuario = userMap[tarea.asignado_a];
                }
              });
            }
          }
        } else {
          tareas = data || [];
        }
      } catch (queryError) {
        console.error('Error grave en la consulta de tareas:', queryError);
        throw queryError;
      }

      // 5. Para cada tarea, obtener sus etiquetas
      for (const tarea of tareas) {
        const { data: etiquetas, error: etiquetasError } = await supabase
          .from('tareas_etiquetas')
          .select(`
            etiqueta:etiqueta_id(id, nombre, color)
          `)
          .eq('tarea_id', tarea.id);
        
        if (etiquetasError) throw new Error(etiquetasError.message);
        
        // Añadir etiquetas a la tarea
        tarea.etiquetas = etiquetas?.map(e => e.etiqueta) || [];
        
        // Ajustar los contadores
        tarea.comentarios_count = tarea.comentarios_count?.[0]?.count || 0;
        tarea.archivos_count = tarea.archivos_count?.[0]?.count || 0;
      }

      // 6. Distribuir las tareas en las columnas correspondientes
      if (tareas) {
        tareas.forEach(tarea => {
          const column = newBoard.columns.find(col => col.id === tarea.columna_id);
          if (column) {
            column.tasks.push(tarea as Task);
          }
        });
      }

      // 7. Actualizar el estado del tablero
      setBoard(newBoard);
    } catch (err: any) {
      console.error('Error al cargar el tablero:', err);
      setError('No se pudo cargar el tablero. Por favor, intente nuevamente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar el arrastre de tareas entre columnas
  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    // Si no hay destino o el destino es igual al origen, no hacer nada
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Crear una copia del tablero
    const newBoard = { ...board };
    
    // Encontrar las columnas de origen y destino
    const sourceColumn = newBoard.columns.find(col => col.id === source.droppableId);
    const destColumn = newBoard.columns.find(col => col.id === destination.droppableId);
    
    if (!sourceColumn || !destColumn) return;
    
    // Obtener la tarea que se está moviendo
    const taskToMove = sourceColumn.tasks.find(task => task.id === draggableId);
    if (!taskToMove) return;

    // Determinar si la tarea se mueve a "Completadas" y si necesita actualizar el estado
    const movingToCompleted = destColumn.nombre === 'Completadas' && sourceColumn.nombre !== 'Completadas';
    const movingFromCompleted = sourceColumn.nombre === 'Completadas' && destColumn.nombre !== 'Completadas';
    
    // Eliminar la tarea de la columna de origen
    sourceColumn.tasks = sourceColumn.tasks.filter(task => task.id !== draggableId);
    
    // Actualizar estado de completado si es necesario
    if (movingToCompleted) {
      taskToMove.completado = true;
      taskToMove.porcentaje_completado = 100;
    } else if (movingFromCompleted) {
      taskToMove.completado = false;
      taskToMove.porcentaje_completado = taskToMove.porcentaje_completado < 100 ? taskToMove.porcentaje_completado : 80;
    }
    
    // Insertar la tarea en la columna de destino
    destColumn.tasks.splice(destination.index, 0, taskToMove);
    
    // Actualizar el estado local
    setBoard(newBoard);

    // Actualizar en la base de datos
    try {
      const { error } = await supabase
        .from('tareas')
        .update({ 
          columna_id: destination.droppableId,
          completado: taskToMove.completado,
          porcentaje_completado: taskToMove.porcentaje_completado 
        })
        .eq('id', draggableId);

      if (error) {
        throw new Error(error.message);
      }
      
      // Registrar el cambio en el historial
      await supabase
        .from('historial_tareas')
        .insert({
          tarea_id: draggableId,
          usuario_id: (await supabase.auth.getUser()).data.user?.id,
          tipo_cambio: 'cambio_columna',
          valor_anterior: { columna_id: source.droppableId, nombre: sourceColumn.nombre },
          valor_nuevo: { columna_id: destination.droppableId, nombre: destColumn.nombre }
        });
        
    } catch (err: any) {
      console.error('Error al actualizar la tarea:', err);
      setError('No se pudo actualizar la tarea. Por favor, intente nuevamente.');
      // Revertir cambios en caso de error
      fetchBoardData();
    }
  };

  // Eliminar una tarea
  const handleDeleteTask = async (taskId: string, columnId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('tareas')
        .delete()
        .eq('id', taskId);

      if (error) {
        throw new Error(error.message);
      }

      // Actualizar el estado local
      const newBoard = { ...board };
      const column = newBoard.columns.find(col => col.id === columnId);
      
      if (column) {
        column.tasks = column.tasks.filter(task => task.id !== taskId);
      }
      
      setBoard(newBoard);
    } catch (err: any) {
      console.error('Error al eliminar la tarea:', err);
      setError('No se pudo eliminar la tarea. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Iniciar edición de tarea (navegando a la página)
  const handleEditTask = (taskId: string) => {
    window.location.href = `/organizacion/tarea/${taskId}`;
  };

  // Componente para renderizar una tarea
  const TaskCard = ({ task, columnId }: { task: Task, columnId: string }) => (
    <div 
      className={`bg-white p-4 mb-3 rounded-lg shadow-sm border-l-4 hover:shadow-md transition-all ${
        task.prioridad === 'urgente' ? 'border-red-500' : 
        task.prioridad === 'alta' ? 'border-orange-500' : 
        task.prioridad === 'media' ? 'border-blue-500' : 'border-green-500'
      }`}
    >
      {/* Cabecera con categoría */}
      {task.categoria && (
        <div className="mb-2">
          <span 
            className="text-xs inline-block px-2 py-1 rounded-full" 
            style={{ backgroundColor: task.categoria.color + '20', color: task.categoria.color }}
          >
            {task.categoria.nombre}
          </span>
        </div>
      )}
      
      {/* Título y acciones */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-800">{task.titulo}</h3>
        <div className="flex space-x-1">
          <button 
            onClick={() => handleEditTask(task.id)}
            className="text-gray-400 hover:text-blue-500 transition-colors"
          >
            <FiEdit2 size={14} />
          </button>
          <button 
            onClick={() => handleDeleteTask(task.id, columnId)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>
      
      {/* Descripción (truncada) */}
      {task.descripcion && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.descripcion}
        </p>
      )}
      
      {/* Etiquetas */}
      {task.etiquetas && task.etiquetas.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.etiquetas.map(etiqueta => (
            <span 
              key={etiqueta.id}
              className="text-xs px-2 py-0.5 rounded-full flex items-center space-x-1"
              style={{ backgroundColor: etiqueta.color + '30', color: etiqueta.color }}
            >
              <FiTag size={10} />
              <span>{etiqueta.nombre}</span>
            </span>
          ))}
        </div>
      )}
      
      {/* Barra de progreso si no está completada y no es 0% */}
      {task.porcentaje_completado > 0 && task.porcentaje_completado < 100 && (
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
          <div 
            className="bg-blue-600 h-1.5 rounded-full" 
            style={{ width: `${task.porcentaje_completado}%` }}
          ></div>
        </div>
      )}
      
      {/* Información adicional en formato de grid */}
      <div className="mt-3 grid grid-cols-2 gap-y-2 text-xs text-gray-500">
        {/* Fecha límite */}
        {task.fecha_limite && (
          <div className={`flex items-center ${getDateColor(task.fecha_limite)}`}>
            <FiCalendar className="mr-1" size={12} />
            <span>{formatDate(task.fecha_limite)}</span>
          </div>
        )}
        
        {/* Asignado a */}
        {task.usuario && (
          <div className="flex items-center">
            <FiUser className="mr-1" size={12} />
            <span>{task.usuario.nombre}</span>
          </div>
        )}
        
        {/* Avance */}
        <div className="flex items-center">
          <FiClock className="mr-1" size={12} />
          <span>{getProgressText(task.porcentaje_completado)}</span>
        </div>
        
        {/* Comentarios y archivos */}
        <div className="flex items-center space-x-3">
          {task.comentarios_count > 0 && (
            <span className="flex items-center">
              <FiMessageSquare className="mr-1" size={12} />
              {task.comentarios_count}
            </span>
          )}
          
          {task.archivos_count > 0 && (
            <span className="flex items-center">
              <FiPaperclip className="mr-1" size={12} />
              {task.archivos_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Si necesita configuración, mostrar el componente de configuración
  if (needsSetup) {
    return <SetupInstructions 
              onTryAgain={createDatabaseTables} 
              isLoading={isCreatingDatabase}
              errorMessage={setupError} 
           />;
  }

  // Renderizar el componente
  return (
    <div className="container mx-auto p-4">
      {/* Cabecera con título y botón de nueva tarea */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Tablero de Organización</h1>
        
        {/* Barra de filtros y búsqueda */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Buscador */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar tareas..."
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
              onChange={handleSearchChange}
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          {/* Filtro por prioridad */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterPriority || ''}
            onChange={(e) => setFilterPriority(e.target.value || null)}
          >
            <option value="">Todas las prioridades</option>
            <option value="baja">Prioridad baja</option>
            <option value="media">Prioridad media</option>
            <option value="alta">Prioridad alta</option>
            <option value="urgente">Prioridad urgente</option>
          </select>
          
          {/* Filtro por categoría */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterCategory || ''}
            onChange={(e) => setFilterCategory(e.target.value || null)}
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
          
          {/* Botón para añadir tarea */}
          <a 
            href="/organizacion/nueva-tarea"
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="mr-2" /> Nueva Tarea
          </a>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <FiAlertCircle className="mr-2" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <FiX />
          </button>
        </div>
      )}

      {/* Spinner de carga */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-3 text-gray-500">Cargando tablero...</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Renderizar las columnas */}
            {(filteredBoard || board).columns.map(column => (
              <div 
                key={column.id} 
                className="bg-gray-50 rounded-lg shadow overflow-hidden flex flex-col h-[calc(100vh-220px)]"
                style={{ backgroundColor: column.color + '30' }}
              >
                {/* Cabecera de la columna */}
                <div className="p-4 border-b bg-white flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2 text-gray-600">
                      {column.icon}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-700">{column.nombre}</h2>
                  </div>
                  <span className="text-sm bg-gray-200 px-2 py-1 rounded-full text-gray-700">
                    {column.tasks.length}
                  </span>
                </div>
                
                {/* Área para las tareas */}
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="p-3 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                    >
                      {column.tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskCard task={task} columnId={column.id} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {/* Mensaje cuando no hay tareas */}
                      {column.tasks.length === 0 && (
                        <div className="text-center py-8 text-gray-400 italic text-sm">
                          No hay tareas en esta columna
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
                
                {/* Botón para añadir tarea en esta columna */}
                <div className="p-3 border-t bg-white">
                  <a
                    href={`/organizacion/nueva-tarea?columna=${column.id}`}
                    className="w-full py-2 px-3 text-sm text-gray-500 hover:bg-gray-100 rounded-md flex items-center justify-center transition-colors"
                  >
                    <FiPlus className="mr-1" /> Añadir tarea
                  </a>
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
} 
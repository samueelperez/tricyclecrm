'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FiEye, FiEyeOff, FiSave, FiAlertCircle, FiRefreshCw, FiUser } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Usuario {
  id: string;
  email: string;
}

interface Seccion {
  id: string;
  nombre: string;
  descripcion: string;
  visible: boolean;
}

export default function SectionVisibilityManager() {
  const supabase = createClientComponentClient();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [userSections, setUserSections] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Definición de secciones disponibles
  const seccionesDisponibles: Seccion[] = [
    { id: 'dashboard', nombre: 'Dashboard', descripcion: 'Panel principal con estadísticas', visible: true },
    { id: 'facturas', nombre: 'Facturas', descripcion: 'Gestión de facturas', visible: true },
    { id: 'clientes', nombre: 'Clientes', descripcion: 'Gestión de clientes', visible: true },
    { id: 'productos', nombre: 'Productos', descripcion: 'Catálogo de productos', visible: true },
    { id: 'negocios', nombre: 'Negocios', descripcion: 'Oportunidades de venta', visible: true },
    { id: 'albaranes', nombre: 'Albaranes', descripcion: 'Gestión de albaranes', visible: true },
    { id: 'configuracion', nombre: 'Configuración', descripcion: 'Ajustes de la aplicación', visible: true },
    { id: 'chatbot', nombre: 'Chatbot', descripcion: 'Asistente virtual', visible: true },
    { id: 'logistica', nombre: 'Logística', descripcion: 'Gestión de envíos', visible: true },
    { id: 'organizacion', nombre: 'Organización', descripcion: 'Gestión de tareas', visible: true }
  ];

  // Cargar usuarios
  useEffect(() => {
    async function loadUsuarios() {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('auth_users_view')
          .select('id, email');
          
        if (error) {
          throw new Error(error.message);
        }
        
        if (data) {
          setUsuarios(data);
          if (data.length > 0) {
            setSelectedUser(data[0]);
            await loadUserSections(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
        setError('No se pudieron cargar los usuarios. Asegúrate de haber ejecutado la configuración de base de datos.');
      } finally {
        setIsLoading(false);
      }
    }
    
    // Inicializar secciones
    setSecciones(seccionesDisponibles);
    loadUsuarios();
  }, [supabase]);

  // Cargar secciones de un usuario
  async function loadUserSections(userId: string) {
    setIsLoading(true);
    
    try {
      // Cargar configuración de secciones del usuario
      const { data, error } = await supabase
        .from('usuario_secciones')
        .select('seccion_id, visible')
        .eq('user_id', userId);
        
      if (error) {
        if (error.code === '42P01') { // Tabla no existe
          console.error('La tabla usuario_secciones no existe:', error.message);
          toast.error('La tabla de configuración no existe. Por favor, configura la base de datos primero.');
          setError('La tabla de configuración no existe. Por favor, haz clic en "Configurar Base de Datos" primero.');
          return;
        }
        throw new Error(error.message);
      }
      
      // Crear un mapa con los valores predeterminados (todas las secciones visibles)
      const sectionsMap = new Map<string, boolean>();
      seccionesDisponibles.forEach(seccion => {
        sectionsMap.set(seccion.id, true); // Por defecto todas son visibles
      });
      
      // Si hay datos, sobrescribir con la configuración del usuario
      if (data && data.length > 0) {
        data.forEach(item => {
          sectionsMap.set(item.seccion_id, item.visible);
        });
      }
      
      setUserSections(sectionsMap);
    } catch (err) {
      console.error('Error al cargar secciones del usuario:', err);
      toast.error('Error al cargar configuración del usuario');
    } finally {
      setIsLoading(false);
    }
  }

  // Manejar cambio de usuario seleccionado
  function handleSelectUser(user: Usuario) {
    setSelectedUser(user);
    loadUserSections(user.id);
  }

  // Alternar visibilidad de una sección
  function toggleSectionVisibility(sectionId: string) {
    setUserSections(prev => {
      const newMap = new Map(prev);
      const currentValue = newMap.get(sectionId) ?? true;
      newMap.set(sectionId, !currentValue);
      return newMap;
    });
  }

  // Guardar configuración
  async function handleSaveConfiguration() {
    if (!selectedUser) return;
    
    setIsSaving(true);
    
    try {
      // Primero eliminamos las configuraciones existentes
      const { error: deleteError } = await supabase
        .from('usuario_secciones')
        .delete()
        .eq('user_id', selectedUser.id);
        
      if (deleteError) {
        if (deleteError.code === '42P01') { // Tabla no existe
          console.error('La tabla usuario_secciones no existe:', deleteError.message);
          toast.error('La tabla de configuración no existe. Por favor, configura la base de datos primero.');
          setError('La tabla de configuración no existe. Por favor, haz clic en "Configurar Base de Datos" primero.');
          setIsSaving(false);
          return;
        }
        throw new Error(deleteError.message);
      }
      
      // Luego insertamos las nuevas configuraciones
      const sectionsToInsert = Array.from(userSections.entries()).map(([seccion_id, visible]) => ({
        user_id: selectedUser.id,
        seccion_id,
        visible
      }));
      
      const { error: insertError } = await supabase
        .from('usuario_secciones')
        .insert(sectionsToInsert);
        
      if (insertError) throw new Error(insertError.message);
      
      toast.success('Configuración guardada correctamente');
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  }

  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 flex items-center text-sm font-medium text-red-700 hover:text-red-900"
            >
              <FiRefreshCw className="mr-1" /> Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Panel de selección de usuario */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Seleccionar Usuario</h2>
        
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <ul className="space-y-2">
            {usuarios.map(user => (
              <li key={user.id}>
                <button 
                  onClick={() => handleSelectUser(user)}
                  className={`w-full text-left p-3 rounded flex items-center ${
                    selectedUser?.id === user.id 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <FiUser className="mr-2" />
                  <span>{user.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Panel de configuración de secciones */}
      <div className="bg-white rounded-lg shadow p-4 md:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Configurar Secciones</h2>
          
          <Button
            onClick={handleSaveConfiguration}
            disabled={!selectedUser || isLoading || isSaving}
            className="flex items-center gap-2"
          >
            <FiSave className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
        
        {!selectedUser ? (
          <p className="text-gray-500 italic">Selecciona un usuario para configurar sus secciones</p>
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {secciones.map(seccion => {
              const isVisible = userSections.get(seccion.id) ?? true;
              
              return (
                <div key={seccion.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{seccion.nombre}</h3>
                      <p className="text-sm text-gray-500">{seccion.descripcion}</p>
                    </div>
                    
                    <button
                      onClick={() => toggleSectionVisibility(seccion.id)}
                      className={`p-2 rounded-full transition-colors ${
                        isVisible
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                    >
                      {isVisible ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 
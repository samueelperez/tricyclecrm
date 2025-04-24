'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FiEye, FiEyeOff, FiSave, FiUser, FiUsers, FiSearch, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Usuario {
  id: string;
  email: string;
  secciones: string[];
}

interface MenuItemType {
  id: string;
  name: string;
}

interface AdminSeccionesProps {
  usuarios: Usuario[];
}

export default function AdminSecciones({ usuarios: initialUsuarios }: AdminSeccionesProps) {
  const supabase = createClientComponentClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [visibleSections, setVisibleSections] = useState<string[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios || []);
  const [error, setError] = useState<string | null>(null);

  // Inicializar la base de datos con las funciones y tablas necesarias
  useEffect(() => {
    async function initializeDatabase() {
      if (initialUsuarios && initialUsuarios.length > 0) {
        return; // No es necesario inicializar si ya hay datos
      }
      
      setIsInitializing(true);
      setError(null);
      
      try {
        // Crear las funciones SQL básicas
        const sqlFunctionsResponse = await fetch('/api/admin/sql-functions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initialize: true })
        });
        
        if (!sqlFunctionsResponse.ok) {
          const data = await sqlFunctionsResponse.json();
          throw new Error(data.error || 'Error al crear funciones SQL');
        }
        
        // Crear la vista de usuarios
        const authViewResponse = await fetch('/api/admin/functions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ function_name: 'create_auth_users_view_if_missing' })
        });
        
        if (!authViewResponse.ok) {
          const data = await authViewResponse.json();
          throw new Error(data.error || 'Error al crear vista de usuarios');
        }
        
        // Crear la tabla de secciones
        const seccionesTableResponse = await fetch('/api/admin/functions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ function_name: 'create_usuario_secciones_table_if_missing' })
        });
        
        if (!seccionesTableResponse.ok) {
          const data = await seccionesTableResponse.json();
          throw new Error(data.error || 'Error al crear tabla de secciones');
        }
        
        // Cargar los usuarios después de inicializar
        await loadUsers();
        
        toast.success('Base de datos inicializada correctamente');
      } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        setError('Error al inicializar la base de datos. Por favor, intenta de nuevo.');
        toast.error('Error al inicializar la base de datos');
      } finally {
        setIsInitializing(false);
      }
    }
    
    initializeDatabase();
  }, [initialUsuarios]);

  // Cargar elementos del menú al montar el componente
  useEffect(() => {
    loadMenuItems();

    // Si hay usuarios, seleccionar el primero por defecto
    if (usuarios && usuarios.length > 0) {
      handleSelectUser(usuarios[0]);
    }
  }, [usuarios]);

  // Cargar los usuarios desde la API
  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/secciones');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar usuarios');
      }
      
      const data = await response.json();
      setUsuarios(data);
      
      if (data && data.length > 0) {
        handleSelectUser(data[0]);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error al cargar la lista de usuarios');
      toast.error('Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar elementos del menú predefinidos
  const loadMenuItems = () => {
    const predefinedItems = [
      { id: 'dashboard', name: 'Panel' },
      { id: 'solicitudes', name: 'Solicitudes' },
      { id: 'clientes', name: 'Clientes' },
      { id: 'productos', name: 'Productos' },
      { id: 'negocios', name: 'Negocios' },
      { id: 'albaranes', name: 'Albaranes' },
      { id: 'facturas', name: 'Facturas' },
      { id: 'configuracion', name: 'Configuración' },
      { id: 'chatbot', name: 'Chatbot' },
      { id: 'logistica', name: 'Logística' },
      { id: 'recibos', name: 'Recibos' },
      { id: 'instrucciones_bl', name: 'Instrucciones BL' },
      { id: 'almacenamiento', name: 'Almacenamiento' },
      { id: 'organizacion', name: 'Organización' }
    ];
    setMenuItems(predefinedItems);
  };

  // Seleccionar un usuario para configurar sus secciones
  const handleSelectUser = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setVisibleSections(usuario.secciones || []);
  };

  // Alternar la visibilidad de una sección
  const toggleSection = (sectionId: string) => {
    setVisibleSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  };

  // Guardar las secciones visibles para el usuario seleccionado
  const handleSaveUserSections = async () => {
    if (!usuarioSeleccionado) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Guardar a través de la API
      const response = await fetch('/api/admin/secciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: usuarioSeleccionado.id,
          secciones_visibles: visibleSections
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar configuración');
      }
      
      // Actualizar el usuario en el array local
      const updatedUsuarios = usuarios.map(u => 
        u.id === usuarioSeleccionado.id ? { ...u, secciones: visibleSections } : u
      );
      
      setUsuarios(updatedUsuarios);
      setUsuarioSeleccionado({ ...usuarioSeleccionado, secciones: visibleSections });
      
      toast.success("Configuración guardada correctamente");
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      setError('Error al guardar la configuración');
      toast.error("Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrar usuarios según término de búsqueda
  const filteredUsuarios = searchTerm 
    ? usuarios.filter(usuario => 
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : usuarios;

  // Renderizar el mensaje de error si hay alguno
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button 
              onClick={loadUsers} 
              className="mt-2 flex items-center text-sm font-medium text-red-700 hover:text-red-900"
            >
              <FiRefreshCw className="mr-1" /> Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar spinner durante la inicialización
  if (isInitializing) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">Inicializando base de datos...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panel de selección de usuario */}
      <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-1">
        <h2 className="text-lg font-semibold flex items-center mb-4">
          <FiUsers className="mr-2" /> Seleccione un Usuario
        </h2>
        
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md pl-10"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[400px]">
          {isLoading ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="p-3 border border-gray-200 rounded-md">
                  <Skeleton width="w-full" height="h-6" />
                </div>
              ))}
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No se encontraron usuarios</p>
          ) : (
            <ul className="space-y-2">
              {filteredUsuarios.map(usuario => (
                <li key={usuario.id}>
                  <button
                    onClick={() => handleSelectUser(usuario)}
                    className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                      usuarioSeleccionado?.id === usuario.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <FiUser className="mr-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{usuario.email}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Panel de configuración de secciones */}
      <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <FiEye className="mr-2" /> Secciones Visibles
          </h2>
          
          <button 
            onClick={handleSaveUserSections}
            disabled={isSaving || !usuarioSeleccionado}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            <FiSave />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
        
        {!usuarioSeleccionado ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <FiUser className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">
              Seleccione un usuario para configurar las secciones visibles
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton width="w-[150px]" height="h-[24px]" />
                <Skeleton width="w-[100px]" height="h-[36px]" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-sm text-blue-700">
                Configurando secciones para: <span className="font-bold">{usuarioSeleccionado.email}</span>
              </p>
            </div>
            
            <div className="space-y-4">
              {menuItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-3">
                  <span className="font-medium">{item.name}</span>
                  <button
                    onClick={() => toggleSection(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                      visibleSections.includes(item.id)
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {visibleSections.includes(item.id) ? (
                      <>
                        <FiEye />
                        <span>Visible</span>
                      </>
                    ) : (
                      <>
                        <FiEyeOff />
                        <span>Oculto</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { FiUser, FiCheck, FiX, FiShield } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface Usuario {
  id: string;
  email: string;
  nombre?: string;
  is_admin: boolean;
  created_at: string;
}

export default function UsuariosManager() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/usuarios');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al cargar usuarios');
        }
        
        const data = await response.json();
        setUsuarios(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        toast.error(err instanceof Error ? err.message : 'Error al cargar usuarios');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  const toggleAdminStatus = async (userId: string, isAdmin: boolean) => {
    try {
      const toastId = toast.loading('Actualizando permisos...');
      
      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          isAdmin: !isAdmin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar usuario');
      }

      // Actualizar estado local
      setUsuarios(prevUsuarios => 
        prevUsuarios.map(usuario => 
          usuario.id === userId 
            ? { ...usuario, is_admin: !isAdmin } 
            : usuario
        )
      );
      
      toast.success('Permisos actualizados correctamente', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar permisos');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
        <p className="font-medium">Error al cargar usuarios</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha de creación
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admin
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay usuarios para mostrar
                </td>
              </tr>
            ) : (
              usuarios.map(usuario => (
                <tr key={usuario.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <FiUser className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{usuario.email}</div>
                        <div className="text-sm text-gray-500">{usuario.nombre || 'Sin nombre'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(usuario.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      usuario.is_admin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {usuario.is_admin ? (
                        <FiCheck className="mr-1" />
                      ) : (
                        <FiX className="mr-1" />
                      )}
                      {usuario.is_admin ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {usuario.email === 'admin@tricyclecrm.com' ? (
                      <span className="text-gray-400 flex items-center">
                        <FiShield className="mr-1" /> Admin principal
                      </span>
                    ) : (
                      <button
                        onClick={() => toggleAdminStatus(usuario.id, usuario.is_admin)}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md ${
                          usuario.is_admin
                            ? 'text-red-700 bg-red-100 hover:bg-red-200'
                            : 'text-green-700 bg-green-100 hover:bg-green-200'
                        } transition ease-in-out duration-150`}
                      >
                        {usuario.is_admin ? 'Quitar admin' : 'Hacer admin'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
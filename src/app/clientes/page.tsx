'use client'

import { useState, useEffect } from 'react'
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiUser, FiUsers, FiPhone, FiMail, FiMapPin } from 'react-icons/fi'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'

interface Cliente {
  id: number
  nombre: string
  id_fiscal: string | null
  direccion: string | null
  ciudad: string | null
  codigo_postal: string | null
  pais: string | null
  contacto_nombre: string | null
  email: string | null
  telefono: string | null
  sitio_web: string | null
  comentarios: string | null
  created_at?: string | null
  updated_at?: string | null
}

export default function ClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchClientes = async () => {
      setLoading(true)
      
      try {
        const { data, error: fetchError } = await supabase
          .from('clientes')
          .select('id, nombre, id_fiscal, email, telefono, ciudad, pais, direccion, codigo_postal, contacto_nombre, sitio_web, comentarios')
          .order('nombre')
        
        if (fetchError) {
          throw new Error(`Error al cargar clientes: ${fetchError.message}`)
        }
        
        setClientes(data || [])
      } catch (error) {
        console.error('Error inesperado:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchClientes()
  }, [supabase])
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Función para eliminar cliente
  const handleDelete = async (clienteId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setDeleteLoading(clienteId);
    
    try {
      const { error: deleteError } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteId);
      
      if (deleteError) {
        console.error('Error eliminando cliente:', deleteError);
        alert(`Error al eliminar: ${deleteError.message}`);
        return;
      }
      
      // Actualizar la lista de clientes
      setClientes(clientes.filter(cliente => cliente.id !== clienteId));
      
      toast.success('Cliente eliminado correctamente');
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error al eliminar el cliente');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filtrar clientes según término de búsqueda
  const filteredClientes = clientes.filter(cliente => 
    cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cliente.id_fiscal && cliente.id_fiscal.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 sm:mb-0">
            Clientes
          </h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Link 
              href="/clientes/new"
              className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nuevo Cliente
            </Link>
          </div>
        </div>
        
        {/* Buscador */}
        <div className="bg-white shadow-md rounded-lg p-5 mb-8 transition-all duration-300 ease-in-out transform hover:shadow-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, ID fiscal o email..."
              className="pl-10 pr-4 py-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        {/* Estado de carga */}
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Cargando clientes...</p>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="flex justify-center mb-4">
              <FiUsers className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg mb-4">No se encontraron clientes</p>
            {searchQuery && (
              <p className="text-sm text-gray-500">
                Intente buscar con otros términos o{' '}
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-indigo-500 hover:text-indigo-700 hover:underline focus:outline-none"
                >
                  ver todos los clientes
                </button>
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out">
            {/* Tabla de clientes */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiUser className="mr-2 text-indigo-500" />
                        Cliente
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiPhone className="mr-2 text-indigo-500" />
                        Contacto
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiMapPin className="mr-2 text-indigo-500" />
                        Ubicación
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-full">
                            <FiUser className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                            <div className="text-sm text-gray-500">{cliente.id_fiscal || 'Sin ID fiscal'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(cliente.email || cliente.telefono) ? (
                          <div>
                            {cliente.email && (
                              <div className="text-sm text-gray-900 flex items-center">
                                <FiMail className="mr-1 text-indigo-500 h-4 w-4" />
                                {cliente.email}
                              </div>
                            )}
                            {cliente.telefono && (
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <FiPhone className="mr-1 text-indigo-500 h-4 w-4" />
                                {cliente.telefono}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Sin información</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(cliente.ciudad || cliente.pais) ? (
                          <div className="text-sm text-gray-900 flex items-center">
                            <FiMapPin className="mr-1 text-indigo-500 h-4 w-4" />
                            {cliente.ciudad && cliente.pais 
                              ? `${cliente.ciudad}, ${cliente.pais}`
                              : cliente.ciudad || cliente.pais}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Sin ubicación</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link
                            href={`/clientes/${cliente.id}`}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150 p-1"
                            title="Ver detalles"
                          >
                            Ver
                          </Link>
                          <Link
                            href={`/clientes/edit/${cliente.id}`}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1"
                            title="Editar cliente"
                          >
                            <FiEdit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(cliente.id)}
                            disabled={deleteLoading === cliente.id}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 disabled:opacity-50"
                            title="Eliminar cliente"
                          >
                            {deleteLoading === cliente.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-r-transparent border-red-600"></div>
                            ) : (
                              <FiTrash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
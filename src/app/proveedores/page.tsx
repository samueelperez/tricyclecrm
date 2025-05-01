'use client'

import { useState, useEffect } from 'react'
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiUser, FiPackage, FiPhone, FiMail, FiMapPin, FiEye } from 'react-icons/fi'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FiFile } from 'react-icons/fi'

interface Proveedor {
  id: number
  nombre: string
  id_fiscal: string | null
  telefono: string | null
  email: string | null
  ciudad: string | null
  pais: string | null
  sitio_web: string | null
  comentarios: string | null
  ruta_archivo: string | null
  nombre_archivo: string | null
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [filePreview, setFilePreview] = useState<{url: string, nombre: string} | null>(null)

  useEffect(() => {
    const fetchProveedores = async () => {
      setLoading(true)
      
      try {
        const supabase = getSupabaseClient();
        
        // Consulta básica para obtener todos los proveedores
        let query = supabase.from('proveedores').select('*')
        
        // Si hay una búsqueda, filtrar por nombre o id fiscal
        if (searchQuery) {
          query = query.or(`nombre.ilike.%${searchQuery}%,id_fiscal.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,ciudad.ilike.%${searchQuery}%`)
        }
        
        // Ordenar por nombre
        query = query.order('nombre', { ascending: true })
        
        const { data, error } = await query
        
        if (error) {
          console.error('Error cargando proveedores:', error)
          return
        }
        
        setProveedores(data || [])
      } catch (error) {
        console.error('Error inesperado:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProveedores()
  }, [searchQuery])
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este proveedor? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeleteLoading(id);
    
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error eliminando proveedor:', error);
        alert(`Error al eliminar: ${error.message}`);
        return;
      }
      
      // Actualizar la lista de proveedores
      setProveedores(proveedores.filter(proveedor => proveedor.id !== id));
      
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error al eliminar el proveedor');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handlePreviewFile = async (proveedor: Proveedor) => {
    if (!proveedor.ruta_archivo || !proveedor.nombre_archivo) {
      return;
    }

    try {
      const supabase = createClientComponentClient();
      
      // Crear una URL firmada (válida por 1 hora) para el archivo
      const { data, error } = await supabase
        .storage
        .from('documentos')
        .createSignedUrl(proveedor.ruta_archivo, 3600);
        
      if (error) {
        console.error('Error al obtener URL firmada:', error);
        alert('No se pudo cargar el archivo para la vista previa');
        return;
      }
      
      setFilePreview({
        url: data.signedUrl,
        nombre: proveedor.nombre_archivo
      });
      
    } catch (error) {
      console.error('Error al generar vista previa:', error);
      alert('Error al generar la vista previa del archivo');
    }
  };
  
  const closePreview = () => {
    setFilePreview(null);
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 sm:mb-0">
            Proveedores
          </h1>
          <Link 
            href="/proveedores/new"
            className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nuevo Proveedor
          </Link>
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
            <p className="text-gray-500 text-lg">Cargando proveedores...</p>
          </div>
        ) : proveedores.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="flex justify-center mb-4">
              <FiPackage className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg mb-4">No se encontraron proveedores</p>
            {searchQuery && (
              <p className="text-sm text-gray-500">
                Intente buscar con otros términos o{' '}
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-indigo-500 hover:text-indigo-700 hover:underline focus:outline-none"
                >
                  ver todos los proveedores
                </button>
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out">
            {/* Tabla de proveedores */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiUser className="mr-2 text-indigo-500" />
                        Proveedor
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
                  {proveedores.map((proveedor) => (
                    <tr key={proveedor.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-full">
                            <FiPackage className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{proveedor.nombre}</div>
                            <div className="text-sm text-gray-500">{proveedor.id_fiscal || 'Sin ID fiscal'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(proveedor.email || proveedor.telefono) ? (
                          <div>
                            {proveedor.email && (
                              <div className="text-sm text-gray-900 flex items-center">
                                <FiMail className="mr-1 text-indigo-500 h-4 w-4" />
                                {proveedor.email}
                              </div>
                            )}
                            {proveedor.telefono && (
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <FiPhone className="mr-1 text-indigo-500 h-4 w-4" />
                                {proveedor.telefono}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Sin información</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(proveedor.ciudad || proveedor.pais) ? (
                          <div className="text-sm text-gray-900 flex items-center">
                            <FiMapPin className="mr-1 text-indigo-500 h-4 w-4" />
                            {proveedor.ciudad && proveedor.pais 
                              ? `${proveedor.ciudad}, ${proveedor.pais}`
                              : proveedor.ciudad || proveedor.pais}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Sin ubicación</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          {proveedor.nombre_archivo && (
                            <button
                              onClick={() => handlePreviewFile(proveedor)}
                              className="text-blue-500 hover:text-blue-700 transition-colors duration-150 p-1"
                              title="Ver archivo adjunto"
                            >
                              <FiEye className="h-4 w-4" />
                            </button>
                          )}
                          <Link
                            href={`/proveedores/${proveedor.id}`}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150 p-1"
                            title="Ver detalles"
                          >
                            Ver
                          </Link>
                          <Link
                            href={`/proveedores/edit/${proveedor.id}`}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1"
                            title="Editar proveedor"
                          >
                            <FiEdit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(proveedor.id)}
                            disabled={deleteLoading === proveedor.id}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 disabled:opacity-50"
                            title="Eliminar proveedor"
                          >
                            {deleteLoading === proveedor.id ? (
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
        
        {/* Modal de vista previa del archivo */}
        {filePreview && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-70" onClick={closePreview}>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {filePreview.nombre}
                </h3>
                <button onClick={closePreview} className="text-gray-400 hover:text-gray-500">
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-6 bg-gray-50">
                {filePreview.nombre.toLowerCase().endsWith('.pdf') ? (
                  <iframe 
                    src={filePreview.url} 
                    className="w-full h-full min-h-[70vh]" 
                    title="Vista previa del PDF"
                  />
                ) : filePreview.nombre.toLowerCase().match(/\.(jpe?g|png|gif)$/i) ? (
                  <div className="flex justify-center">
                    <img 
                      src={filePreview.url} 
                      alt="Vista previa" 
                      className="max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-12">
                    <div className="text-center">
                      <FiFile className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        No se puede mostrar la vista previa para este tipo de archivo
                      </p>
                      <a
                        href={filePreview.url}
                        download={filePreview.nombre}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Descargar archivo
                      </a>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                <a
                  href={filePreview.url}
                  download={filePreview.nombre}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Descargar
                </a>
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                  onClick={closePreview}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
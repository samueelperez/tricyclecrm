'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiPlus, 
  FiEye, 
  FiEdit, 
  FiTrash2, 
  FiDownload,
  FiSearch,
  FiCalendar,
  FiPackage,
  FiBox,
  FiUser,
  FiTag,
  FiRefreshCw,
  FiX,
  FiFilter
} from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';

// Interfaz para lista de empaque
interface PackingList {
  id: string;
  id_externo: string;
  fecha: string;
  cliente_nombre: string;
  cliente_direccion: string;
  items: PackingListItem[];
  peso_total: number;
  bales_total: number;
  created_at: string;
}

// Interfaz para item de lista de empaque
interface PackingListItem {
  id: string;
  packing_list_id: string;
  container: string;
  precinto: string;
  bales: number;
  weight: number;
  date: string;
}

export default function PackingListsPage() {
  const [packingLists, setPackingLists] = useState<PackingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Cargar listas de empaque
  useEffect(() => {
    loadPackingLists();
  }, []);

  const loadPackingLists = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('packing_lists')
        .select(`
          *,
          items:packing_list_items(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setPackingLists(data || []);
    } catch (error) {
      console.error('Error al cargar listas de empaque:', error);
      setError('Error al cargar listas de empaque. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  // Eliminar lista de empaque
  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta lista de empaque?')) return;
    
    setDeleteLoading(id);
    try {
      const supabase = getSupabaseClient();
      
      // Primero eliminamos los items relacionados
      const { error: itemsError } = await supabase
        .from('packing_list_items')
        .delete()
        .eq('packing_list_id', id);
      
      if (itemsError) throw itemsError;
      
      // Luego eliminamos la lista de empaque
      const { error } = await supabase
        .from('packing_lists')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Actualizar estado local removiendo la lista eliminada
      setPackingLists(prev => prev.filter(list => list.id !== id));
      
    } catch (error) {
      console.error('Error al eliminar lista de empaque:', error);
      setError('Error al eliminar la lista de empaque. Por favor, intente nuevamente.');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filtrar listas de empaque por término de búsqueda
  const filteredLists = packingLists.filter(list => 
    list.id_externo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    list.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div>
      <div className="max-w-full mx-auto">
        {/* Cabecera */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 sm:mb-0">
            Listas de Empaque
          </h1>
          <Link 
            href="/packing-lists/new" 
            className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nueva Lista de Empaque
          </Link>
        </div>
        
        {/* Mensaje de error */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm animate-fadeIn">
            <div className="flex">
              <div className="flex-shrink-0 text-red-500">
                <FiX className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setError(null)}
                    className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <span className="sr-only">Descartar</span>
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Filtros y búsqueda */}
        <div className="bg-white shadow-md rounded-lg p-5 mb-8 transition-all duration-300 ease-in-out transform hover:shadow-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Buscar por número o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Tabla de listas de empaque */}
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Cargando listas de empaque...</p>
          </div>
        ) : filteredLists.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="flex justify-center mb-4">
              <FiBox className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg mb-4">
              {searchTerm ? (
                'No se encontraron listas de empaque con los filtros seleccionados'
              ) : (
                'No hay listas de empaque registradas'
              )}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="text-indigo-500 hover:text-indigo-700 hover:underline focus:outline-none"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg transition-all duration-300 ease-in-out">
            <table className="w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contenedores
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peso Total
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLists.map((list) => (
                  <tr key={list.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-indigo-600">
                        {list.id_externo || `PL-${list.id.slice(0, 8)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-700">
                        <FiCalendar className="mr-2 h-4 w-4 text-gray-400" />
                        {formatDate(list.fecha)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm">
                        <FiUser className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-800">{list.cliente_nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiPackage className="mr-2 h-4 w-4 text-indigo-500" />
                        <span className="text-sm text-gray-700">{list.items?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-800">
                        {new Intl.NumberFormat('es-ES').format(list.peso_total || 0)} kg
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link 
                          href={`/packing-lists/${list.id}/pdf`} 
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors duration-150"
                          title="Ver PDF"
                        >
                          <FiEye className="h-5 w-5" />
                        </Link>
                        <Link 
                          href={`/packing-lists/edit/${list.id}`} 
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-150"
                          title="Editar lista"
                        >
                          <FiEdit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(list.id)}
                          disabled={deleteLoading === list.id}
                          className={`p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors duration-150 ${
                            deleteLoading === list.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Eliminar lista"
                        >
                          {deleteLoading === list.id ? (
                            <FiRefreshCw className="h-5 w-5 animate-spin" />
                          ) : (
                            <FiTrash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 
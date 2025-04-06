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
  FiPackage
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
    async function loadPackingLists() {
      setLoading(true);
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
    
    loadPackingLists();
  }, []);

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
      alert('Error al eliminar la lista de empaque.');
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Listas de Empaque</h1>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 w-full md:w-auto">
          {/* Buscador */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar lista de empaque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FiSearch className="w-4 h-4" />
            </div>
          </div>
          
          {/* Botón para nueva lista de empaque */}
          <Link 
            href="/packing-lists/new" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <FiPlus className="w-5 h-5 mr-2" />
            Nueva Lista de Empaque
          </Link>
        </div>
      </div>
      
      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabla de listas de empaque */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredLists.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contenedores
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peso Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLists.map((list) => (
                  <tr key={list.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{list.id_externo || `PL-${list.id.slice(0, 8)}`}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FiCalendar className="mr-1 text-gray-500 h-4 w-4" />
                        {formatDate(list.fecha)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{list.cliente_nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FiPackage className="mr-1 text-blue-500 h-4 w-4" />
                        {list.items?.length || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{list.peso_total?.toLocaleString('es-ES')} kg</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <Link 
                          href={`/packing-lists/${list.id}/pdf`} 
                          className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150 p-1"
                          title="Ver PDF"
                        >
                          <FiEye className="h-4 w-4" />
                        </Link>
                        <Link 
                          href={`/packing-lists/edit/${list.id}`} 
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1"
                          title="Editar lista"
                        >
                          <FiEdit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(list.id)}
                          disabled={deleteLoading === list.id}
                          className="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 disabled:opacity-50"
                          title="Eliminar lista"
                        >
                          {deleteLoading === list.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-r-transparent border-red-600"></div>
                          ) : (
                            <FiTrash2 className="h-4 w-4" />
                          )}
                        </button>
                        <Link
                          href={`/packing-lists/${list.id}/pdf`}
                          className="text-green-600 hover:text-green-900 transition-colors duration-150 p-1"
                          title="Descargar PDF"
                        >
                          <FiDownload className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay listas de empaque</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comience por crear una nueva lista de empaque.
            </p>
            <div className="mt-6">
              <Link
                href="/packing-lists/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                Nueva Lista de Empaque
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
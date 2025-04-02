'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiArrowLeft, 
  FiEdit, 
  FiDownload, 
  FiX,
  FiUser,
  FiFileText,
  FiCalendar,
  FiTag,
  FiAlignLeft,
  FiPackage,
  FiTruck,
  FiList
} from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';

interface AlbaranItem {
  id: number;
  id_albaran: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
}

interface Albaran {
  id: number;
  numero_albaran: string;
  fecha: string;
  estado: string;
  notas: string | null;
  id_cliente: number | null;
  id_proveedor: number | null;
  total: number | null;
  cliente: {
    id: number;
    nombre: string;
    id_fiscal: string | null;
    direccion: string | null;
    ciudad: string | null;
    codigo_postal: string | null;
    pais: string | null;
  } | null;
  proveedor: {
    id: number;
    nombre: string;
    id_fiscal: string | null;
    direccion: string | null;
    ciudad: string | null;
    codigo_postal: string | null;
    pais: string | null;
  } | null;
  items: AlbaranItem[];
}

export default function AlbaranDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [albaran, setAlbaran] = useState<Albaran | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const albaranId = parseInt(params.id);

  // Cargar datos del albarán
  useEffect(() => {
    const fetchAlbaran = async () => {
      if (isNaN(albaranId)) {
        setError('ID de albarán inválido');
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseClient();
        
        // Consultar albarán por ID con sus relaciones
        const { data: albaranData, error: albaranError } = await supabase
          .from('albaranes')
          .select(`
            *,
            cliente:id_cliente (*),
            proveedor:id_proveedor (*)
          `)
          .eq('id', albaranId)
          .single();
        
        if (albaranError) {
          throw new Error(`Error al cargar el albarán: ${albaranError.message}`);
        }
        
        if (!albaranData) {
          throw new Error('Albarán no encontrado');
        }
        
        // Consultar items del albarán
        const { data: itemsData, error: itemsError } = await supabase
          .from('albaran_items')
          .select('*')
          .eq('id_albaran', albaranId)
          .order('id');
        
        if (itemsError) {
          throw new Error(`Error al cargar los items: ${itemsError.message}`);
        }
        
        setAlbaran({
          ...albaranData,
          items: itemsData || []
        });
        
      } catch (err) {
        console.error('Error al cargar albarán:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlbaran();
  }, [albaranId]);

  // Formatea fecha de YYYY-MM-DD a DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES');
  };

  // Función para obtener el color de estado
  const getEstadoBadgeClass = (estado: string) => {
    switch(estado) {
      case 'completado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default: // pendiente
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="ml-3 text-lg text-gray-500">Cargando albarán...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar mensaje de error
  if (error || !albaran) {
    return (
      <div className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg px-6 py-5 mb-8">
            <div className="flex items-center">
              <Link href="/albaranes" className="mr-4 text-gray-500 hover:text-indigo-600 transition-colors duration-200">
                <FiArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Error</h1>
            </div>
          </div>
          
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0 text-red-500">
                <FiX className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error || 'No se pudo cargar el albarán'}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link 
              href="/albaranes"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Volver a Albaranes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Si hay datos, mostrar el detalle del albarán
  const tipoAlbaran = albaran.id_cliente ? 'Cliente' : 'Proveedor';
  const entidad = albaran.id_cliente ? albaran.cliente : albaran.proveedor;

  return (
    <div className="py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="bg-white shadow-md rounded-lg px-6 py-5 mb-8 flex items-center justify-between transition-all duration-300 ease-in-out transform hover:shadow-lg border-l-4 border-indigo-500">
          <div className="flex items-center">
            <Link href="/albaranes" className="mr-4 text-gray-500 hover:text-indigo-600 transition-colors duration-200">
              <FiArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Albarán: {albaran.numero_albaran}
            </h1>
          </div>
          <div className="flex space-x-3">
            <Link 
              href={`/albaranes/edit/${albaran.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
            >
              <FiEdit className="mr-2 -ml-1 h-4 w-4" />
              Editar
            </Link>
            <button 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
            >
              <FiDownload className="mr-2 -ml-1 h-4 w-4" />
              Descargar PDF
            </button>
          </div>
        </div>
        
        {/* Información del Albarán */}
        <div className="space-y-8">
          {/* Información General */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <FiFileText className="mr-2 text-indigo-500" />
                Información General
              </h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <div className="text-sm font-medium text-gray-500">Tipo de Albarán</div>
                      <div className="mt-1 flex items-center text-sm text-gray-900">
                        {tipoAlbaran === 'Cliente' ? (
                          <FiUser className="mr-1.5 h-4 w-4 text-indigo-500" />
                        ) : (
                          <FiTruck className="mr-1.5 h-4 w-4 text-indigo-500" />
                        )}
                        {tipoAlbaran}
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <div className="text-sm font-medium text-gray-500">Número</div>
                      <div className="mt-1 flex items-center text-sm text-gray-900">
                        <FiFileText className="mr-1.5 h-4 w-4 text-indigo-500" />
                        {albaran.numero_albaran}
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <div className="text-sm font-medium text-gray-500">Fecha</div>
                      <div className="mt-1 flex items-center text-sm text-gray-900">
                        <FiCalendar className="mr-1.5 h-4 w-4 text-indigo-500" />
                        {formatDate(albaran.fecha)}
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <div className="text-sm font-medium text-gray-500">Estado</div>
                      <div className="mt-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoBadgeClass(albaran.estado)}`}>
                          {albaran.estado.charAt(0).toUpperCase() + albaran.estado.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="sm:border-l sm:border-gray-200 sm:pl-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    {tipoAlbaran === 'Cliente' ? 'Información del Cliente' : 'Información del Proveedor'}
                  </h4>
                  
                  <div className="text-sm text-gray-900 font-medium">{entidad?.nombre}</div>
                  
                  {entidad?.id_fiscal && (
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="font-medium">CIF/NIF:</span> {entidad.id_fiscal}
                    </div>
                  )}
                  
                  {entidad?.direccion && (
                    <div className="text-sm text-gray-500 mt-1">
                      {entidad.direccion}
                      {entidad.codigo_postal && entidad.ciudad && (
                        <>, {entidad.codigo_postal} {entidad.ciudad}</>
                      )}
                      {entidad.pais && (
                        <>, {entidad.pais}</>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {albaran.notas && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="text-sm font-medium text-gray-500 mb-2">Notas</div>
                  <div className="text-sm text-gray-900 whitespace-pre-line">
                    {albaran.notas}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Items del Albarán */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <FiList className="mr-2 text-indigo-500" />
                Items del Albarán
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Unitario
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {albaran.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                        {item.descripcion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.cantidad.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.precio_unitario.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {item.total.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      Total Albarán:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900 text-right">
                      {albaran.total?.toFixed(2) || '0.00'} €
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
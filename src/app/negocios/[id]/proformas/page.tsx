'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  FiArrowLeft, 
  FiSearch, 
  FiEdit, 
  FiTrash2, 
  FiPlus, 
  FiRefreshCw,
  FiFileText,
  FiAlertCircle
} from 'react-icons/fi';

// Tipos
interface Proforma {
  id: number;
  id_externo: string;
  numero?: string;
  fecha: string;
  monto: number;
  cliente_id: number | null;
  negocio_id: number | null;
  origen: string | null;
  puerto: string | null;
  id_fiscal: string | null;
  cuenta_bancaria: string | null;
  terminos_pago: string | null;
  terminos_entrega: string | null;
  notas: string | null;
  cantidad_contenedores: number | null;
  peso_total: number | null;
  monto_total?: number;
}

interface ProformaProducto {
  id: number;
  proforma_id: number | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  peso: number | null;
  tipo_empaque: string | null;
  valor_total: number | null;
}

export default function ProformasPage({ params }: { params: { id: string } }) {
  // Estado para almacenar datos
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Cliente Supabase
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  // Efecto para cargar las proformas
  useEffect(() => {
    loadProformas();
  }, [params.id, currentPage, searchQuery]);
  
  // Función para cargar proformas desde Supabase
  const loadProformas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Cargando proformas para negocio ID: ${params.id}`);
      
      // Conversión segura del ID
      const negocioId = parseInt(params.id);
      
      if (isNaN(negocioId)) {
        throw new Error(`ID de negocio inválido: ${params.id}`);
      }
      
      // Consulta principal de proformas
      let query = supabase
        .from('proformas')
        .select('*', { count: 'exact' });
        
      // Filtrar por negocio_id
      query = query.eq('negocio_id', negocioId);
      
      console.log(`Aplicando filtro: negocio_id = ${negocioId}`);
      
      // Aplicar búsqueda si existe
      if (searchQuery) {
        // Búsqueda ampliada para incluir más campos y manejar distintos formatos
        const searchPattern = `%${searchQuery}%`;
        query = query.or(
          `id_externo.ilike.${searchPattern},` +
          `numero.ilike.${searchPattern},` +
          `puerto.ilike.${searchPattern},` +
          `origen.ilike.${searchPattern},` +
          `terminos_pago.ilike.${searchPattern},` +
          `notas.ilike.${searchPattern}`
        );
        console.log(`Aplicando búsqueda: "${searchQuery}"`);
      }
      
      // Paginación
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      console.log(`Aplicando paginación: ${from} a ${to}`);
      
      query = query
        .order('fecha', { ascending: false })
        .range(from, to);
      
      const { data, error: proformasError, count } = await query;
      
      if (proformasError) {
        console.error('Error de Supabase:', proformasError);
        throw proformasError;
      }
      
      console.log(`Proformas recuperadas: ${data?.length || 0}`);
      
      if (data && data.length > 0) {
        // Log de datos para depuración
        console.log('Muestra de datos:', data[0]);
      }
      
      // Calcular total de páginas
      if (count !== null) {
        const totalPags = Math.ceil(count / itemsPerPage);
        setTotalPages(totalPags);
        console.log(`Total páginas: ${totalPags} (${count} registros)`);
      }
      
      setProformas(data || []);
    } catch (err) {
      console.error('Error cargando proformas:', err);
      setError(`Error al cargar las proformas: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Manejar eliminación de proforma
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    
    if (!confirm('¿Está seguro que desea eliminar esta proforma? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      // Eliminar primero los productos relacionados a la proforma
      const { error: productosError } = await supabase
        .from('proformas_productos')
        .delete()
        .eq('proforma_id', id);
      
      if (productosError) throw productosError;
      
      // Eliminar la proforma
      const { error: proformaError } = await supabase
        .from('proformas')
        .delete()
        .eq('id', id);
      
      if (proformaError) throw proformaError;
      
      // Recargar la lista
      loadProformas();
    } catch (err) {
      console.error('Error eliminando proforma:', err);
      alert('Error al eliminar la proforma. Por favor, intente nuevamente.');
    }
  };
  
  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('es-ES', options);
  };
  
  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };
  
  // Renderizado para estado de carga
  if (loading && proformas.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mb-6">
          <Link 
            href={`/negocios/${params.id}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-800"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            <span>Volver a detalles del negocio</span>
          </Link>
        </div>
        
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-500">Cargando proformas...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Cabecera con botón de volver */}
      <div className="mb-6">
        <Link 
          href={`/negocios/${params.id}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-800"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          <span>Volver a detalles del negocio</span>
        </Link>
      </div>
      
      {/* Título y controles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-medium text-gray-800 mb-4 md:mb-0">Proformas</h1>
        
        <div className="w-full md:w-auto flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <input
              type="search"
              className="w-full p-2 pl-10 pr-4 rounded-lg border bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Buscar por ID, puerto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <button
            onClick={loadProformas}
            className="p-2 text-gray-500 hover:text-gray-700 bg-white rounded-lg border hover:bg-gray-50"
            title="Recargar"
          >
            <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          
          <Link
            href={`/negocios/${params.id}/proformas/new`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center whitespace-nowrap"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            <span>Nueva Proforma</span>
          </Link>
        </div>
      </div>
      
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center text-red-600 mb-2">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            <h2 className="font-medium">Error al cargar proformas</h2>
          </div>
          <p className="text-red-700">{error}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button 
              onClick={loadProformas}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 inline-flex items-center text-sm"
            >
              <FiRefreshCw className="w-4 h-4 mr-1.5" /> Reintentar
            </button>
            <Link
              href={`/negocios/${params.id}`}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 inline-flex items-center text-sm"
            >
              <FiArrowLeft className="w-4 h-4 mr-1.5" /> Volver al negocio
            </Link>
            <button
              onClick={() => {
                // Limpiar filtros y reintentar
                setSearchQuery('');
                setCurrentPage(1);
                setTimeout(loadProformas, 100);
              }}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 inline-flex items-center text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar filtros
            </button>
          </div>
        </div>
      )}
      
      {/* Sin resultados */}
      {proformas.length === 0 && !loading ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <FiFileText className="mx-auto w-12 h-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-medium text-gray-700 mb-2">No hay proformas disponibles</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchQuery 
              ? `No se encontraron resultados para "${searchQuery}". Intente con otra búsqueda.`
              : 'No hay proformas registradas para este negocio.'}
          </p>
          <Link
            href={`/negocios/${params.id}/proformas/new`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            <span>Crear nueva proforma</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Tabla de proformas */}
          <div className="bg-white rounded-lg border overflow-hidden mb-6">
            <div className="grid grid-cols-5 gap-4 border-b bg-gray-50 text-xs font-medium text-gray-500 uppercase py-3 px-4">
              <div>ID</div>
              <div>Fecha</div>
              <div>Monto</div>
              <div>Destino</div>
              <div className="text-right">Acciones</div>
            </div>
            
            {proformas.map((proforma) => (
              <div key={proforma.id} className="grid grid-cols-5 gap-4 px-4 py-4 border-b last:border-b-0 hover:bg-gray-50">
                <div className="text-gray-800 font-medium">
                  {proforma.id_externo || proforma.numero || `PRO-${proforma.id}`}
                </div>
                <div className="text-gray-600">
                  {proforma.fecha ? formatDate(proforma.fecha) : 'Fecha no disponible'}
                </div>
                <div className="text-gray-800 font-medium">
                  {formatCurrency(
                    // Usar el campo correcto según esté disponible
                    typeof proforma.monto_total === 'number' 
                      ? proforma.monto_total 
                      : (typeof proforma.monto === 'number' ? proforma.monto : 0)
                  )}
                </div>
                <div className="text-gray-600">
                  {proforma.puerto || proforma.origen || 'No especificado'}
                </div>
                <div className="flex justify-end space-x-2">
                  <Link
                    href={`/negocios/${params.id}/proformas/edit/${proforma.id}`}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md"
                    title="Editar"
                  >
                    <FiEdit className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={(e) => handleDelete(e, proforma.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                    title="Eliminar"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Paginación */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Mostrando {proformas.length} de {totalPages * itemsPerPage} proformas
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1 border rounded-md bg-white text-gray-600 disabled:opacity-50 disabled:bg-gray-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
                className="px-3 py-1 border rounded-md bg-white text-gray-600 disabled:opacity-50 disabled:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 
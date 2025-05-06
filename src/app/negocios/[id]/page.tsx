'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  FiClock, FiUser, FiTruck, FiPackage, FiCalendar, FiFileText, 
  FiEdit, FiTrash2, FiArrowLeft, FiPlus, FiChevronDown, 
  FiX, FiAlertCircle, FiRefreshCw, FiDollarSign, FiCheckCircle,
  FiCreditCard, FiTrendingUp, FiShoppingBag, FiBarChart2, FiDownload,
  FiInfo, FiMessageSquare
} from 'react-icons/fi';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Tipos
interface Negocio {
  id: number;
  id_externo: string;
  nombre: string;
  cliente_id: number | null;
  cliente_nombre: string;
  fecha_creacion: string;
  fecha_inicio: string | null;
  fecha_entrega: string | null;
  fecha_envio: string | null;
  fecha_estimada_finalizacion: string | null;
  fecha_estimada_llegada: string | null;
  estado: string | null;
  descripcion: string | null;
  notas: string | null;
  progreso: number | null;
  valor_total: number | null;
  total_ingresos: number | null;
  total_gastos: number | null;
}

interface Proveedor {
  proveedor_nombre: string;
}

interface Material {
  material_nombre: string;
}

// Función auxiliar para determinar el color del estado
const getStatusColor = (estado: string | null | undefined) => {
  if (!estado) return 'gray';
  
  switch (estado.toLowerCase()) {
    case 'pendiente':
      return 'yellow';
    case 'en proceso':
      return 'blue';
    case 'completado':
      return 'green';
    case 'cancelado':
      return 'red';
    default:
      return 'gray';
  }
};

// Página de detalles de un negocio específico
export default function DetalleNegocio({ params }: { params: { id: string } }) {
  // Router para navegación programática
  const router = useRouter();
  
  // Obtenemos el parámetro tab de la URL
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  // Si hay un tabParam válido, lo usamos; si no, mostramos 'overview'
  const [activeTab, setActiveTab] = useState(
    tabParam && ['overview', 'bills', 'proformas', 'invoices', 'documents'].includes(tabParam) 
      ? tabParam 
      : 'overview'
  );
  
  // Estados para los datos
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cliente de Supabase
  const supabase = createClientComponentClient();
  
  // Función para cargar datos del negocio
  const loadNegocioData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar el negocio
      const { data: negociosData, error: negociosError } = await supabase
        .from('negocios')
        .select('*, clientes:cliente_id(nombre)')
        .eq('id', params.id);
      
      if (negociosError) throw negociosError;
      
      // Verificamos si obtuvimos algún resultado
      if (!negociosData || negociosData.length === 0) {
        throw new Error('Negocio no encontrado');
      }
      
      // Tomamos el primer resultado (debería ser el único)
      const negocioData = negociosData[0];
      
      // Formatear los datos del negocio
      const negocioFormateado = {
        ...negocioData,
        cliente_nombre: negocioData.clientes?.nombre || 'Cliente sin asignar'
      };
      
      setNegocio(negocioFormateado);
      
      // Cargar proveedores relacionados
      const { data: proveedoresData, error: proveedoresError } = await supabase
        .from('negocios_proveedores')
        .select('*, proveedores:proveedor_id(id, nombre)')
        .eq('negocio_id', params.id);
      
      if (proveedoresError) throw proveedoresError;
      
      // Extraer y formatear información de proveedores
      const proveedoresFormateados = proveedoresData?.map(item => ({
        id: item.proveedores?.id,
        proveedor_nombre: item.proveedores?.nombre || 'Proveedor desconocido'
      })) || [];
      
      setProveedores(proveedoresFormateados);
      
      // Cargar materiales relacionados
      const { data: materialesData, error: materialesError } = await supabase
        .from('negocios_materiales')
        .select('*, materiales:material_id(id, nombre)')
        .eq('negocio_id', params.id);
      
      if (materialesError) throw materialesError;
      
      // Extraer y formatear información de materiales
      const materialesFormateados = materialesData?.map(item => ({
        id: item.materiales?.id,
        material_nombre: item.materiales?.nombre || 'Material desconocido'
      })) || [];
      
      setMateriales(materialesFormateados);
      
    } catch (err: any) {
      console.error('Error cargando datos del negocio:', err);
      setError('Error al cargar los datos del negocio: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };
  
  // Actualizar la pestaña activa cuando cambie el parámetro de búsqueda
  useEffect(() => {
    if (tabParam && ['overview', 'bills', 'proformas', 'invoices', 'documents'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  
  // Cargar datos cuando se monte el componente
  useEffect(() => {
    loadNegocioData();
  }, [params.id]);

  // Función para formatear fechas
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No establecido';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };
  
  // Función para formatear moneda
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'No disponible';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };
  
  // Renderizado de estado de carga
  if (loading && !negocio) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando datos del contrato...</p>
        </div>
      </div>
    );
  }
  
  // Renderizado de estado de error
  if (error && !loading) {
    return (
      <div className="h-full bg-gray-50 p-8">
        <div className="bg-white border border-red-100 rounded-xl p-8 max-w-4xl mx-auto shadow-sm">
          <div className="flex items-center text-red-600 mb-4">
            <FiAlertCircle className="text-3xl mr-3" />
            <h2 className="text-xl font-semibold">Error</h2>
          </div>
          <p className="text-gray-700 mb-6">{error}</p>
          <button 
            onClick={loadNegocioData}
            className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center font-medium"
          >
            <FiRefreshCw className="mr-2" /> Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  // Si el negocio no existe y no estamos cargando, mostramos un mensaje
  if (!negocio && !loading) {
    return (
      <div className="h-full bg-gray-50 p-8">
        <div className="bg-white border border-yellow-100 rounded-xl p-8 max-w-4xl mx-auto shadow-sm">
          <div className="flex items-center text-yellow-600 mb-4">
            <FiAlertCircle className="text-3xl mr-3" />
            <h2 className="text-xl font-semibold">Contrato no encontrado</h2>
          </div>
          <p className="text-gray-700 mb-6">El contrato que está buscando no existe o ha sido eliminado.</p>
          <Link 
            href="/negocios"
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center font-medium"
          >
            <FiArrowLeft className="mr-2" /> Volver a la lista de contratos
          </Link>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(negocio?.estado);
  
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Cabecera */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <Link
                href="/negocios"
                className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FiArrowLeft className="h-5 w-5 text-gray-500" />
              </Link>
              <div>
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">{negocio?.nombre}</h1>
                  <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                    {negocio?.estado || 'Pendiente'}
                  </span>
                </div>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <span className="flex items-center">
                    <FiShoppingBag className="h-4 w-4 mr-1" /> {negocio?.id_externo}
                  </span>
                  <span className="mx-2">•</span>
                  <span className="flex items-center">
                    <FiUser className="h-4 w-4 mr-1" /> {negocio?.cliente_nombre}
                  </span>
                  <span className="mx-2">•</span>
                  <span className="flex items-center">
                    <FiCalendar className="h-4 w-4 mr-1" /> {formatDate(negocio?.fecha_inicio)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => {
                  window.print();
                }}
              >
                <FiDownload className="mr-2 -ml-1 h-4 w-4" />
                Exportar
              </button>
              <Link
                href={`/negocios/edit/${params.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiEdit className="mr-2 -ml-1 h-4 w-4" />
                Editar
              </Link>
            </div>
          </div>
          
          {/* Pestañas */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => { router.push(`/negocios/${params.id}?tab=overview`); }}
                className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <FiInfo className="mr-2 h-4 w-4" />
                  Resumen
                </div>
              </button>
              
              <button
                onClick={() => { router.push(`/negocios/${params.id}?tab=proformas`); }}
                className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'proformas'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <FiFileText className="mr-2 h-4 w-4" />
                  Proformas
                </div>
              </button>
              
              <button
                onClick={() => { router.push(`/negocios/${params.id}?tab=invoices`); }}
                className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'invoices'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <FiCreditCard className="mr-2 h-4 w-4" />
                  Facturas
                </div>
              </button>
              
              <button
                onClick={() => { router.push(`/negocios/${params.id}?tab=documents`); }}
                className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'documents'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <FiFileText className="mr-2 h-4 w-4" />
                  Documentos
                </div>
              </button>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna Izquierda - Información Principal */}
            <div className="lg:col-span-2 space-y-8">
              {/* Tarjeta de Progreso */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Progreso del Contrato</h2>
                  <span className="text-2xl font-bold text-indigo-600">{negocio?.progreso || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${negocio?.progreso || 0}%` }}
                  ></div>
                </div>
                
                <div className="flex flex-wrap mt-6 -mx-3">
                  <div className="px-3 w-1/2 md:w-1/4 mb-4">
                    <div className="bg-gray-50 p-4 rounded-lg h-full">
                      <p className="text-xs font-medium text-gray-500 mb-1">FECHA CREACIÓN</p>
                      <p className="font-semibold">{formatDate(negocio?.fecha_creacion)}</p>
                    </div>
                  </div>
                  <div className="px-3 w-1/2 md:w-1/4 mb-4">
                    <div className="bg-gray-50 p-4 rounded-lg h-full">
                      <p className="text-xs font-medium text-gray-500 mb-1">FECHA INICIO</p>
                      <p className="font-semibold">{formatDate(negocio?.fecha_inicio)}</p>
                    </div>
                  </div>
                  <div className="px-3 w-1/2 md:w-1/4 mb-4">
                    <div className="bg-gray-50 p-4 rounded-lg h-full">
                      <p className="text-xs font-medium text-gray-500 mb-1">FECHA ENTREGA</p>
                      <p className="font-semibold">{formatDate(negocio?.fecha_entrega)}</p>
                    </div>
                  </div>
                  <div className="px-3 w-1/2 md:w-1/4 mb-4">
                    <div className="bg-gray-50 p-4 rounded-lg h-full">
                      <p className="text-xs font-medium text-gray-500 mb-1">FIN ESTIMADO</p>
                      <p className="font-semibold">{formatDate(negocio?.fecha_estimada_finalizacion)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Descripción */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <FiMessageSquare className="text-indigo-600 h-5 w-5 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-800">Descripción</h2>
                </div>
                <div className="prose prose-indigo max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {negocio?.descripcion || 'No hay descripción disponible para este contrato.'}
                  </p>
                </div>
              </div>
              
              {/* Materiales */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FiPackage className="text-indigo-600 h-5 w-5 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-800">Materiales</h2>
                  </div>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {materiales.length} materiales
                  </span>
                </div>
                
                {materiales.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {materiales.map((material, index) => (
                      <li key={index} className="py-3 flex items-center">
                        <FiPackage className="text-gray-400 h-4 w-4 mr-3" />
                        <span className="font-medium text-gray-800">{material.material_nombre}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-gray-500">No hay materiales asignados a este contrato</p>
                  </div>
                )}
              </div>
              
              {/* Notas */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <FiFileText className="text-indigo-600 h-5 w-5 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-800">Notas</h2>
                </div>
                <div className="prose prose-indigo max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {negocio?.notas || 'No hay notas adicionales para este contrato.'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Columna Derecha - Información Secundaria */}
            <div className="space-y-8">
              {/* Información Financiera */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center mb-6">
                  <FiDollarSign className="text-indigo-600 h-5 w-5 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-800">Información Financiera</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-indigo-700 mb-1">VALOR TOTAL</p>
                    <p className="text-2xl font-bold text-indigo-800">{formatCurrency(negocio?.valor_total)}</p>
                  </div>
                  
                  <div className="flex flex-wrap -mx-2">
                    <div className="w-1/2 px-2">
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-green-700 mb-1">INGRESOS</p>
                        <p className="font-bold text-green-800">{formatCurrency(negocio?.total_ingresos)}</p>
                      </div>
                    </div>
                    <div className="w-1/2 px-2">
                      <div className="bg-red-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-red-700 mb-1">GASTOS</p>
                        <p className="font-bold text-red-800">{formatCurrency(negocio?.total_gastos)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-gray-700">Beneficio Estimado</p>
                      <p className="font-bold text-green-600">
                        {negocio?.total_ingresos !== undefined && negocio?.total_gastos !== undefined && 
                         negocio?.total_ingresos !== null && negocio?.total_gastos !== null
                          ? formatCurrency(negocio.total_ingresos - negocio.total_gastos)
                          : 'No disponible'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cliente */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <FiUser className="text-indigo-600 h-5 w-5 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-800">Cliente</h2>
                </div>
                
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                    <FiUser className="text-indigo-600 h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{negocio?.cliente_nombre}</h3>
                    <Link 
                      href={`/clientes/${negocio?.cliente_id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-800 mt-1 inline-block"
                    >
                      Ver detalles del cliente
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Proveedores */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FiTruck className="text-indigo-600 h-5 w-5 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-800">Proveedores</h2>
                  </div>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {proveedores.length} proveedores
                  </span>
                </div>
                
                {proveedores.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {proveedores.map((proveedor, index) => (
                      <li key={index} className="py-3 flex items-center">
                        <FiTruck className="text-gray-400 h-4 w-4 mr-3" />
                        <span className="font-medium text-gray-800">{proveedor.proveedor_nombre}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-gray-500">No hay proveedores asignados a este contrato</p>
                  </div>
                )}
              </div>
              
              {/* Acciones */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>
                <div className="space-y-2">
                  <Link 
                    href={`/negocios/${params.id}/proformas/new`}
                    className="flex items-center text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-md transition-colors"
                  >
                    <FiFileText className="h-4 w-4 mr-2" />
                    <span>Crear nueva proforma</span>
                  </Link>
                  <Link 
                    href={`/negocios/${params.id}/facturas/new`}
                    className="flex items-center text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-md transition-colors"
                  >
                    <FiCreditCard className="h-4 w-4 mr-2" />
                    <span>Crear nueva factura</span>
                  </Link>
                  <Link 
                    href={`/negocios/${params.id}/documentos/new`}
                    className="flex items-center text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-md transition-colors"
                  >
                    <FiFileText className="h-4 w-4 mr-2" />
                    <span>Subir documento</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'proformas' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Proformas</h2>
                <Link 
                  href={`/negocios/${params.id}/proformas/new`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiPlus className="mr-2 -ml-1 h-4 w-4" />
                  Nueva Proforma
                </Link>
              </div>
            </div>
            
            <div className="px-6 py-8 text-center">
              <div className="bg-indigo-50 rounded-full h-16 w-16 mx-auto flex items-center justify-center mb-4">
                <FiFileText className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proformas</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                No se han encontrado proformas asociadas a este contrato. Puedes crear una nueva proforma usando el botón superior.
              </p>
              <Link 
                href={`/negocios/${params.id}/proformas/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiPlus className="mr-2 -ml-1 h-4 w-4" />
                Crear primera proforma
              </Link>
            </div>
          </div>
        )}
        
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Facturas</h2>
                <Link 
                  href={`/negocios/${params.id}/facturas/new`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiPlus className="mr-2 -ml-1 h-4 w-4" />
                  Nueva Factura
                </Link>
              </div>
            </div>
            
            <div className="px-6 py-8 text-center">
              <div className="bg-indigo-50 rounded-full h-16 w-16 mx-auto flex items-center justify-center mb-4">
                <FiCreditCard className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay facturas</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                No se han encontrado facturas asociadas a este contrato. Puedes crear una nueva factura usando el botón superior.
              </p>
              <Link 
                href={`/negocios/${params.id}/facturas/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiPlus className="mr-2 -ml-1 h-4 w-4" />
                Crear primera factura
              </Link>
            </div>
          </div>
        )}
        
        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Documentos</h2>
                <Link 
                  href={`/negocios/${params.id}/documentos/new`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiPlus className="mr-2 -ml-1 h-4 w-4" />
                  Subir Documento
                </Link>
              </div>
            </div>
            
            <div className="px-6 py-8 text-center">
              <div className="bg-indigo-50 rounded-full h-16 w-16 mx-auto flex items-center justify-center mb-4">
                <FiFileText className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay documentos</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                No se han encontrado documentos asociados a este contrato. Puedes subir un nuevo documento usando el botón superior.
              </p>
              <Link 
                href={`/negocios/${params.id}/documentos/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiPlus className="mr-2 -ml-1 h-4 w-4" />
                Subir primer documento
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
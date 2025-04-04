'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  FiClock, 
  FiUser, 
  FiTruck, 
  FiPackage, 
  FiCalendar,
  FiFileText,
  FiEdit,
  FiTrash2,
  FiArrowLeft,
  FiPlus,
  FiChevronDown,
  FiX,
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

// Tipos
interface Negocio {
  id: number;
  id_externo: string;
  cliente_id: number | null;
  cliente_nombre: string;
  fecha_creacion: string;
  fecha_entrega: string | null;
  fecha_envio: string | null;
  fecha_estimada_finalizacion: string | null;
  fecha_estimada_llegada: string | null;
  estado: string | null;
  notas: string | null;
  progreso: number | null;
  total_ingresos: number | null;
  total_gastos: number | null;
}

interface Proveedor {
  proveedor_nombre: string;
}

interface Material {
  material_nombre: string;
}

// Página de detalles de un negocio específico
export default function DetalleNegocio({ params }: { params: { id: string } }) {
  // Router para navegación programática
  const router = useRouter();
  
  // Obtenemos el parámetro tab de la URL
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  // Si hay un tabParam válido, lo usamos; si no, mostramos 'overview'
  const [activeTab, setActiveTab] = useState(
    tabParam && ['overview', 'bills', 'proformas', 'invoices', 'shipping'].includes(tabParam) 
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
      const { data: negocioData, error: negocioError } = await supabase
        .from('negocios')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (negocioError) throw negocioError;
      if (!negocioData) throw new Error('Negocio no encontrado');
      
      setNegocio(negocioData);
      
      // Cargar proveedores relacionados
      const { data: proveedoresData, error: proveedoresError } = await supabase
        .from('negocios_proveedores')
        .select('proveedor_nombre')
        .eq('negocio_id', params.id);
      
      if (proveedoresError) throw proveedoresError;
      setProveedores(proveedoresData || []);
      
      // Cargar materiales relacionados
      const { data: materialesData, error: materialesError } = await supabase
        .from('negocios_materiales')
        .select('material_nombre')
        .eq('negocio_id', params.id);
      
      if (materialesError) throw materialesError;
      setMateriales(materialesData || []);
      
    } catch (err) {
      console.error('Error cargando datos del negocio:', err);
      setError('Error al cargar los datos del negocio. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Actualizar la pestaña activa cuando cambie el parámetro de búsqueda
  useEffect(() => {
    if (tabParam && ['overview', 'bills', 'proformas', 'invoices', 'shipping'].includes(tabParam)) {
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
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">Cargando datos del negocio...</p>
        </div>
      </div>
    );
  }
  
  // Renderizado de estado de error
  if (error && !loading) {
    return (
      <div className="h-full bg-white p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-4xl mx-auto">
          <div className="flex items-center text-red-600 mb-4">
            <FiAlertCircle className="text-2xl mr-2" />
            <h2 className="text-lg font-semibold">Error</h2>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={loadNegocioData}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors inline-flex items-center"
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
      <div className="h-full bg-white p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-4xl mx-auto">
          <div className="flex items-center text-yellow-600 mb-4">
            <FiAlertCircle className="text-2xl mr-2" />
            <h2 className="text-lg font-semibold">Negocio no encontrado</h2>
          </div>
          <p className="text-yellow-700 mb-4">El negocio que está buscando no existe o ha sido eliminado.</p>
          <Link 
            href="/negocios"
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Volver a la lista de negocios
          </Link>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            {/* Tarjetas de métricas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Total Revenue */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <div className="mr-3">
                    <span className="text-green-600 text-2xl">$</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-0.5">Ingresos Totales</p>
                    <p className="text-xl font-medium">{formatCurrency(negocio?.total_ingresos)}</p>
                  </div>
                </div>
              </div>
              
              {/* Total Expense */}
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <div className="mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                      <polyline points="16 7 22 7 22 13"></polyline>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-0.5">Gastos Totales</p>
                    <p className="text-xl font-medium">{formatCurrency(negocio?.total_gastos)}</p>
                  </div>
                </div>
              </div>
              
              {/* Net Profit */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <div className="mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
                      <polyline points="16 17 22 17 22 11"></polyline>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-0.5">Beneficio Neto</p>
                    <p className="text-xl font-medium">
                      {negocio?.total_ingresos !== undefined && negocio?.total_gastos !== undefined && negocio?.total_ingresos !== null && negocio?.total_gastos !== null
                        ? formatCurrency(negocio.total_ingresos - negocio.total_gastos)
                        : 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* ID del negocio */}
            <div className="border-t border-b py-6 mb-6 text-center">
              <h2 className="text-xl font-medium text-gray-800">{negocio?.id_externo}</h2>
            </div>
            
            {/* Barra de progreso */}
            <div className="mb-8">
              <div className="text-sm text-gray-400 mb-2">progreso: {negocio?.progreso}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full"
                  style={{ width: `${negocio?.progreso}%` }}
                ></div>
              </div>
            </div>
            
            {/* Información detallada del negocio - Estimated Completion */}
            <div className="mb-8">
              <div className="flex items-center mb-1.5">
                <div className="text-gray-400 mr-2">
                  <FiClock className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-400">Fecha Estimada de Finalización</span>
              </div>
              <p className="text-gray-700 ml-6">{formatDate(negocio?.fecha_estimada_finalizacion)}</p>
            </div>
            
            {/* Información detallada - Segunda fila */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              {/* Customer */}
              <div>
                <div className="flex items-center mb-1.5">
                  <div className="text-gray-400 mr-2">
                    <FiUser className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-400">Cliente</span>
                </div>
                <p className="text-gray-700 ml-6 font-medium leading-relaxed">{negocio?.cliente_nombre}</p>
              </div>
              
              {/* Suppliers */}
              <div>
                <div className="flex items-center mb-1.5">
                  <div className="text-gray-400 mr-2">
                    <FiTruck className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-400">Proveedores</span>
                </div>
                <p className="text-gray-700 ml-6 leading-relaxed">{proveedores.map(p => p.proveedor_nombre).join(', ')}</p>
              </div>
              
              {/* Materials */}
              <div>
                <div className="flex items-center mb-1.5">
                  <div className="text-gray-400 mr-2">
                    <FiPackage className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-400">Materiales</span>
                </div>
                <p className="text-gray-700 ml-6 leading-relaxed">{materiales.map(m => m.material_nombre).join(', ')}</p>
              </div>
            </div>
            
            {/* Status y Creation Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Status */}
              <div>
                <div className="flex items-center mb-1.5">
                  <div className="mr-2">
                    <div className="bg-yellow-400 w-4 h-4 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-400">Estado</span>
                </div>
                <p className="text-yellow-500 ml-6 font-medium">{negocio?.estado}</p>
              </div>
              
              {/* Creation Date */}
              <div>
                <div className="flex items-center mb-1.5">
                  <div className="text-gray-400 mr-2">
                    <FiCalendar className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-400">Fecha de Creación</span>
                </div>
                <p className="text-gray-700 ml-6 font-medium">{formatDate(negocio?.fecha_creacion)}</p>
              </div>
              
              {/* Columna vacía para mantener alineación */}
              <div></div>
            </div>
            
            {/* Notes */}
            <div className="mb-10">
              <div className="flex items-center mb-2">
                <div className="text-gray-400 mr-2">
                  <FiFileText className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-400">Notas sobre el Negocio</span>
              </div>
              <div className="border rounded-lg p-4 text-gray-600 ml-6">
                {negocio?.notas}
              </div>
            </div>
            
            {/* Fechas de envío */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 pt-6 border-t">
              {/* Shipping Date */}
              <div>
                <p className="mb-2 text-gray-600 font-medium">Fecha de Envío</p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ej. dd/mm/aaaa"
                    className="w-full p-2 border rounded pl-3 pr-10 text-gray-600"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FiCalendar className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
              
              {/* ETA */}
              <div>
                <p className="mb-2 text-gray-600 font-medium">Fecha Estimada de Llegada</p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ej. dd/mm/aaaa"
                    className="w-full p-2 border rounded pl-3 pr-10 text-gray-600"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FiCalendar className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
              
              {/* Delivery Date */}
              <div>
                <p className="mb-2 text-gray-600 font-medium">Fecha de Entrega</p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ej. dd/mm/aaaa"
                    className="w-full p-2 border rounded pl-3 pr-10 text-gray-600"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FiCalendar className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 mt-8">
              <button className="px-4 py-2 border border-red-500 text-red-500 rounded flex items-center">
                <FiTrash2 className="mr-2" /> Eliminar
              </button>
              <button className="px-4 py-2 border border-gray-500 text-gray-700 rounded flex items-center">
                <FiEdit className="mr-2" /> Editar
              </button>
            </div>
          </>
        );
      case 'bills':
        return (
          <div className="py-4">
            {/* Campo de búsqueda */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Estado vacío */}
            <div className="flex flex-col items-center justify-center py-16">
              <div className="bg-blue-100 rounded-full p-10 mb-6">
                <svg className="w-16 h-16 text-blue-500" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 12H8L12 38H36L40 12Z" fill="currentColor" fillOpacity="0.2"/>
                  <path d="M8 12H40L36 38H12L8 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M16 20H32M16 26H32M16 32H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M8 8H40M13 8V4H35V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No hay Facturas</h3>
              <p className="text-gray-500 mb-6 text-center max-w-md">
                No se han encontrado facturas para este negocio. Puedes añadir una nueva factura usando el botón de abajo.
              </p>
            </div>
            
            {/* Controles inferiores */}
            <div className="mt-8 flex justify-between items-center">
              <Link 
                href={`/negocios/${negocio?.id_externo}/bills/new`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Añadir Nuevo Recibo
              </Link>
              
              <div className="flex items-center text-gray-500">
                <span className="mr-4">Página 1 de 0</span>
                <div className="flex">
                  <button disabled className="px-3 py-1 border rounded-l-lg bg-gray-50 text-gray-400">
                    anterior
                  </button>
                  <button disabled className="px-3 py-1 border border-l-0 rounded-r-lg bg-gray-50 text-gray-400">
                    siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'proformas':
        useEffect(() => {
          // Redirigir a la página específica de proformas manteniendo el historial de navegación
          router.push(`/negocios/${params.id}/proformas`);
        }, [params.id]);
        
        return (
          <div className="py-4 flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500">Cargando proformas...</p>
            </div>
          </div>
        );
      case 'invoices':
        return (
          <div className="py-4">
            {/* Título y sección de Facturas de Cliente */}
            <h2 className="text-xl font-medium text-gray-800 mb-6">Factura Cliente</h2>
            
            <div className="bg-white rounded-lg shadow-sm border mb-8">
              <div className="flex items-center p-4 border-b bg-gray-50 text-gray-500 text-sm font-medium">
                <div className="w-1/6">ID</div>
                <div className="w-1/6">Fecha</div>
                <div className="w-1/6">Monto</div>
                <div className="w-1/6">Material</div>
                <div className="w-1/6">Estado</div>
                <div className="w-1/6 text-right">Acciones</div>
              </div>
              
              <div className="flex items-center p-4 hover:bg-gray-50 transition-colors">
                <div className="w-1/6 text-gray-800 font-medium">{negocio?.id_externo}</div>
                <div className="w-1/6 text-gray-600">Mar 10, 2025</div>
                <div className="w-1/6 text-gray-800 font-medium">€51062.40</div>
                <div className="w-1/6 text-gray-600">PP JUMBO BAGS</div>
                <div className="w-1/6">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    Pending
                  </span>
                </div>
                <div className="w-1/6 flex justify-end space-x-2">
                  <Link 
                    href={`/negocios/${negocio?.id_externo}/facturas/edit/${negocio?.id_externo}`}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <FiEdit className="w-5 h-5" />
                  </Link>
                  <button 
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Sección de Facturas de Proveedor */}
            <h2 className="text-xl font-medium text-gray-800 mb-6">Facturas Proveedor</h2>
            
            <div className="bg-white rounded-lg shadow-sm border mb-6">
              <div className="flex items-center p-4 border-b bg-gray-50 text-gray-500 text-sm font-medium">
                <div className="w-1/6">ID</div>
                <div className="w-1/6">Proveedor</div>
                <div className="w-1/6">Monto</div>
                <div className="w-1/6">Fecha</div>
                <div className="w-1/6">Material</div>
                <div className="w-1/6 text-right">Acciones</div>
              </div>
              
              {/* Primera factura proveedor */}
              <div className="flex items-center p-4 hover:bg-gray-50 transition-colors border-b">
                <div className="w-1/6 text-gray-800 font-medium">{negocio?.id_externo}</div>
                <div className="w-1/6 text-gray-600">CTR MEDITERRANEO</div>
                <div className="w-1/6 text-gray-800 font-medium">€3036.00</div>
                <div className="w-1/6 text-gray-600">Mar 10, 2025</div>
                <div className="w-1/6">
                  <span className="text-gray-600">PP JUMBO BAGS</span>
                  <span className="ml-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    Pending
                  </span>
                </div>
                <div className="w-1/6 flex justify-end space-x-2">
                  <Link 
                    href={`/negocios/${negocio?.id_externo}/facturas/edit/${negocio?.id_externo}-1`}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <FiEdit className="w-5 h-5" />
                  </Link>
                  <button 
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Segunda factura proveedor */}
              <div className="flex items-center p-4 hover:bg-gray-50 transition-colors border-b">
                <div className="w-1/6 text-gray-800 font-medium">{negocio?.id_externo}</div>
                <div className="w-1/6 text-gray-600">RECICLADOS Y DERRIBOS LLORENS</div>
                <div className="w-1/6 text-gray-800 font-medium">€2418.00</div>
                <div className="w-1/6 text-gray-600">Mar 10, 2025</div>
                <div className="w-1/6">
                  <span className="text-gray-600">PP JUMBO BAGS</span>
                  <span className="ml-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    Pending
                  </span>
                </div>
                <div className="w-1/6 flex justify-end space-x-2">
                  <Link 
                    href={`/negocios/${negocio?.id_externo}/facturas/edit/${negocio?.id_externo}-2`}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <FiEdit className="w-5 h-5" />
                  </Link>
                  <button 
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Tercera factura proveedor */}
              <div className="flex items-center p-4 hover:bg-gray-50 transition-colors">
                <div className="w-1/6 text-gray-800 font-medium">{negocio?.id_externo}</div>
                <div className="w-1/6 text-gray-600">RECICLADOS COLLADO</div>
                <div className="w-1/6 text-gray-800 font-medium">€11484.00</div>
                <div className="w-1/6 text-gray-600">Mar 10, 2025</div>
                <div className="w-1/6">
                  <span className="text-gray-600">PP JUMBO BAGS</span>
                  <span className="ml-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    Pending
                  </span>
                </div>
                <div className="w-1/6 flex justify-end space-x-2">
                  <Link 
                    href={`/negocios/${negocio?.id_externo}/facturas/edit/${negocio?.id_externo}-3`}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <FiEdit className="w-5 h-5" />
                  </Link>
                  <button 
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Controles inferiores */}
            <div className="flex justify-end items-center mt-6">
              <div className="flex items-center text-gray-500">
                <span className="mr-4">Página 1 de 1</span>
                <div className="flex">
                  <button disabled className="px-3 py-1 border rounded-l-lg bg-gray-50 text-gray-400">
                    anterior
                  </button>
                  <button disabled className="px-3 py-1 border border-l-0 rounded-r-lg bg-gray-50 text-gray-400">
                    siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'shipping':
        return (
          <div className="py-4">
            {/* Título de la sección */}
            <h2 className="text-xl font-medium text-gray-800 mb-6">Shipping Invoice</h2>
            
            {/* Lista de Albaranes */}
            <div className="bg-white rounded-lg shadow-sm border mb-6">
              <div className="flex items-center p-4 border-b bg-gray-50 text-gray-500 text-sm font-medium">
                <div className="w-1/6">ID</div>
                <div className="w-1/6">Transportista</div>
                <div className="w-1/6">Fecha</div>
                <div className="w-1/6">Monto</div>
                <div className="w-1/6">Material</div>
                <div className="w-1/6 text-right">Acciones</div>
              </div>
              
              {/* Primer albarán */}
              <div className="flex items-center p-4 hover:bg-gray-50 transition-colors">
                <div className="w-1/6 text-gray-800 font-medium">INV002</div>
                <div className="w-1/6 text-gray-600">FR MEYER</div>
                <div className="w-1/6 text-gray-600">Jan 2, 2025</div>
                <div className="w-1/6 text-gray-800 font-medium">€25950.00</div>
                <div className="w-1/6">
                  <span className="text-gray-600">PP JUMBO BAGS</span>
                  <span className="ml-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    Pending
                  </span>
                </div>
                <div className="w-1/6 flex justify-end space-x-2">
                  <Link 
                    href={`/negocios/${negocio?.id_externo}/albaranes/edit/INV002`}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <FiEdit className="w-5 h-5" />
                  </Link>
                  <button 
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Controles inferiores */}
            <div className="flex justify-between items-center mt-6">
              <Link 
                href={`/negocios/${negocio?.id_externo}/albaranes/new`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
              >
                <FiPlus className="mr-2" />
                Añadir Nuevo Albarán
              </Link>
              
              <div className="flex items-center text-gray-500">
                <span className="mr-4">Página 1 de 1</span>
                <div className="flex">
                  <button disabled className="px-3 py-1 border rounded-l-lg bg-gray-50 text-gray-400">
                    anterior
                  </button>
                  <button disabled className="px-3 py-1 border border-l-0 rounded-r-lg bg-gray-50 text-gray-400">
                    siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div className="py-4">Selecciona una pestaña</div>;
    }
  };

  return (
    <div className="h-full bg-white">
      {/* Botón de retorno */}
      <div className="pt-6 px-6 mb-2">
        <Link href="/negocios" className="inline-flex items-center text-gray-600 hover:text-gray-800">
          <FiArrowLeft className="w-5 h-5 mr-2" />
          <span>Volver a negocios</span>
        </Link>
      </div>
      
      {/* Tabs de navegación */}
      <div className="border-b">
        <nav className="flex">
          {[
            { id: 'overview', label: 'Resumen' },
            { id: 'bills', label: 'Recibos' },
            { id: 'proformas', label: 'Proformas' },
            { id: 'invoices', label: 'Facturas C/P' },
            { id: 'shipping', label: 'Albaranes' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Contenido de la pestaña activa */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
} 
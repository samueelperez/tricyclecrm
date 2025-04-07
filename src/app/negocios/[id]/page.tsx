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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel izquierdo */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progreso y fechas clave */}
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Progreso y Fechas</h2>
            
            {/* Barra de progreso */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progreso general</span>
                    <span>{negocio?.progreso || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${negocio?.progreso || 0}%` }}
                ></div>
              </div>
            </div>
            
                {/* Fechas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Fecha de creación</p>
                    <p className="font-medium">{formatDate(negocio?.fecha_creacion)}</p>
                </div>
              <div>
                    <p className="text-xs text-gray-500 mb-1">Fecha de inicio</p>
                    <p className="font-medium">{formatDate(negocio?.fecha_inicio)}</p>
                  </div>
              <div>
                    <p className="text-xs text-gray-500 mb-1">Fecha estimada de finalización</p>
                    <p className="font-medium">{formatDate(negocio?.fecha_estimada_finalizacion)}</p>
                  </div>
              <div>
                    <p className="text-xs text-gray-500 mb-1">Fecha de entrega</p>
                    <p className="font-medium">{formatDate(negocio?.fecha_entrega)}</p>
                  </div>
              </div>
            </div>
            
              {/* Descripción */}
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Descripción</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {negocio?.descripcion || 'Sin descripción disponible.'}
                </p>
              </div>
              
              {/* Notas */}
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Notas</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {negocio?.notas || 'Sin notas adicionales.'}
                </p>
                  </div>
              </div>
              
            {/* Panel derecho */}
            <div className="space-y-6">
              {/* Métricas financieras */}
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Información Financiera</h2>
                
                <dl className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <dt className="text-sm text-gray-500">Valor Total</dt>
                    <dd className="font-medium text-gray-900">{formatCurrency(negocio?.valor_total)}</dd>
                </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <dt className="text-sm text-gray-500">Gastos Totales</dt>
                    <dd className="font-medium text-gray-900">{formatCurrency(negocio?.total_gastos)}</dd>
              </div>
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-sm text-gray-500">Beneficio Estimado</dt>
                    <dd className="font-medium text-green-600">
                      {negocio?.total_ingresos !== undefined && negocio?.total_gastos !== undefined && 
                       negocio?.total_ingresos !== null && negocio?.total_gastos !== null
                        ? formatCurrency(negocio.total_ingresos - negocio.total_gastos)
                        : 'No disponible'}
                    </dd>
              </div>
                </dl>
            </div>
            
              {/* Entidades relacionadas */}
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Entidades Relacionadas</h2>
                
                {/* Cliente */}
                <div className="mb-4">
                  <h3 className="text-sm text-gray-500 mb-1 flex items-center">
                    <FiUser className="mr-1.5 h-3.5 w-3.5" /> Cliente
                  </h3>
                  <p className="text-gray-800 font-medium">{negocio?.cliente_nombre}</p>
              </div>
              
                {/* Proveedores */}
                <div className="mb-4">
                  <h3 className="text-sm text-gray-500 mb-1 flex items-center">
                    <FiTruck className="mr-1.5 h-3.5 w-3.5" /> Proveedores
                  </h3>
              <div>
                    {proveedores.length > 0 ? (
                      proveedores.map((p, index) => (
                        <div key={index} className="text-gray-800">
                          {p.proveedor_nombre}
                  </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic text-sm">Sin proveedores asignados</p>
                    )}
                </div>
              </div>
              
                {/* Materiales */}
              <div>
                  <h3 className="text-sm text-gray-500 mb-1 flex items-center">
                    <FiPackage className="mr-1.5 h-3.5 w-3.5" /> Materiales
                  </h3>
                  <div>
                    {materiales.length > 0 ? (
                      materiales.map((m, index) => (
                        <div key={index} className="text-gray-800">
                          {m.material_nombre}
                  </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic text-sm">Sin materiales asignados</p>
                    )}
                </div>
              </div>
            </div>
            
              {/* Documentos */}
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Documentos</h2>
                <div className="flex flex-col space-y-2">
                  <Link 
                    href={`/negocios/${params.id}/proformas`}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <FiFileText className="mr-2 h-4 w-4" /> Ver proformas
                  </Link>
                  <Link 
                    href="?tab=invoices"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <FiFileText className="mr-2 h-4 w-4" /> Ver facturas
                  </Link>
                  <Link 
                    href="?tab=shipping"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <FiFileText className="mr-2 h-4 w-4" /> Ver albaranes
                  </Link>
            </div>
              </div>
            </div>
          </div>
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
        return (
          <div className="py-4">
            {/* Título y controles superiores */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-gray-800">Proformas</h2>
              <Link 
                href={`/negocios/${params.id}/proformas/new`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
              >
                <FiPlus className="mr-2" />
                Nueva Proforma
              </Link>
            </div>
            
            {/* Lista de proformas */}
            <div className="bg-white rounded-lg shadow-sm border mb-6">
              <div className="flex items-center p-4 border-b bg-gray-50 text-gray-500 text-sm font-medium">
                <div className="w-1/6">ID</div>
                <div className="w-1/6">Fecha</div>
                <div className="w-1/6">Cliente</div>
                <div className="w-1/6">Total</div>
                <div className="w-1/6">Estado</div>
                <div className="w-1/6 text-right">Acciones</div>
              </div>
              
              {/* Estado vacío cuando no hay proformas */}
              {true ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <div className="bg-blue-100 rounded-full p-8 mb-4">
                    <FiFileText className="w-12 h-12 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No hay proformas</h3>
                  <p className="text-gray-500 mb-6 text-center max-w-md">
                    No se han encontrado proformas para este negocio. Puedes añadir una nueva proforma usando el botón superior.
                  </p>
                </div>
              ) : (
                <>
                  {/* Ejemplo de proforma para demostración */}
                  <div className="flex items-center p-4 hover:bg-gray-50 transition-colors border-b">
                    <div className="w-1/6 text-gray-800 font-medium">PRO-{negocio?.id_externo}</div>
                    <div className="w-1/6 text-gray-600">{formatDate(new Date().toISOString())}</div>
                    <div className="w-1/6 text-gray-600">{negocio?.cliente_nombre}</div>
                    <div className="w-1/6 text-gray-800 font-medium">{formatCurrency(negocio?.valor_total || 0)}</div>
                    <div className="w-1/6">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        Pendiente
                      </span>
                    </div>
                    <div className="w-1/6 flex justify-end space-x-2">
                      <Link 
                        href={`/negocios/${params.id}/proformas/edit/PRO-${negocio?.id_externo}`}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                        title="Editar"
                      >
                        <FiEdit className="w-5 h-5" />
                      </Link>
                      <Link 
                        href={`/negocios/${params.id}/proformas/PRO-${negocio?.id_externo}/pdf`}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                        title="Ver PDF"
                      >
                        <FiFileText className="w-5 h-5" />
                      </Link>
                      <button 
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Eliminar"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
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
    <div className="min-h-screen bg-gray-50">
      {/* Header con información clave y acciones */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            {/* Navegación y título */}
            <div className="mb-4 md:mb-0">
              <Link href="/negocios" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-2">
                <FiArrowLeft className="w-4 h-4 mr-1" />
                <span className="text-sm">Volver a negocios</span>
        </Link>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-800">{negocio?.nombre || 'Contrato sin nombre'}</h1>
                <span className="ml-3 px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {negocio?.id_externo}
                </span>
              </div>
      </div>
      
            {/* Estado y acciones rápidas */}
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3">
              <div className="flex items-center">
                <div className={`h-3 w-3 rounded-full mr-2 ${negocio?.estado === 'Completado' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm font-medium">{negocio?.estado || 'En progreso'}</span>
              </div>
              <div className="flex space-x-2">
                <Link
                  href={`/negocios/edit/${params.id}`}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 inline-flex items-center"
                >
                  <FiEdit className="mr-1.5 h-4 w-4" /> Editar
                </Link>
                <button
                  className="px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 inline-flex items-center"
                >
                  <FiTrash2 className="mr-1.5 h-4 w-4" /> Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navegación por pestañas */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto">
          <nav className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Resumen', icon: FiFileText },
              { id: 'bills', label: 'Recibos', icon: FiFileText },
              { id: 'proformas', label: 'Proformas', icon: FiFileText },
              { id: 'invoices', label: 'Facturas C/P', icon: FiFileText },
              { id: 'shipping', label: 'Albaranes', icon: FiFileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-4 font-medium whitespace-nowrap flex items-center border-b-2 transition-colors ${
                activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
                  <Icon className="mr-1.5 h-4 w-4" />
              {tab.label}
            </button>
              );
            })}
        </nav>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel izquierdo */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progreso y fechas clave */}
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Progreso y Fechas</h2>
                
                {/* Barra de progreso */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progreso general</span>
                    <span>{negocio?.progreso || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${negocio?.progreso || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Fechas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Fecha de creación</p>
                    <p className="font-medium">{formatDate(negocio?.fecha_creacion)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Fecha de inicio</p>
                    <p className="font-medium">{formatDate(negocio?.fecha_inicio)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Fecha estimada de finalización</p>
                    <p className="font-medium">{formatDate(negocio?.fecha_estimada_finalizacion)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Fecha de entrega</p>
                    <p className="font-medium">{formatDate(negocio?.fecha_entrega)}</p>
                  </div>
                </div>
              </div>
              
              {/* Descripción */}
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Descripción</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {negocio?.descripcion || 'Sin descripción disponible.'}
                </p>
              </div>
              
              {/* Notas */}
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Notas</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {negocio?.notas || 'Sin notas adicionales.'}
                </p>
              </div>
            </div>
            
            {/* Panel derecho */}
            <div className="space-y-6">
              {/* Métricas financieras */}
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Información Financiera</h2>
                
                <dl className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <dt className="text-sm text-gray-500">Valor Total</dt>
                    <dd className="font-medium text-gray-900">{formatCurrency(negocio?.valor_total)}</dd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <dt className="text-sm text-gray-500">Gastos Totales</dt>
                    <dd className="font-medium text-gray-900">{formatCurrency(negocio?.total_gastos)}</dd>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-sm text-gray-500">Beneficio Estimado</dt>
                    <dd className="font-medium text-green-600">
                      {negocio?.total_ingresos !== undefined && negocio?.total_gastos !== undefined && 
                       negocio?.total_ingresos !== null && negocio?.total_gastos !== null
                        ? formatCurrency(negocio.total_ingresos - negocio.total_gastos)
                        : 'No disponible'}
                    </dd>
                  </div>
                </dl>
              </div>
              
              {/* Entidades relacionadas */}
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Entidades Relacionadas</h2>
                
                {/* Cliente */}
                <div className="mb-4">
                  <h3 className="text-sm text-gray-500 mb-1 flex items-center">
                    <FiUser className="mr-1.5 h-3.5 w-3.5" /> Cliente
                  </h3>
                  <p className="text-gray-800 font-medium">{negocio?.cliente_nombre}</p>
                </div>
                
                {/* Proveedores */}
                <div className="mb-4">
                  <h3 className="text-sm text-gray-500 mb-1 flex items-center">
                    <FiTruck className="mr-1.5 h-3.5 w-3.5" /> Proveedores
                  </h3>
                  <div>
                    {proveedores.length > 0 ? (
                      proveedores.map((p, index) => (
                        <div key={index} className="text-gray-800">
                          {p.proveedor_nombre}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic text-sm">Sin proveedores asignados</p>
                    )}
                  </div>
                </div>
                
                {/* Materiales */}
                <div>
                  <h3 className="text-sm text-gray-500 mb-1 flex items-center">
                    <FiPackage className="mr-1.5 h-3.5 w-3.5" /> Materiales
                  </h3>
                  <div>
                    {materiales.length > 0 ? (
                      materiales.map((m, index) => (
                        <div key={index} className="text-gray-800">
                          {m.material_nombre}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic text-sm">Sin materiales asignados</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Documentos */}
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Documentos</h2>
                <div className="flex flex-col space-y-2">
                  <Link 
                    href={`/negocios/${params.id}/proformas`}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <FiFileText className="mr-2 h-4 w-4" /> Ver proformas
                  </Link>
                  <Link 
                    href="?tab=invoices"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <FiFileText className="mr-2 h-4 w-4" /> Ver facturas
                  </Link>
                  <Link 
                    href="?tab=shipping"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <FiFileText className="mr-2 h-4 w-4" /> Ver albaranes
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-5">
        {renderTabContent()}
          </div>
        )}
      </div>
    </div>
  );
} 
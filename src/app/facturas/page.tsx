"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiPlus, FiEdit, FiEye, FiTrash2, FiDownload, FiSearch, FiTag, FiCalendar, FiClock, FiX, FiUser, FiDollarSign, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiFileText } from "react-icons/fi";
import { getSupabaseClient, ejecutarMigracionFacturas } from "@/lib/supabase";

// Definición del tipo para facturas
type Factura = {
  id: number;
  numero_factura: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  cliente: string;
  cliente_id: number;
  total: number;
  estado: string;
  divisa: string;
  condiciones_pago: string;
  ref_proforma: string | null;
  proforma_id: number | null;
  items: any[];
  notas: string | null;
  created_at: string;
  tipo: string; // 'cliente' o 'proveedor'
};

type FacturaTab = 'customer' | 'supplier';

// Componente interno que usa useSearchParams
function FacturasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as FacturaTab || 'customer';
  const [activeTab, setActiveTab] = useState<FacturaTab>(initialTab);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados para facturas
  const estadosFactura = [
    { value: "borrador", label: "Borrador", color: "bg-gray-100 text-gray-800", icon: <FiFileText className="mr-1.5 h-3 w-3" /> },
    { value: "emitida", label: "Emitida", color: "bg-blue-100 text-blue-800", icon: <FiRefreshCw className="mr-1.5 h-3 w-3" /> },
    { value: "pendiente", label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: <FiClock className="mr-1.5 h-3 w-3" /> },
    { value: "pagada", label: "Pagada", color: "bg-green-100 text-green-800", icon: <FiCheckCircle className="mr-1.5 h-3 w-3" /> },
    { value: "anulada", label: "Anulada", color: "bg-red-100 text-red-800", icon: <FiX className="mr-1.5 h-3 w-3" /> },
    { value: "vencida", label: "Vencida", color: "bg-orange-100 text-orange-800", icon: <FiAlertCircle className="mr-1.5 h-3 w-3" /> },
  ];

  // Función para cambiar de pestaña
  const handleTabChange = (tab: FacturaTab) => {
    setActiveTab(tab);
    router.push(`/facturas?tab=${tab}`);
  };

  // Cargar datos de facturas
  useEffect(() => {
    cargarFacturas();
  }, [activeTab]);

  const cargarFacturas = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      
      // Primero ejecutamos la migración para asegurarnos de que la tabla existe
      console.log('Ejecutando migración de facturas...');
      const resultadoMigracion = await ejecutarMigracionFacturas();
      
      if (!resultadoMigracion.success) {
        console.error('Error en la migración de facturas:', resultadoMigracion.error);
        setError('Error inicializando la tabla de facturas: ' + resultadoMigracion.message);
        setFacturas(activeTab === 'customer' ? datosEjemploCliente : datosEjemploProveedor);
        setLoading(false);
        return;
      }
      
      console.log('Migración completada, cargando datos...');
      
      // Si la migración fue exitosa, cargar los datos según la pestaña activa
      const tableName = activeTab === 'customer' ? 'facturas_cliente' : 'facturas_proveedor';
      const { data, error } = await supabase
        .from(tableName)
        .select(`
          *,
          clientes(nombre),
          proformas(id_externo)
        `)
        .order("fecha", { ascending: false });

      if (error) {
        console.error(`Error cargando facturas de ${activeTab}:`, error);
        setError("Error al cargar datos: " + error.message);
        setFacturas(activeTab === 'customer' ? datosEjemploCliente : datosEjemploProveedor);
      } else if (data && data.length > 0) {
        // Formatear los datos recibidos
        const facturasFormateadas = data.map(item => ({
          ...item,
          cliente: item.clientes?.nombre || item.cliente || 'Cliente sin asignar',
          ref_proforma: item.proformas?.id_externo || null,
          numero_factura: item.id_externo || 'SIN-NUMERO',
          divisa: item.divisa || 'EUR',
          tipo: activeTab === 'customer' ? 'cliente' : 'proveedor'
        }));
        setFacturas(facturasFormateadas as Factura[]);
      } else {
        // Si no hay datos, usar los de ejemplo
        setFacturas(activeTab === 'customer' ? datosEjemploCliente : datosEjemploProveedor);
      }
    } catch (error: any) {
      console.error("Error:", error);
      setError("Error desconocido al cargar los datos");
      setFacturas(activeTab === 'customer' ? datosEjemploCliente : datosEjemploProveedor);
    } finally {
      setLoading(false);
    }
  };

  // Manejar eliminación
  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar esta factura? Esta acción no se puede deshacer.")) 
      return;
    
    setDeleteLoading(id);
    
    try {
      const supabase = getSupabaseClient();
      const tableName = activeTab === 'customer' ? 'facturas_cliente' : 'facturas_proveedor';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      // Actualizar lista después de eliminar
      setFacturas(prevFacturas => prevFacturas.filter(factura => factura.id !== id));
      
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      setError(`Error al eliminar: ${error.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filtrar facturas
  const facturasFiltradas = facturas.filter(factura => {
    const cumpleFiltroTexto = 
      factura.numero_factura.toLowerCase().includes(filtro.toLowerCase()) ||
      factura.cliente.toLowerCase().includes(filtro.toLowerCase()) ||
      (factura.ref_proforma && factura.ref_proforma.toLowerCase().includes(filtro.toLowerCase()));
    
    const cumpleFiltroEstado = estadoFiltro === "todos" || factura.estado === estadoFiltro;
    
    return cumpleFiltroTexto && cumpleFiltroEstado;
  });

  // Obtener estilos de estado
  const getEstadoStyles = (estado: string) => {
    const estadoObj = estadosFactura.find(e => e.value === estado);
    return {
      bgColor: estadoObj ? estadoObj.color.split(' ')[0] : "bg-gray-100",
      textColor: estadoObj ? estadoObj.color.split(' ')[1] : "text-gray-800",
      icon: estadoObj ? estadoObj.icon : <FiTag className="mr-1.5 h-3 w-3" />
    };
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES');
  };

  // Formatear montos
  const formatMonto = (monto: number, divisa: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: divisa,
      minimumFractionDigits: 2
    }).format(monto);
  };

  return (
    <div className="py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 sm:mb-0">
            Facturas
          </h1>
          <Link 
            href={activeTab === 'supplier' ? '/facturas/new-supplier' : '/facturas/new-customer'}
            className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nueva Factura {activeTab === 'supplier' ? 'de Proveedor' : 'de Cliente'}
          </Link>
        </div>
        
        {/* Pestañas para cambiar entre facturas de cliente y proveedor */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => handleTabChange('customer')}
                className={`${
                  activeTab === 'customer'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Facturas de Clientes
              </button>
              <button
                onClick={() => handleTabChange('supplier')}
                className={`${
                  activeTab === 'supplier'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Facturas de Proveedores
              </button>
            </nav>
          </div>
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
            </div>
          </div>
        )}
        
        {/* Filtros y búsqueda */}
        <div className="bg-white shadow-md rounded-lg p-5 mb-8 transition-all duration-300 ease-in-out transform hover:shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400 h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder={`Buscar facturas de ${activeTab === 'customer' ? 'clientes' : 'proveedores'}...`}
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="pl-10 pr-4 py-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                />
              </div>
            </div>
            
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiTag className="text-gray-400 h-5 w-5" />
                </div>
                <select
                  value={estadoFiltro}
                  onChange={(e) => setEstadoFiltro(e.target.value)}
                  className="pl-10 pr-4 py-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                  <option value="todos">Todos los estados</option>
                  {estadosFactura.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de facturas */}
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Cargando facturas de {activeTab === 'customer' ? 'clientes' : 'proveedores'}...</p>
          </div>
        ) : facturasFiltradas.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="flex justify-center mb-4">
              <FiFileText className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg mb-4">
              {filtro || estadoFiltro !== 'todos' ? (
                'No se encontraron facturas con los filtros seleccionados'
              ) : (
                `No hay facturas de ${activeTab === 'customer' ? 'clientes' : 'proveedores'} registradas`
              )}
            </p>
            {(filtro || estadoFiltro !== 'todos') && (
              <button 
                onClick={() => {
                  setFiltro('');
                  setEstadoFiltro('todos');
                }}
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
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiFileText className="mr-1 text-indigo-500" />
                      Nº Factura
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiCalendar className="mr-1 text-indigo-500" />
                      Fecha
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiUser className="mr-1 text-indigo-500" />
                      {activeTab === 'customer' ? 'Cliente' : 'Proveedor'}
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiDollarSign className="mr-1 text-indigo-500" />
                      Total
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiTag className="mr-1 text-indigo-500" />
                      Estado
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiClock className="mr-1 text-indigo-500" />
                      Vencimiento
                    </div>
                  </th>
                  {activeTab === 'customer' && (
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiFileText className="mr-1 text-indigo-500" />
                        Proforma
                      </div>
                    </th>
                  )}
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {facturasFiltradas.map((factura) => {
                  const { bgColor, textColor } = getEstadoStyles(factura.estado);
                  
                  return (
                    <tr key={factura.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{factura.numero_factura}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiCalendar className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatDate(factura.fecha_emision)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <FiUser className="mr-1 text-indigo-500 h-4 w-4" />
                          {factura.cliente}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <FiDollarSign className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatMonto(factura.total, factura.divisa)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
                          {factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiClock className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatDate(factura.fecha_vencimiento)}
                        </div>
                      </td>
                      {activeTab === 'customer' && (
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {factura.ref_proforma ? (
                              <Link 
                                href={`/proformas/${factura.proforma_id}`}
                                className="flex items-center text-indigo-600 hover:text-indigo-900"
                              >
                                <FiFileText className="mr-1 text-indigo-500 h-4 w-4" />
                                {factura.ref_proforma}
                              </Link>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link 
                            href={`/facturas/${factura.id}/pdf`} 
                            className="text-green-600 hover:text-green-900 transition-colors duration-150 p-1"
                            title="Descargar PDF"
                          >
                            <FiDownload className="h-4 w-4" />
                          </Link>
                          <Link 
                            href={activeTab === 'supplier' 
                              ? `/facturas/edit-supplier/${factura.id}` 
                              : `/facturas/edit-customer/${factura.id}`} 
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1"
                            title="Editar factura"
                          >
                            <FiEdit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(factura.id)}
                            disabled={deleteLoading === factura.id}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 disabled:opacity-50"
                            title="Eliminar factura"
                          >
                            {deleteLoading === factura.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-r-transparent border-red-600"></div>
                            ) : (
                              <FiTrash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de carga para Suspense
function LoadingFallback() {
  return (
    <div className="py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// Componente principal envuelto en Suspense
export default function FacturasPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FacturasContent />
    </Suspense>
  );
}

// Datos de ejemplo para facturas de clientes
const datosEjemploCliente: Factura[] = [
  {
    id: 1,
    numero_factura: "FAC-2023-001",
    fecha_emision: "2023-05-10",
    fecha_vencimiento: "2023-06-10",
    cliente: "Comercial Acme, S.L.",
    cliente_id: 1,
    total: 1250.75,
    estado: "pagada",
    divisa: "EUR",
    condiciones_pago: "30 días",
    ref_proforma: "PRO-2023-001",
    proforma_id: 1,
    items: [],
    notas: null,
    created_at: "2023-05-10T08:30:00Z",
    tipo: 'cliente'
  },
  {
    id: 2,
    numero_factura: "FAC-2023-002",
    fecha_emision: "2023-05-20",
    fecha_vencimiento: "2023-06-20",
    cliente: "Distribuciones García",
    cliente_id: 2,
    total: 2350.00,
    estado: "pendiente",
    divisa: "EUR",
    condiciones_pago: "60 días",
    ref_proforma: null,
    proforma_id: null,
    items: [],
    notas: null,
    created_at: "2023-05-20T14:15:00Z",
    tipo: 'cliente'
  },
  {
    id: 3,
    numero_factura: "FAC-2023-003",
    fecha_emision: "2023-06-01",
    fecha_vencimiento: "2023-07-01",
    cliente: "Industrias Martínez, S.A.",
    cliente_id: 3,
    total: 4500.00,
    estado: "emitida",
    divisa: "EUR",
    condiciones_pago: "30 días",
    ref_proforma: "PRO-2023-002",
    proforma_id: 2,
    items: [],
    notas: null,
    created_at: "2023-06-01T09:45:00Z",
    tipo: 'cliente'
  }
];

// Datos de ejemplo para facturas de proveedores
const datosEjemploProveedor: Factura[] = [
  {
    id: 1,
    numero_factura: "PROV-2023-001",
    fecha_emision: "2023-04-15",
    fecha_vencimiento: "2023-05-15",
    cliente: "Suministros Industriales López",
    cliente_id: 101,
    total: 875.50,
    estado: "pagada",
    divisa: "EUR",
    condiciones_pago: "30 días",
    ref_proforma: null,
    proforma_id: null,
    items: [],
    notas: "Material de oficina",
    created_at: "2023-04-15T10:30:00Z",
    tipo: 'proveedor'
  },
  {
    id: 2,
    numero_factura: "PROV-2023-002",
    fecha_emision: "2023-05-05",
    fecha_vencimiento: "2023-06-05",
    cliente: "Materiales Construcción S.A.",
    cliente_id: 102,
    total: 3150.25,
    estado: "pendiente",
    divisa: "EUR",
    condiciones_pago: "30 días",
    ref_proforma: null,
    proforma_id: null,
    items: [],
    notas: "Cemento y ladrillos",
    created_at: "2023-05-05T11:20:00Z",
    tipo: 'proveedor'
  },
  {
    id: 3,
    numero_factura: "PROV-2023-003",
    fecha_emision: "2023-05-18",
    fecha_vencimiento: "2023-06-18",
    cliente: "Recisur",
    cliente_id: 103,
    total: 1980.00,
    estado: "vencida",
    divisa: "EUR",
    condiciones_pago: "30 días",
    ref_proforma: null,
    proforma_id: null,
    items: [],
    notas: "Material plástico",
    created_at: "2023-05-18T15:45:00Z",
    tipo: 'proveedor'
  }
]; 
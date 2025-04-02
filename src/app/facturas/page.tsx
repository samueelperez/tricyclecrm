"use client";

import { useState, useEffect } from "react";
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
};

export default function FacturasPage() {
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

  // Cargar datos de facturas
  useEffect(() => {
    cargarFacturas();
  }, []);

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
        setFacturas(datosEjemplo);
        setLoading(false);
        return;
      }
      
      console.log('Migración completada, cargando datos...');
      
      // Si la migración fue exitosa, cargar los datos
      const { data, error } = await supabase
        .from("facturas")
        .select(`
          *,
          clientes(nombre),
          proformas(numero_proforma)
        `)
        .order("fecha_emision", { ascending: false });

      if (error) {
        console.error("Error cargando facturas:", error);
        setError("Error al cargar datos: " + error.message);
        setFacturas(datosEjemplo);
      } else if (data && data.length > 0) {
        // Formatear los datos recibidos
        const facturasFormateadas = data.map(item => ({
          ...item,
          cliente: item.clientes?.nombre || item.cliente || 'Cliente sin asignar',
          ref_proforma: item.proformas?.numero_proforma || null
        }));
        setFacturas(facturasFormateadas as Factura[]);
      } else {
        // Si no hay datos, usar los de ejemplo
        setFacturas(datosEjemplo);
      }
    } catch (error: any) {
      console.error("Error:", error);
      setError("Error desconocido al cargar los datos");
      setFacturas(datosEjemplo);
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
      
      const { error } = await supabase
        .from("facturas")
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
            href="/facturas/new"
            className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nueva Factura
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
                  placeholder="Buscar por número, cliente o proforma..."
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
            <p className="text-gray-500 text-lg">Cargando facturas...</p>
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
                'No hay facturas registradas'
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
                      Fecha Emisión
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiUser className="mr-1 text-indigo-500" />
                      Cliente
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
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiFileText className="mr-1 text-indigo-500" />
                      Proforma
                    </div>
                  </th>
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
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link 
                            href={`/facturas/${factura.id}`} 
                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150 p-1"
                            title="Ver detalles"
                          >
                            <FiEye className="h-4 w-4" />
                          </Link>
                          <Link 
                            href={`/facturas/edit/${factura.id}`} 
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
                          <Link
                            href={`/facturas/${factura.id}/pdf`}
                            className="text-green-600 hover:text-green-900 transition-colors duration-150 p-1"
                            title="Descargar PDF"
                          >
                            <FiDownload className="h-4 w-4" />
                          </Link>
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

// Datos de ejemplo para mostrar cuando no hay datos reales
const datosEjemplo: Factura[] = [
  {
    id: 1,
    numero_factura: "FAC-2023-001",
    fecha_emision: "2023-05-15",
    fecha_vencimiento: "2023-06-15",
    cliente: "Comercial Acme, S.L.",
    cliente_id: 1,
    total: 3025.00,
    estado: "pagada",
    divisa: "EUR",
    condiciones_pago: "30 días",
    ref_proforma: "PRO-2023-001",
    proforma_id: 1,
    items: [
      { id: 1, descripcion: "Servicio A", cantidad: 2, precio_unitario: 1000.00, subtotal: 2000.00 },
      { id: 2, descripcion: "Servicio B", cantidad: 1, precio_unitario: 500.00, subtotal: 500.00 },
      { id: 3, descripcion: "IVA 21%", cantidad: 1, precio_unitario: 525.00, subtotal: 525.00 }
    ],
    notas: "Factura pagada por transferencia bancaria.",
    created_at: "2023-05-15T10:30:00Z"
  },
  {
    id: 2,
    numero_factura: "FAC-2023-002",
    fecha_emision: "2023-05-25",
    fecha_vencimiento: "2023-06-25",
    cliente: "Distribuciones García",
    cliente_id: 2,
    total: 2117.50,
    estado: "emitida",
    divisa: "EUR",
    condiciones_pago: "30 días",
    ref_proforma: "PRO-2023-002",
    proforma_id: 2,
    items: [
      { id: 1, descripcion: "Producto X", cantidad: 5, precio_unitario: 350.00, subtotal: 1750.00 },
      { id: 2, descripcion: "IVA 21%", cantidad: 1, precio_unitario: 367.50, subtotal: 367.50 }
    ],
    notas: "Factura enviada por email.",
    created_at: "2023-05-25T14:45:00Z"
  },
  {
    id: 3,
    numero_factura: "FAC-2023-003",
    fecha_emision: "2023-06-05",
    fecha_vencimiento: "2023-07-05",
    cliente: "Industrias Martínez, S.A.",
    cliente_id: 3,
    total: 5082.00,
    estado: "pendiente",
    divisa: "EUR",
    condiciones_pago: "30 días",
    ref_proforma: "PRO-2023-003",
    proforma_id: 3,
    items: [
      { id: 1, descripcion: "Consultoría", cantidad: 10, precio_unitario: 420.00, subtotal: 4200.00 },
      { id: 2, descripcion: "IVA 21%", cantidad: 1, precio_unitario: 882.00, subtotal: 882.00 }
    ],
    notas: "Pendiente de cobro.",
    created_at: "2023-06-05T11:20:00Z"
  },
  {
    id: 4,
    numero_factura: "FAC-2023-004",
    fecha_emision: "2023-04-20",
    fecha_vencimiento: "2023-05-20",
    cliente: "Electrónica Europa",
    cliente_id: 4,
    total: 4598.00,
    estado: "vencida",
    divisa: "EUR",
    condiciones_pago: "30 días",
    ref_proforma: null,
    proforma_id: null,
    items: [
      { id: 1, descripcion: "Componente A", cantidad: 20, precio_unitario: 90.00, subtotal: 1800.00 },
      { id: 2, descripcion: "Componente B", cantidad: 10, precio_unitario: 200.00, subtotal: 2000.00 },
      { id: 3, descripcion: "IVA 21%", cantidad: 1, precio_unitario: 798.00, subtotal: 798.00 }
    ],
    notas: "Factura vencida. Recordatorio enviado el 25/05/2023.",
    created_at: "2023-04-20T09:15:00Z"
  },
  {
    id: 5,
    numero_factura: "FAC-2023-005",
    fecha_emision: "2023-06-18",
    fecha_vencimiento: "2023-07-18",
    cliente: "Importaciones del Sur",
    cliente_id: 5,
    total: 0.00,
    estado: "anulada",
    divisa: "EUR",
    condiciones_pago: "30 días",
    ref_proforma: "PRO-2023-005",
    proforma_id: 5,
    items: [],
    notas: "Factura anulada por cambio en los servicios.",
    created_at: "2023-06-18T16:40:00Z"
  }
]; 
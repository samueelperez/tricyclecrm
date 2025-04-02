"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiPlus, FiEdit, FiEye, FiTrash2, FiDownload, FiSearch, FiTag, FiCalendar, FiClock, FiX, FiUser, FiDollarSign, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiFileText } from "react-icons/fi";
import { getSupabaseClient, ejecutarMigracionProformas } from "@/lib/supabase";

// Definición del tipo para proformas
type Proforma = {
  id: number;
  numero_proforma: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  cliente: string;
  cliente_id: number;
  total: number;
  estado: string;
  divisa: string;
  condiciones_pago: string;
  validez: number;
  items: any[];
  notas: string | null;
  created_at: string;
};

export default function ProformasPage() {
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados para proformas
  const estadosProforma = [
    { value: "borrador", label: "Borrador", color: "bg-gray-100 text-gray-800", icon: <FiFileText className="mr-1.5 h-3 w-3" /> },
    { value: "enviada", label: "Enviada", color: "bg-blue-100 text-blue-800", icon: <FiRefreshCw className="mr-1.5 h-3 w-3" /> },
    { value: "pendiente", label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: <FiClock className="mr-1.5 h-3 w-3" /> },
    { value: "aprobada", label: "Aprobada", color: "bg-green-100 text-green-800", icon: <FiCheckCircle className="mr-1.5 h-3 w-3" /> },
    { value: "rechazada", label: "Rechazada", color: "bg-red-100 text-red-800", icon: <FiX className="mr-1.5 h-3 w-3" /> },
    { value: "vencida", label: "Vencida", color: "bg-orange-100 text-orange-800", icon: <FiAlertCircle className="mr-1.5 h-3 w-3" /> },
  ];

  // Cargar datos de proformas
  useEffect(() => {
    cargarProformas();
  }, []);

  const cargarProformas = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      
      // Primero ejecutamos la migración para asegurarnos de que la tabla existe
      console.log('Ejecutando migración de proformas...');
      const resultadoMigracion = await ejecutarMigracionProformas();
      
      if (!resultadoMigracion.success) {
        console.error('Error en la migración de proformas:', resultadoMigracion.error);
        setError('Error inicializando la tabla de proformas: ' + resultadoMigracion.message);
        setProformas(datosEjemplo);
        setLoading(false);
        return;
      }
      
      console.log('Migración completada, cargando datos...');
      
      // Si la migración fue exitosa, cargar los datos
      const { data, error } = await supabase
        .from("proformas")
        .select(`
          *,
          clientes(nombre)
        `)
        .order("fecha_emision", { ascending: false });

      if (error) {
        console.error("Error cargando proformas:", error);
        setError("Error al cargar datos: " + error.message);
        setProformas(datosEjemplo);
      } else if (data && data.length > 0) {
        // Formatear los datos recibidos
        const proformasFormateadas = data.map(item => ({
          ...item,
          cliente: item.clientes?.nombre || item.cliente || 'Cliente sin asignar'
        }));
        setProformas(proformasFormateadas as Proforma[]);
      } else {
        // Si no hay datos, usar los de ejemplo
        setProformas(datosEjemplo);
      }
    } catch (error: any) {
      console.error("Error:", error);
      setError("Error desconocido al cargar los datos");
      setProformas(datosEjemplo);
    } finally {
      setLoading(false);
    }
  };

  // Manejar eliminación
  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar esta proforma? Esta acción no se puede deshacer.")) 
      return;
    
    setDeleteLoading(id);
    
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from("proformas")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      // Actualizar lista después de eliminar
      setProformas(prevProformas => prevProformas.filter(proforma => proforma.id !== id));
      
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      setError(`Error al eliminar: ${error.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filtrar proformas
  const proformasFiltradas = proformas.filter(proforma => {
    const cumpleFiltroTexto = 
      proforma.numero_proforma.toLowerCase().includes(filtro.toLowerCase()) ||
      proforma.cliente.toLowerCase().includes(filtro.toLowerCase());
    
    const cumpleFiltroEstado = estadoFiltro === "todos" || proforma.estado === estadoFiltro;
    
    return cumpleFiltroTexto && cumpleFiltroEstado;
  });

  // Obtener estilos de estado
  const getEstadoStyles = (estado: string) => {
    const estadoObj = estadosProforma.find(e => e.value === estado);
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
            Proformas
          </h1>
          <Link 
            href="/proformas/new"
            className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nueva Proforma
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
                  placeholder="Buscar por número o cliente..."
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
                  {estadosProforma.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de proformas */}
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Cargando proformas...</p>
          </div>
        ) : proformasFiltradas.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="flex justify-center mb-4">
              <FiFileText className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg mb-4">
              {filtro || estadoFiltro !== 'todos' ? (
                'No se encontraron proformas con los filtros seleccionados'
              ) : (
                'No hay proformas registradas'
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
                      Nº Proforma
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
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proformasFiltradas.map((proforma) => {
                  const { bgColor, textColor } = getEstadoStyles(proforma.estado);
                  
                  return (
                    <tr key={proforma.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{proforma.numero_proforma}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiCalendar className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatDate(proforma.fecha_emision)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <FiUser className="mr-1 text-indigo-500 h-4 w-4" />
                          {proforma.cliente}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <FiDollarSign className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatMonto(proforma.total, proforma.divisa)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
                          {proforma.estado.charAt(0).toUpperCase() + proforma.estado.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiClock className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatDate(proforma.fecha_vencimiento)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link 
                            href={`/proformas/${proforma.id}`} 
                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150 p-1"
                            title="Ver detalles"
                          >
                            <FiEye className="h-4 w-4" />
                          </Link>
                          <Link 
                            href={`/proformas/edit/${proforma.id}`} 
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1"
                            title="Editar proforma"
                          >
                            <FiEdit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(proforma.id)}
                            disabled={deleteLoading === proforma.id}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 disabled:opacity-50"
                            title="Eliminar proforma"
                          >
                            {deleteLoading === proforma.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-r-transparent border-red-600"></div>
                            ) : (
                              <FiTrash2 className="h-4 w-4" />
                            )}
                          </button>
                          <Link
                            href={`/proformas/${proforma.id}/pdf`}
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
const datosEjemplo: Proforma[] = [
  {
    id: 1,
    numero_proforma: "PRO-2023-001",
    fecha_emision: "2023-05-10",
    fecha_vencimiento: "2023-06-10",
    cliente: "Comercial Acme, S.L.",
    cliente_id: 1,
    total: 2500.75,
    estado: "aprobada",
    divisa: "EUR",
    condiciones_pago: "30 días",
    validez: 30,
    items: [
      { id: 1, descripcion: "Servicio A", cantidad: 2, precio_unitario: 1000.00, subtotal: 2000.00 },
      { id: 2, descripcion: "Servicio B", cantidad: 1, precio_unitario: 500.75, subtotal: 500.75 }
    ],
    notas: "IVA no incluido.",
    created_at: "2023-05-10T08:30:00Z"
  },
  {
    id: 2,
    numero_proforma: "PRO-2023-002",
    fecha_emision: "2023-05-20",
    fecha_vencimiento: "2023-06-20",
    cliente: "Distribuciones García",
    cliente_id: 2,
    total: 1750.00,
    estado: "enviada",
    divisa: "EUR",
    condiciones_pago: "15 días",
    validez: 15,
    items: [
      { id: 1, descripcion: "Producto X", cantidad: 5, precio_unitario: 350.00, subtotal: 1750.00 }
    ],
    notas: "Incluye transporte.",
    created_at: "2023-05-20T14:15:00Z"
  },
  {
    id: 3,
    numero_proforma: "PRO-2023-003",
    fecha_emision: "2023-06-01",
    fecha_vencimiento: "2023-07-01",
    cliente: "Industrias Martínez, S.A.",
    cliente_id: 3,
    total: 4200.00,
    estado: "borrador",
    divisa: "EUR",
    condiciones_pago: "Al contado",
    validez: 15,
    items: [
      { id: 1, descripcion: "Consultoría", cantidad: 10, precio_unitario: 420.00, subtotal: 4200.00 }
    ],
    notas: null,
    created_at: "2023-06-01T09:45:00Z"
  },
  {
    id: 4,
    numero_proforma: "PRO-2023-004",
    fecha_emision: "2023-04-15",
    fecha_vencimiento: "2023-05-15",
    cliente: "Electrónica Europa",
    cliente_id: 4,
    total: 3800.00,
    estado: "vencida",
    divisa: "EUR",
    condiciones_pago: "30 días",
    validez: 30,
    items: [
      { id: 1, descripcion: "Componente A", cantidad: 20, precio_unitario: 90.00, subtotal: 1800.00 },
      { id: 2, descripcion: "Componente B", cantidad: 10, precio_unitario: 200.00, subtotal: 2000.00 }
    ],
    notas: "Precios sujetos a cambio.",
    created_at: "2023-04-15T10:30:00Z"
  },
  {
    id: 5,
    numero_proforma: "PRO-2023-005",
    fecha_emision: "2023-06-15",
    fecha_vencimiento: "2023-07-15",
    cliente: "Importaciones del Sur",
    cliente_id: 5,
    total: 1950.30,
    estado: "rechazada",
    divisa: "EUR",
    condiciones_pago: "30 días",
    validez: 30,
    items: [
      { id: 1, descripcion: "Servicio Premium", cantidad: 1, precio_unitario: 1950.30, subtotal: 1950.30 }
    ],
    notas: "Cliente solicitó revisión de precios.",
    created_at: "2023-06-15T11:10:00Z"
  }
]; 
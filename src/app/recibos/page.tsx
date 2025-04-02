"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiPlus, FiEdit, FiEye, FiTrash2, FiDownload, FiSearch, FiTag, FiCalendar, FiClock, FiX, FiDollarSign, FiUser, FiFileText, FiCreditCard, FiCheckCircle, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { getSupabaseClient, ejecutarMigracionRecibos } from "@/lib/supabase";

// Definición del tipo para recibos
type Recibo = {
  id: number;
  numero_recibo: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  cliente: string;
  cliente_id: number;
  factura_id: number | null;
  numero_factura: string | null;
  monto: number;
  monto_pagado: number;
  saldo_pendiente: number;
  estado: string;
  metodo_pago: string;
  notas: string | null;
  created_at: string;
};

export default function RecibosPage() {
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados para recibos
  const estadosRecibo = [
    { value: "pendiente", label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: <FiClock className="mr-1.5 h-3 w-3" /> },
    { value: "pagado", label: "Pagado", color: "bg-green-100 text-green-800", icon: <FiCheckCircle className="mr-1.5 h-3 w-3" /> },
    { value: "vencido", label: "Vencido", color: "bg-red-100 text-red-800", icon: <FiAlertCircle className="mr-1.5 h-3 w-3" /> },
    { value: "cancelado", label: "Cancelado", color: "bg-gray-100 text-gray-800", icon: <FiX className="mr-1.5 h-3 w-3" /> },
    { value: "parcial", label: "Pago Parcial", color: "bg-blue-100 text-blue-800", icon: <FiRefreshCw className="mr-1.5 h-3 w-3" /> },
  ];

  // Métodos de pago
  const metodosPago = [
    "Transferencia", 
    "Efectivo", 
    "Tarjeta", 
    "Cheque", 
    "PayPal", 
    "Otro"
  ];

  // Cargar datos de recibos
  useEffect(() => {
    cargarRecibos();
  }, []);

  const cargarRecibos = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      
      // Primero ejecutamos la migración para asegurarnos de que la tabla existe
      console.log('Ejecutando migración de recibos...');
      const resultadoMigracion = await ejecutarMigracionRecibos();
      
      if (!resultadoMigracion.success) {
        console.error('Error en la migración de recibos:', resultadoMigracion.error);
        setError('Error inicializando la tabla de recibos: ' + resultadoMigracion.message);
        setRecibos(datosEjemplo);
        setLoading(false);
        return;
      }
      
      console.log('Migración completada, cargando datos...');
      
      // Si la migración fue exitosa, cargar los datos
      const { data, error } = await supabase
        .from("recibos")
        .select(`
          *,
          clientes(nombre),
          facturas(numero_factura)
        `)
        .order("fecha_emision", { ascending: false });

      if (error) {
        console.error("Error cargando recibos:", error);
        setError("Error al cargar datos: " + error.message);
        setRecibos(datosEjemplo);
      } else if (data && data.length > 0) {
        // Formatear los datos recibidos
        const recibosFormateados = data.map(item => ({
          ...item,
          cliente: item.clientes?.nombre || item.cliente || 'Cliente sin asignar',
          numero_factura: item.facturas?.numero_factura || 'Sin factura'
        }));
        setRecibos(recibosFormateados as Recibo[]);
      } else {
        // Si no hay datos, usar los de ejemplo
        setRecibos(datosEjemplo);
      }
    } catch (error: any) {
      console.error("Error:", error);
      setError("Error desconocido al cargar los datos");
      setRecibos(datosEjemplo);
    } finally {
      setLoading(false);
    }
  };

  // Manejar eliminación
  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este recibo? Esta acción no se puede deshacer.")) 
      return;
    
    setDeleteLoading(id);
    
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from("recibos")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      // Actualizar lista después de eliminar
      setRecibos(prevRecibos => prevRecibos.filter(recibo => recibo.id !== id));
      
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      setError(`Error al eliminar: ${error.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filtrar recibos
  const recibosFiltrados = recibos.filter(recibo => {
    const cumpleFiltroTexto = 
      recibo.numero_recibo.toLowerCase().includes(filtro.toLowerCase()) ||
      recibo.cliente.toLowerCase().includes(filtro.toLowerCase()) ||
      (recibo.numero_factura && recibo.numero_factura.toLowerCase().includes(filtro.toLowerCase()));
    
    const cumpleFiltroEstado = estadoFiltro === "todos" || recibo.estado === estadoFiltro;
    
    return cumpleFiltroTexto && cumpleFiltroEstado;
  });

  // Obtener estilos de estado
  const getEstadoStyles = (estado: string) => {
    const estadoObj = estadosRecibo.find(e => e.value === estado);
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
  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(monto);
  };

  return (
    <div className="py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 sm:mb-0">
            Recibos
          </h1>
          <Link 
            href="/recibos/new"
            className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nuevo Recibo
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
                  placeholder="Buscar por número, cliente o factura relacionada..."
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
                  {estadosRecibo.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de recibos */}
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Cargando recibos...</p>
          </div>
        ) : recibosFiltrados.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="flex justify-center mb-4">
              <FiCreditCard className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg mb-4">
              {filtro || estadoFiltro !== 'todos' ? (
                'No se encontraron recibos con los filtros seleccionados'
              ) : (
                'No hay recibos registrados'
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
                      <FiCreditCard className="mr-1 text-indigo-500" />
                      Nº Recibo
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
                      <FiClock className="mr-1 text-indigo-500" />
                      Vencimiento
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
                      <FiFileText className="mr-1 text-indigo-500" />
                      Factura
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiDollarSign className="mr-1 text-indigo-500" />
                      Monto
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiTag className="mr-1 text-indigo-500" />
                      Estado
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recibosFiltrados.map((recibo) => {
                  const { bgColor, textColor } = getEstadoStyles(recibo.estado);
                  
                  return (
                    <tr key={recibo.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{recibo.numero_recibo}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiCalendar className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatDate(recibo.fecha_emision)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiClock className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatDate(recibo.fecha_vencimiento)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <FiUser className="mr-1 text-indigo-500 h-4 w-4" />
                          {recibo.cliente}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiFileText className="mr-1 text-indigo-500 h-4 w-4" />
                          {recibo.numero_factura || 'Sin factura'}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <FiDollarSign className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatMonto(recibo.monto)}
                        </div>
                        {recibo.estado === 'parcial' && (
                          <div className="text-xs text-gray-500">
                            Pagado: {formatMonto(recibo.monto_pagado)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
                          {recibo.estado.charAt(0).toUpperCase() + recibo.estado.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link 
                            href={`/recibos/${recibo.id}`} 
                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150 p-1"
                            title="Ver detalles"
                          >
                            <FiEye className="h-4 w-4" />
                          </Link>
                          <Link 
                            href={`/recibos/edit/${recibo.id}`} 
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1"
                            title="Editar recibo"
                          >
                            <FiEdit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(recibo.id)}
                            disabled={deleteLoading === recibo.id}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 disabled:opacity-50"
                            title="Eliminar recibo"
                          >
                            {deleteLoading === recibo.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-r-transparent border-red-600"></div>
                            ) : (
                              <FiTrash2 className="h-4 w-4" />
                            )}
                          </button>
                          <Link
                            href={`/recibos/${recibo.id}/imprimir`}
                            className="text-green-600 hover:text-green-900 transition-colors duration-150 p-1"
                            title="Imprimir recibo"
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
const datosEjemplo: Recibo[] = [
  {
    id: 1,
    numero_recibo: "REC-2023-001",
    fecha_emision: "2023-05-10",
    fecha_vencimiento: "2023-06-10",
    cliente: "Comercial Acme, S.L.",
    cliente_id: 1,
    factura_id: 1,
    numero_factura: "FAC-2023-001",
    monto: 1250.75,
    monto_pagado: 1250.75,
    saldo_pendiente: 0,
    estado: "pagado",
    metodo_pago: "Transferencia",
    notas: "Pago recibido completo",
    created_at: "2023-05-10T08:30:00Z"
  },
  {
    id: 2,
    numero_recibo: "REC-2023-002",
    fecha_emision: "2023-05-20",
    fecha_vencimiento: "2023-06-20",
    cliente: "Distribuciones García",
    cliente_id: 2,
    factura_id: 2,
    numero_factura: "FAC-2023-002",
    monto: 2350.00,
    monto_pagado: 1175.00,
    saldo_pendiente: 1175.00,
    estado: "parcial",
    metodo_pago: "Transferencia",
    notas: "Pago del 50% recibido",
    created_at: "2023-05-20T14:15:00Z"
  },
  {
    id: 3,
    numero_recibo: "REC-2023-003",
    fecha_emision: "2023-06-01",
    fecha_vencimiento: "2023-07-01",
    cliente: "Industrias Martínez, S.A.",
    cliente_id: 3,
    factura_id: 3,
    numero_factura: "FAC-2023-003",
    monto: 4500.00,
    monto_pagado: 0,
    saldo_pendiente: 4500.00,
    estado: "pendiente",
    metodo_pago: "Transferencia",
    notas: null,
    created_at: "2023-06-01T09:45:00Z"
  },
  {
    id: 4,
    numero_recibo: "REC-2023-004",
    fecha_emision: "2023-04-15",
    fecha_vencimiento: "2023-05-15",
    cliente: "Electrónica Europa",
    cliente_id: 4,
    factura_id: 4,
    numero_factura: "FAC-2023-004",
    monto: 1800.00,
    monto_pagado: 0,
    saldo_pendiente: 1800.00,
    estado: "vencido",
    metodo_pago: "Transferencia",
    notas: "Recordatorio enviado el 20/05/2023",
    created_at: "2023-04-15T10:30:00Z"
  },
  {
    id: 5,
    numero_recibo: "REC-2023-005",
    fecha_emision: "2023-06-15",
    fecha_vencimiento: "2023-07-15",
    cliente: "Importaciones del Sur",
    cliente_id: 5,
    factura_id: 5,
    numero_factura: "FAC-2023-005",
    monto: 950.30,
    monto_pagado: 0,
    saldo_pendiente: 0,
    estado: "cancelado",
    metodo_pago: "Transferencia",
    notas: "Factura cancelada por acuerdo con el cliente",
    created_at: "2023-06-15T11:10:00Z"
  }
]; 
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiPlus, FiEdit, FiEye, FiTrash2, FiDownload, FiSearch, FiTag, FiCalendar, FiClock, FiX, FiUser, FiFileText, FiAnchor, FiGlobe, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiPackage, FiMapPin, FiTruck } from "react-icons/fi";
import { getSupabaseClient, ejecutarMigracionInstruccionesBL } from "@/lib/supabase";

// Definición del tipo para instrucciones BL
type InstruccionBL = {
  id: number;
  numero_instruccion: string;
  fecha_creacion: string;
  fecha_estimada_embarque: string;
  cliente: string;
  cliente_id: number;
  envio_id: number | null;
  numero_envio: string | null;
  estado: string;
  consignatario: string;
  puerto_carga: string;
  puerto_descarga: string;
  tipo_carga: string;
  incoterm: string;
  notas: string | null;
  created_at: string;
};

export default function InstruccionesBLPage() {
  const [instrucciones, setInstrucciones] = useState<InstruccionBL[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados para instrucciones BL
  const estadosInstruccion = [
    { value: "borrador", label: "Borrador", color: "bg-gray-100 text-gray-800", icon: <FiFileText className="mr-1.5 h-3 w-3" /> },
    { value: "pendiente", label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: <FiClock className="mr-1.5 h-3 w-3" /> },
    { value: "aprobada", label: "Aprobada", color: "bg-green-100 text-green-800", icon: <FiCheckCircle className="mr-1.5 h-3 w-3" /> },
    { value: "enviada", label: "Enviada", color: "bg-blue-100 text-blue-800", icon: <FiRefreshCw className="mr-1.5 h-3 w-3" /> },
    { value: "rechazada", label: "Rechazada", color: "bg-red-100 text-red-800", icon: <FiAlertCircle className="mr-1.5 h-3 w-3" /> },
    { value: "completada", label: "Completada", color: "bg-indigo-100 text-indigo-800", icon: <FiAnchor className="mr-1.5 h-3 w-3" /> },
  ];

  // Tipos de carga
  const tiposCarga = [
    "FCL (Full Container Load)",
    "LCL (Less Container Load)",
    "Granel",
    "Break Bulk",
    "Ro-Ro",
    "Carga Refrigerada"
  ];

  // Incoterms comunes
  const incoterms = [
    "EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"
  ];

  // Cargar datos de instrucciones BL
  useEffect(() => {
    cargarInstruccionesBL();
  }, []);

  const cargarInstruccionesBL = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      
      // Primero ejecutamos la migración para asegurarnos de que la tabla existe
      console.log('Ejecutando migración de instrucciones BL...');
      const resultadoMigracion = await ejecutarMigracionInstruccionesBL();
      
      if (!resultadoMigracion.success) {
        console.error('Error en la migración de instrucciones BL:', resultadoMigracion.error);
        setError('Error inicializando la tabla de instrucciones BL: ' + resultadoMigracion.message);
        setInstrucciones(datosEjemplo);
        setLoading(false);
        return;
      }
      
      console.log('Migración completada, cargando datos...');
      
      // Si la migración fue exitosa, cargar los datos
      const { data, error } = await supabase
        .from("instrucciones_bl")
        .select(`
          *,
          clientes(nombre),
          envios(numero_envio)
        `)
        .order("fecha_creacion", { ascending: false });

      if (error) {
        console.error("Error cargando instrucciones BL:", error);
        setError("Error al cargar datos: " + error.message);
        setInstrucciones(datosEjemplo);
      } else if (data && data.length > 0) {
        // Formatear los datos recibidos
        const instruccionesFormateadas = data.map(item => ({
          ...item,
          cliente: item.clientes?.nombre || item.cliente || 'Cliente sin asignar',
          numero_envio: item.envios?.numero_envio || 'Sin asignar'
        }));
        setInstrucciones(instruccionesFormateadas as InstruccionBL[]);
      } else {
        // Si no hay datos, usar los de ejemplo
        setInstrucciones(datosEjemplo);
      }
    } catch (error: any) {
      console.error("Error:", error);
      setError("Error desconocido al cargar los datos");
      setInstrucciones(datosEjemplo);
    } finally {
      setLoading(false);
    }
  };

  // Manejar eliminación
  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar esta instrucción BL? Esta acción no se puede deshacer.")) 
      return;
    
    setDeleteLoading(id);
    
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from("instrucciones_bl")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      // Actualizar lista después de eliminar
      setInstrucciones(prevInstrucciones => prevInstrucciones.filter(instruccion => instruccion.id !== id));
      
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      setError(`Error al eliminar: ${error.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filtrar instrucciones
  const instruccionesFiltradas = instrucciones.filter(instruccion => {
    const cumpleFiltroTexto = 
      instruccion.numero_instruccion.toLowerCase().includes(filtro.toLowerCase()) ||
      instruccion.cliente.toLowerCase().includes(filtro.toLowerCase()) ||
      instruccion.consignatario.toLowerCase().includes(filtro.toLowerCase()) ||
      instruccion.puerto_carga.toLowerCase().includes(filtro.toLowerCase()) ||
      instruccion.puerto_descarga.toLowerCase().includes(filtro.toLowerCase()) ||
      (instruccion.numero_envio && instruccion.numero_envio.toLowerCase().includes(filtro.toLowerCase()));
    
    const cumpleFiltroEstado = estadoFiltro === "todos" || instruccion.estado === estadoFiltro;
    
    return cumpleFiltroTexto && cumpleFiltroEstado;
  });

  // Obtener estilos de estado
  const getEstadoStyles = (estado: string) => {
    const estadoObj = estadosInstruccion.find(e => e.value === estado);
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

  return (
    <div className="py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 sm:mb-0">
            Instrucciones BL
          </h1>
          <Link 
            href="/instrucciones-bl/new"
            className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nueva Instrucción
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
                  placeholder="Buscar por número, cliente, consignatario o puertos..."
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
                  {estadosInstruccion.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de instrucciones BL */}
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Cargando instrucciones BL...</p>
          </div>
        ) : instruccionesFiltradas.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="flex justify-center mb-4">
              <FiFileText className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg mb-4">
              {filtro || estadoFiltro !== 'todos' ? (
                'No se encontraron instrucciones BL con los filtros seleccionados'
              ) : (
                'No hay instrucciones BL registradas'
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
                      Nº Instrucción
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiCalendar className="mr-1 text-indigo-500" />
                      Fecha Creación
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
                      <FiAnchor className="mr-1 text-indigo-500" />
                      Puerto Carga
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiMapPin className="mr-1 text-indigo-500" />
                      Puerto Descarga
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiPackage className="mr-1 text-indigo-500" />
                      Tipo Carga
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
                {instruccionesFiltradas.map((instruccion) => {
                  const { bgColor, textColor } = getEstadoStyles(instruccion.estado);
                  
                  return (
                    <tr key={instruccion.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{instruccion.numero_instruccion}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiCalendar className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatDate(instruccion.fecha_creacion)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <FiUser className="mr-1 text-indigo-500 h-4 w-4" />
                          {instruccion.cliente}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiAnchor className="mr-1 text-indigo-500 h-4 w-4" />
                          {instruccion.puerto_carga}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiMapPin className="mr-1 text-indigo-500 h-4 w-4" />
                          {instruccion.puerto_descarga}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiPackage className="mr-1 text-indigo-500 h-4 w-4" />
                          {instruccion.tipo_carga}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
                          {instruccion.estado.charAt(0).toUpperCase() + instruccion.estado.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link 
                            href={`/instrucciones-bl/${instruccion.id}`} 
                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150 p-1"
                            title="Ver detalles"
                          >
                            <FiEye className="h-4 w-4" />
                          </Link>
                          <Link 
                            href={`/instrucciones-bl/edit/${instruccion.id}`} 
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1"
                            title="Editar instrucción"
                          >
                            <FiEdit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(instruccion.id)}
                            disabled={deleteLoading === instruccion.id}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 disabled:opacity-50"
                            title="Eliminar instrucción"
                          >
                            {deleteLoading === instruccion.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-r-transparent border-red-600"></div>
                            ) : (
                              <FiTrash2 className="h-4 w-4" />
                            )}
                          </button>
                          <Link
                            href={`/instrucciones-bl/${instruccion.id}/pdf`}
                            className="text-green-600 hover:text-green-900 transition-colors duration-150 p-1"
                            title="Ver BL Info"
                          >
                            <FiFileText className="h-4 w-4" />
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
const datosEjemplo: InstruccionBL[] = [
  {
    id: 1,
    numero_instruccion: "BL-2023-001",
    fecha_creacion: "2023-05-10",
    fecha_estimada_embarque: "2023-06-15",
    cliente: "Comercial Acme, S.L.",
    cliente_id: 1,
    envio_id: 1,
    numero_envio: "ENV-2023-001",
    estado: "aprobada",
    consignatario: "Global Imports Inc.",
    puerto_carga: "Valencia, España",
    puerto_descarga: "Shanghai, China",
    tipo_carga: "FCL (Full Container Load)",
    incoterm: "FOB",
    notas: "Requiere certificado fitosanitario",
    created_at: "2023-05-10T08:30:00Z"
  },
  {
    id: 2,
    numero_instruccion: "BL-2023-002",
    fecha_creacion: "2023-05-20",
    fecha_estimada_embarque: "2023-06-25",
    cliente: "Distribuciones García",
    cliente_id: 2,
    envio_id: 2,
    numero_envio: "ENV-2023-002",
    estado: "pendiente",
    consignatario: "American Distributors LLC",
    puerto_carga: "Barcelona, España",
    puerto_descarga: "New York, EE.UU.",
    tipo_carga: "LCL (Less Container Load)",
    incoterm: "CIF",
    notas: "Mercancía frágil, manejo especial",
    created_at: "2023-05-20T14:15:00Z"
  },
  {
    id: 3,
    numero_instruccion: "BL-2023-003",
    fecha_creacion: "2023-06-01",
    fecha_estimada_embarque: "2023-07-10",
    cliente: "Industrias Martínez, S.A.",
    cliente_id: 3,
    envio_id: 3,
    numero_envio: "ENV-2023-003",
    estado: "borrador",
    consignatario: "European Logistics GmbH",
    puerto_carga: "Bilbao, España",
    puerto_descarga: "Hamburgo, Alemania",
    tipo_carga: "Granel",
    incoterm: "EXW",
    notas: null,
    created_at: "2023-06-01T09:45:00Z"
  },
  {
    id: 4,
    numero_instruccion: "BL-2023-004",
    fecha_creacion: "2023-06-10",
    fecha_estimada_embarque: "2023-07-20",
    cliente: "Electrónica Europa",
    cliente_id: 4,
    envio_id: 4,
    numero_envio: "ENV-2023-004",
    estado: "rechazada",
    consignatario: "Asian Electronics Co.",
    puerto_carga: "Valencia, España",
    puerto_descarga: "Hong Kong, China",
    tipo_carga: "FCL (Full Container Load)",
    incoterm: "CIF",
    notas: "Rechazada por documentación incompleta",
    created_at: "2023-06-10T16:20:00Z"
  },
  {
    id: 5,
    numero_instruccion: "BL-2023-005",
    fecha_creacion: "2023-06-15",
    fecha_estimada_embarque: "2023-07-30",
    cliente: "Importaciones del Sur",
    cliente_id: 5,
    envio_id: 5,
    numero_envio: "ENV-2023-005",
    estado: "completada",
    consignatario: "Mediterranean Trade Company",
    puerto_carga: "Algeciras, España",
    puerto_descarga: "Casablanca, Marruecos",
    tipo_carga: "Break Bulk",
    incoterm: "DAP",
    notas: "Entrega realizada sin incidencias",
    created_at: "2023-06-15T11:10:00Z"
  }
]; 
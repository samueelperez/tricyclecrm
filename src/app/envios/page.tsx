"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiPlus, FiEdit, FiEye, FiTrash2, FiDownload, FiFilter, FiSearch, FiTruck, FiUser, FiMapPin, FiTag, FiCalendar, FiClock, FiX, FiRefreshCw, FiPackage } from "react-icons/fi";
import { getSupabaseClient, ejecutarMigracionEnvios } from "@/lib/supabase";

// Definición del tipo para envíos
type Envio = {
  id: number;
  numero_envio: string;
  fecha_envio: string;
  cliente: string;
  destino: string;
  estado: string;
  transportista: string;
  peso_total: number;
  num_paquetes: number;
  created_at: string;
};

export default function EnviosPage() {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados para envíos
  const estadosEnvio = [
    { value: "pendiente", label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: <FiClock className="mr-1.5 h-3 w-3" /> },
    { value: "en_transito", label: "En Tránsito", color: "bg-blue-100 text-blue-800", icon: <FiTruck className="mr-1.5 h-3 w-3" /> },
    { value: "entregado", label: "Entregado", color: "bg-green-100 text-green-800", icon: <FiPackage className="mr-1.5 h-3 w-3" /> },
    { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-800", icon: <FiX className="mr-1.5 h-3 w-3" /> },
  ];

  // Cargar datos de envíos
  useEffect(() => {
    cargarEnvios();
  }, []);

  const cargarEnvios = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      
      // Primero ejecutamos la migración para asegurarnos de que la tabla existe
      console.log('Ejecutando migración de envíos...');
      const resultadoMigracion = await ejecutarMigracionEnvios();
      
      if (!resultadoMigracion.success) {
        console.error('Error en la migración de envíos:', resultadoMigracion.error);
        setError('Error inicializando la tabla de envíos: ' + resultadoMigracion.message);
        setEnvios(datosEjemplo);
        setLoading(false);
        return;
      }
      
      console.log('Migración completada, cargando datos...');
      
      // Si la migración fue exitosa, cargar los datos
      const { data, error } = await supabase
        .from("envios")
        .select("*")
        .order("fecha_envio", { ascending: false });

      if (error) {
        console.error("Error cargando envíos:", error);
        // Mostrar un mensaje de error pero seguir con datos de ejemplo
        setError("Error al cargar datos: " + error.message);
        setEnvios(datosEjemplo);
      } else if (data) {
        setEnvios(data as Envio[]);
      } else {
        // Si no hay datos, usar los de ejemplo
        setEnvios(datosEjemplo);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error desconocido al cargar los datos");
      setEnvios(datosEjemplo);
    } finally {
      setLoading(false);
    }
  };

  // Manejar eliminación
  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este envío? Esta acción no se puede deshacer.")) 
      return;
    
    setDeleteLoading(id);
    
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from("envios")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      // Actualizar lista después de eliminar
      setEnvios(prevEnvios => prevEnvios.filter(envio => envio.id !== id));
      
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      setError(`Error al eliminar: ${error.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filtrar envíos
  const enviosFiltrados = envios.filter(envio => {
    const cumpleFiltroTexto = 
      envio.numero_envio.toLowerCase().includes(filtro.toLowerCase()) ||
      envio.cliente.toLowerCase().includes(filtro.toLowerCase()) ||
      envio.destino.toLowerCase().includes(filtro.toLowerCase()) ||
      envio.transportista.toLowerCase().includes(filtro.toLowerCase());
    
    const cumpleFiltroEstado = estadoFiltro === "todos" || envio.estado === estadoFiltro;
    
    return cumpleFiltroTexto && cumpleFiltroEstado;
  });

  // Obtener estilos de estado
  const getEstadoStyles = (estado: string) => {
    const estadoObj = estadosEnvio.find(e => e.value === estado);
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
            Envíos
          </h1>
          <Link 
            href="/envios/new"
            className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nuevo Envío
          </Link>
        </div>
        
        {/* Mensaje de error */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm animate-fadeIn">
            <div className="flex">
              <div className="flex-shrink-0 text-red-500">
                <FiTrash2 className="h-5 w-5" />
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
                  placeholder="Buscar por número, cliente, destino o transportista..."
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
                  {estadosEnvio.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de envíos */}
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Cargando envíos...</p>
          </div>
        ) : enviosFiltrados.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="flex justify-center mb-4">
              <FiTruck className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg mb-4">
              {filtro || estadoFiltro !== 'todos' ? (
                'No se encontraron envíos con los filtros seleccionados'
              ) : (
                'No hay envíos registrados'
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
                      <FiTruck className="mr-1 text-indigo-500" />
                      Nº Envío
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
                      Cliente
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiMapPin className="mr-1 text-indigo-500" />
                      Destino
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
                      <FiRefreshCw className="mr-1 text-indigo-500" />
                      Transportista
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiPackage className="mr-1 text-indigo-500" />
                      Paquetes
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enviosFiltrados.map((envio) => {
                  const { bgColor, textColor } = getEstadoStyles(envio.estado);
                  
                  return (
                    <tr key={envio.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{envio.numero_envio}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiCalendar className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatDate(envio.fecha_envio)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <FiUser className="mr-1 text-indigo-500 h-4 w-4" />
                          {envio.cliente}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiMapPin className="mr-1 text-indigo-500 h-4 w-4" />
                          {envio.destino}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
                          {envio.estado.charAt(0).toUpperCase() + envio.estado.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiTruck className="mr-1 text-indigo-500 h-4 w-4" />
                          {envio.transportista}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiPackage className="mr-1 text-indigo-500 h-4 w-4" />
                          {envio.num_paquetes}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link 
                            href={`/envios/${envio.id}`} 
                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150 p-1"
                            title="Ver detalles"
                          >
                            <FiEye className="h-4 w-4" />
                          </Link>
                          <Link 
                            href={`/envios/edit/${envio.id}`} 
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1"
                            title="Editar envío"
                          >
                            <FiEdit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(envio.id)}
                            disabled={deleteLoading === envio.id}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 disabled:opacity-50"
                            title="Eliminar envío"
                          >
                            {deleteLoading === envio.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-r-transparent border-red-600"></div>
                            ) : (
                              <FiTrash2 className="h-4 w-4" />
                            )}
                          </button>
                          <Link
                            href={`/envios/${envio.id}/documento`}
                            className="text-green-600 hover:text-green-900 transition-colors duration-150 p-1"
                            title="Descargar documentación"
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
const datosEjemplo: Envio[] = [
  {
    id: 1,
    numero_envio: "ENV-2023-001",
    fecha_envio: "2023-05-15",
    cliente: "Comercial Acme, S.L.",
    destino: "Barcelona, España",
    estado: "entregado",
    transportista: "Seur",
    peso_total: 125.5,
    num_paquetes: 3,
    created_at: "2023-05-14T10:30:00Z"
  },
  {
    id: 2,
    numero_envio: "ENV-2023-002",
    fecha_envio: "2023-05-28",
    cliente: "Distribuciones García",
    destino: "Madrid, España",
    estado: "en_transito",
    transportista: "MRW",
    peso_total: 45.2,
    num_paquetes: 1,
    created_at: "2023-05-27T14:15:00Z"
  },
  {
    id: 3,
    numero_envio: "ENV-2023-003",
    fecha_envio: "2023-06-05",
    cliente: "Industrias Martínez, S.A.",
    destino: "Valencia, España",
    estado: "pendiente",
    transportista: "DHL",
    peso_total: 230.0,
    num_paquetes: 5,
    created_at: "2023-06-04T09:45:00Z"
  },
  {
    id: 4,
    numero_envio: "ENV-2023-004",
    fecha_envio: "2023-06-12",
    cliente: "Electrónica Europa",
    destino: "Berlín, Alemania",
    estado: "cancelado",
    transportista: "FedEx",
    peso_total: 78.3,
    num_paquetes: 2,
    created_at: "2023-06-11T16:20:00Z"
  },
  {
    id: 5,
    numero_envio: "ENV-2023-005",
    fecha_envio: "2023-06-20",
    cliente: "Importaciones del Sur",
    destino: "Sevilla, España",
    estado: "entregado",
    transportista: "Correos Express",
    peso_total: 103.7,
    num_paquetes: 4,
    created_at: "2023-06-19T11:10:00Z"
  }
]; 
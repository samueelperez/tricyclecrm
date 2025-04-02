"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiPlus, FiEdit, FiEye, FiTrash2, FiDownload, FiSearch, FiPackage, FiUser, FiBox, FiTag, FiCalendar, FiClock, FiX, FiRefreshCw, FiList, FiClipboard, FiTruck } from "react-icons/fi";
import { getSupabaseClient, ejecutarMigracionListasEmpaque } from "@/lib/supabase";

// Definición del tipo para listas de empaque
type ListaEmpaque = {
  id: number;
  numero_lista: string;
  fecha_creacion: string;
  cliente: string;
  envio_id: number;
  numero_envio: string;
  estado: string;
  num_items: number;
  peso_total: number;
  created_at: string;
};

export default function ListasEmpaquePage() {
  const [listasEmpaque, setListasEmpaque] = useState<ListaEmpaque[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados para listas de empaque
  const estadosLista = [
    { value: "borrador", label: "Borrador", color: "bg-gray-100 text-gray-800", icon: <FiClipboard className="mr-1.5 h-3 w-3" /> },
    { value: "pendiente", label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: <FiClock className="mr-1.5 h-3 w-3" /> },
    { value: "completa", label: "Completa", color: "bg-green-100 text-green-800", icon: <FiList className="mr-1.5 h-3 w-3" /> },
    { value: "enviada", label: "Enviada", color: "bg-blue-100 text-blue-800", icon: <FiTruck className="mr-1.5 h-3 w-3" /> },
    { value: "cancelada", label: "Cancelada", color: "bg-red-100 text-red-800", icon: <FiX className="mr-1.5 h-3 w-3" /> },
  ];

  // Cargar datos de listas de empaque
  useEffect(() => {
    cargarListasEmpaque();
  }, []);

  const cargarListasEmpaque = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      
      // Primero ejecutamos la migración para asegurarnos de que la tabla existe
      console.log('Ejecutando migración de listas de empaque...');
      const resultadoMigracion = await ejecutarMigracionListasEmpaque();
      
      if (!resultadoMigracion.success) {
        console.error('Error en la migración de listas de empaque:', resultadoMigracion.error);
        setError('Error inicializando la tabla de listas de empaque: ' + resultadoMigracion.message);
        setListasEmpaque(datosEjemplo);
        setLoading(false);
        return;
      }
      
      console.log('Migración completada, cargando datos...');
      
      // Si la migración fue exitosa, cargar los datos
      const { data, error } = await supabase
        .from("listas_empaque")
        .select(`
          *,
          envios (numero_envio)
        `)
        .order("fecha_creacion", { ascending: false });

      if (error) {
        console.error("Error cargando listas de empaque:", error);
        setError("Error al cargar datos: " + error.message);
        setListasEmpaque(datosEjemplo);
      } else if (data && data.length > 0) {
        // Formatear los datos recibidos
        const listasFormateadas = data.map(item => ({
          ...item,
          numero_envio: item.envios?.numero_envio || 'Sin asignar'
        }));
        setListasEmpaque(listasFormateadas as ListaEmpaque[]);
      } else {
        // Si no hay datos, usar los de ejemplo
        setListasEmpaque(datosEjemplo);
      }
    } catch (error: any) {
      console.error("Error:", error);
      setError("Error desconocido al cargar los datos");
      setListasEmpaque(datosEjemplo);
    } finally {
      setLoading(false);
    }
  };

  // Manejar eliminación
  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar esta lista de empaque? Esta acción no se puede deshacer.")) 
      return;
    
    setDeleteLoading(id);
    
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from("listas_empaque")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      // Actualizar lista después de eliminar
      setListasEmpaque(prevListas => prevListas.filter(lista => lista.id !== id));
      
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      setError(`Error al eliminar: ${error.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filtrar listas de empaque
  const listasFiltradas = listasEmpaque.filter(lista => {
    const cumpleFiltroTexto = 
      lista.numero_lista.toLowerCase().includes(filtro.toLowerCase()) ||
      lista.cliente.toLowerCase().includes(filtro.toLowerCase()) ||
      lista.numero_envio.toLowerCase().includes(filtro.toLowerCase());
    
    const cumpleFiltroEstado = estadoFiltro === "todos" || lista.estado === estadoFiltro;
    
    return cumpleFiltroTexto && cumpleFiltroEstado;
  });

  // Obtener estilos de estado
  const getEstadoStyles = (estado: string) => {
    const estadoObj = estadosLista.find(e => e.value === estado);
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
            Listas de Empaque
          </h1>
          <Link 
            href="/listas-empaque/new"
            className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nueva Lista
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
                  placeholder="Buscar por número, cliente o envío relacionado..."
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
                  {estadosLista.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de listas de empaque */}
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Cargando listas de empaque...</p>
          </div>
        ) : listasFiltradas.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="flex justify-center mb-4">
              <FiList className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg mb-4">
              {filtro || estadoFiltro !== 'todos' ? (
                'No se encontraron listas de empaque con los filtros seleccionados'
              ) : (
                'No hay listas de empaque registradas'
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
                      <FiList className="mr-1 text-indigo-500" />
                      Nº Lista
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
                      <FiTruck className="mr-1 text-indigo-500" />
                      Nº Envío
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
                      <FiBox className="mr-1 text-indigo-500" />
                      Items
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiPackage className="mr-1 text-indigo-500" />
                      Peso Total
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {listasFiltradas.map((lista) => {
                  const { bgColor, textColor } = getEstadoStyles(lista.estado);
                  
                  return (
                    <tr key={lista.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lista.numero_lista}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiCalendar className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatDate(lista.fecha_creacion)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <FiUser className="mr-1 text-indigo-500 h-4 w-4" />
                          {lista.cliente}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiTruck className="mr-1 text-indigo-500 h-4 w-4" />
                          {lista.numero_envio}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
                          {lista.estado.charAt(0).toUpperCase() + lista.estado.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiBox className="mr-1 text-indigo-500 h-4 w-4" />
                          {lista.num_items}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiPackage className="mr-1 text-indigo-500 h-4 w-4" />
                          {lista.peso_total} kg
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link 
                            href={`/listas-empaque/${lista.id}`} 
                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150 p-1"
                            title="Ver detalles"
                          >
                            <FiEye className="h-4 w-4" />
                          </Link>
                          <Link 
                            href={`/listas-empaque/edit/${lista.id}`} 
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1"
                            title="Editar lista"
                          >
                            <FiEdit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(lista.id)}
                            disabled={deleteLoading === lista.id}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 disabled:opacity-50"
                            title="Eliminar lista"
                          >
                            {deleteLoading === lista.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-r-transparent border-red-600"></div>
                            ) : (
                              <FiTrash2 className="h-4 w-4" />
                            )}
                          </button>
                          <Link
                            href={`/listas-empaque/${lista.id}/imprimir`}
                            className="text-green-600 hover:text-green-900 transition-colors duration-150 p-1"
                            title="Imprimir lista"
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
const datosEjemplo: ListaEmpaque[] = [
  {
    id: 1,
    numero_lista: "PL-2023-001",
    fecha_creacion: "2023-05-10",
    cliente: "Comercial Acme, S.L.",
    envio_id: 1,
    numero_envio: "ENV-2023-001",
    estado: "completa",
    num_items: 15,
    peso_total: 125.5,
    created_at: "2023-05-10T08:30:00Z"
  },
  {
    id: 2,
    numero_lista: "PL-2023-002",
    fecha_creacion: "2023-05-20",
    cliente: "Distribuciones García",
    envio_id: 2,
    numero_envio: "ENV-2023-002",
    estado: "pendiente",
    num_items: 8,
    peso_total: 45.2,
    created_at: "2023-05-20T14:15:00Z"
  },
  {
    id: 3,
    numero_lista: "PL-2023-003",
    fecha_creacion: "2023-06-01",
    cliente: "Industrias Martínez, S.A.",
    envio_id: 3,
    numero_envio: "ENV-2023-003",
    estado: "borrador",
    num_items: 24,
    peso_total: 230.0,
    created_at: "2023-06-01T09:45:00Z"
  },
  {
    id: 4,
    numero_lista: "PL-2023-004",
    fecha_creacion: "2023-06-10",
    cliente: "Electrónica Europa",
    envio_id: 4,
    numero_envio: "ENV-2023-004",
    estado: "cancelada",
    num_items: 6,
    peso_total: 78.3,
    created_at: "2023-06-10T16:20:00Z"
  },
  {
    id: 5,
    numero_lista: "PL-2023-005",
    fecha_creacion: "2023-06-15",
    cliente: "Importaciones del Sur",
    envio_id: 5,
    numero_envio: "ENV-2023-005",
    estado: "enviada",
    num_items: 12,
    peso_total: 103.7,
    created_at: "2023-06-15T11:10:00Z"
  }
]; 
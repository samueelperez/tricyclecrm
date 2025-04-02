"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiPlus, FiEdit, FiEye, FiTrash2, FiDownload, FiSearch, FiTag, FiCalendar, FiClock, FiX, FiUser, FiDollarSign, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiFileText } from "react-icons/fi";
import { getSupabaseClient, ejecutarMigracionNegocios } from "@/lib/supabase";

// Definición del tipo para negocios
type Negocio = {
  id: number;
  numero_negocio: string;
  fecha_creacion: string;
  fecha_estimada_cierre: string;
  cliente: string;
  cliente_id: number;
  valor: number;
  estado: string;
  etapa: string;
  probabilidad: number;
  asignado_a: string;
  productos: string[];
  notas: string | null;
  created_at: string;
};

export default function NegociosPage() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados para negocios
  const estadosNegocio = [
    { value: "prospecto", label: "Prospecto", color: "bg-purple-100 text-purple-800", icon: <FiTag className="mr-1.5 h-3 w-3" /> },
    { value: "calificado", label: "Calificado", color: "bg-blue-100 text-blue-800", icon: <FiCheckCircle className="mr-1.5 h-3 w-3" /> },
    { value: "propuesta", label: "Propuesta", color: "bg-yellow-100 text-yellow-800", icon: <FiFileText className="mr-1.5 h-3 w-3" /> },
    { value: "negociacion", label: "Negociación", color: "bg-orange-100 text-orange-800", icon: <FiRefreshCw className="mr-1.5 h-3 w-3" /> },
    { value: "ganado", label: "Ganado", color: "bg-green-100 text-green-800", icon: <FiCheckCircle className="mr-1.5 h-3 w-3" /> },
    { value: "perdido", label: "Perdido", color: "bg-red-100 text-red-800", icon: <FiX className="mr-1.5 h-3 w-3" /> },
  ];

  // Cargar datos de negocios
  useEffect(() => {
    cargarNegocios();
  }, []);

  const cargarNegocios = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      
      // Primero ejecutamos la migración para asegurarnos de que la tabla existe
      console.log('Ejecutando migración de negocios...');
      const resultadoMigracion = await ejecutarMigracionNegocios();
      
      if (!resultadoMigracion.success) {
        console.error('Error en la migración de negocios:', resultadoMigracion.error);
        setError('Error inicializando la tabla de negocios: ' + resultadoMigracion.message);
        setNegocios(datosEjemplo);
        setLoading(false);
        return;
      }
      
      console.log('Migración completada, cargando datos...');
      
      // Si la migración fue exitosa, cargar los datos
      const { data, error } = await supabase
        .from("negocios")
        .select(`
          *,
          clientes(nombre)
        `)
        .order("fecha_creacion", { ascending: false });

      if (error) {
        console.error("Error cargando negocios:", error);
        setError("Error al cargar datos: " + error.message);
        setNegocios(datosEjemplo);
      } else if (data && data.length > 0) {
        // Formatear los datos recibidos
        const negociosFormateados = data.map(item => ({
          ...item,
          cliente: item.clientes?.nombre || item.cliente || 'Cliente sin asignar'
        }));
        setNegocios(negociosFormateados as Negocio[]);
      } else {
        // Si no hay datos, usar los de ejemplo
        setNegocios(datosEjemplo);
      }
    } catch (error: any) {
      console.error("Error:", error);
      setError("Error desconocido al cargar los datos");
      setNegocios(datosEjemplo);
    } finally {
      setLoading(false);
    }
  };

  // Manejar eliminación
  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este negocio? Esta acción no se puede deshacer.")) 
      return;
    
    setDeleteLoading(id);
    
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from("negocios")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      // Actualizar lista después de eliminar
      setNegocios(prevNegocios => prevNegocios.filter(negocio => negocio.id !== id));
      
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      setError(`Error al eliminar: ${error.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filtrar negocios
  const negociosFiltrados = negocios.filter(negocio => {
    const cumpleFiltroTexto = 
      negocio.numero_negocio.toLowerCase().includes(filtro.toLowerCase()) ||
      negocio.cliente.toLowerCase().includes(filtro.toLowerCase()) ||
      negocio.asignado_a.toLowerCase().includes(filtro.toLowerCase());
    
    const cumpleFiltroEstado = estadoFiltro === "todos" || negocio.estado === estadoFiltro;
    
    return cumpleFiltroTexto && cumpleFiltroEstado;
  });

  // Obtener estilos de estado
  const getEstadoStyles = (estado: string) => {
    const estadoObj = estadosNegocio.find(e => e.value === estado);
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
            Negocios
          </h1>
          <Link 
            href="/negocios/new"
            className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nuevo Negocio
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
                  placeholder="Buscar por número, cliente o responsable..."
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
                  {estadosNegocio.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de negocios */}
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Cargando negocios...</p>
          </div>
        ) : negociosFiltrados.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="flex justify-center mb-4">
              <FiTag className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg mb-4">
              {filtro || estadoFiltro !== 'todos' ? (
                'No se encontraron negocios con los filtros seleccionados'
              ) : (
                'No hay negocios registrados'
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
                      <FiTag className="mr-1 text-indigo-500" />
                      Nº Negocio
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
                      <FiDollarSign className="mr-1 text-indigo-500" />
                      Valor
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
                      Estimación Cierre
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiUser className="mr-1 text-indigo-500" />
                      Asignado a
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {negociosFiltrados.map((negocio) => {
                  const { bgColor, textColor } = getEstadoStyles(negocio.estado);
                  
                  return (
                    <tr key={negocio.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{negocio.numero_negocio}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiCalendar className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatDate(negocio.fecha_creacion)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <FiUser className="mr-1 text-indigo-500 h-4 w-4" />
                          {negocio.cliente}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <FiDollarSign className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatMonto(negocio.valor)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
                          {negocio.estado.charAt(0).toUpperCase() + negocio.estado.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiClock className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatDate(negocio.fecha_estimada_cierre)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiUser className="mr-1 text-indigo-500 h-4 w-4" />
                          {negocio.asignado_a}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link 
                            href={`/negocios/${negocio.id}`} 
                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150 p-1"
                            title="Ver detalles"
                          >
                            <FiEye className="h-4 w-4" />
                          </Link>
                          <Link 
                            href={`/negocios/edit/${negocio.id}`} 
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1"
                            title="Editar negocio"
                          >
                            <FiEdit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(negocio.id)}
                            disabled={deleteLoading === negocio.id}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 disabled:opacity-50"
                            title="Eliminar negocio"
                          >
                            {deleteLoading === negocio.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-r-transparent border-red-600"></div>
                            ) : (
                              <FiTrash2 className="h-4 w-4" />
                            )}
                          </button>
                          <Link
                            href={`/negocios/${negocio.id}/documento`}
                            className="text-green-600 hover:text-green-900 transition-colors duration-150 p-1"
                            title="Generar propuesta"
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
const datosEjemplo: Negocio[] = [
  {
    id: 1,
    numero_negocio: "NEG-2023-001",
    fecha_creacion: "2023-05-10",
    fecha_estimada_cierre: "2023-06-30",
    cliente: "Comercial Acme, S.L.",
    cliente_id: 1,
    valor: 25000.75,
    estado: "propuesta",
    etapa: "presentacion",
    probabilidad: 60,
    asignado_a: "Juan Pérez",
    productos: ["Producto A", "Producto B"],
    notas: "Cliente muy interesado en nuestra solución.",
    created_at: "2023-05-10T08:30:00Z"
  },
  {
    id: 2,
    numero_negocio: "NEG-2023-002",
    fecha_creacion: "2023-05-20",
    fecha_estimada_cierre: "2023-07-15",
    cliente: "Distribuciones García",
    cliente_id: 2,
    valor: 15750.00,
    estado: "negociacion",
    etapa: "descuento",
    probabilidad: 75,
    asignado_a: "María López",
    productos: ["Servicio Premium"],
    notas: "Negociando términos de precio y entrega.",
    created_at: "2023-05-20T14:15:00Z"
  },
  {
    id: 3,
    numero_negocio: "NEG-2023-003",
    fecha_creacion: "2023-06-01",
    fecha_estimada_cierre: "2023-07-30",
    cliente: "Industrias Martínez, S.A.",
    cliente_id: 3,
    valor: 42000.00,
    estado: "ganado",
    etapa: "cerrado",
    probabilidad: 100,
    asignado_a: "Carlos Rodríguez",
    productos: ["Producto X", "Producto Y", "Mantenimiento"],
    notas: "Contrato firmado. Esperando pago inicial.",
    created_at: "2023-06-01T09:45:00Z"
  },
  {
    id: 4,
    numero_negocio: "NEG-2023-004",
    fecha_creacion: "2023-06-10",
    fecha_estimada_cierre: "2023-08-20",
    cliente: "Electrónica Europa",
    cliente_id: 4,
    valor: 8900.00,
    estado: "prospecto",
    etapa: "contacto_inicial",
    probabilidad: 25,
    asignado_a: "Ana Martínez",
    productos: ["Solución Basic"],
    notas: "Contacto inicial realizado. Esperando feedback.",
    created_at: "2023-06-10T16:20:00Z"
  },
  {
    id: 5,
    numero_negocio: "NEG-2023-005",
    fecha_creacion: "2023-06-15",
    fecha_estimada_cierre: "2023-07-05",
    cliente: "Importaciones del Sur",
    cliente_id: 5,
    valor: 12300.00,
    estado: "perdido",
    etapa: "abandonado",
    probabilidad: 0,
    asignado_a: "Juan Pérez",
    productos: ["Producto C"],
    notas: "Cliente eligió otra solución por menor precio.",
    created_at: "2023-06-15T11:10:00Z"
  }
]; 
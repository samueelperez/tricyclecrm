"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiPlus, FiEdit, FiEye, FiTrash2, FiDownload, FiSearch, FiTag, FiCalendar, FiX, FiDollarSign, FiUser, FiCreditCard, FiCheckCircle, FiAlertCircle, FiShoppingBag, FiFileText } from "react-icons/fi";
import { getSupabaseClient, ejecutarMigracionRecibos } from "@/lib/supabase";

// Definición del tipo para gastos
type Gasto = {
  id: number;
  numero_recibo: string;
  fecha_emision: string;
  categoria: string;
  proveedor: string;
  proveedor_id?: number | null;
  descripcion: string;
  monto: number;
  estado: string;
  metodo_pago: string;
  notas: string | null;
  created_at: string;
  deducible: boolean;
  impuesto: number;
  created_by?: string | null;
};

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Categorías de gastos
  const categoriasGasto = [
    { value: "oficina", label: "Material de Oficina", color: "bg-blue-100 text-blue-800" },
    { value: "viajes", label: "Viajes y Desplazamientos", color: "bg-yellow-100 text-yellow-800" },
    { value: "servicios", label: "Servicios Externos", color: "bg-purple-100 text-purple-800" },
    { value: "suministros", label: "Suministros", color: "bg-green-100 text-green-800" },
    { value: "personal", label: "Gastos de Personal", color: "bg-orange-100 text-orange-800" },
    { value: "impuestos", label: "Impuestos y Tasas", color: "bg-red-100 text-red-800" },
    { value: "marketing", label: "Marketing y Publicidad", color: "bg-indigo-100 text-indigo-800" },
    { value: "otros", label: "Otros Gastos", color: "bg-gray-100 text-gray-800" },
  ];

  // Estados para gastos
  const estadosGasto = [
    { value: "pendiente", label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: <FiAlertCircle className="mr-1.5 h-3 w-3" /> },
    { value: "pagado", label: "Pagado", color: "bg-green-100 text-green-800", icon: <FiCheckCircle className="mr-1.5 h-3 w-3" /> },
    { value: "cancelado", label: "Cancelado", color: "bg-gray-100 text-gray-800", icon: <FiX className="mr-1.5 h-3 w-3" /> },
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

  // Cargar datos de gastos
  useEffect(() => {
    cargarGastos();
  }, []);

  const cargarGastos = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      
      // Primero ejecutamos la migración para asegurarnos de que la tabla existe
      console.log('Ejecutando migración de gastos...');
      const resultadoMigracion = await ejecutarMigracionRecibos();
      
      if (!resultadoMigracion.success) {
        console.error('Error en la migración de gastos:', resultadoMigracion.error);
        setError('Error inicializando la tabla de gastos: ' + resultadoMigracion.message);
        setGastos(datosEjemploGastos);
        setLoading(false);
        return;
      }
      
      console.log('Migración completada, cargando datos...');
      
      // Si la migración fue exitosa, cargar los datos
      const { data, error } = await supabase
        .from("recibos")
        .select(`
          *,
          proveedores(nombre)
        `)
        .order("fecha_emision", { ascending: false });

      if (error) {
        console.error("Error cargando gastos:", error);
        setError("Error al cargar datos: " + error.message);
        setGastos(datosEjemploGastos);
      } else if (data && data.length > 0) {
        // Formatear los datos recibidos como gastos
        const gastosFormateados = data.map(item => ({
          ...item,
          proveedor: item.proveedores?.nombre || item.proveedor || 'Proveedor sin especificar',
          categoria: item.categoria || 'otros',
          deducible: item.deducible || false,
          impuesto: item.impuesto || 21
        }));
        setGastos(gastosFormateados as Gasto[]);
      } else {
        // Si no hay datos, usar los de ejemplo
        setGastos(datosEjemploGastos);
      }
    } catch (error: any) {
      console.error("Error:", error);
      setError("Error desconocido al cargar los datos");
      setGastos(datosEjemploGastos);
    } finally {
      setLoading(false);
    }
  };

  // Manejar eliminación
  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este gasto? Esta acción no se puede deshacer.")) 
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
      setGastos(prevGastos => prevGastos.filter(gasto => gasto.id !== id));
      
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      setError(`Error al eliminar: ${error.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filtrar gastos
  const gastosFiltrados = gastos.filter(gasto => {
    const cumpleFiltroTexto = 
      gasto.numero_recibo.toLowerCase().includes(filtro.toLowerCase()) ||
      gasto.proveedor.toLowerCase().includes(filtro.toLowerCase()) ||
      gasto.descripcion.toLowerCase().includes(filtro.toLowerCase());
    
    const cumpleFiltroCategoria = categoriaFiltro === "todas" || gasto.categoria === categoriaFiltro;
    
    return cumpleFiltroTexto && cumpleFiltroCategoria;
  });

  // Obtener estilos de estado
  const getEstadoStyles = (estado: string) => {
    const estadoObj = estadosGasto.find(e => e.value === estado);
    return {
      bgColor: estadoObj ? estadoObj.color.split(' ')[0] : "bg-gray-100",
      textColor: estadoObj ? estadoObj.color.split(' ')[1] : "text-gray-800",
      icon: estadoObj ? estadoObj.icon : <FiTag className="mr-1.5 h-3 w-3" />
    };
  };

  // Obtener estilos de categoría
  const getCategoriaStyles = (categoria: string) => {
    const categoriaObj = categoriasGasto.find(c => c.value === categoria);
    return {
      bgColor: categoriaObj ? categoriaObj.color.split(' ')[0] : "bg-gray-100",
      textColor: categoriaObj ? categoriaObj.color.split(' ')[1] : "text-gray-800",
      label: categoriaObj ? categoriaObj.label : "Otra categoría"
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
            Gastos de Empresa
          </h1>
          <Link 
            href="/recibos/new"
            className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nuevo Gasto
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
                  placeholder="Buscar por número, proveedor o descripción..."
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
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  className="pl-10 pr-4 py-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                  <option value="todas">Todas las categorías</option>
                  {categoriasGasto.map((categoria) => (
                    <option key={categoria.value} value={categoria.value}>
                      {categoria.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de gastos */}
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Cargando gastos...</p>
          </div>
        ) : gastosFiltrados.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="flex justify-center mb-4">
              <FiShoppingBag className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg mb-4">
              {filtro || categoriaFiltro !== 'todas' ? (
                'No se encontraron gastos con los filtros seleccionados'
              ) : (
                'No hay gastos registrados'
              )}
            </p>
            {(filtro || categoriaFiltro !== 'todas') && (
              <button 
                onClick={() => {
                  setFiltro('');
                  setCategoriaFiltro('todas');
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
                      Nº Recibo
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
                      <FiTag className="mr-1 text-indigo-500" />
                      Categoría
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiUser className="mr-1 text-indigo-500" />
                      Proveedor
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiFileText className="mr-1 text-indigo-500" />
                      Descripción
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiDollarSign className="mr-1 text-indigo-500" />
                      Importe
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiCreditCard className="mr-1 text-indigo-500" />
                      Estado
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gastosFiltrados.map((gasto) => {
                  const { bgColor, textColor } = getEstadoStyles(gasto.estado);
                  const categoria = getCategoriaStyles(gasto.categoria);
                  
                  return (
                    <tr key={gasto.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{gasto.numero_recibo}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiCalendar className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatDate(gasto.fecha_emision)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${categoria.bgColor} ${categoria.textColor}`}>
                          {categoria.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <FiUser className="mr-1 text-indigo-500 h-4 w-4" />
                          {gasto.proveedor}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {gasto.descripcion}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <FiDollarSign className="mr-1 text-indigo-500 h-4 w-4" />
                          {formatMonto(gasto.monto)}
                        </div>
                        {gasto.deducible && (
                          <div className="text-xs text-green-600">
                            Deducible
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
                          {gasto.estado.charAt(0).toUpperCase() + gasto.estado.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link 
                            href={`/recibos/${gasto.id}`} 
                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150 p-1"
                            title="Ver detalles"
                          >
                            <FiEye className="h-4 w-4" />
                          </Link>
                          <Link 
                            href={`/recibos/edit/${gasto.id}`} 
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1"
                            title="Editar gasto"
                          >
                            <FiEdit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(gasto.id)}
                            disabled={deleteLoading === gasto.id}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 disabled:opacity-50"
                            title="Eliminar gasto"
                          >
                            {deleteLoading === gasto.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-r-transparent border-red-600"></div>
                            ) : (
                              <FiTrash2 className="h-4 w-4" />
                            )}
                          </button>
                          <Link
                            href={`/recibos/${gasto.id}/imprimir`}
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
const datosEjemploGastos: Gasto[] = [
  {
    id: 1,
    numero_recibo: "G-2023-001",
    fecha_emision: "2023-05-10",
    categoria: "oficina",
    proveedor: "Papelería Central, S.L.",
    descripcion: "Material de oficina y papelería",
    monto: 125.75,
    estado: "pagado",
    metodo_pago: "Tarjeta",
    notas: "Compra mensual de material de oficina",
    created_at: "2023-05-10T08:30:00Z",
    deducible: true,
    impuesto: 21
  },
  {
    id: 2,
    numero_recibo: "G-2023-002",
    fecha_emision: "2023-05-20",
    categoria: "servicios",
    proveedor: "Asesoría García y Asociados",
    descripcion: "Servicios de asesoría legal mensual",
    monto: 350.00,
    estado: "pendiente",
    metodo_pago: "Transferencia",
    notas: null,
    created_at: "2023-05-20T14:15:00Z",
    deducible: true,
    impuesto: 21
  },
  {
    id: 3,
    numero_recibo: "G-2023-003",
    fecha_emision: "2023-06-01",
    categoria: "viajes",
    proveedor: "Renfe",
    descripcion: "Billete de tren Madrid-Barcelona para reunión con cliente",
    monto: 110.50,
    estado: "pagado",
    metodo_pago: "Tarjeta",
    notas: "Viaje de negocios, deducible de impuestos",
    created_at: "2023-06-01T09:45:00Z",
    deducible: true,
    impuesto: 10
  },
  {
    id: 4,
    numero_recibo: "G-2023-004",
    fecha_emision: "2023-06-15",
    categoria: "suministros",
    proveedor: "Iberdrola",
    descripcion: "Factura de electricidad oficina (junio)",
    monto: 187.65,
    estado: "pagado",
    metodo_pago: "Domiciliación",
    notas: null,
    created_at: "2023-06-15T10:30:00Z",
    deducible: true,
    impuesto: 21
  },
  {
    id: 5,
    numero_recibo: "G-2023-005",
    fecha_emision: "2023-06-30",
    categoria: "marketing",
    proveedor: "Imprenta Rápida",
    descripcion: "Impresión de folletos promocionales",
    monto: 450.30,
    estado: "cancelado",
    metodo_pago: "Transferencia",
    notas: "Pedido cancelado por cambio en diseño",
    created_at: "2023-06-30T11:10:00Z",
    deducible: false,
    impuesto: 21
  }
]; 
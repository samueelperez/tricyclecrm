"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiPlus, FiEdit, FiEye, FiTrash2, FiSearch, FiTag, FiUser, FiPackage, FiTruck } from "react-icons/fi";
import { getSupabaseClient, ejecutarMigracionNegocios } from "@/lib/supabase";

// Definición del tipo para negocios
type Negocio = {
  id: number;
  nombre: string;
  cliente_id: number;
  cliente_nombre?: string;
  material_principal?: string;
  proveedor_principal?: string;
  fecha_inicio?: string;
  descripcion?: string;
  valor_total?: number;
  created_at: string;
  proveedores?: Array<{id: number; nombre: string}>;
  materiales?: Array<{id: number; nombre: string}>;
};

// Interfaces para los datos de las relaciones
interface IProveedor {
  id: number;
  nombre: string;
}

interface IMaterial {
  id: number;
  nombre: string;
}

// Interfaces para los resultados de Supabase
interface ProveedorResult {
  proveedores: IProveedor | Array<IProveedor> | any;
}

interface MaterialResult {
  materiales: IMaterial | Array<IMaterial> | any;
}

export default function NegociosPage() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos de negocios
  useEffect(() => {
    cargarNegocios();
  }, []);

  const cargarNegocios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = getSupabaseClient();
      
      // Primero ejecutamos la migración para asegurarnos de que la tabla existe
      console.log('Ejecutando migración de negocios...');
      const resultadoMigracion = await ejecutarMigracionNegocios();
      
      if (!resultadoMigracion.success) {
        console.error('Error en la migración de negocios:', resultadoMigracion.error);
        setError('Error inicializando la tabla de negocios: ' + resultadoMigracion.message);
        setNegocios([]);
        setLoading(false);
        return;
      }
      
      console.log('Migración completada, cargando datos...');
      
      // Si la migración fue exitosa, cargar los datos
      const { data, error } = await supabase
        .from("negocios")
        .select(`
          *,
          clientes:cliente_id(nombre)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error cargando negocios:", error);
        throw error;
      }
      
      // Obtener datos adicionales de proveedores y materiales para cada negocio
      const negociosConDetalles = await Promise.all((data || []).map(async (negocio) => {
        // Buscar proveedores relacionados
        const { data: proveedoresData } = await supabase
          .from("negocios_proveedores")
          .select(`
            proveedores:proveedor_id(id, nombre)
          `)
          .eq("negocio_id", negocio.id);
          
        // Buscar materiales relacionados
        const { data: materialesData } = await supabase
          .from("negocios_materiales")
          .select(`
            materiales:material_id(id, nombre)
          `)
          .eq("negocio_id", negocio.id);
          
        // Extraer nombres y formatear
        const proveedores = proveedoresData?.map(p => ({
          id: p.proveedores[0].id,
          nombre: p.proveedores[0].nombre
        })) || [];
        
        const materiales = materialesData?.map(m => ({
          id: m.materiales[0].id,
          nombre: m.materiales[0].nombre
        })) || [];
        
        // Determinar proveedor y material principal
        const proveedor_principal = proveedores.length > 0 ? proveedores[0].nombre : 'Sin proveedor';
        const material_principal = materiales.length > 0 ? materiales[0].nombre : 'Sin material definido';
        
        return {
          ...negocio,
          cliente_nombre: negocio.clientes?.nombre || 'Cliente sin asignar',
          proveedor_principal,
          material_principal,
          proveedores,
          materiales
        };
      }));
      
      setNegocios(negociosConDetalles);
      
    } catch (error: any) {
      console.error("Error:", error);
      setError("Error al cargar los datos");
      setNegocios([]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar eliminación
  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este contrato? Esta acción no se puede deshacer.")) 
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
      (negocio.nombre?.toLowerCase() || '').includes(filtro.toLowerCase()) ||
      (negocio.cliente_nombre?.toLowerCase() || '').includes(filtro.toLowerCase()) ||
      (negocio.material_principal?.toLowerCase() || '').includes(filtro.toLowerCase()) ||
      (negocio.proveedor_principal?.toLowerCase() || '').includes(filtro.toLowerCase());
    
    return cumpleFiltroTexto;
  });

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Fecha no disponible';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES');
  };

  // Formatear montos
  const formatMonto = (monto?: number) => {
    if (monto === undefined || monto === null) return '-';
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
            Contratos
          </h1>
          <Link 
            href="/negocios/new"
            className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nuevo Contrato
          </Link>
        </div>
        
        {/* Mensaje de error */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm animate-fadeIn">
            <div className="flex">
              <div className="flex-shrink-0 text-red-500">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Filtros y búsqueda */}
        <div className="bg-white shadow-md rounded-lg p-5 mb-8 transition-all duration-300 ease-in-out transform hover:shadow-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Buscar por número de contrato, cliente, material o proveedor..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="pl-10 pr-4 py-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Tabla de negocios */}
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Cargando contratos...</p>
          </div>
        ) : negociosFiltrados.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="flex justify-center mb-4">
              <FiTag className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg mb-4">
              {filtro ? (
                'No se encontraron contratos con los filtros seleccionados'
              ) : (
                'No hay contratos registrados'
              )}
            </p>
            {filtro && (
              <button 
                onClick={() => setFiltro('')}
                className="text-indigo-500 hover:text-indigo-700 hover:underline focus:outline-none"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg transition-all duration-300 ease-in-out overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiTag className="mr-1 text-indigo-500" />
                        Contrato
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiPackage className="mr-1 text-indigo-500" />
                        Material
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiUser className="mr-1 text-indigo-500" />
                        Cliente
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiTruck className="mr-1 text-indigo-500" />
                        Proveedor
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {negociosFiltrados.map((negocio) => (
                    <tr key={negocio.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">Contrato Nº{negocio.id}</div>
                        <div className="text-xs text-gray-500">{negocio.nombre}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiPackage className="mr-1 text-indigo-500 h-4 w-4" />
                          <span className="text-sm text-gray-900">{negocio.material_principal}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiUser className="mr-1 text-indigo-500 h-4 w-4" />
                          <span className="text-sm text-gray-900">{negocio.cliente_nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiTruck className="mr-1 text-indigo-500 h-4 w-4" />
                          <span className="text-sm text-gray-900">{negocio.proveedor_principal}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                            title="Editar contrato"
                          >
                            <FiEdit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(negocio.id)}
                            disabled={deleteLoading === negocio.id}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 disabled:opacity-50"
                            title="Eliminar contrato"
                          >
                            {deleteLoading === negocio.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-r-transparent border-red-600"></div>
                            ) : (
                              <FiTrash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    nombre: "Contrato de suministro",
    cliente_id: 1,
    cliente_nombre: "Comercial Acme, S.L.",
    material_principal: "Plástico reciclado",
    proveedor_principal: "Plastisur, S.A.",
    fecha_inicio: "2023-05-10",
    valor_total: 25000.75,
    created_at: "2023-05-10T08:30:00Z"
  },
  {
    id: 2,
    nombre: "Contrato de distribución",
    cliente_id: 2,
    cliente_nombre: "Distribuciones García",
    material_principal: "Cartón",
    proveedor_principal: "Cartonajes Europa",
    fecha_inicio: "2023-05-20",
    valor_total: 15750.00,
    created_at: "2023-05-20T14:15:00Z"
  },
  {
    id: 3,
    nombre: "Contrato de servicios",
    cliente_id: 3,
    cliente_nombre: "Industrias Martínez, S.A.",
    material_principal: "Papel",
    proveedor_principal: "Papelera del Norte",
    fecha_inicio: "2023-06-01",
    valor_total: 42000.00,
    created_at: "2023-06-01T09:45:00Z"
  }
]; 
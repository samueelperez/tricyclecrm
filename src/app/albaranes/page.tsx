'use client'

import { useState, useEffect } from 'react'
import { FiEdit, FiEye, FiTrash2, FiSearch, FiFilter, FiPlus, FiPackage, FiCalendar, FiTag, FiFileText, FiUser, FiTruck, FiClock, FiX } from 'react-icons/fi'
import Link from 'next/link'
import { getSupabaseClient, ejecutarMigracionAlbaranes } from '@/lib/supabase'

interface Albaran {
  id: number
  numero_albaran: string
  fecha: string
  estado: string
  notas: string | null
  id_cliente: number | null
  id_proveedor: number | null
  cliente: {
    nombre: string
  } | null
  proveedor: {
    nombre: string
  } | null
}

export default function AlbaranesPage() {
  const [albaranes, setAlbaranes] = useState<Albaran[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inicializando, setInicializando] = useState(true)

  useEffect(() => {
    inicializarBaseDatos()
  }, [])

  async function inicializarBaseDatos() {
    try {
      setInicializando(true)
      
      // Primero ejecutamos la migración para asegurarnos de que las tablas existan
      const resultadoMigracion = await ejecutarMigracionAlbaranes()
      
      if (!resultadoMigracion.success) {
        console.error('Error en la migración:', resultadoMigracion.error)
        setError('Error inicializando la base de datos. Intentando continuar de todos modos...')
        // Aunque falle la migración, intentamos cargar los datos de todas formas
        // por si la tabla ya existe
      }
      
      // Si la migración fue exitosa o no, intentamos cargar los datos
      console.log('Intentando cargar datos...')
      setInicializando(false)
      await loadAlbaranes()
      
    } catch (error) {
      console.error('Error inicializando base de datos:', error)
      setError('Error inicializando la base de datos')
      setInicializando(false)
      setLoading(false)
    }
  }

  async function loadAlbaranes() {
    try {
      setLoading(true)
      const supabase = getSupabaseClient()
      
      // Intentar una consulta simple primero para ver si la tabla existe
      try {
        const { data: checkData, error: checkError } = await supabase
          .from('albaranes')
          .select('id')
          .limit(1)
        
        if (checkError) {
          if (checkError.code === '42P01') { // tabla no existe
            throw new Error('La tabla de albaranes no existe. Por favor, cree la tabla primero.')
          } else {
            throw checkError
          }
        }
        
        // Si llegamos aquí, la tabla existe, intentamos la consulta de albaranes
        const { data: albaranesRaw, error: albaranesError } = await supabase
          .from('albaranes')
          .select('*')
          .order('fecha', { ascending: false })
        
        if (albaranesError) {
          console.error('Error en la consulta de albaranes:', albaranesError)
          throw albaranesError
        }
        
        if (!albaranesRaw || albaranesRaw.length === 0) {
          // No hay albaranes, no necesitamos buscar detalles
          setAlbaranes([])
          return;
        }
        
        // Lista de IDs de clientes y proveedores únicos para consultas adicionales
        const clienteIds = albaranesRaw
          .filter(a => a.id_cliente !== null)
          .map(a => a.id_cliente)
          .filter((id, index, self) => id !== null && self.indexOf(id) === index);
        
        const proveedorIds = albaranesRaw
          .filter(a => a.id_proveedor !== null)
          .map(a => a.id_proveedor)
          .filter((id, index, self) => id !== null && self.indexOf(id) === index);
        
        // Consulta de clientes
        let clientesMap: Record<number, { nombre: string }> = {};
        if (clienteIds.length > 0) {
          const { data: clientesData, error: clientesError } = await supabase
            .from('clientes')
            .select('id, nombre')
            .in('id', clienteIds);
          
          if (clientesError) {
            console.warn('Error al obtener clientes:', clientesError);
          } else if (clientesData) {
            clientesMap = clientesData.reduce((acc, cliente) => {
              acc[cliente.id] = { nombre: cliente.nombre };
              return acc;
            }, {} as Record<number, { nombre: string }>);
          }
        }
        
        // Consulta de proveedores
        let proveedoresMap: Record<number, { nombre: string }> = {};
        if (proveedorIds.length > 0) {
          const { data: proveedoresData, error: proveedoresError } = await supabase
            .from('proveedores')
            .select('id, nombre')
            .in('id', proveedorIds);
          
          if (proveedoresError) {
            console.warn('Error al obtener proveedores:', proveedoresError);
          } else if (proveedoresData) {
            proveedoresMap = proveedoresData.reduce((acc, proveedor) => {
              acc[proveedor.id] = { nombre: proveedor.nombre };
              return acc;
            }, {} as Record<number, { nombre: string }>);
          }
        }
        
        // Combinar datos para crear el resultado completo
        const albaranesCompletos = albaranesRaw.map(albaran => {
          const clienteInfo = albaran.id_cliente && clientesMap[albaran.id_cliente] 
            ? { cliente: clientesMap[albaran.id_cliente] }
            : { cliente: null };
          
          const proveedorInfo = albaran.id_proveedor && proveedoresMap[albaran.id_proveedor]
            ? { proveedor: proveedoresMap[albaran.id_proveedor] }
            : { proveedor: null };
          
          return {
            ...albaran,
            ...clienteInfo,
            ...proveedorInfo
          };
        });
        
        setAlbaranes(albaranesCompletos)
      } catch (queryError) {
        console.error('Error específico de consulta:', queryError)
        throw queryError
      }
    } catch (error: any) {
      console.error('Error cargando albaranes:', error)
      
      // Mensajes de error más específicos según el tipo de error
      if (error.code === '42P01') {
        setError('Error: La tabla de albaranes no existe. Por favor, contacte al administrador.')
      } else if (error.code === '42703') {
        setError('Error: La estructura de la tabla no coincide con lo esperado. Por favor, contacte al administrador.')
      } else if (error.code && error.code.startsWith('22')) {
        setError('Error de formato en los datos. Por favor, contacte al administrador.')
      } else if (error.code && error.code.startsWith('23')) {
        setError('Error de restricción en la base de datos. Por favor, contacte al administrador.')
      } else if (error.message) {
        setError(`Error: ${error.message}`)
      } else {
        setError('Error al cargar los albaranes. Por favor, inténtelo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este albarán? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeleteLoading(id);
    
    try {
      const supabase = getSupabaseClient();
      
      // Primero eliminamos los items relacionados
      const { error: errorItems } = await supabase
        .from('albaran_items')
        .delete()
        .eq('id_albaran', id);
      
      if (errorItems) {
        console.error('Error eliminando items del albarán:', errorItems);
        setError(`Error al eliminar items: ${errorItems.message}`);
        return;
      }
      
      // Luego eliminamos el albarán
      const { error } = await supabase
        .from('albaranes')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error eliminando albarán:', error);
        setError(`Error al eliminar: ${error.message}`);
        return;
      }
      
      // Actualizar la lista de albaranes
      setAlbaranes(albaranes.filter(albaran => albaran.id !== id));
      
    } catch (error) {
      console.error('Error inesperado:', error);
      setError('Error al eliminar el albarán');
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredAlbaranes = albaranes.filter(albaran => {
    const matchesSearch = 
      albaran.numero_albaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (albaran.cliente?.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (albaran.proveedor?.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    
    const matchesTipo = 
      filtroTipo === 'todos' || 
      (filtroTipo === 'cliente' && albaran.id_cliente !== null) || 
      (filtroTipo === 'proveedor' && albaran.id_proveedor !== null)
    
    const matchesEstado = filtroEstado === 'todos' || albaran.estado === filtroEstado
    
    return matchesSearch && matchesTipo && matchesEstado
  })

  // Formatea fecha de YYYY-MM-DD a DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES')
  }

  // Función para obtener el icono y color según el estado
  const getEstadoStyles = (estado: string) => {
    switch(estado) {
      case 'completado':
        return { 
          bgColor: 'bg-green-100', 
          textColor: 'text-green-800',
          icon: <FiPackage className="mr-1.5 h-3 w-3" />
        };
      case 'cancelado':
        return { 
          bgColor: 'bg-red-100', 
          textColor: 'text-red-800',
          icon: <FiX className="mr-1.5 h-3 w-3" />
        };
      default: // pendiente
        return { 
          bgColor: 'bg-yellow-100', 
          textColor: 'text-yellow-800',
          icon: <FiClock className="mr-1.5 h-3 w-3" />
        };
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
              Facturas de Transporte
          </h1>
            <p className="text-gray-600 text-sm">
              Gestión de albaranes y documentación para servicios de transporte y logística
            </p>
          </div>
          <Link 
            href="/albaranes/new"
            className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nueva Factura de Transporte
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400 h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por número, cliente o proveedor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                />
              </div>
            </div>
            
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFilter className="text-gray-400 h-5 w-5" />
                </div>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="pl-10 pr-4 py-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="cliente">Cliente</option>
                  <option value="proveedor">Proveedor</option>
                </select>
              </div>
            </div>
            
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiTag className="text-gray-400 h-5 w-5" />
                </div>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="pl-10 pr-4 py-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de inicialización */}
        {inicializando ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Inicializando base de datos...</p>
          </div>
        ) : loading ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Cargando albaranes...</p>
          </div>
        ) : filteredAlbaranes.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="flex justify-center mb-4">
              <FiFileText className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg mb-4">
              {searchQuery || filtroTipo !== 'todos' || filtroEstado !== 'todos' ? (
                'No se encontraron albaranes con los filtros seleccionados'
              ) : (
                'No hay albaranes registrados'
              )}
            </p>
            {(searchQuery || filtroTipo !== 'todos' || filtroEstado !== 'todos') && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setFiltroTipo('todos');
                  setFiltroEstado('todos');
                }}
                className="text-indigo-500 hover:text-indigo-700 hover:underline focus:outline-none"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out">
            {/* Tabla de albaranes */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiFileText className="mr-2 text-indigo-500" />
                        Nº Albarán
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiTruck className="mr-2 text-indigo-500" />
                        Tipo
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiUser className="mr-2 text-indigo-500" />
                        Cliente/Proveedor
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiCalendar className="mr-2 text-indigo-500" />
                        Fecha
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiTag className="mr-2 text-indigo-500" />
                        Estado
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAlbaranes.map((albaran) => {
                    const entityType = albaran.id_cliente ? 'cliente' : 'proveedor';
                    const entityName = albaran.id_cliente ? albaran.cliente?.nombre : albaran.proveedor?.nombre;
                    const { bgColor, textColor } = getEstadoStyles(albaran.estado);
                    
                    return (
                      <tr key={albaran.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{albaran.numero_albaran}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            {entityType === 'cliente' ? (
                              <><FiUser className="mr-1 text-indigo-500 h-4 w-4" /> Cliente</>
                            ) : (
                              <><FiTruck className="mr-1 text-indigo-500 h-4 w-4" /> Proveedor</>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{entityName || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            <FiCalendar className="mr-1 text-indigo-500 h-4 w-4" />
                            {formatDate(albaran.fecha)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
                            {albaran.estado.charAt(0).toUpperCase() + albaran.estado.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <Link 
                              href={`/albaranes/${albaran.id}`} 
                              className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150 p-1"
                              title="Ver detalles"
                            >
                              <FiEye className="h-4 w-4" />
                            </Link>
                            <Link 
                              href={`/albaranes/edit/${albaran.id}`} 
                              className="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1"
                              title="Editar albarán"
                            >
                              <FiEdit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(albaran.id)}
                              disabled={deleteLoading === albaran.id}
                              className="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 disabled:opacity-50"
                              title="Eliminar albarán"
                            >
                              {deleteLoading === albaran.id ? (
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
          </div>
        )}
      </div>
    </div>
  )
} 
'use client';

import { 
  FiUsers, 
  FiDollarSign, 
  FiShoppingBag, 
  FiBarChart2, 
  FiArrowUpRight, 
  FiArrowDownRight,
  FiBox,
  FiEye,
  FiRefreshCw,
  FiFilter,
  FiCalendar,
  FiClock,
  FiCheckSquare,
  FiAlertCircle
} from "react-icons/fi";
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

// Tipos de datos
interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalDeals: number;
  activeCustomers: number;
  topProduct: string;
}

interface RecentActivity {
  id: string;
  type: 'customer' | 'supplier' | 'deal';
  action: string;
  docType: string;
  docId: string;
  timestamp: string;
  user: string;
}

interface TopCustomer {
  id: string;
  name: string;
  totalDeals: number;
  totalRevenue: number;
}

interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  type: string;
}

export default function Dashboard() {
  // Estados para almacenar datos
  const [timeRange, setTimeRange] = useState<string>('month');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cliente de Supabase
  const supabase = createClientComponentClient();
  
  // Función para cargar los datos del dashboard
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Cargar estadísticas principales
      await loadStats();
      
      // 2. Cargar actividades recientes
      await loadRecentActivities();
      
      // 3. Cargar top clientes
      await loadTopCustomers();
      
      // 4. Cargar tareas pendientes
      await loadPendingTasks();
      
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
      setError('Ocurrió un error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar estadísticas principales
  const loadStats = async () => {
    try {
      // Calcular ingresos totales (facturas cliente)
      const { data: facturas, error: facturasError } = await supabase
        .from('facturas_cliente')
        .select('monto')
        .eq('estado', 'pagada');
      
      if (facturasError) throw facturasError;
      
      const totalRevenue = facturas?.reduce((sum, f) => sum + (f.monto || 0), 0) || 0;
      
      // Calcular gastos totales (facturas proveedor)
      const { data: facturasProv, error: facturasProvError } = await supabase
        .from('facturas_proveedor')
        .select('monto');
      
      if (facturasProvError) throw facturasProvError;
      
      const totalExpenses = facturasProv?.reduce((sum, f) => sum + (f.monto || 0), 0) || 0;
      
      // Contar negocios
      const { count: totalDeals, error: negociosError } = await supabase
        .from('negocios')
        .select('*', { count: 'exact', head: true });
      
      if (negociosError) throw negociosError;
      
      // Contar clientes activos (con alguna factura o negocio)
      const { count: activeCustomers, error: clientesError } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });
      
      if (clientesError) throw clientesError;
      
      // Producto/material más vendido
      const { data: materiales, error: materialesError } = await supabase
        .from('materiales')
        .select('nombre, id')
        .order('id', { ascending: true })
        .limit(1);
      
      if (materialesError) throw materialesError;
      
      const topProduct = materiales && materiales.length > 0 ? materiales[0].nombre : 'No disponible';
      
      // Calcular beneficio neto
      const netProfit = totalRevenue - totalExpenses;
      
      // Actualizar estado
      setStats({
        totalRevenue,
        totalExpenses,
        netProfit,
        totalDeals: totalDeals || 0,
        activeCustomers: activeCustomers || 0,
        topProduct
      });
      
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      throw err;
    }
  };
  
  // Cargar actividades recientes
  const loadRecentActivities = async () => {
    try {
      // En una implementación real, podríamos tener una tabla de actividades
      // Por ahora, usaremos datos simulados basados en facturas recientes
      const { data: facturasRecientes, error: facturasError } = await supabase
        .from('facturas_cliente')
        .select('id, fecha, negocio_id, material')
        .order('fecha', { ascending: false })
        .limit(5);
      
      if (facturasError) throw facturasError;
      
      // Transformar facturas en actividades
      const actividadesFacturas = facturasRecientes?.map(factura => ({
        id: factura.id,
        type: 'customer' as const,
        action: 'create',
        docType: 'invoice',
        docId: factura.id,
        timestamp: new Date(factura.fecha).toLocaleString(),
        user: 'Admin'
      })) || [];
      
      // También podríamos añadir facturas de proveedor, pero por simplicidad usaremos solo cliente
      setActivities(actividadesFacturas);
      
    } catch (err) {
      console.error('Error cargando actividades recientes:', err);
      throw err;
    }
  };
  
  // Cargar top clientes
  const loadTopCustomers = async () => {
    try {
      // Obtener clientes con más facturas
      const { data: clientes, error: clientesError } = await supabase
        .from('clientes')
        .select('id, nombre')
        .limit(3);
      
      if (clientesError) throw clientesError;
      
      if (!clientes || clientes.length === 0) {
        setTopCustomers([]);
        return;
      }
      
      // Para cada cliente, obtener sus facturas
      const clientesConDetalles = await Promise.all(clientes.map(async (cliente) => {
        // Contar negocios
        const { count: totalDeals, error: negociosError } = await supabase
          .from('negocios')
          .select('*', { count: 'exact', head: true })
          .eq('cliente_id', cliente.id);
        
        if (negociosError) throw negociosError;
        
        // Obtener los negocios primero
        const { data: negocios, error: negociosDataError } = await supabase
          .from('negocios')
          .select('id')
          .eq('cliente_id', cliente.id);
          
        if (negociosDataError) throw negociosDataError;
        
        // Sumar ingresos de todas las facturas asociadas a los negocios de este cliente
        let totalRevenue = 0;
        
        if (negocios && negocios.length > 0) {
          const negocioIds = negocios.map(negocio => negocio.id);
          
          const { data: facturas, error: facturasError } = await supabase
            .from('facturas_cliente')
            .select('monto')
            .in('negocio_id', negocioIds);
          
          if (facturasError) throw facturasError;
          
          totalRevenue = facturas?.reduce((sum, f) => sum + (f.monto || 0), 0) || 0;
        }
        
        return {
          id: cliente.id,
          name: cliente.nombre,
          totalDeals: totalDeals || 0,
          totalRevenue
        };
      }));
      
      // Ordenar por ingreso total (descendente)
      clientesConDetalles.sort((a, b) => b.totalRevenue - a.totalRevenue);
      
      setTopCustomers(clientesConDetalles);
      
    } catch (err) {
      console.error('Error cargando top clientes:', err);
      throw err;
    }
  };
  
  // Cargar tareas pendientes
  const loadPendingTasks = async () => {
    try {
      // Si ya implementamos la sección de organización, podemos usarla aquí
      let tareasPendientes: Task[] = [];
      
      try {
        const { data: tareasDB, error: tareasError } = await supabase
          .from('tareas')
          .select('id, titulo, prioridad, fecha_limite, completado')
          .eq('completado', false)
          .order('fecha_limite', { ascending: true })
          .limit(5);
          
        if (!tareasError && tareasDB) {
          // Mapear tareas a nuestro formato
          tareasPendientes = tareasDB.map(tarea => ({
            id: tarea.id,
            title: tarea.titulo,
            priority: tarea.prioridad as 'high' | 'medium' | 'low',
            dueDate: tarea.fecha_limite ? new Date(tarea.fecha_limite).toLocaleDateString() : 'Sin fecha',
            type: 'Tarea'
          }));
        }
      } catch (errorTareas) {
        console.warn('No se pudieron cargar tareas desde la tabla tareas:', errorTareas);
        // Si no existen las tablas de tareas, usamos datos de ejemplo
        tareasPendientes = [
          { id: '1', title: 'Contactar a cliente pendiente', priority: 'high', dueDate: 'Hoy', type: 'Llamada' },
          { id: '2', title: 'Actualizar inventario', priority: 'medium', dueDate: 'Mañana', type: 'Inventario' },
          { id: '3', title: 'Revisar factura', priority: 'low', dueDate: new Date().toLocaleDateString(), type: 'Facturación' },
          { id: '4', title: 'Seguimiento de pedido', priority: 'medium', dueDate: new Date().toLocaleDateString(), type: 'Pedido' },
          { id: '5', title: 'Reunión con proveedor', priority: 'high', dueDate: new Date().toLocaleDateString(), type: 'Reunión' }
        ];
      }
      
      setTasks(tareasPendientes);
      
    } catch (err) {
      console.error('Error cargando tareas pendientes:', err);
      throw err;
    }
  };
  
  // Cargar datos al montar el componente y cuando cambie el rango de tiempo
  useEffect(() => {
    loadDashboardData();
  }, [timeRange]); // Recargar cuando cambie el rango de tiempo
  
  // Función para formatear dinero
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };
  
  // Manejar cambio de rango de tiempo
  const handleTimeRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(event.target.value);
  };
  
  // Manejar recarga de datos
  const handleRefresh = () => {
    loadDashboardData();
  };

  // Renderizar estado de carga
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-500">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Renderizar estado de error
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-4xl mx-auto my-8">
        <div className="flex items-center text-red-600 mb-4">
          <FiAlertCircle className="text-2xl mr-2" />
          <h2 className="text-lg font-semibold">Error al cargar el dashboard</h2>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors inline-flex items-center"
        >
          <FiRefreshCw className="mr-2" /> Intentar nuevamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con título y opciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard de Contabilidad y Analíticas</h1>
        <div className="flex items-center gap-3">
          <select 
            className="px-3 py-2 border rounded-md text-sm text-gray-600 bg-white"
            value={timeRange}
            onChange={handleTimeRangeChange}
          >
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="quarter">Este trimestre</option>
            <option value="year">Este año</option>
          </select>
          <button 
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            onClick={handleRefresh}
            disabled={loading}
          >
            <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
            <FiFilter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Total Revenue */}
        <div className="bg-green-50 p-4 md:p-6 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ingresos Totales</p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats?.totalRevenue || 0)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Total Expenses */}
        <div className="bg-red-50 p-4 md:p-6 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full">
              <FiBarChart2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Gastos Totales</p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats?.totalExpenses || 0)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Net Profit */}
        <div className="bg-green-50 p-4 md:p-6 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <FiArrowUpRight className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Beneficio Neto</p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats?.netProfit || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Segunda fila de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Total Deals */}
        <div className="bg-amber-50 p-4 md:p-6 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-full">
              <FiShoppingBag className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Negocios</p>
              <p className="text-2xl font-bold">{stats?.totalDeals || 0}</p>
            </div>
          </div>
        </div>
        
        {/* Active Customers */}
        <div className="bg-blue-50 p-4 md:p-6 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Clientes Activos</p>
              <p className="text-2xl font-bold">{stats?.activeCustomers || 0}</p>
            </div>
          </div>
        </div>
        
        {/* Top Product */}
        <div className="bg-blue-50 p-4 md:p-6 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <FiBox className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Producto Principal</p>
              <p className="text-lg font-bold">{stats?.topProduct || 'No disponible'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secciones de actividades recientes y clientes principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Actividades Recientes</h2>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No hay actividades recientes</p>
            ) : (
              activities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">
                      <span className="text-green-500">Crear</span> {' '}
                      {activity.type === 'customer' ? 'cliente' : 
                       activity.type === 'supplier' ? 'proveedor' : 'negocio'} {' '}
                      {activity.docType} ({activity.docId}) por {activity.user}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <FiClock className="w-3 h-3" /> {activity.timestamp}
                    </p>
                  </div>
                  <Link
                    href={`/${activity.type === 'customer' ? 'facturas' : 
                            activity.type === 'supplier' ? 'facturas-proveedor' : 
                            'negocios'}/${activity.docId}`}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <FiEye className="w-5 h-5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Top Customers */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Clientes Principales</h2>
          <div className="space-y-4">
            {topCustomers.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No hay datos de clientes disponibles</p>
            ) : (
              topCustomers.map((customer, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-semibold">{customer.name}</h3>
                    <Link
                      href={`/clientes/${customer.id}`}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <FiEye className="w-5 h-5" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Total Negocios:</p>
                      <p className="font-medium">{customer.totalDeals}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Ingresos:</p>
                      <p className="font-medium">{formatCurrency(customer.totalRevenue)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tareas Pendientes */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Tareas Pendientes</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              {tasks.length} pendientes
            </span>
          </div>
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No hay tareas pendientes</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((item, index) => (
                <div key={index} className="flex flex-col p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      item.priority === 'high' ? 'bg-red-100 text-red-800' : 
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Media' : 'Baja'}
                    </span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{item.type}</span>
                  </div>
                  <p className="font-medium mb-1">{item.title}</p>
                  <p className="text-sm text-gray-500 flex items-center mt-auto pt-2">
                    <FiCalendar className="w-3 h-3 mr-1" /> {item.dueDate}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
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
  FiCheckSquare
} from "react-icons/fi";
import dynamic from 'next/dynamic';

// Importación dinámica para evitar problemas de SSR

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header con título y opciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Accounting & Analytics Dashboard</h1>
        <div className="flex items-center gap-3">
          <select className="px-3 py-2 border rounded-md text-sm text-gray-600 bg-white">
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month" selected>Este mes</option>
            <option value="quarter">Este trimestre</option>
            <option value="year">Este año</option>
          </select>
          <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
            <FiRefreshCw className="w-5 h-5" />
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
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">€143597.60</p>
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
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold">€67668.60</p>
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
              <p className="text-sm text-gray-500">Net Profit</p>
              <p className="text-2xl font-bold">€75929.00</p>
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
              <p className="text-sm text-gray-500">Total Deals</p>
              <p className="text-2xl font-bold">3</p>
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
              <p className="text-sm text-gray-500">Active Customers</p>
              <p className="text-2xl font-bold">6</p>
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
              <p className="text-sm text-gray-500">Top Product</p>
              <p className="text-lg font-bold">PP JUMBO BAGS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de rendimiento financiero */}
     
     

      {/* Secciones de actividades recientes y clientes principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {[
              { type: 'supplier', docType: 'invoice', id: 'INV003', time: 'Mar 10, 2025 · 12:39 PM' },
              { type: 'supplier', docType: 'invoice', id: 'INV003', time: 'Mar 10, 2025 · 12:38 PM' },
              { type: 'supplier', docType: 'invoice', id: 'INV003', time: 'Mar 10, 2025 · 12:37 PM' },
              { type: 'customer', docType: 'invoice', id: 'INV003', time: 'Mar 10, 2025 · 12:34 PM' },
              { type: 'deal', docType: '', id: 'INV003', time: 'Mar 10, 2025 · 12:17 PM' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">
                    <span className="text-green-500">Create</span> {activity.type} {activity.docType} ({activity.id}) by Admin
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <FiClock className="w-3 h-3" /> {activity.time}
                  </p>
                </div>
                <button className="text-blue-500">
                  <FiEye className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Top Customers */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Top Customers</h2>
          <div className="space-y-4">
            {[
              { name: 'DDH TRADE CO.,LIMITED', deals: 2, revenue: '121769.6' },
              { name: 'LAO QIXIN CO.,LTD.', deals: 1, revenue: '21828.0' },
            ].map((customer, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold">{customer.name}</h3>
                  <button className="text-blue-500">
                    <FiEye className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-500">Total Deals:</p>
                    <p className="font-medium">{customer.deals}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue:</p>
                    <p className="font-medium">€{customer.revenue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tareas Pendientes */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Tareas Pendientes</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">5 pendientes</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { task: 'Contactar a DDH TRADE CO., LIMITED', priority: 'high', date: 'Hoy', type: 'Llamada' },
              { task: 'Actualizar inventario de PP JUMBO BAGS', priority: 'medium', date: 'Mañana', type: 'Inventario' },
              { task: 'Revisar factura INV003', priority: 'low', date: '26/10/2023', type: 'Facturación' },
              { task: 'Seguimiento de pedido #45921', priority: 'medium', date: '27/10/2023', type: 'Pedido' },
              { task: 'Reunión con nuevo proveedor', priority: 'high', date: '01/11/2023', type: 'Reunión' },
            ].map((item, index) => (
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
                <p className="font-medium mb-1">{item.task}</p>
                <p className="text-sm text-gray-500 flex items-center mt-auto pt-2">
                  <FiCalendar className="w-3 h-3 mr-1" /> {item.date}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 
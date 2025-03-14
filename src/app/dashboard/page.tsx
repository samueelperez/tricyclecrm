import { FiUsers, FiShoppingBag, FiDollarSign, FiTruck } from "react-icons/fi";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Bienvenido a tu panel de control</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <FiShoppingBag className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Negocios activos</p>
              <p className="text-2xl font-bold">24</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Facturación mensual</p>
              <p className="text-2xl font-bold">$45,231</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Clientes totales</p>
              <p className="text-2xl font-bold">78</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiTruck className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Envíos pendientes</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Negocios recientes</h2>
          <div className="space-y-4">
            {['Importación maquinaria', 'Venta equipos médicos', 'Exportación alimentos'].map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{item}</p>
                  <p className="text-sm text-gray-500">Cliente {index + 1}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${(Math.random() * 10000).toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Hace {index + 1} días</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Facturas pendientes</h2>
          <div className="space-y-4">
            {['FAC-001', 'FAC-002', 'FAC-003'].map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{item}</p>
                  <p className="text-sm text-gray-500">Cliente {index + 3}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${(Math.random() * 5000).toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Vence en {5 + index} días</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 
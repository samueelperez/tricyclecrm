import { FiAlertCircle, FiTrash2, FiSearch } from 'react-icons/fi';

export default function NegociosPage() {
  // Datos de ejemplo para la tabla
  const negocios = [
    {
      id: "INV003",
      fecha: "Mar 10, 2025",
      cliente: "DDH TRADE CO.,LIMITED",
      proveedor: "CTR MEDITERRANEO RECICLADOS Y DERRIB...",
      material: "PP JUMBO BAGS",
      estado: "alerta"
    },
    {
      id: "INV002",
      fecha: "Mar 10, 2025",
      cliente: "DDH TRADE CO.,LIMITED",
      proveedor: "Recisur",
      material: "PP JUMBO BAGS",
      estado: "alerta"
    },
    {
      id: "INV001",
      fecha: "Mar 6, 2025",
      cliente: "LAO QIXIN CO.,LTD.",
      proveedor: "Recisur",
      material: "PP JUMBO BAGS",
      estado: "alerta"
    }
  ];

  return (
    <div className="h-full">
      {/* Barra de búsqueda refinada */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="search"
            className="block w-full p-2.5 pl-10 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiSearch className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
      
      {/* Título de la sección - como en la imagen */}
      <div className="mb-4">
        <h2 className="text-lg text-blue-600 font-medium border-b border-blue-500 pb-2 inline-block">Deals</h2>
      </div>
      
      {/* Encabezados de columnas */}
      <div className="grid grid-cols-7 gap-4 px-4 py-3 mb-3 text-xs font-medium text-gray-500 uppercase">
        <div>Deal Number</div>
        <div>Date</div>
        <div>Customer</div>
        <div>Suppliers</div>
        <div>Materials</div>
        <div className="text-center">Status</div>
        <div className="text-center">Actions</div>
      </div>
      
      {/* Cada deal en un contenedor separado con bordes redondeados */}
      <div className="space-y-3">
        {negocios.map((negocio) => (
          <div key={negocio.id} className="grid grid-cols-7 gap-4 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition-all">
            <div className="text-gray-900 font-medium">{negocio.id}</div>
            <div className="text-gray-600">{negocio.fecha}</div>
            <div className="text-gray-600">{negocio.cliente}</div>
            <div className="text-gray-600">{negocio.proveedor}</div>
            <div className="text-gray-600">{negocio.material}</div>
            <div className="flex justify-center">
              <FiAlertCircle className="text-red-500 w-5 h-5" />
            </div>
            <div className="flex justify-center">
              <button className="text-red-500 hover:text-red-700">
                <FiTrash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Paginación refinada */}
      <div className="flex items-center justify-end mt-4 text-sm text-gray-500">
        <span className="mr-4">Página 1 de 1</span>
        <div className="flex space-x-2">
          <button
            className="px-3 py-1 border rounded text-gray-500 border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            disabled
          >
            anterior
          </button>
          <button
            className="px-3 py-1 border rounded text-gray-500 border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            disabled
          >
            siguiente
          </button>
        </div>
      </div>
    </div>
  );
} 
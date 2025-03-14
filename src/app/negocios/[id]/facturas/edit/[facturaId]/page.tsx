'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiChevronDown, 
  FiPlus, 
  FiTrash2,
  FiPackage,
  FiDollarSign,
  FiCreditCard
} from 'react-icons/fi';

export default function EditarFactura({ params }: { params: { id: string; facturaId: string } }) {
  const router = useRouter();
  const { id: negocioId, facturaId } = params;
  
  // Determinar si es factura de cliente o proveedor
  const isProveedor = facturaId.includes('-');
  const proveedorNum = isProveedor ? facturaId.split('-')[1] : null;
  
  // Datos de la factura basados en el ID
  const factura = {
    id: facturaId,
    fecha: "2025-03-10",
    tipo: isProveedor ? "proveedor" : "cliente",
    proveedor: isProveedor ? 
      (proveedorNum === '1' ? "CTR MEDITERRANEO" : 
       proveedorNum === '2' ? "RECICLADOS Y DERRIBOS LLORENS" : 
       "RECICLADOS COLLADO") : null,
    cliente: "DDH TRADE CO.,LIMITED",
    monto: isProveedor ? 
      (proveedorNum === '1' ? "3036.00" : 
       proveedorNum === '2' ? "2418.00" : 
       "11484.00") : "51062.40",
    material: "PP JUMBO BAGS",
    estado: "Pending"
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSave = () => {
    // Aquí iría la lógica para guardar los cambios
    
    // Redirigir de vuelta a la pestaña de facturas
    router.push(`/negocios/${negocioId}?tab=invoices`);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Cabecera */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={handleCancel}
                className="mr-3 text-gray-600 hover:text-gray-800"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-medium text-gray-800">
                Editar Factura {isProveedor ? "de Proveedor" : "de Cliente"}
              </h1>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h1a2 2 0 012 2v7a2 2 0 01-2 2H8a2 2 0 01-2-2v-7a2 2 0 012-2h1v5.586l-1.293-1.293z" />
                  <path d="M9 4a1 1 0 012 0v2H9V4z" />
                </svg>
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenido del formulario */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Detalles de Factura */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Detalles de Factura</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Factura</label>
              <input 
                type="text" 
                value={factura.id}
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Factura</label>
              <div className="relative">
                <input 
                  type="date" 
                  defaultValue={factura.fecha}
                  className="w-full p-2 border rounded-md pr-10"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiCalendar className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <div className="relative">
                <select className="w-full p-2 border rounded-md appearance-none">
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Información de Cliente/Proveedor */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            {isProveedor ? "Información del Proveedor" : "Información del Cliente"}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isProveedor ? "Nombre del Proveedor" : "Nombre del Cliente"}
              </label>
              <div className="relative">
                <select className="w-full p-2 border rounded-md appearance-none">
                  {isProveedor ? (
                    <>
                      <option value="ctr">CTR MEDITERRANEO</option>
                      <option value="reciclados_llorens">RECICLADOS Y DERRIBOS LLORENS</option>
                      <option value="reciclados_collado">RECICLADOS COLLADO</option>
                    </>
                  ) : (
                    <option value="dth">DDH TRADE CO.,LIMITED</option>
                  )}
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Fiscal</label>
              <input 
                type="text" 
                placeholder="ej. XXXX30283-9-00"
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>
        
        {/* Detalles de Material */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Detalles de Material</h3>
          
          {/* Línea de productos */}
          <div className="mb-4 border rounded-md overflow-hidden">
            <div className="grid grid-cols-6 gap-2 p-3 bg-white">
              <div className="col-span-6 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                <input 
                  type="text" 
                  defaultValue={factura.material}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                <input 
                  type="number" 
                  defaultValue="10"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Peso (MT)</label>
                <input 
                  type="number" 
                  defaultValue="200.00"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Precio Unitario</label>
                <input 
                  type="number" 
                  defaultValue="240.00"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Empaque</label>
                <div className="relative">
                  <select className="w-full p-2 border rounded-md appearance-none">
                    <option>Bales</option>
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                    <FiChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Valor Total <span className="text-blue-500">auto</span></label>
                <input 
                  type="text" 
                  value={factura.monto}
                  className="w-full p-2 border rounded-md bg-gray-50"
                  readOnly
                />
              </div>
            </div>
            <div className="flex justify-end border-t p-2 bg-white">
              <button className="p-1 text-red-500 hover:bg-red-50 rounded">
                <FiTrash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Botón para añadir más productos */}
          <button className="w-full p-3 border border-dashed border-blue-300 rounded-md text-blue-500 flex items-center justify-center hover:bg-blue-50 mb-6">
            <FiPlus className="w-5 h-5 mr-2" />
            Añadir Producto
          </button>
          
          {/* Detalles adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal</label>
              <input 
                type="text" 
                value={factura.monto}
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IVA (21%)</label>
              <input 
                type="text" 
                value="0.00"
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
              <input 
                type="text" 
                value={factura.monto}
                className="w-full p-2 border rounded-md font-bold"
                readOnly
              />
            </div>
          </div>
        </div>
        
        {/* Detalles de Pago */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Detalles de Pago</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
              <div className="relative">
                <select className="w-full p-2 border rounded-md appearance-none">
                  <option>Transferencia Bancaria</option>
                  <option>Efectivo</option>
                  <option>Tarjeta de Crédito</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
              <div className="relative">
                <input 
                  type="date" 
                  defaultValue="2025-04-10"
                  className="w-full p-2 border rounded-md pr-10"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiCalendar className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia de Pago</label>
            <input 
              type="text" 
              placeholder="ej. REF-12345"
              className="w-full p-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Bancaria</label>
            <div className="relative">
              <select className="w-full p-2 border rounded-md appearance-none">
                <option>Santander S.A. - ES6000495332142610008899 - USD</option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <FiChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Notas */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Notas Adicionales</h3>
          
          <div>
            <textarea 
              placeholder="Añadir notas o comentarios relevantes..."
              className="w-full p-2 border rounded-md h-24"
            ></textarea>
          </div>
        </div>
        
        {/* Pie con botones */}
        <div className="flex justify-end space-x-3 mt-6">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 flex items-center">
            <FiDollarSign className="mr-2" />
            Registrar Pago
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 flex items-center">
            <FiCreditCard className="mr-2" />
            Vista Previa PDF
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h1a2 2 0 012 2v7a2 2 0 01-2 2H8a2 2 0 01-2-2v-7a2 2 0 012-2h1v5.586l-1.293-1.293z" />
              <path d="M9 4a1 1 0 012 0v2H9V4z" />
            </svg>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
} 
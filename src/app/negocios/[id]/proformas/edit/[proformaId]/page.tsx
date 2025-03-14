'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiChevronDown, 
  FiPlus, 
  FiTrash2
} from 'react-icons/fi';

export default function EditarProforma({ params }: { params: { id: string; proformaId: string } }) {
  const router = useRouter();
  const { id: negocioId, proformaId } = params;

  const handleCancel = () => {
    router.back();
  };

  const handleSave = () => {
    // Aquí iría la lógica para guardar los cambios
    
    // Redirigir de vuelta a la pestaña de proformas
    router.push(`/negocios/${negocioId}?tab=proformas`);
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
              <h1 className="text-xl font-medium text-gray-800">Editar Proforma</h1>
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
        {/* Proforma Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Detalles de Proforma</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Proforma</label>
              <input 
                type="text" 
                value={proformaId}
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Proforma</label>
              <div className="relative">
                <input 
                  type="date" 
                  defaultValue="2025-01-13"
                  className="w-full p-2 border rounded-md pr-10"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiCalendar className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Customer Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Información del Cliente</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente</label>
              <div className="relative">
                <select className="w-full p-2 border rounded-md appearance-none">
                  <option>DDH TRADE CO.,LIMITED</option>
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
        
        {/* Delivery Terms */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Términos de Entrega</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Puertos</label>
              <div className="relative">
                <select className="w-full p-2 border rounded-md appearance-none">
                  <option>TEMA PORT - GHANA</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Términos de Entrega</label>
              <input 
                type="text" 
                defaultValue="CIF (Cost, Insurance, and Freight), DTHC Not Included, 14 Free Combined Days of"
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>
        
        {/* Payment Terms */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Términos de Pago</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Términos de Pago</label>
            <div className="relative">
              <select className="w-full p-2 border rounded-md appearance-none">
                <option>30% CASH IN ADVANCE 70% CASH AGAINST DOCUMENTS</option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <FiChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Good Descriptions */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Descripción de Bienes</h3>
          
          {/* Línea de productos existente */}
          <div className="mb-4 border rounded-md overflow-hidden">
            <div className="grid grid-cols-6 gap-2 p-3 bg-white">
              <div className="col-span-6 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                <input 
                  type="text" 
                  defaultValue="PP JUMBO BAGS"
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
                  value="48000.00"
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
          
          {/* Nueva línea de producto (vacía) */}
          <div className="mb-4 border rounded-md overflow-hidden">
            <div className="grid grid-cols-6 gap-2 p-3 bg-white">
              <div className="col-span-6 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                <input 
                  type="text" 
                  placeholder="ej. PP PLASTICS"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                <input 
                  type="text" 
                  placeholder="ej. 3"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Peso (MT)</label>
                <input 
                  type="text" 
                  placeholder="ej. 19.6"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Precio Unitario</label>
                <input 
                  type="text" 
                  placeholder="ej. 80€"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Empaque</label>
                <div className="relative">
                  <select className="w-full p-2 border rounded-md appearance-none">
                    <option>Type</option>
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
                  placeholder="ej. 80€"
                  className="w-full p-2 border rounded-md bg-gray-50"
                  readOnly
                />
              </div>
            </div>
            <div className="flex justify-end border-t p-2 bg-white">
              <button className="p-1 text-blue-500 hover:bg-blue-50 rounded">
                <FiPlus className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origen <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                defaultValue="Spain"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenedores 40ft <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value="10"
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso Total (MT) <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value="200.00"
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value="48000.00"
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
          </div>
        </div>
        
        {/* Bank Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Datos Bancarios</h3>
          
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
        
        {/* Shipping Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Detalles de Envío</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea 
              placeholder="ej. INVO0149 HDPE PLASTIC SCRAP HS CODE 39151020 -CFR MERSIN PORT- TURKEY CONSIGNEE: OZ BESLENEN TARIMÜRUNLERI NAK. PET.TEKS. SAN VE TİC LTD ŞTİ. AKÇATAŞ MAH. 1CAD, NO:11-1 VİRANŞEHİR/ŞANLIURFA)"
              className="w-full p-2 border rounded-md h-24"
            ></textarea>
          </div>
        </div>
        
        {/* Pie con botones */}
        <div className="flex justify-end space-x-3 mt-6">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50">
            Exportar
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50">
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
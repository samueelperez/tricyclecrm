'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiChevronDown, 
  FiPlus, 
  FiTrash2
} from 'react-icons/fi';

export default function EditarAlbaran({ params }: { params: { id: string; albaranId: string } }) {
  const router = useRouter();
  const { id: negocioId, albaranId } = params;
  
  // Estado para manejar los items de productos
  const [items, setItems] = useState([
    {
      description: "PP JUMBO BAGS",
      containerNumber: "OOCU8588186",
      weight: "19.58",
      unitPrice: "240.00",
      totalValue: "4699.20"
    },
    {
      description: "PP JUMBO BAGS",
      containerNumber: "TGHU6860959",
      weight: "20.94",
      unitPrice: "240.00",
      totalValue: "5025.60"
    },
    {
      description: "PP JUMBO BAGS",
      containerNumber: "CCLU7771043",
      weight: "24.46",
      unitPrice: "240.00",
      totalValue: "5870.40"
    }
  ]);

  // Función para añadir un nuevo item
  const addItem = () => {
    setItems([...items, {
      description: "",
      containerNumber: "",
      weight: "",
      unitPrice: "",
      totalValue: ""
    }]);
  };

  // Función para eliminar un item
  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSave = () => {
    // Lógica para guardar los cambios
    router.push(`/negocios/${negocioId}?tab=shipping`);
  };

  // Calcular totales
  const totalWeight = items.reduce((sum, item) => sum + parseFloat(item.weight || "0"), 0).toFixed(2);
  const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.totalValue || "0"), 0).toFixed(2);

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
                Edit Invoice
              </h1>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenido del formulario */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Detalles del Albarán */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="bg-gray-100 px-6 py-4">
            <h3 className="font-medium text-gray-700">Invoice Details</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deal Number</label>
                <input 
                  type="text" 
                  value={negocioId}
                  className="w-full p-2 border rounded-md"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                <div className="relative">
                  <input 
                    type="date" 
                    defaultValue="2025-03-10"
                    className="w-full p-2 border rounded-md pr-10"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                    <FiCalendar className="w-5 h-5" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="relative">
                  <select className="w-full p-2 border rounded-md appearance-none">
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                    <FiChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Información del Cliente */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="bg-gray-100 px-6 py-4">
            <h3 className="font-medium text-gray-700">Customer Information</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input 
                  type="text" 
                  defaultValue="DDH TRADE CO.,LIMITED"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                <input 
                  type="text" 
                  placeholder="e.g XXXX30283-9-00"
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Good Descriptions */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="bg-gray-100 px-6 py-4">
            <h3 className="font-medium text-gray-700">Good Descriptions</h3>
          </div>
          
          <div className="p-6">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-5 gap-4 mb-4">
                <div>
                  <label className={`block text-sm text-gray-700 mb-1 ${index > 0 ? 'invisible' : ''}`}>Description</label>
                  <input 
                    type="text" 
                    defaultValue={item.description}
                    placeholder="e.g PP PLASTICS"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm text-gray-700 mb-1 ${index > 0 ? 'invisible' : ''}`}>Container Number</label>
                  <input 
                    type="text" 
                    defaultValue={item.containerNumber}
                    placeholder="e.g 3"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm text-gray-700 mb-1 ${index > 0 ? 'invisible' : ''}`}>Weight(MT)</label>
                  <input 
                    type="text" 
                    defaultValue={item.weight}
                    placeholder="e.g 19.6"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm text-gray-700 mb-1 ${index > 0 ? 'invisible' : ''}`}>Unit price</label>
                  <input 
                    type="text" 
                    defaultValue={item.unitPrice}
                    placeholder="e.g 80€"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                
                <div className="flex items-end">
                  <div className="flex-grow">
                    <label className={`block text-sm text-gray-700 mb-1 ${index > 0 ? 'invisible' : ''}`}>
                      Total Value <span className="text-blue-500">auto</span>
                    </label>
                    <input 
                      type="text" 
                      defaultValue={item.totalValue}
                      placeholder="e.g 80€"
                      className="w-full p-2 border rounded-md"
                      readOnly
                    />
                  </div>
                  
                  {index > 0 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="ml-2 p-2 bg-red-100 text-red-600 rounded-md h-[42px] flex items-center justify-center"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Botón para añadir más items */}
            <div className="mt-2">
              <button
                onClick={addItem}
                className="p-2 bg-gray-200 text-gray-700 rounded-md flex items-center justify-center w-10 h-10"
              >
                <FiPlus className="w-5 h-5" />
              </button>
            </div>
            
            {/* Información adicional y totales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origin of Goods <span className="text-blue-500">auto</span>
                </label>
                <input 
                  type="text" 
                  defaultValue="Spain"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  40ft Containers Count <span className="text-blue-500">auto</span>
                </label>
                <input 
                  type="text" 
                  defaultValue="10"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Weight (MT) <span className="text-blue-500">auto</span>
                </label>
                <input 
                  type="text" 
                  value={totalWeight}
                  className="w-full p-2 border rounded-md"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount <span className="text-blue-500">auto</span>
                </label>
                <input 
                  type="text" 
                  value={totalAmount}
                  className="w-full p-2 border rounded-md"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Detalles Bancarios */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="bg-gray-100 px-6 py-4">
            <h3 className="font-medium text-gray-700">Bank Details</h3>
          </div>
          
          <div className="p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Name</label>
              <input 
                type="text" 
                defaultValue="Santander S.A. - ES60004953321426100008899 - USD"
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>
        
        {/* Shipping Details */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="bg-gray-100 px-6 py-4">
            <h3 className="font-medium text-gray-700">Shipping Details</h3>
          </div>
          
          <div className="p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea 
                placeholder="e.g INV00149 HDPE PLASTIC SCRAP HS CODE 39151020 -CFR MERSIN PORT- TURKEY CONSIGNEE: OZ BESLENEN TARIMURUNLERI NAK. PET.TEKS. SAN VE TIC LTD STI. AKCATAS MAH. 1CAD, NO:11-1 VIRANSEHIR/SANLIURFA)"
                className="w-full p-2 border rounded-md h-24"
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Pie con botones */}
        <div className="flex justify-end space-x-3 mt-6">
          <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50">
            Export
          </button>
          <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50">
            Preview PDF
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
} 
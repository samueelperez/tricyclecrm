'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiChevronDown, 
  FiPlus, 
  FiTrash2,
  FiSave
} from 'react-icons/fi';

export default function EditCustomerProformaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Datos de ejemplo para la proforma
  const [proforma, setProforma] = useState({
    id: params.id,
    number: `PRF-${params.id.substring(0, 8)}`,
    date: '2025-01-13',
    customerName: 'DDH TRADE CO.,LIMITED',
    taxId: 'XXXX30283-9-00',
    ports: 'TEMA PORT - GHANA',
    deliveryTerms: 'CIF (Cost, Insurance, and Freight), DTHC Not Included, 14 Free Combined Days of',
    paymentTerms: '30% CASH IN ADVANCE 70% CASH AGAINST DOCUMENTS',
    bankAccount: 'Santander S.A. - ES6000495332142610008899 - USD',
    shippingNotes: '',
    items: [
      {
        id: '1',
        description: 'PP JUMBO BAGS',
        quantity: 10,
        weight: 200.00,
        unitPrice: 240.00,
        packaging: 'Bales',
        totalValue: 48000.00
      }
    ],
    origin: 'Spain',
    containers: 10,
    totalWeight: 200.00,
    totalAmount: 48000.00
  });

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleCancel = () => {
    router.push(`/proformas?tab=customer`);
  };

  const handleSave = () => {
    // Aquí iría la lógica para guardar los cambios
    setLoading(true);
    
    // Simulamos un tiempo de procesamiento
    setTimeout(() => {
      setLoading(false);
      // Redirigir de vuelta a la pestaña de proformas
      router.push(`/proformas?tab=customer`);
    }, 500);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...proforma.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Recalcular el valor total si cambia la cantidad o el precio unitario
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalValue = 
        updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setProforma({
      ...proforma,
      items: updatedItems
    });
  };

  const addNewItem = () => {
    setProforma({
      ...proforma,
      items: [
        ...proforma.items,
        {
          id: Date.now().toString(),
          description: '',
          quantity: 0,
          weight: 0,
          unitPrice: 0,
          packaging: 'Type',
          totalValue: 0
        }
      ]
    });
  };

  const removeItem = (index: number) => {
    const updatedItems = [...proforma.items];
    updatedItems.splice(index, 1);
    setProforma({
      ...proforma,
      items: updatedItems
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-100 rounded-lg w-full"></div>
          </div>
        </div>
      </div>
    );
  }

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
                <FiSave className="h-5 w-5 mr-2" />
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
                value={proforma.number}
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Proforma</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={proforma.date}
                  onChange={(e) => setProforma({...proforma, date: e.target.value})}
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
                <select 
                  className="w-full p-2 border rounded-md appearance-none"
                  value={proforma.customerName}
                  onChange={(e) => setProforma({...proforma, customerName: e.target.value})}
                >
                  <option>DDH TRADE CO.,LIMITED</option>
                  <option>Construcciones Martínez S.L.</option>
                  <option>Edificaciones Modernas</option>
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
                value={proforma.taxId}
                onChange={(e) => setProforma({...proforma, taxId: e.target.value})}
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
                <select 
                  className="w-full p-2 border rounded-md appearance-none"
                  value={proforma.ports}
                  onChange={(e) => setProforma({...proforma, ports: e.target.value})}
                >
                  <option>TEMA PORT - GHANA</option>
                  <option>BARCELONA - ESPAÑA</option>
                  <option>VALENCIA - ESPAÑA</option>
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
                value={proforma.deliveryTerms}
                onChange={(e) => setProforma({...proforma, deliveryTerms: e.target.value})}
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
              <select 
                className="w-full p-2 border rounded-md appearance-none"
                value={proforma.paymentTerms}
                onChange={(e) => setProforma({...proforma, paymentTerms: e.target.value})}
              >
                <option>30% CASH IN ADVANCE 70% CASH AGAINST DOCUMENTS</option>
                <option>100% CASH IN ADVANCE</option>
                <option>50% CASH IN ADVANCE 50% BEFORE SHIPMENT</option>
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
          
          {/* Líneas de productos */}
          {proforma.items.map((item, index) => (
            <div key={item.id} className="mb-4 border rounded-md overflow-hidden">
              <div className="grid grid-cols-6 gap-2 p-3 bg-white">
                <div className="col-span-6 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                  <input 
                    type="text" 
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                  <input 
                    type="number" 
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Peso (MT)</label>
                  <input 
                    type="number" 
                    value={item.weight}
                    onChange={(e) => handleItemChange(index, 'weight', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Precio Unitario</label>
                  <input 
                    type="number" 
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Empaque</label>
                  <div className="relative">
                    <select 
                      className="w-full p-2 border rounded-md appearance-none"
                      value={item.packaging}
                      onChange={(e) => handleItemChange(index, 'packaging', e.target.value)}
                    >
                      <option>Bales</option>
                      <option>Boxes</option>
                      <option>Pallets</option>
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
                    value={item.totalValue.toFixed(2)}
                    className="w-full p-2 border rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
              <div className="flex justify-end border-t p-2 bg-white">
                <button 
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                  onClick={() => removeItem(index)}
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          
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
              <button 
                className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                onClick={addNewItem}
              >
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
                value={proforma.origin}
                onChange={(e) => setProforma({...proforma, origin: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenedores 40ft <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value={proforma.containers}
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso Total (MT) <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value={proforma.totalWeight.toFixed(2)}
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value={proforma.totalAmount.toFixed(2)}
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
              <select 
                className="w-full p-2 border rounded-md appearance-none"
                value={proforma.bankAccount}
                onChange={(e) => setProforma({...proforma, bankAccount: e.target.value})}
              >
                <option>Santander S.A. - ES6000495332142610008899 - USD</option>
                <option>BBVA - ES9101822370420201558843 - EUR</option>
                <option>CaixaBank - ES7121000418401234567891 - USD</option>
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
              value={proforma.shippingNotes}
              onChange={(e) => setProforma({...proforma, shippingNotes: e.target.value})}
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
            <FiSave className="h-5 w-5 mr-2" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
} 
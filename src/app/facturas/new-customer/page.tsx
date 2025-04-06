'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiChevronDown, 
  FiPlus, 
  FiTrash2,
  FiSave
} from 'react-icons/fi';

import { getSupabaseClient } from '@/lib/supabase';

export default function NewCustomerInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [proveedoresList, setProveedoresList] = useState<{id: string, nombre: string}[]>([]);
  
  // Datos iniciales para la factura
  const [invoice, setInvoice] = useState({
    number: `INV-${Date.now().toString().substring(0, 8)}`,
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    taxId: '',
    paymentTerms: '',
    invoiceNotes: '',
    items: [
      {
        id: '1',
        description: '',
        quantity: 0,
        unitPrice: 0,
        taxRate: 21,
        totalValue: 0,
        providerId: '' // ID del proveedor asignado a este producto
      }
    ],
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    // Proveedores adicionales para esta factura
    additionalProviders: []
  });

  // Estado para gestionar la adición de nuevos proveedores
  const [newProvider, setNewProvider] = useState({
    id: '',
    name: '',
    percentage: 0
  });

  // Cargar lista de proveedores al iniciar
  useEffect(() => {
    const cargarProveedores = async () => {
      try {
        const supabaseClient = getSupabaseClient();
        const { data, error } = await supabaseClient
          .from('proveedores')
          .select('id, nombre')
          .order('nombre');
          
        if (error) {
          console.error('Error cargando proveedores:', error);
          return;
        }
        
        setProveedoresList(data || []);
      } catch (err) {
        console.error('Error al cargar los proveedores:', err);
      }
    };
    
    cargarProveedores();
  }, []);

  const handleCancel = () => {
    router.push(`/facturas?tab=customer`);
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Validar campos obligatorios
      if (!invoice.customerName) {
        alert('Por favor, seleccione un cliente');
        setLoading(false);
        return;
      }
      
      if (invoice.items.some(item => !item.description)) {
        alert('Por favor, complete la descripción de todos los productos');
        setLoading(false);
        return;
      }
      
      const supabase = getSupabaseClient();
      
      // Preparar datos para guardar en Supabase
      const facturaData = {
        id_externo: invoice.number,
        fecha: invoice.date,
        negocio_id: null, // Se podría relacionar con un negocio específico en el futuro
        monto: invoice.totalAmount,
        material: JSON.stringify({
          cliente_nombre: invoice.customerName,
          taxId: invoice.taxId,
          paymentTerms: invoice.paymentTerms,
          notas: invoice.invoiceNotes,
          items: invoice.items,
          descripcion: invoice.items[0]?.description || ''
        }),
        notas: prepareNotes(),
        estado: 'pendiente'
      };
      
      console.log('Guardando factura:', facturaData);
      
      // Insertar factura en Supabase
      const { data: facturaInsertada, error: facturaError } = await supabase
        .from('facturas_cliente')
        .insert(facturaData)
        .select('id')
        .single();
      
      if (facturaError) {
        throw new Error(`Error al guardar la factura: ${facturaError.message}`);
      }
      
      console.log('Factura guardada con ID:', facturaInsertada.id);
      
      // En el futuro, aquí se podrían guardar también las líneas de factura en una tabla relacionada
      
      alert('Factura guardada correctamente');
      
      // Redirigir de vuelta a la página de facturas
      router.push(`/facturas?tab=customer`);
    } catch (error) {
      console.error('Error al guardar la factura:', error);
      alert(`Error al guardar la factura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Preparar notas con la información de proveedores adicionales
  const prepareNotes = () => {
    let notes = invoice.invoiceNotes || '';
    
    // Añadir información de proveedores adicionales si existen
    if (invoice.additionalProviders.length > 0) {
      notes += (notes ? '\n\n' : '') + 'Proveedores adicionales:\n';
      notes += invoice.additionalProviders.map(provider => 
        `${provider.name}${provider.percentage ? `: ${provider.percentage}%` : ''}`
      ).join('\n');
    }
    
    return notes;
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...invoice.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Recalcular el valor total si cambia la cantidad o el precio unitario
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      const quantity = updatedItems[index].quantity;
      const unitPrice = updatedItems[index].unitPrice;
      updatedItems[index].totalValue = quantity * unitPrice;
    }
    
    // Recalcular totales
    const subtotal = updatedItems.reduce((sum, item) => sum + item.totalValue, 0);
    const taxAmount = updatedItems.reduce((sum, item) => sum + (item.totalValue * (item.taxRate / 100)), 0);
    
    setInvoice({
      ...invoice,
      items: updatedItems,
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount
    });
  };

  const addNewItem = () => {
    setInvoice({
      ...invoice,
      items: [
        ...invoice.items,
        {
          id: Date.now().toString(),
          description: '',
          quantity: 0,
          unitPrice: 0,
          taxRate: 21,
          totalValue: 0,
          providerId: ''
        }
      ]
    });
  };

  const removeItem = (index: number) => {
    const updatedItems = [...invoice.items];
    updatedItems.splice(index, 1);
    
    // Recalcular totales
    const subtotal = updatedItems.reduce((sum, item) => sum + item.totalValue, 0);
    const taxAmount = updatedItems.reduce((sum, item) => sum + (item.totalValue * (item.taxRate / 100)), 0);
    
    setInvoice({
      ...invoice,
      items: updatedItems,
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount
    });
  };

  // Añadir un nuevo proveedor
  const addProvider = () => {
    if (!newProvider.id) {
      alert('Por favor, seleccione un proveedor');
      return;
    }
    
    // Verificar si el proveedor ya existe en la lista
    if (invoice.additionalProviders.some(p => p.id === newProvider.id)) {
      alert('Este proveedor ya ha sido añadido');
      return;
    }
    
    // Buscar el nombre del proveedor seleccionado
    const proveedorSeleccionado = proveedoresList.find(p => p.id === newProvider.id);
    if (!proveedorSeleccionado) return;
    
    setInvoice({
      ...invoice,
      additionalProviders: [
        ...invoice.additionalProviders,
        {
          id: newProvider.id,
          name: proveedorSeleccionado.nombre,
          percentage: newProvider.percentage || 0
        }
      ]
    });
    
    // Limpiar el formulario de nuevo proveedor
    setNewProvider({
      id: '',
      name: '',
      percentage: 0
    });
  };
  
  // Eliminar un proveedor
  const removeProvider = (id) => {
    setInvoice({
      ...invoice,
      additionalProviders: invoice.additionalProviders.filter(provider => provider.id !== id)
    });
  };
  
  // Asignar un proveedor a un producto específico
  const assignProviderToItem = (itemIndex, providerId) => {
    const updatedItems = [...invoice.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      providerId
    };
    
    setInvoice({
      ...invoice,
      items: updatedItems
    });
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
              <h1 className="text-xl font-medium text-gray-800">Nueva Factura Cliente</h1>
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
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
              >
                <FiSave className="h-5 w-5 mr-2" />
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenido del formulario */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Invoice Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Detalles de Factura</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Factura</label>
              <input 
                type="text" 
                value={invoice.number}
                className="w-full p-2 border rounded-md bg-gray-50"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Factura</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={invoice.date}
                  onChange={(e) => setInvoice({...invoice, date: e.target.value})}
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
                  value={invoice.customerName}
                  onChange={(e) => setInvoice({...invoice, customerName: e.target.value})}
                >
                  <option value="">Seleccionar cliente</option>
                  <option>DDH TRADE CO.,LIMITED</option>
                  <option>LAO QIXIN CO.,LTD.</option>
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
                value={invoice.taxId}
                onChange={(e) => setInvoice({...invoice, taxId: e.target.value})}
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
                value={invoice.paymentTerms}
                onChange={(e) => setInvoice({...invoice, paymentTerms: e.target.value})}
              >
                <option value="">Seleccionar términos de pago</option>
                <option>30 días</option>
                <option>60 días</option>
                <option>Pago inmediato</option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <FiChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Proveedores Adicionales */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Proveedores Adicionales</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proveedor</label>
              <div className="relative">
                <select 
                  className="w-full p-2 border rounded-md appearance-none"
                  value={newProvider.id}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedProvider = proveedoresList.find(p => p.id === selectedId);
                    setNewProvider({
                      ...newProvider,
                      id: selectedId,
                      name: selectedProvider?.nombre || ''
                    });
                  }}
                >
                  <option value="">Seleccionar proveedor</option>
                  {proveedoresList.map(proveedor => (
                    <option key={proveedor.id} value={proveedor.id}>
                      {proveedor.nombre}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje (%)</label>
              <input 
                type="number" 
                placeholder="ej. 40"
                value={newProvider.percentage || ''}
                onChange={(e) => setNewProvider({...newProvider, percentage: parseFloat(e.target.value) || 0})}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <button 
              onClick={addProvider}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Añadir Proveedor
            </button>
          </div>
          
          {/* Lista de proveedores añadidos */}
          {invoice.additionalProviders.length > 0 && (
            <div className="mt-4 border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Porcentaje</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.additionalProviders.map((provider) => (
                    <tr key={provider.id}>
                      <td className="px-4 py-2 whitespace-nowrap">{provider.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{provider.percentage}%</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <button 
                          onClick={() => removeProvider(provider.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Invoice Items */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Líneas de Factura</h3>
          
          {/* Líneas de productos */}
          {invoice.items.map((item, index) => (
            <div key={item.id} className="mb-4 border rounded-md overflow-hidden">
              <div className="grid grid-cols-6 gap-2 p-3 bg-white">
                <div className="col-span-6 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                  <input 
                    type="text" 
                    placeholder="ej. PP JUMBO BAGS"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                  <input 
                    type="number" 
                    placeholder="ej. 10"
                    value={item.quantity || ''}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Precio Unitario</label>
                  <input 
                    type="number" 
                    placeholder="ej. 240.00"
                    value={item.unitPrice || ''}
                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">% IVA</label>
                  <input 
                    type="number" 
                    value={item.taxRate || ''}
                    onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-4 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Valor Total <span className="text-blue-500">auto</span></label>
                  <input 
                    type="text" 
                    value={item.totalValue.toFixed(2)}
                    className="w-full p-2 border rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                {/* Añadir selector de proveedor si hay proveedores adicionales */}
                {invoice.additionalProviders.length > 0 && (
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Proveedor</label>
                    <div className="relative">
                      <select 
                        className="w-full p-2 border rounded-md appearance-none"
                        value={item.providerId}
                        onChange={(e) => assignProviderToItem(index, e.target.value)}
                      >
                        <option value="">Sin proveedor</option>
                        {invoice.additionalProviders.map(provider => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                        <FiChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end border-t p-2 bg-white">
                {index === 0 && invoice.items.length === 1 ? (
                  <button 
                    className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                    onClick={addNewItem}
                  >
                    <FiPlus className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    onClick={() => removeItem(index)}
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {/* Botón para añadir nueva línea */}
          {invoice.items.length > 0 && (
            <div className="mb-4 border rounded-md overflow-hidden">
              <div className="p-3 bg-white flex justify-center">
                <button 
                  className="flex items-center text-blue-500 hover:text-blue-700"
                  onClick={addNewItem}
                >
                  <FiPlus className="mr-1 h-5 w-5" />
                  <span>Añadir Línea</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Resumen */}
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-end">
              <div className="w-full md:w-1/3">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{invoice.subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">IVA:</span>
                  <span className="font-medium">{invoice.taxAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-200 mt-2">
                  <span className="text-gray-800 font-medium">Total:</span>
                  <span className="text-gray-800 font-bold">{invoice.totalAmount.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notes */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Notas</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas de Factura (opcional)</label>
            <textarea 
              placeholder="ej. Factura correspondiente al pedido #12345"
              value={invoice.invoiceNotes}
              onChange={(e) => setInvoice({...invoice, invoiceNotes: e.target.value})}
              className="w-full p-2 border rounded-md h-24"
            ></textarea>
          </div>
        </div>
        
        {/* Pie con botones */}
        <div className="flex justify-end space-x-3 mt-6">
          <button 
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
          >
            <FiSave className="h-5 w-5 mr-2" />
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
} 
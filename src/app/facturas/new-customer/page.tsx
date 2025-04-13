'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiChevronDown, 
  FiPlus, 
  FiTrash2,
  FiSave,
  FiSearch
} from 'react-icons/fi';

import { getSupabaseClient } from '@/lib/supabase';
import { verifyFacturasClienteTable } from '@/lib/db-migrations';

// Definir interfaces para los tipos
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalValue: number;
}

// Lista de puertos predefinidos
const PUERTOS_SUGERIDOS = [
  'TEMA PORT - GHANA',
  'APAPA PORT - NIGERIA',
  'MERSIN PORT - TURKEY',
  'KLANG WEST PORT - MALAYSIA',
  'LAEMCHABANG PORT - THAILAND'
];

// Lista de términos de pago predefinidos
const TERMINOS_PAGO_SUGERIDOS = [
  '30% CIA – 70% 14 days before ETA and after receiving copy of all documents required',
  '20% CIA – 80% 14 days before ETA and after receiving copy of all documents required',
  '50% CIA – 50% 14 days before ETA and after receiving copy of all documents required'
];

export default function NewCustomerInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientesList, setClientesList] = useState<{id: string, nombre: string}[]>([]);
  const [showPortSuggestions, setShowPortSuggestions] = useState(false);
  const [showPaymentTermsSuggestions, setShowPaymentTermsSuggestions] = useState(false);
  const [showPortDestSuggestions, setShowPortDestSuggestions] = useState(false);
  
  // Datos iniciales para la factura
  const [invoice, setInvoice] = useState({
    number: `INV-${Date.now().toString().substring(0, 8)}`,
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    taxId: '',
    paymentTerms: '',
    invoiceNotes: '',
    puerto_origen: '',
    puerto_destino: '',
    deliveryTerms: '',
    items: [
      {
        id: '1',
        description: '',
        quantity: 0,
        unitPrice: 0,
        taxRate: 21,
        totalValue: 0
      }
    ] as InvoiceItem[],
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0
  });

  // Cargar lista de clientes al iniciar
  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const supabaseClient = getSupabaseClient();
        const { data, error } = await supabaseClient
          .from('clientes')
          .select('id, nombre')
          .order('nombre');
          
        if (error) {
          console.error('Error cargando clientes:', error);
          return;
        }
        
        setClientesList(data || []);
      } catch (err) {
        console.error('Error al cargar los clientes:', err);
      }
    };
    
    cargarClientes();
  }, []);

  // Manejador para cerrar la lista de sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.ports-combobox')) {
        setShowPortSuggestions(false);
      }
      if (!target.closest('.ports-combobox-dest')) {
        setShowPortDestSuggestions(false);
      }
      if (!target.closest('.payment-terms-combobox')) {
        setShowPaymentTermsSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCancel = () => {
    router.push(`/facturas?tab=customer`);
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Verificar y actualizar la estructura de la tabla antes de guardar
      await verifyFacturasClienteTable();
      
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
      
      // Obtener el ID del cliente seleccionado
      let cliente_id = null;
      const clienteSeleccionado = clientesList.find(c => c.nombre === invoice.customerName);
      if (clienteSeleccionado) {
        cliente_id = clienteSeleccionado.id;
      }
      
      // Preparar datos para guardar en Supabase
      const facturaData = {
        id_externo: invoice.number,
        fecha: invoice.date,
        negocio_id: null, // Se podría relacionar con un negocio específico en el futuro
        cliente_id: cliente_id, // Usar directamente el campo cliente_id
        monto: invoice.totalAmount,
        material: JSON.stringify({
          cliente_nombre: invoice.customerName,
          taxId: invoice.taxId,
          paymentTerms: invoice.paymentTerms,
          deliveryTerms: invoice.deliveryTerms,
          notas: invoice.invoiceNotes,
          items: invoice.items,
          descripcion: invoice.items[0]?.description || ''
        }),
        notas: prepareNotes(),
        estado: 'pendiente',
        puerto_origen: invoice.puerto_origen,
        puerto_destino: invoice.puerto_destino
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

  // Preparar notas con la información de clientes adicionales
  const prepareNotes = () => {
    let notes = invoice.invoiceNotes || '';
    
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
          totalValue: 0
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
                onChange={(e) => setInvoice({...invoice, number: e.target.value})}
                className="w-full p-2 border rounded-md"
                placeholder="Ej: FAC-2023-001"
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
                  onChange={(e) => {
                    const nombreCliente = e.target.value;
                    setInvoice({...invoice, customerName: nombreCliente});
                    
                    // Buscar el ID fiscal del cliente seleccionado
                    const clienteSeleccionado = clientesList.find(c => c.nombre === nombreCliente);
                    if (clienteSeleccionado) {
                      // Obtener el ID fiscal de este cliente
                      const fetchClienteTaxId = async () => {
                        try {
                          const supabaseClient = getSupabaseClient();
                          const { data, error } = await supabaseClient
                            .from('clientes')
                            .select('id_fiscal')
                            .eq('id', clienteSeleccionado.id)
                            .single();
                            
                          if (!error && data) {
                            setInvoice(prev => ({...prev, taxId: data.id_fiscal || ''}));
                          }
                        } catch (err) {
                          console.error('Error al obtener ID fiscal:', err);
                        }
                      };
                      
                      fetchClienteTaxId();
                    }
                  }}
                >
                  <option value="">Seleccionar cliente</option>
                  {clientesList.map((cliente) => (
                    <option key={cliente.id} value={cliente.nombre}>{cliente.nombre}</option>
                  ))}
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
        
        {/* Información de Puertos */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Información de Puertos</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Puerto de Carga</label>
              <div className="relative ports-combobox">
                <input 
                  type="text" 
                  placeholder="Puerto de origen..."
                  value={invoice.puerto_origen}
                  onChange={(e) => {
                    setInvoice({...invoice, puerto_origen: e.target.value});
                  }}
                  onFocus={() => setShowPortSuggestions(true)}
                  className="w-full p-2 border rounded-md pr-10"
                />
                <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                
                {/* Lista de sugerencias */}
                {showPortSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {PUERTOS_SUGERIDOS
                      .filter(port => 
                        port.toLowerCase().includes(invoice.puerto_origen.toLowerCase())
                      )
                      .map((port, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setInvoice({...invoice, puerto_origen: port});
                            setShowPortSuggestions(false);
                          }}
                        >
                          {port}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Puerto de Descarga</label>
              <div className="relative ports-combobox-dest">
                <input 
                  type="text" 
                  placeholder="Puerto de destino..."
                  value={invoice.puerto_destino}
                  onChange={(e) => {
                    setInvoice({...invoice, puerto_destino: e.target.value});
                  }}
                  onFocus={() => setShowPortDestSuggestions(true)}
                  className="w-full p-2 border rounded-md pr-10"
                />
                <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                
                {/* Lista de sugerencias */}
                {showPortDestSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {PUERTOS_SUGERIDOS
                      .filter(port => 
                        port.toLowerCase().includes(invoice.puerto_destino.toLowerCase())
                      )
                      .map((port, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setInvoice({...invoice, puerto_destino: port});
                            setShowPortDestSuggestions(false);
                          }}
                        >
                          {port}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Términos de Entrega */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Términos de Entrega</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Términos de Entrega</label>
              <input 
                type="text" 
                placeholder="ej. CIF (Cost, Insurance, and Freight)"
                value={invoice.deliveryTerms}
                onChange={(e) => setInvoice({...invoice, deliveryTerms: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>
        
        {/* Payment Terms */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Términos de Pago</h3>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Términos de Pago</label>
            <div className="relative payment-terms-combobox">
              <input 
                type="text" 
                placeholder="Buscar o escribir términos de pago..."
                value={invoice.paymentTerms}
                onChange={(e) => {
                  setInvoice({...invoice, paymentTerms: e.target.value});
                }}
                onFocus={() => setShowPaymentTermsSuggestions(true)}
                className="w-full p-2 border rounded-md pr-10"
              />
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              
              {/* Lista de sugerencias */}
              {showPaymentTermsSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {TERMINOS_PAGO_SUGERIDOS
                    .filter(term => 
                      term.toLowerCase().includes(invoice.paymentTerms.toLowerCase())
                    )
                    .map((term, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setInvoice({...invoice, paymentTerms: term});
                          setShowPaymentTermsSuggestions(false);
                        }}
                      >
                        {term}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
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
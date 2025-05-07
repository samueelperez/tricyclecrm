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
import { cookies } from 'next/headers';
import { Proforma } from '@/app/proformas/components/types';

import { getSupabaseClient } from '@/lib/supabase';
import { verifyFacturasClienteTable } from '@/lib/db-migrations';
import ClienteSelector, { Cliente } from '@/components/cliente-selector';
import { PUERTOS_SUGERIDOS, TERMINOS_PAGO_SUGERIDOS, CUENTAS_BANCARIAS, EMPAQUE_OPCIONES } from '@/lib/constants';
import InvoicePrintView from '@/components/invoice-print-view';

// Definir interfaces para los tipos
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  weight?: number;
  unitPrice: number;
  totalValue: number;
  packaging?: string;
}

// Definir una versión extendida de la interface Proforma que incluya la propiedad cliente
interface ProformaWithClient extends Proforma {
  cliente?: {
    id: string;
    nombre: string;
    id_fiscal?: string;
  } | null;
}

export default function NewCustomerInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [showPortSuggestions, setShowPortSuggestions] = useState(false);
  const [showPaymentTermsSuggestions, setShowPaymentTermsSuggestions] = useState(false);
  const [showPortDestSuggestions, setShowPortDestSuggestions] = useState(false);
  const [proformasList, setProformasList] = useState<ProformaWithClient[]>([]);
  const [selectedProformaId, setSelectedProformaId] = useState<string>('');
  const [selectedProforma, setSelectedProforma] = useState<ProformaWithClient | null>(null);
  
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
    bankAccount: CUENTAS_BANCARIAS[0].descripcion, // Establece la cuenta bancaria por defecto
    items: [
      {
        id: '1',
        description: '',
        quantity: 0,
        weight: 0,
        unitPrice: 0,
        totalValue: 0,
        packaging: ''
      }
    ] as InvoiceItem[],
    subtotal: 0,
    totalAmount: 0,
    proforma_id: null as number | null, // Añadir esta propiedad para evitar errores de tipo
  });

  // Cargar lista de clientes al iniciar
  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const supabaseClient = getSupabaseClient();
        const { data, error } = await supabaseClient
          .from('clientes')
          .select('id, nombre, id_fiscal, email, ciudad, telefono')
          .order('nombre');
          
        if (error) {
          console.error('Error cargando clientes:', error);
          return;
        }
        
        // Convertir explícitamente los IDs de string a number para que coincidan con la interfaz Cliente
        const clientesConIdNumerico = (data || []).map(cliente => ({
          ...cliente,
          id: typeof cliente.id === 'string' ? parseInt(cliente.id, 10) : cliente.id
        }));
        
        setClientesList(clientesConIdNumerico);
      } catch (err) {
        console.error('Error al cargar los clientes:', err);
      }
    };
    
    cargarClientes();
    
    // Cargar proformas de clientes
    const cargarProformas = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('proformas')
          .select('*, cliente:clientes(*)')
          .order('fecha', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        setProformasList(data || []);
      } catch (error) {
        console.error('Error al cargar proformas:', error);
      }
    };
    
    cargarProformas();
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
          descripcion: invoice.items[0]?.description || '',
          puerto_origen: invoice.puerto_origen,
          puerto_destino: invoice.puerto_destino,
          bankAccount: invoice.bankAccount // Agregar la cuenta bancaria al objeto material
        }),
        notas: prepareNotes(),
        estado: 'pendiente',
        puerto_origen: invoice.puerto_origen,
        puerto_destino: invoice.puerto_destino,
        proforma_id: selectedProforma?.id || null, // Incluir referencia a la proforma
        ref_proforma: selectedProforma?.id_externo || null, // Incluir referencia externa a la proforma
        cuenta_bancaria: invoice.bankAccount || "" // Guardar la cuenta bancaria directamente en la columna de la tabla
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
    
    // Recalcular el valor total si cambia el peso o el precio unitario
    if (field === 'weight' || field === 'unitPrice') {
      // Usar peso para el cálculo si está disponible, de lo contrario usar quantity
      const weight = updatedItems[index].weight || 0;
      const unitPrice = updatedItems[index].unitPrice;
      updatedItems[index].totalValue = weight * unitPrice;
    }
    
    // Recalcular totales
    const subtotal = updatedItems.reduce((sum, item) => sum + item.totalValue, 0);
    
    setInvoice({
      ...invoice,
      items: updatedItems,
      subtotal,
      totalAmount: subtotal
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
          weight: 0,
          unitPrice: 0,
          totalValue: 0,
          packaging: ''
        }
      ]
    });
  };

  const removeItem = (index: number) => {
    const updatedItems = [...invoice.items];
    updatedItems.splice(index, 1);
    
    // Recalcular totales
    const subtotal = updatedItems.reduce((sum, item) => sum + item.totalValue, 0);
    
    setInvoice({
      ...invoice,
      items: updatedItems,
      subtotal,
      totalAmount: subtotal
    });
  };

  const handleProformaSelect = async (proformaId: string) => {
    if (!proformaId) {
      setSelectedProforma(null);
      return;
    }
    
    setLoading(true);
    
    try {
      const supabase = getSupabaseClient();
      
      // Obtener detalles de la proforma
      const { data: proforma, error: proformaError } = await supabase
        .from('proformas')
        .select('*, cliente:clientes(*)')
        .eq('id', proformaId)
        .single();
      
      if (proformaError) throw proformaError;
      
      // Guardar la proforma seleccionada
      setSelectedProforma(proforma as ProformaWithClient);
      
      // Obtener productos de la proforma
      const { data: proformaProductos, error: productosError } = await supabase
        .from('proformas_productos')
        .select('*')
        .eq('proforma_id', proformaId);
      
      if (productosError) throw productosError;
      
      // Mapear productos de la proforma a items de factura
      const invoiceItems = proformaProductos?.map((producto, index) => ({
        id: String(index + 1),
        description: producto.descripcion || '',
        quantity: producto.cantidad || 0,
        weight: producto.peso || 0,
        unitPrice: producto.precio_unitario || 0,
        totalValue: producto.valor_total || 0,
        packaging: producto.empaque || ''
      })) || [];
      
      // Si no hay productos, mantener al menos un ítem vacío
      if (invoiceItems.length === 0) {
        invoiceItems.push({
          id: '1',
          description: '',
          quantity: 0,
          weight: 0,
          unitPrice: 0,
          totalValue: 0,
          packaging: ''
        });
      }
      
      // Actualizar el estado de la factura con los datos de la proforma
      setInvoice({
        ...invoice,
        customerName: proforma.cliente?.nombre || '',
        taxId: proforma.cliente?.id_fiscal || '',
        paymentTerms: proforma.condiciones_pago || '',
        puerto_origen: proforma.puerto_origen || '',
        puerto_destino: proforma.puerto_destino || '',
        deliveryTerms: proforma.incoterm || '',
        invoiceNotes: `Ref. Proforma: ${proforma.numero}${proforma.notas ? '\n' + proforma.notas : ''}`,
        items: invoiceItems,
        subtotal: proforma.monto_subtotal || 0,
        totalAmount: proforma.monto || 0,
        proforma_id: parseInt(proformaId)
      });
      
    } catch (error) {
      console.error('Error al cargar detalles de la proforma:', error);
      alert('Error al cargar la proforma seleccionada');
    } finally {
      setLoading(false);
    }
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
        {/* Selector de Proforma */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Seleccionar Proforma Existente (Opcional)</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proforma</label>
              <div className="relative">
                <select 
                  className="w-full p-2 border rounded-md appearance-none"
                  value={selectedProformaId}
                  onChange={(e) => {
                    const newProformaId = e.target.value;
                    setSelectedProformaId(newProformaId);
                    if (newProformaId) {
                      handleProformaSelect(newProformaId);
                    }
                  }}
                >
                  <option value="">Seleccionar proforma (opcional)</option>
                  {proformasList.map((proforma) => (
                    <option key={proforma.id} value={proforma.id}>
                      {proforma.id_externo || `PRO-${proforma.id}`} - {proforma.cliente?.nombre || 'Sin cliente'} - {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(proforma.monto || 0)}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiChevronDown className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Al seleccionar una proforma, se cargarán automáticamente todos sus datos en el formulario.
              </p>
              {selectedProforma && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium">
                    Proforma seleccionada: {selectedProforma.id_externo || `PRO-${selectedProforma.id}`}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Cliente: {selectedProforma.cliente?.nombre} • Monto: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(selectedProforma.monto || 0)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
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
              <ClienteSelector 
                value={invoice.customerName}
                clientesList={clientesList}
                onChange={(nombreCliente) => {
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
              />
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
          
          <div>
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
                  <label className="block text-xs font-medium text-gray-500 mb-1">Peso (MT)</label>
                  <input 
                    type="number" 
                    placeholder="ej. 20.00"
                    value={item.weight || ''}
                    onChange={(e) => handleItemChange(index, 'weight', parseFloat(e.target.value) || 0)}
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
                  <label className="block text-xs font-medium text-gray-500 mb-1">Empaque</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Tipo de empaque"
                      value={item.packaging}
                      onChange={(e) => handleItemChange(index, 'packaging', e.target.value)}
                      list="packaging-options"
                      className="w-full p-2 border rounded-md pr-10"
                    />
                    <datalist id="packaging-options">
                      {EMPAQUE_OPCIONES.map((option, idx) => (
                        <option key={idx} value={option} />
                      ))}
                    </datalist>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                      <FiChevronDown className="w-4 h-4" />
                    </div>
                  </div>
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
        
        {/* Bank Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Datos Bancarios</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Bancaria</label>
            <div className="relative">
              <select 
                className="w-full p-2 border rounded-md appearance-none"
                value={invoice.bankAccount}
                onChange={(e) => setInvoice({...invoice, bankAccount: e.target.value})}
              >
                {CUENTAS_BANCARIAS.map(cuenta => (
                  <option key={cuenta.id} value={cuenta.descripcion}>
                    {cuenta.nombre} - {cuenta.banco} ({cuenta.moneda})
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <FiChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          {/* Mostrar detalles bancarios */}
          {invoice.bankAccount && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
              {CUENTAS_BANCARIAS.filter(cuenta => cuenta.descripcion === invoice.bankAccount).map(cuenta => (
                <div key={cuenta.id}>
                  <p><span className="font-medium">Banco:</span> {cuenta.banco}</p>
                  <p><span className="font-medium">IBAN:</span> {cuenta.iban}</p>
                  <p><span className="font-medium">SWIFT:</span> {cuenta.swift}</p>
                  <p><span className="font-medium">Moneda:</span> {cuenta.moneda}</p>
                </div>
              ))}
            </div>
          )}
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
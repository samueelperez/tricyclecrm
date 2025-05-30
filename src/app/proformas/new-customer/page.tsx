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
  FiCode,
  FiSearch
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { verifyProformasProductosTable } from '@/lib/db-migrations';
import ClienteSelector, { Cliente } from '@/components/cliente-selector';

// Interfaces para tipar correctamente los objetos
interface ProformaItem {
  id: string;
  description: string;
  quantity: number;
  weight: number;
  unitPrice: number;
  packaging: string;
  totalValue: number;
}

interface ProformaState {
  number: string;
  date: string;
  customerName: string;
  taxId: string;
  ports: string;
  deliveryTerms: string;
  paymentTerms: string;
  bankAccount: string;
  shippingNotes: string;
  items: ProformaItem[];
  origin: string;
  containers: number;
  totalWeight: number;
  totalAmount: number;
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

// Lista de opciones de empaque predefinidas
const EMPAQUE_OPCIONES = ['Bales', 'Loose', 'Package', 'Roles'];

export default function NewCustomerProformaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [showPortSuggestions, setShowPortSuggestions] = useState(false);
  const [showPaymentTermsSuggestions, setShowPaymentTermsSuggestions] = useState(false);
  
  // Datos iniciales para la proforma
  const [proforma, setProforma] = useState<ProformaState>({
    number: `PRO-CUST-${new Date().getFullYear().toString().substring(2)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    taxId: '',
    ports: '',
    deliveryTerms: '',
    paymentTerms: '',
    bankAccount: '',
    shippingNotes: '',
    items: [
      {
        id: '1',
        description: '',
        quantity: 0,
        weight: 0,
        unitPrice: 0,
        packaging: 'Type',
        totalValue: 0
      }
    ],
    origin: 'Spain',
    containers: 0,
    totalWeight: 0,
    totalAmount: 0
  });

  // Cargar lista de clientes al iniciar
  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const supabaseClient = supabase;
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
  }, []);

  // Manejador para cerrar la lista de sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.ports-combobox')) {
        setShowPortSuggestions(false);
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
    router.push(`/proformas?tab=customer`);
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Verificar la estructura de la tabla antes de guardar
      await verifyProformasProductosTable();
      
      // Validar datos básicos
      if (!proforma.customerName) {
        alert('Por favor, seleccione un cliente');
        setLoading(false);
        return;
      }
      
      if (proforma.items.some(item => !item.description)) {
        alert('Por favor, complete la descripción de todos los productos');
        setLoading(false);
        return;
      }
      
      // Obtener el ID del cliente seleccionado
      let cliente_id = null;
      const clienteSeleccionado = clientesList.find(c => c.nombre === proforma.customerName);
      if (clienteSeleccionado) {
        cliente_id = clienteSeleccionado.id;
      }
      
      // Preparar datos para guardar en Supabase
      const proformaData = {
        id_externo: proforma.number,
        fecha: proforma.date,
        cliente_id: cliente_id, // Incluir el ID del cliente
        id_fiscal: proforma.taxId,
        monto: proforma.totalAmount,
        puerto: proforma.ports,
        origen: proforma.origin,
        terminos_entrega: proforma.deliveryTerms,
        terminos_pago: proforma.paymentTerms,
        cuenta_bancaria: proforma.bankAccount,
        notas: prepareNotes()
      };
      
      console.log('Guardando proforma:', proformaData);
      
      // Insertar proforma en Supabase
      const { data: proformaInsertada, error: proformaError } = await supabase
        .from('proformas')
        .insert(proformaData)
        .select('id')
        .single();
      
      if (proformaError) {
        throw new Error(`Error al guardar la proforma: ${proformaError.message}`);
      }
      
      console.log('Proforma guardada con ID:', proformaInsertada.id);
      
      // Preparar productos para guardar
      const productosData = proforma.items.map(item => ({
        proforma_id: proformaInsertada.id,
        descripcion: item.description,
        cantidad: item.quantity,
        precio_unitario: item.unitPrice,
        peso: item.weight,
        tipo_empaque: item.packaging
      }));
      
      // Insertar productos de la proforma
      const { error: productosError } = await supabase
        .from('proformas_productos')
        .insert(productosData);
      
      if (productosError) {
        throw new Error(`Error al guardar los productos: ${productosError.message}`);
      }
      
      console.log('Productos guardados correctamente');
      
      alert('Proforma guardada correctamente');
      
      // Redirigir de vuelta a la pestaña de proformas
      router.push(`/proformas?tab=customer`);
    } catch (error) {
      console.error('Error al guardar la proforma:', error);
      alert(`Error al guardar la proforma: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Preparar notas
  const prepareNotes = () => {
    // Usar directamente las notas de envío sin añadir líneas de Cliente y Material
    return proforma.shippingNotes || '';
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...proforma.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Recalcular el valor total si cambia el peso o el precio unitario
    if (field === 'weight' || field === 'unitPrice') {
      updatedItems[index].totalValue = 
        updatedItems[index].weight * updatedItems[index].unitPrice;
    }
    
    // Recalcular totales
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.totalValue, 0);
    const totalWeight = updatedItems.reduce((sum, item) => sum + item.weight, 0);
    
    setProforma({
      ...proforma,
      items: updatedItems,
      totalAmount,
      totalWeight
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
    
    // Recalcular totales
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.totalValue, 0);
    const totalWeight = updatedItems.reduce((sum, item) => sum + item.weight, 0);
    
    setProforma({
      ...proforma,
      items: updatedItems,
      totalAmount,
      totalWeight
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
              <h1 className="text-xl font-medium text-gray-800">Nueva Proforma</h1>
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
        {/* Proforma Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Detalles de Proforma</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Proforma</label>
              <input 
                type="text" 
                value={proforma.number}
                onChange={(e) => setProforma({...proforma, number: e.target.value})}
                className="w-full p-2 border rounded-md"
                placeholder="Ej: PRO-CUST-23-001"
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
              <ClienteSelector 
                value={proforma.customerName}
                clientesList={clientesList}
                onChange={(nombreCliente) => {
                  setProforma({...proforma, customerName: nombreCliente});
                  
                  // Buscar el ID fiscal del cliente seleccionado
                  const clienteSeleccionado = clientesList.find(c => c.nombre === nombreCliente);
                  if (clienteSeleccionado) {
                    // Obtener el ID fiscal de este cliente
                    const fetchClienteTaxId = async () => {
                      try {
                        const supabaseClient = supabase;
                        const { data, error } = await supabaseClient
                          .from('clientes')
                          .select('id_fiscal')
                          .eq('id', clienteSeleccionado.id)
                          .single();
                          
                        if (!error && data) {
                          setProforma(prev => ({...prev, taxId: data.id_fiscal || ''}));
                        }
                      } catch (err) {
                        console.error('Error al obtener ID fiscal:', err);
                      }
                    };
                    
                    fetchClienteTaxId();
                  }
                }}
                placeholder="Seleccionar cliente"
              />
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
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Puertos</label>
              <div className="relative ports-combobox">
                <input 
                  type="text" 
                  placeholder="Buscar o escribir puerto..."
                  value={proforma.ports}
                  onChange={(e) => {
                    setProforma({...proforma, ports: e.target.value});
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
                        port.toLowerCase().includes(proforma.ports.toLowerCase())
                      )
                      .map((port, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setProforma({...proforma, ports: port});
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
                value={proforma.paymentTerms}
                onChange={(e) => {
                  setProforma({...proforma, paymentTerms: e.target.value});
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
                      term.toLowerCase().includes(proforma.paymentTerms.toLowerCase())
                    )
                    .map((term, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setProforma({...proforma, paymentTerms: term});
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
                    placeholder="ej. PP PLASTICS"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">40ft</label>
                  <input 
                    type="number" 
                    placeholder="ej. 10"
                    value={item.quantity || ''}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Peso (MT)</label>
                  <input 
                    type="number" 
                    placeholder="ej. 200.00"
                    value={item.weight || ''}
                    onChange={(e) => handleItemChange(index, 'weight', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Precio</label>
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
                      className="w-full p-2 border rounded-md pr-10"
                      value={item.packaging}
                      onChange={(e) => handleItemChange(index, 'packaging', e.target.value)}
                      list="packaging-options"
                      placeholder="Tipo de empaque"
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
                {index === 0 && proforma.items.length === 1 ? (
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
          {proforma.items.length > 0 && (
            <div className="mb-4 border rounded-md overflow-hidden">
              <div className="p-3 bg-white flex justify-center">
                <button 
                  className="flex items-center text-blue-500 hover:text-blue-700"
                  onClick={addNewItem}
                >
                  <FiPlus className="mr-1 h-5 w-5" />
                  <span>Añadir Producto</span>
                </button>
              </div>
            </div>
          )}
          
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenedores</label>
              <input 
                type="number" 
                min="0"
                value={proforma.containers}
                onChange={(e) => setProforma({...proforma, containers: parseInt(e.target.value) || 0})}
                className="w-full p-2 border rounded-md"
                placeholder="Ej: 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso Total (MT) <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value={proforma.totalWeight.toFixed(2)}
                className="w-full p-2 border rounded-md bg-gray-50"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value={proforma.totalAmount.toFixed(2)}
                className="w-full p-2 border rounded-md bg-gray-50"
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
                <option value="">Seleccionar cuenta bancaria</option>
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
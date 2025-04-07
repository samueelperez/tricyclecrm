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
import { supabase } from '@/lib/supabase';
import { verifyProformasProductosTable } from '@/lib/db-migrations';

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

export default function NewCustomerProformaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientesList, setClientesList] = useState<{id: string, nombre: string}[]>([]);
  
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
    
    // Recalcular el valor total si cambia la cantidad o el precio unitario
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalValue = 
        updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    // Recalcular totales
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.totalValue, 0);
    const totalWeight = updatedItems.reduce((sum, item) => sum + item.weight, 0);
    
    setProforma({
      ...proforma,
      items: updatedItems,
      totalAmount,
      totalWeight,
      containers: Math.ceil(totalWeight / 20) // Estimación simple: 1 contenedor por cada 20 MT
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
      totalWeight,
      containers: Math.ceil(totalWeight / 20)
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
              <div className="relative">
                <select 
                  className="w-full p-2 border rounded-md appearance-none"
                  value={proforma.customerName}
                  onChange={(e) => {
                    const nombreCliente = e.target.value;
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
                >
                  <option value="">Seleccionar cliente</option>
                  {clientesList.map(cliente => (
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
              <input 
                type="text" 
                placeholder="Ej: TEMA PORT - GHANA, BARCELONA - ESPAÑA"
                value={proforma.ports}
                onChange={(e) => setProforma({...proforma, ports: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Términos de Entrega</label>
              <input 
                type="text" 
                placeholder="ej. CIF (Cost, Insurance, and Freight)"
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
            <input 
              type="text" 
              placeholder="Ej: 30% PAGO POR ADELANTADO 70% PAGO CONTRA DOCUMENTOS"
              value={proforma.paymentTerms}
              onChange={(e) => setProforma({...proforma, paymentTerms: e.target.value})}
              className="w-full p-2 border rounded-md"
            />
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
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
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
                    <select 
                      className="w-full p-2 border rounded-md appearance-none"
                      value={item.packaging}
                      onChange={(e) => handleItemChange(index, 'packaging', e.target.value)}
                    >
                      <option>Tipo</option>
                      <option>Balas</option>
                      <option>Cajas</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenedores 40ft <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value={proforma.containers}
                className="w-full p-2 border rounded-md bg-gray-50"
                readOnly
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
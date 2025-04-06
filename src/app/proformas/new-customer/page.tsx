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

// Interfaces para tipar correctamente los objetos
interface ProformaItem {
  id: string;
  description: string;
  quantity: number;
  weight: number;
  unitPrice: number;
  packaging: string;
  totalValue: number;
  providerId: string;
}

interface AdditionalProvider {
  id: string;
  name: string;
  percentage: number;
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
  additionalProviders: AdditionalProvider[];
}

export default function NewCustomerProformaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [proveedoresList, setProveedoresList] = useState<{id: string, nombre: string}[]>([]);
  
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
        totalValue: 0,
        providerId: '' // ID del proveedor asignado a este producto
      }
    ],
    origin: 'Spain',
    containers: 0,
    totalWeight: 0,
    totalAmount: 0,
    // Proveedores adicionales para esta proforma
    additionalProviders: []
  });

  // Estado para gestionar la adición de nuevos proveedores
  const [newProvider, setNewProvider] = useState<AdditionalProvider>({
    id: '',
    name: '',
    percentage: 0
  });

  // Cargar lista de proveedores al iniciar
  useEffect(() => {
    const cargarProveedores = async () => {
      try {
        const supabaseClient = supabase;
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
    router.push(`/proformas?tab=customer`);
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
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
      
      // Preparar datos para guardar en Supabase
      const proformaData = {
        id_externo: proforma.number,
        fecha: proforma.date,
        cliente_id: null, // Se podría buscar el ID del cliente según el nombre
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
        tipo_empaque: item.packaging,
        proveedor_id: item.providerId
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

  // Preparar notas con la información de proveedores adicionales
  const prepareNotes = () => {
    let notes = proforma.shippingNotes 
      ? proforma.shippingNotes + '\nCliente: ' + proforma.customerName + '\nMaterial: ' + (proforma.items[0]?.description || '') 
      : 'Cliente: ' + proforma.customerName + '\nMaterial: ' + (proforma.items[0]?.description || '');
    
    // Añadir información de proveedores adicionales si existen
    if (proforma.additionalProviders.length > 0) {
      notes += '\n\nProveedores adicionales:\n';
      notes += proforma.additionalProviders.map((provider: AdditionalProvider) => 
        `${provider.name}${provider.percentage ? `: ${provider.percentage}%` : ''}`
      ).join('\n');
    }
    
    return notes;
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
          totalValue: 0,
          providerId: ''
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

  // Añadir un nuevo proveedor
  const addProvider = () => {
    if (!newProvider.id) {
      alert('Por favor, seleccione un proveedor');
      return;
    }
    
    // Verificar si el proveedor ya existe en la lista
    if (proforma.additionalProviders.some(p => p.id === newProvider.id)) {
      alert('Este proveedor ya ha sido añadido');
      return;
    }
    
    // Buscar el nombre del proveedor seleccionado
    const proveedorSeleccionado = proveedoresList.find(p => p.id === newProvider.id);
    if (!proveedorSeleccionado) return;
    
    setProforma({
      ...proforma,
      additionalProviders: [
        ...proforma.additionalProviders,
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
  const removeProvider = (id: string) => {
    setProforma({
      ...proforma,
      additionalProviders: proforma.additionalProviders.filter(provider => provider.id !== id)
    });
  };
  
  // Asignar un proveedor a un producto específico
  const assignProviderToItem = (itemIndex: number, providerId: string) => {
    const updatedItems = [...proforma.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      providerId
    };
    
    setProforma({
      ...proforma,
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
                  onChange={(e) => setProforma({...proforma, customerName: e.target.value})}
                >
                  <option value="">Seleccionar cliente</option>
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
                  <option value="">Seleccionar puerto</option>
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
            <div className="relative">
              <select 
                className="w-full p-2 border rounded-md appearance-none"
                value={proforma.paymentTerms}
                onChange={(e) => setProforma({...proforma, paymentTerms: e.target.value})}
              >
                <option value="">Seleccionar términos de pago</option>
                <option>30% PAGO POR ADELANTADO 70% PAGO CONTRA DOCUMENTOS</option>
                <option>100% PAGO POR ADELANTADO</option>
                <option>50% PAGO POR ADELANTADO 50% ANTES DEL ENVÍO</option>
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
          {proforma.additionalProviders.length > 0 && (
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
                  {proforma.additionalProviders.map((provider) => (
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
                {/* Añadir selector de proveedor si hay proveedores adicionales */}
                {proforma.additionalProviders.length > 0 && (
                  <div className="col-span-6 md:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Proveedor</label>
                    <div className="relative">
                      <select 
                        className="w-full p-2 border rounded-md appearance-none"
                        value={item.providerId}
                        onChange={(e) => assignProviderToItem(index, e.target.value)}
                      >
                        <option value="">Sin proveedor específico</option>
                        {proforma.additionalProviders.map(provider => (
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
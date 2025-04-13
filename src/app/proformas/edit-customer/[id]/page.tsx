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
  FiSave,
  FiSearch
} from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';

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

export default function EditCustomerProformaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientesList, setClientesList] = useState<{id: string, nombre: string}[]>([]);
  const [showPortSuggestions, setShowPortSuggestions] = useState(false);
  const [showPaymentTermsSuggestions, setShowPaymentTermsSuggestions] = useState(false);
  
  // Datos iniciales de la proforma
  const [proforma, setProforma] = useState({
    id: params.id,
    number: '',  // Será actualizado con id_externo desde la base de datos
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    taxId: '',
    ports: '',
    deliveryTerms: '',
    paymentTerms: '',
    bankAccount: '',
    shippingNotes: '',
    items: [] as any[],
    origin: '',
    containers: 0,
    totalWeight: 0,
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
      if (!target.closest('.payment-terms-combobox')) {
        setShowPaymentTermsSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cargar datos reales desde Supabase
  useEffect(() => {
    async function loadProformaData() {
      try {
        setLoading(true);
        const supabase = getSupabaseClient();
        
        // Consultar la proforma
        const { data: proformaData, error: proformaError } = await supabase
          .from('proformas')
          .select('*')
          .eq('id', params.id)
          .single();
        
        if (proformaError) throw new Error(`Error al cargar la proforma: ${proformaError.message}`);
        if (!proformaData) throw new Error('No se encontró la proforma');
        
        // Consultar los productos relacionados
        const { data: productosData, error: productosError } = await supabase
          .from('proformas_productos')
          .select('*')
          .eq('proforma_id', params.id);
        
        if (productosError) throw new Error(`Error al cargar los productos: ${productosError.message}`);
        
        // Preparar los items
        const items = productosData ? productosData.map(producto => ({
          id: producto.id.toString(),
          description: producto.descripcion || '',
          quantity: producto.cantidad || 0,
          weight: producto.peso || 0,
          unitPrice: producto.precio_unitario || 0,
          packaging: producto.tipo_empaque || 'Type',
          totalValue: producto.valor_total || (producto.cantidad * producto.precio_unitario)
        })) : [];
        
        // Si no hay items, agregar uno vacío
        if (items.length === 0) {
          items.push({
            id: '1',
            description: '',
            quantity: 0,
            weight: 0,
            unitPrice: 0,
            packaging: 'Type',
            totalValue: 0
          });
        }
        
        // Actualizar el estado
        setProforma({
          id: params.id,
          number: proformaData.id_externo || `Sin número`, // Usar id_externo de la BD
          date: proformaData.fecha || new Date().toISOString().split('T')[0],
          customerName: proformaData.cliente_nombre || '',
          taxId: proformaData.id_fiscal || '',
          ports: proformaData.puerto || '',
          deliveryTerms: proformaData.terminos_entrega || '',
          paymentTerms: proformaData.terminos_pago || '',
          bankAccount: proformaData.cuenta_bancaria || '',
          shippingNotes: proformaData.notas || '',
          items: items,
          origin: proformaData.origen || 'Spain',
          containers: proformaData.cantidad_contenedores || 0,
          totalWeight: proformaData.peso_total || 0,
          totalAmount: proformaData.monto || 0
        });
        
        setError(null);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    
    loadProformaData();
  }, [params.id]);

  const handleCancel = () => {
    router.push(`/proformas?tab=customer`);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validar datos básicos
      if (!proforma.customerName) {
        alert('Por favor, seleccione un cliente');
        setLoading(false);
        return;
      }
      
      const supabase = getSupabaseClient();
      
      // Obtener el ID del cliente seleccionado
      let cliente_id = null;
      const clienteSeleccionado = clientesList.find(c => c.nombre === proforma.customerName);
      if (clienteSeleccionado) {
        cliente_id = clienteSeleccionado.id;
      }
      
      // Preparar datos para actualizar en Supabase
      const proformaData = {
        id_externo: proforma.number, // Mantener el mismo número de proforma
        fecha: proforma.date,
        cliente_id: cliente_id, // Incluir el ID del cliente
        id_fiscal: proforma.taxId,
        monto: proforma.totalAmount,
        puerto: proforma.ports,
        origen: proforma.origin,
        terminos_entrega: proforma.deliveryTerms,
        terminos_pago: proforma.paymentTerms,
        cuenta_bancaria: proforma.bankAccount,
        notas: proforma.shippingNotes + '\nCliente: ' + proforma.customerName + '\nMaterial: ' + (proforma.items[0]?.description || ''),
        peso_total: proforma.totalWeight,
        cantidad_contenedores: proforma.containers
      };
      
      console.log('Actualizando proforma:', proformaData);
      
      // Actualizar proforma en Supabase
      const { error: proformaError } = await supabase
        .from('proformas')
        .update(proformaData)
        .eq('id', proforma.id);
      
      if (proformaError) {
        throw new Error(`Error al actualizar la proforma: ${proformaError.message}`);
      }
      
      // Borrar productos anteriores
      const { error: deleteError } = await supabase
        .from('proformas_productos')
        .delete()
        .eq('proforma_id', proforma.id);
        
      if (deleteError) {
        throw new Error(`Error al eliminar productos anteriores: ${deleteError.message}`);
      }
      
      // Preparar productos para guardar
      const productosData = proforma.items.map(item => ({
        proforma_id: proforma.id,
        descripcion: item.description,
        cantidad: item.quantity,
        precio_unitario: item.unitPrice,
        peso: item.weight,
        tipo_empaque: item.packaging
        // No incluimos valor_total porque se calcula automáticamente en la base de datos
      }));
      
      // Insertar productos de la proforma
      const { error: productosError } = await supabase
        .from('proformas_productos')
        .insert(productosData);
      
      if (productosError) {
        throw new Error(`Error al guardar los productos: ${productosError.message}`);
      }
      
      console.log('Proforma actualizada correctamente');
      
      alert('Proforma actualizada correctamente');
      
      // Redirigir de vuelta a la pestaña de proformas
      router.push(`/proformas?tab=customer`);
    } catch (error) {
      console.error('Error al actualizar la proforma:', error);
      alert(`Error al actualizar la proforma: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Proforma
                <span className="ml-1 text-blue-500 text-xs font-normal">(editable)</span>
              </label>
              <input 
                type="text" 
                value={proforma.number}
                onChange={(e) => setProforma({...proforma, number: e.target.value})}
                className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: PRO-2023-001"
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
                          const supabaseClient = getSupabaseClient();
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
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad 40ft</label>
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
                  <label className="block text-xs font-medium text-gray-500 mb-1">Precio</label>
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
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md pr-10"
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
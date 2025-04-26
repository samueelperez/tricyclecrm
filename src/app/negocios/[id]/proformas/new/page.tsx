'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiChevronDown, 
  FiPlus, 
  FiTrash2,
  FiAlertCircle,
  FiLoader
} from 'react-icons/fi';

// Tipos
interface Cliente {
  id: number;
  nombre: string;
  id_fiscal?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  codigo_postal?: string | null;
  pais?: string | null;
  contacto_nombre?: string | null;
  email?: string | null;
  telefono?: string | null;
  sitio_web?: string | null;
  comentarios?: string | null;
}

interface ProformaProducto {
  id?: number;
  descripcion: string;
  cantidad: number;
  peso: number | null;
  precio_unitario: number;
  tipo_empaque: string | null;
  valor_total: number | null;
}

export default function NuevaProforma({ params }: { params: { id: string } }) {
  const router = useRouter();
  const negocioId = params.id;
  const supabase = createClientComponentClient();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [productos, setProductos] = useState<ProformaProducto[]>([
    {
      descripcion: '',
      cantidad: 0,
      peso: null,
      precio_unitario: 0,
      tipo_empaque: null,
      valor_total: null
    }
  ]);
  
  // Campos de proforma
  const [proforma, setProforma] = useState({
    id_externo: `PRO-${Date.now().toString().slice(-6)}`,
    fecha: new Date().toISOString().split('T')[0],
    cliente_id: null as number | null,
    puerto: '',
    id_fiscal: '',
    cuenta_bancaria: '',
    terminos_pago: '',
    terminos_entrega: '',
    notas: '',
    origen: 'España',
    cantidad_contenedores: 0,
    peso_total: 0,
    monto: 0
  });
  
  // Cargar clientes al montar
  useEffect(() => {
    loadClientes();
    loadNegocioInfo();
  }, []);
  
  // Cargar datos del negocio para obtener cliente relacionado
  const loadNegocioInfo = async () => {
    try {
      const { data: negocio, error: negocioError } = await supabase
        .from('negocios')
        .select('cliente_id, cliente_nombre')
        .eq('id', negocioId)
        .single();
      
      if (negocioError) throw negocioError;
      
      if (negocio && negocio.cliente_id) {
        // Buscar datos completos del cliente
        const { data: clienteData, error: clienteError } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', negocio.cliente_id)
          .single();
        
        if (clienteError) throw clienteError;
        
        if (clienteData) {
          setClienteSeleccionado(clienteData);
          setProforma(prev => ({
            ...prev,
            cliente_id: clienteData.id,
            id_fiscal: clienteData.id_fiscal || ''
          }));
        }
      }
    } catch (err) {
      console.error('Error cargando datos del negocio:', err);
    }
  };
  
  // Cargar clientes desde Supabase
  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre, id_fiscal')
        .order('nombre');
      
      if (error) throw error;
      
      setClientes(data || []);
    } catch (err) {
      console.error('Error cargando clientes:', err);
      setError('Error al cargar los clientes');
    }
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  // Actualizar proforma
  const handleProformaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProforma(prev => ({ ...prev, [name]: value }));
  };
  
  // Seleccionar cliente
  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clienteId = parseInt(e.target.value);
    const cliente = clientes.find(c => c.id === clienteId);
    
    if (cliente) {
      setClienteSeleccionado(cliente);
      setProforma(prev => ({
        ...prev,
        cliente_id: cliente.id,
        id_fiscal: cliente.id_fiscal || ''
      }));
    } else {
      setClienteSeleccionado(null);
      setProforma(prev => ({
        ...prev,
        cliente_id: null,
        id_fiscal: ''
      }));
    }
  };
  
  // Actualizar producto
  const handleProductoChange = (index: number, field: keyof ProformaProducto, value: any) => {
    const newProductos: ProformaProducto[] = [...productos];
    
    // Adaptar el valor según el campo
    if (field === 'descripcion' || field === 'tipo_empaque') {
      newProductos[index][field] = value as string;
    } else if (field === 'cantidad' || field === 'precio_unitario') {
      // Estos campos no pueden ser null, usar 0 como valor por defecto
      newProductos[index][field] = typeof value === 'number' ? value : parseFloat(value) || 0;
    } else if (field === 'peso' || field === 'valor_total') {
      // Estos campos pueden ser null
      newProductos[index][field] = typeof value === 'number' ? value : parseFloat(value) || null;
    }
    
    // Calcular valor total automáticamente
    if (field === 'cantidad' || field === 'precio_unitario') {
      const cantidad = newProductos[index].cantidad;
      const precioUnitario = newProductos[index].precio_unitario;
      newProductos[index].valor_total = cantidad * precioUnitario;
    }
    
    setProductos(newProductos);
    actualizarTotales(newProductos);
  };
  
  // Añadir nuevo producto
  const handleAddProducto = () => {
    setProductos([
      ...productos,
      {
        descripcion: '',
        cantidad: 0,
        peso: null,
        precio_unitario: 0,
        tipo_empaque: null,
        valor_total: null
      }
    ]);
  };
  
  // Eliminar producto
  const handleRemoveProducto = (index: number) => {
    if (productos.length > 1) {
      const newProductos = productos.filter((_, i) => i !== index);
      setProductos(newProductos);
      actualizarTotales(newProductos);
    }
  };
  
  // Actualizar totales
  const actualizarTotales = (productos: ProformaProducto[]) => {
    const pesoTotal = productos.reduce((sum, p) => sum + (p.peso || 0) * (p.cantidad || 0), 0);
    const montoTotal = productos.reduce((sum, p) => sum + (p.valor_total || 0), 0);
    
    // Estimación aproximada de contenedores (1 MT ~ 0.05 contenedor)
    const cantidadContenedores = Math.ceil(pesoTotal * 0.05);
    
    setProforma(prev => ({
      ...prev,
      peso_total: pesoTotal,
      monto: montoTotal,
      cantidad_contenedores: cantidadContenedores
    }));
  };
  
  // Guardar proforma
  const handleSave = async () => {
    if (!proforma.cliente_id) {
      setError('Debe seleccionar un cliente');
      return;
    }
    
    if (productos.length === 0 || !productos[0].descripcion) {
      setError('Debe añadir al menos un producto');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Guardar la proforma
      const { data: proformaData, error: proformaError } = await supabase
        .from('proformas')
        .insert([{
          id_externo: proforma.id_externo,
          fecha: proforma.fecha,
          monto: proforma.monto,
          cliente_id: proforma.cliente_id,
          negocio_id: parseInt(negocioId),
          origen: proforma.origen,
          puerto: proforma.puerto,
          id_fiscal: proforma.id_fiscal,
          cuenta_bancaria: proforma.cuenta_bancaria,
          terminos_pago: proforma.terminos_pago,
          terminos_entrega: proforma.terminos_entrega,
          notas: proforma.notas,
          cantidad_contenedores: proforma.cantidad_contenedores,
          peso_total: proforma.peso_total
        }])
        .select()
        .single();
      
      if (proformaError) throw proformaError;
      
      // 2. Guardar los productos de la proforma
      const productosToInsert = productos.map(p => ({
        proforma_id: proformaData.id,
        descripcion: p.descripcion,
        cantidad: p.cantidad,
        peso: p.peso,
        precio_unitario: p.precio_unitario,
        tipo_empaque: p.tipo_empaque,
        valor_total: p.valor_total
      }));
      
      const { error: productosError } = await supabase
        .from('proformas_productos')
        .insert(productosToInsert);
      
      if (productosError) throw productosError;
      
      // Redirigir a la página de proformas
      router.push(`/negocios/${negocioId}?tab=proformas`);
    } catch (err) {
      console.error('Error guardando proforma:', err);
      setError('Error al guardar la proforma');
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
              <h1 className="text-xl font-medium text-gray-800">Nueva Proforma</h1>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className={`px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <><FiLoader className="animate-spin w-5 h-5 mr-2" /> Guardando...</>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h1a2 2 0 012 2v7a2 2 0 01-2 2H8a2 2 0 01-2-2v-7a2 2 0 012-2h1v5.586l-1.293-1.293z" />
                      <path d="M9 4a1 1 0 012 0v2H9V4z" />
                    </svg>
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mensaje de error */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center text-red-600">
              <FiAlertCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        </div>
      )}
      
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
                name="id_externo"
                value={proforma.id_externo}
                onChange={handleProformaChange}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Proforma</label>
              <div className="relative">
                <input 
                  type="date" 
                  name="fecha"
                  value={proforma.fecha}
                  onChange={handleProformaChange}
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
                  value={proforma.cliente_id || ''}
                  onChange={handleClienteChange}
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
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
                name="id_fiscal"
                value={proforma.id_fiscal}
                onChange={handleProformaChange}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Puerto</label>
              <input 
                type="text" 
                name="puerto"
                value={proforma.puerto}
                onChange={handleProformaChange}
                placeholder="ej. TEMA PORT - GHANA"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Términos de Entrega</label>
              <input 
                type="text" 
                name="terminos_entrega"
                value={proforma.terminos_entrega}
                onChange={handleProformaChange}
                placeholder="ej. CIF (Cost, Insurance, and Freight)..."
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
              name="terminos_pago"
              value={proforma.terminos_pago}
              onChange={handleProformaChange}
              placeholder="ej. 30% CASH IN ADVANCE 70% CASH AGAINST DOCUMENTS"
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
        
        {/* Good Descriptions */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Descripción de Bienes</h3>
          
          {/* Productos */}
          {productos.map((producto, index) => (
            <div key={index} className="mb-4 border rounded-md overflow-hidden">
              <div className="grid grid-cols-6 gap-2 p-3 bg-white">
                <div className="col-span-6 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                  <input 
                    type="text" 
                    value={producto.descripcion}
                    onChange={(e) => handleProductoChange(index, 'descripcion', e.target.value)}
                    placeholder="ej. PP PLASTICS"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                  <input 
                    type="number"
                    value={producto.cantidad}
                    onChange={(e) => handleProductoChange(index, 'cantidad', parseFloat(e.target.value))}
                    placeholder="ej. 3"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Peso (MT)</label>
                  <input 
                    type="number"
                    value={producto.peso || ''}
                    onChange={(e) => handleProductoChange(index, 'peso', parseFloat(e.target.value))}
                    placeholder="ej. 19.6"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Precio Unitario</label>
                  <input 
                    type="number"
                    value={producto.precio_unitario}
                    onChange={(e) => handleProductoChange(index, 'precio_unitario', parseFloat(e.target.value))}
                    placeholder="ej. 80"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Empaque</label>
                  <select 
                    className="w-full p-2 border rounded-md appearance-none"
                    value={producto.tipo_empaque || ''}
                    onChange={(e) => handleProductoChange(index, 'tipo_empaque', e.target.value)}
                  >
                    <option value="">Tipo</option>
                    <option value="Bales">Bales</option>
                    <option value="Bags">Bags</option>
                    <option value="Bulk">Bulk</option>
                  </select>
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Valor Total <span className="text-blue-500">auto</span></label>
                  <input 
                    type="text" 
                    value={producto.valor_total?.toFixed(2) || '0.00'}
                    className="w-full p-2 border rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
              <div className="flex justify-end border-t p-2 bg-white">
                <button 
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                  onClick={() => handleRemoveProducto(index)}
                  title="Eliminar"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          
          {/* Botón para añadir más productos */}
          <button 
            className="w-full p-3 border border-dashed border-blue-300 rounded-md text-blue-500 flex items-center justify-center hover:bg-blue-50 mb-6"
            onClick={handleAddProducto}
          >
            <FiPlus className="w-5 h-5 mr-2" />
            Añadir Producto
          </button>
          
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origen <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                name="origen"
                value={proforma.origen}
                onChange={handleProformaChange}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenedores 40ft <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value={proforma.cantidad_contenedores}
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso Total (MT) <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value={proforma.peso_total.toFixed(2)}
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value={proforma.monto.toFixed(2)}
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
            <input 
              type="text" 
              name="cuenta_bancaria"
              value={proforma.cuenta_bancaria}
              onChange={handleProformaChange}
              placeholder="Introducir detalles de cuenta bancaria"
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
        
        {/* Shipping Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Detalles de Envío</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea 
              name="notas"
              value={proforma.notas}
              onChange={handleProformaChange}
              placeholder="Añadir notas adicionales sobre el envío, instrucciones especiales, etc."
              className="w-full p-2 border rounded-md h-24"
            ></textarea>
          </div>
        </div>
        
        {/* Pie con botones */}
        <div className="flex justify-end space-x-3 mt-6">
          <button 
            onClick={handleSave}
            className={`px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <><FiLoader className="animate-spin w-5 h-5 mr-2" /> Guardando...</>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h1a2 2 0 012 2v7a2 2 0 01-2 2H8a2 2 0 01-2-2v-7a2 2 0 012-2h1v5.586l-1.293-1.293z" />
                  <path d="M9 4a1 1 0 012 0v2H9V4z" />
                </svg>
                Guardar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 
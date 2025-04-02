'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiArrowLeft, 
  FiSave,
  FiTag,
  FiCalendar,
  FiUser,
  FiFileText,
  FiDollarSign,
  FiCheckCircle,
  FiCreditCard,
  FiAlertTriangle,
  FiMessageSquare
} from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';

// Tipo de proveedor
type Proveedor = {
  id: number;
  nombre: string;
};

const CATEGORIAS_GASTO = [
  { value: "oficina", label: "Material de Oficina" },
  { value: "viajes", label: "Viajes y Desplazamientos" },
  { value: "servicios", label: "Servicios Externos" },
  { value: "suministros", label: "Suministros" },
  { value: "personal", label: "Gastos de Personal" },
  { value: "impuestos", label: "Impuestos y Tasas" },
  { value: "marketing", label: "Marketing y Publicidad" },
  { value: "otros", label: "Otros Gastos" },
];

const ESTADOS_GASTO = [
  { value: "pendiente", label: "Pendiente" },
  { value: "pagado", label: "Pagado" },
  { value: "cancelado", label: "Cancelado" },
];

const METODOS_PAGO = [
  "Transferencia",
  "Efectivo",
  "Tarjeta",
  "Cheque",
  "PayPal",
  "Domiciliación",
  "Otro"
];

export default function NuevoGastoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [showNuevoProveedor, setShowNuevoProveedor] = useState(false);
  const [nuevoProveedor, setNuevoProveedor] = useState('');

  // Estado para el formulario
  const [formData, setFormData] = useState({
    numero_recibo: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    categoria: 'otros',
    proveedor_id: '',
    nuevo_proveedor: '',
    descripcion: '',
    monto: '',
    estado: 'pendiente',
    metodo_pago: 'Transferencia',
    notas: '',
    deducible: true,
    impuesto: 21
  });

  // Cargar proveedores existentes
  useEffect(() => {
    const cargarProveedores = async () => {
      try {
        const supabase = getSupabaseClient();
        
        const { data, error } = await supabase
          .from('proveedores')
          .select('id, nombre')
          .order('nombre');
          
        if (error) throw error;
        
        if (data) {
          setProveedores(data);
        }
      } catch (error) {
        console.error('Error al cargar proveedores:', error);
        // No establecer error para la UI, simplemente mostrar un array vacío
        setProveedores([]);
      }
    };
    
    cargarProveedores();
  }, []);

  // Función para generar número de recibo automático
  useEffect(() => {
    if (formData.numero_recibo === '') {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      setFormData(prev => ({
        ...prev,
        numero_recibo: `G-${year}${month}${day}-${random}`
      }));
    }
  }, [formData.numero_recibo]);

  // Manejador para cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'monto') {
      // Validar que solo se introduzcan números y decimales
      if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else if (name === 'impuesto') {
      // Validar que solo se introduzcan números enteros para el impuesto
      if (value === '' || /^\d+$/.test(value)) {
        const numValue = parseInt(value || '0');
        if (numValue >= 0 && numValue <= 100) {
          setFormData(prev => ({
            ...prev,
            [name]: numValue
          }));
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Manejador para toggle de proveedor nuevo
  const handleToggleNuevoProveedor = () => {
    setShowNuevoProveedor(!showNuevoProveedor);
    if (!showNuevoProveedor) {
      setFormData(prev => ({
        ...prev,
        proveedor_id: '',
        nuevo_proveedor: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        nuevo_proveedor: '',
      }));
    }
  };

  // Función para crear nuevo proveedor
  const crearNuevoProveedor = async (nombre: string): Promise<number | null> => {
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('proveedores')
        .insert({ nombre })
        .select('id')
        .single();
        
      if (error) throw error;
      
      if (data) {
        setProveedores(prev => [...prev, { id: data.id, nombre }]);
        return data.id;
      }
      
      return null;
    } catch (error) {
      console.error('Error al crear nuevo proveedor:', error);
      return null;
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validar campos obligatorios
      if (!formData.fecha_emision || !formData.descripcion || !formData.monto) {
        throw new Error('Por favor, complete los campos obligatorios: fecha, descripción e importe.');
      }
      
      const montoNumerico = parseFloat(formData.monto);
      if (isNaN(montoNumerico) || montoNumerico <= 0) {
        throw new Error('El importe debe ser un número mayor que cero.');
      }
      
      // Crear nuevo proveedor si es necesario
      let proveedorId = parseInt(formData.proveedor_id);
      if (showNuevoProveedor && formData.nuevo_proveedor) {
        const nuevoId = await crearNuevoProveedor(formData.nuevo_proveedor);
        if (nuevoId) {
          proveedorId = nuevoId;
        } else {
          throw new Error('No se pudo crear el nuevo proveedor.');
        }
      }
      
      const supabase = getSupabaseClient();
      
      // Preparar datos para guardar
      const gastoData = {
        numero_recibo: formData.numero_recibo,
        fecha_emision: formData.fecha_emision,
        categoria: formData.categoria,
        proveedor_id: !isNaN(proveedorId) ? proveedorId : null,
        proveedor: showNuevoProveedor ? formData.nuevo_proveedor : proveedores.find(p => p.id === proveedorId)?.nombre || null,
        descripcion: formData.descripcion,
        monto: montoNumerico,
        estado: formData.estado,
        metodo_pago: formData.metodo_pago,
        notas: formData.notas || null,
        deducible: formData.deducible,
        impuesto: formData.impuesto || 0
      };
      
      // Guardar en la tabla recibos
      const { error: saveError } = await supabase
        .from('recibos')
        .insert(gastoData);
        
      if (saveError) throw new Error(`Error al guardar: ${saveError.message}`);
      
      // Redirigir a la página principal de gastos
      router.push('/recibos');
      
    } catch (error: any) {
      console.error('Error al guardar el gasto:', error);
      setError(error.message || 'Ha ocurrido un error al guardar el gasto.');
    } finally {
      setLoading(false);
    }
  };

  // Cancelar y volver atrás
  const handleCancel = () => {
    router.push('/recibos');
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
              <h1 className="text-xl font-medium text-gray-800">Nuevo Gasto</h1>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
              >
                {loading ? (
                  <>
                    <span className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <FiSave className="h-5 w-5 mr-2" />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenido del formulario */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Sección de información básica */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Información Básica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nº Recibo / Factura <span className="text-gray-400">(generado automáticamente)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="numero_recibo"
                    value={formData.numero_recibo}
                    onChange={handleChange}
                    className="w-full p-2 pr-10 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FiFileText className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="fecha_emision"
                    value={formData.fecha_emision}
                    onChange={handleChange}
                    required
                    className="w-full p-2 pr-10 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    required
                    className="w-full p-2 pr-10 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  >
                    {CATEGORIAS_GASTO.map(categoria => (
                      <option key={categoria.value} value={categoria.value}>
                        {categoria.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FiTag className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sección del proveedor */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-700">Información del Proveedor</h3>
              <button
                type="button"
                onClick={handleToggleNuevoProveedor}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {showNuevoProveedor ? 'Seleccionar proveedor existente' : 'Añadir nuevo proveedor'}
              </button>
            </div>
            
            {showNuevoProveedor ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Nuevo Proveedor <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="nuevo_proveedor"
                    value={formData.nuevo_proveedor}
                    onChange={handleChange}
                    placeholder="Introduce el nombre del proveedor"
                    className="w-full p-2 pr-10 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccionar Proveedor
                </label>
                <div className="relative">
                  <select
                    name="proveedor_id"
                    value={formData.proveedor_id}
                    onChange={handleChange}
                    className="w-full p-2 pr-10 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  >
                    <option value="">Seleccionar un proveedor</option>
                    {proveedores.map(proveedor => (
                      <option key={proveedor.id} value={proveedor.id}>
                        {proveedor.nombre}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Sección de detalles del gasto */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Detalles del Gasto</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Descripción detallada del gasto"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importe <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="monto"
                    value={formData.monto}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    className="w-full p-2 pl-8 pr-10 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">€</span>
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FiDollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  % Impuesto
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="impuesto"
                    value={formData.impuesto}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full p-2 pr-10 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="deducible"
                    checked={formData.deducible}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Gasto deducible de impuestos</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Sección de estado y pago */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Estado y Pago</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <div className="relative">
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="w-full p-2 pr-10 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  >
                    {ESTADOS_GASTO.map(estado => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FiCheckCircle className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago
                </label>
                <div className="relative">
                  <select
                    name="metodo_pago"
                    value={formData.metodo_pago}
                    onChange={handleChange}
                    className="w-full p-2 pr-10 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  >
                    {METODOS_PAGO.map(metodo => (
                      <option key={metodo} value={metodo}>
                        {metodo}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FiCreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sección de notas */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Notas Adicionales</h3>
            
            <div className="relative">
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                rows={4}
                placeholder="Información adicional o notas sobre el gasto"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="absolute top-2 right-2 text-gray-400">
                <FiMessageSquare className="h-5 w-5" />
              </div>
            </div>
          </div>
          
          {/* Pie de formulario con botones */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="mr-3 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
            >
              {loading ? (
                <>
                  <span className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <FiSave className="h-5 w-5 mr-2" />
                  Guardar Gasto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiArrowLeft, 
  FiSave, 
  FiX,
  FiUser,
  FiFileText,
  FiCalendar,
  FiTag,
  FiAlignLeft,
  FiPackage,
  FiTruck,
  FiList,
  FiPlus
} from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';

interface Cliente {
  id: number;
  nombre: string;
}

interface Proveedor {
  id: number;
  nombre: string;
}

interface ItemAlbaran {
  id?: number;
  id_albaran?: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
}

interface AlbaranFormData {
  numero_albaran: string;
  fecha: string;
  estado: string;
  notas: string;
  id_cliente: number | null;
  id_proveedor: number | null;
  items: ItemAlbaran[];
}

export default function EditAlbaranPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const albaranId = parseInt(params.id);
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [tipoAlbaran, setTipoAlbaran] = useState<'cliente' | 'proveedor'>('cliente');
  
  // Estado inicial del formulario
  const [formData, setFormData] = useState<AlbaranFormData>({
    numero_albaran: '',
    fecha: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
    estado: 'pendiente',
    notas: '',
    id_cliente: null,
    id_proveedor: null,
    items: []
  });
  
  // Cargar clientes, proveedores y datos del albarán
  useEffect(() => {
    const fetchData = async () => {
      if (isNaN(albaranId)) {
        setError('ID de albarán inválido');
        setLoading(false);
        return;
      }
      
      try {
        const supabase = getSupabaseClient();
        
        // 1. Cargar datos del albarán
        const { data: albaranData, error: albaranError } = await supabase
          .from('albaranes')
          .select('*')
          .eq('id', albaranId)
          .single();
        
        if (albaranError) {
          throw new Error(`Error al cargar el albarán: ${albaranError.message}`);
        }
        
        if (!albaranData) {
          throw new Error('Albarán no encontrado');
        }
        
        // 2. Cargar items del albarán
        const { data: itemsData, error: itemsError } = await supabase
          .from('albaran_items')
          .select('*')
          .eq('id_albaran', albaranId)
          .order('id');
        
        if (itemsError) {
          throw new Error(`Error al cargar los items: ${itemsError.message}`);
        }
        
        // 3. Cargar clientes
        const { data: clientesData, error: clientesError } = await supabase
          .from('clientes')
          .select('id, nombre')
          .order('nombre');
        
        if (clientesError) throw new Error(`Error al cargar clientes: ${clientesError.message}`);
        setClientes(clientesData || []);
        
        // 4. Cargar proveedores
        const { data: proveedoresData, error: proveedoresError } = await supabase
          .from('proveedores')
          .select('id, nombre')
          .order('nombre');
        
        if (proveedoresError) throw new Error(`Error al cargar proveedores: ${proveedoresError.message}`);
        setProveedores(proveedoresData || []);
        
        // Determinar el tipo de albarán
        const tipo: 'cliente' | 'proveedor' = albaranData.id_cliente ? 'cliente' : 'proveedor';
        setTipoAlbaran(tipo);
        
        // Inicializar formulario con datos
        setFormData({
          numero_albaran: albaranData.numero_albaran,
          fecha: albaranData.fecha,
          estado: albaranData.estado,
          notas: albaranData.notas || '',
          id_cliente: albaranData.id_cliente,
          id_proveedor: albaranData.id_proveedor,
          items: itemsData || []
        });
        
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [albaranId]);

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'tipo_albaran') {
      const tipo = value as 'cliente' | 'proveedor';
      setTipoAlbaran(tipo);
      setFormData({
        ...formData,
        id_cliente: tipo === 'cliente' ? (clientes.length > 0 ? clientes[0].id : null) : null,
        id_proveedor: tipo === 'proveedor' ? (proveedores.length > 0 ? Number(proveedores[0].id) : null) : null
      });
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Manejar cambios en los items del albarán
  const handleItemChange = (index: number, name: keyof ItemAlbaran, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [name]: value
    };
    
    // Calcular el total del item
    if (name === 'cantidad' || name === 'precio_unitario') {
      newItems[index].total = newItems[index].cantidad * newItems[index].precio_unitario;
    }
    
    setFormData({
      ...formData,
      items: newItems
    });
  };

  // Añadir un nuevo item al albarán
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { descripcion: '', cantidad: 1, precio_unitario: 0, total: 0 }]
    });
  };

  // Eliminar un item del albarán
  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return; // Mantener al menos un item
    
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    
    setFormData({
      ...formData,
      items: newItems
    });
  };

  // Calcular el total del albarán
  const calcularTotal = () => {
    return formData.items.reduce((total, item) => total + item.total, 0);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      // Validaciones
      if (!formData.numero_albaran.trim()) {
        throw new Error('El número de albarán es obligatorio');
      }
      
      if (tipoAlbaran === 'cliente' && !formData.id_cliente) {
        throw new Error('Debe seleccionar un cliente');
      }
      
      if (tipoAlbaran === 'proveedor' && !formData.id_proveedor) {
        throw new Error('Debe seleccionar un proveedor');
      }
      
      if (formData.items.some(item => !item.descripcion.trim())) {
        throw new Error('Todos los items deben tener una descripción');
      }
      
      const supabase = getSupabaseClient();
      
      // 1. Actualizar el albarán
      const { error: albaranError } = await supabase
        .from('albaranes')
        .update({
          numero_albaran: formData.numero_albaran,
          fecha: formData.fecha,
          estado: formData.estado,
          notas: formData.notas || null,
          id_cliente: formData.id_cliente,
          id_proveedor: formData.id_proveedor,
          total: calcularTotal()
        })
        .eq('id', albaranId);
        
      if (albaranError) {
        throw new Error(`Error al actualizar el albarán: ${albaranError.message}`);
      }
      
      // 2. Eliminar items existentes
      const { error: deleteError } = await supabase
        .from('albaran_items')
        .delete()
        .eq('id_albaran', albaranId);
      
      if (deleteError) {
        throw new Error(`Error al eliminar los items existentes: ${deleteError.message}`);
      }
      
      // 3. Insertar los nuevos items
      const itemsWithAlbaranId = formData.items.map(item => ({
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        total: item.total,
        id_albaran: albaranId
      }));
      
      const { error: itemsError } = await supabase
        .from('albaran_items')
        .insert(itemsWithAlbaranId);
        
      if (itemsError) {
        throw new Error(`Error al guardar los items: ${itemsError.message}`);
      }
      
      // Redirigir a la página del albarán
      router.push(`/albaranes/${albaranId}`);
      router.refresh();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al actualizar albarán:', err);
    } finally {
      setSaving(false);
    }
  };

  // Función para renderizar label con icono
  const renderLabel = (text: string, required = false, icon: React.ReactNode) => (
    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
      <span className="text-indigo-500 mr-1.5">{icon}</span>
      {text} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  // Función para renderizar un campo de input estilizado
  const renderInput = (props: {
    name: string;
    id: string;
    type?: string;
    required?: boolean;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    min?: string | number;
    step?: string;
    className?: string;
  }) => (
    <div className="relative">
      <input
        {...props}
        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                  focus:border-indigo-500 focus:ring-indigo-500 
                  transition-all duration-200 ease-in-out
                  hover:border-indigo-300 sm:text-sm
                  peer ${props.className || ''}`}
      />
      <div className="absolute inset-0 border border-indigo-500 rounded-md opacity-0 pointer-events-none transition-opacity duration-200 peer-focus:opacity-100"></div>
    </div>
  );

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="ml-3 text-lg text-gray-500">Cargando albarán...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="bg-white shadow-md rounded-lg px-6 py-5 mb-8 flex items-center justify-between transition-all duration-300 ease-in-out transform hover:shadow-lg border-l-4 border-indigo-500">
          <div className="flex items-center">
            <Link href={`/albaranes/${albaranId}`} className="mr-4 text-gray-500 hover:text-indigo-600 transition-colors duration-200">
              <FiArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Editar Albarán
            </h1>
          </div>
          <div className="hidden sm:block text-sm text-gray-500">
            Modifique los datos del albarán. Los campos marcados con * son obligatorios.
          </div>
        </div>
        
        {/* Mensaje de error */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm animate-fadeIn">
            <div className="flex">
              <div className="flex-shrink-0 text-red-500">
                <FiX className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información Básica */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out transform hover:shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <FiFileText className="mr-2 text-indigo-500" />
                Información General
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Datos básicos del albarán
              </p>
            </div>
            
            <div className="p-6 bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
                {/* Tipo de Albarán */}
                <div className="sm:col-span-3 relative group">
                  {renderLabel('Tipo de Albarán', true, <FiTag />)}
                  <select
                    name="tipo_albaran"
                    id="tipo_albaran"
                    value={tipoAlbaran}
                    onChange={handleInputChange}
                    disabled={true} // No permitimos cambiar el tipo una vez creado
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200 ease-in-out hover:border-indigo-300 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="cliente">Albarán de Cliente</option>
                    <option value="proveedor">Albarán de Proveedor</option>
                  </select>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
                
                {/* Número de Albarán */}
                <div className="sm:col-span-3 relative group">
                  {renderLabel('Número de Albarán', true, <FiFileText />)}
                  {renderInput({
                    type: "text",
                    name: "numero_albaran",
                    id: "numero_albaran",
                    required: true,
                    value: formData.numero_albaran,
                    onChange: handleInputChange,
                    placeholder: "Ej. ALB-2023-001"
                  })}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
                
                {/* Cliente o Proveedor */}
                <div className="sm:col-span-3 relative group">
                  {renderLabel(tipoAlbaran === 'cliente' ? 'Cliente' : 'Proveedor', true, tipoAlbaran === 'cliente' ? <FiUser /> : <FiTruck />)}
                  <select
                    name={tipoAlbaran === 'cliente' ? 'id_cliente' : 'id_proveedor'}
                    id={tipoAlbaran === 'cliente' ? 'id_cliente' : 'id_proveedor'}
                    value={tipoAlbaran === 'cliente' ? formData.id_cliente || '' : formData.id_proveedor || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200 ease-in-out hover:border-indigo-300 sm:text-sm"
                    required
                  >
                    <option value="">Seleccione {tipoAlbaran === 'cliente' ? 'un cliente' : 'un proveedor'}</option>
                    {tipoAlbaran === 'cliente' 
                      ? clientes.map(cliente => (
                          <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
                        ))
                      : proveedores.map(proveedor => (
                          <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>
                        ))
                    }
                  </select>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
                
                {/* Fecha */}
                <div className="sm:col-span-3 relative group">
                  {renderLabel('Fecha', true, <FiCalendar />)}
                  {renderInput({
                    type: "date",
                    name: "fecha",
                    id: "fecha",
                    required: true,
                    value: formData.fecha,
                    onChange: handleInputChange
                  })}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
                
                {/* Estado */}
                <div className="sm:col-span-3 relative group">
                  {renderLabel('Estado', true, <FiTag />)}
                  <select
                    name="estado"
                    id="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200 ease-in-out hover:border-indigo-300 sm:text-sm"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
                
                {/* Notas */}
                <div className="sm:col-span-6 relative group">
                  {renderLabel('Notas', false, <FiAlignLeft />)}
                  <textarea
                    name="notas"
                    id="notas"
                    rows={3}
                    value={formData.notas}
                    onChange={handleInputChange}
                    placeholder="Notas adicionales sobre el albarán..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200 ease-in-out hover:border-indigo-300 sm:text-sm"
                  ></textarea>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Items del Albarán */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out transform hover:shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <FiList className="mr-2 text-indigo-500" />
                Items del Albarán
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Productos o servicios incluidos en el albarán
              </p>
            </div>
            
            <div className="p-6 bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm">
              <div className="space-y-4">
                {/* Cabecera de la tabla de items */}
                <div className="grid grid-cols-12 gap-4 mb-2 text-sm font-medium text-gray-500">
                  <div className="col-span-6">Descripción</div>
                  <div className="col-span-2">Cantidad</div>
                  <div className="col-span-2">Precio Unit.</div>
                  <div className="col-span-1">Total</div>
                  <div className="col-span-1"></div>
                </div>
                
                {/* Items */}
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6">
                      <input
                        type="text"
                        value={item.descripcion}
                        onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                        placeholder="Descripción del producto o servicio"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => handleItemChange(index, 'cantidad', parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.precio_unitario}
                        onChange={(e) => handleItemChange(index, 'precio_unitario', parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-1 font-medium">
                      {item.total.toFixed(2)} €
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-700 transition-colors duration-150 disabled:opacity-50"
                        disabled={formData.items.length <= 1}
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Botón para añadir más items */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FiPlus className="mr-2 -ml-1" />
                    Añadir Item
                  </button>
                </div>
                
                {/* Total del Albarán */}
                <div className="pt-4 border-t border-gray-200 mt-6">
                  <div className="flex justify-end">
                    <div className="text-sm text-gray-500 mr-4">Total:</div>
                    <div className="text-lg font-bold">{calcularTotal().toFixed(2)} €</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 mt-8">
            <Link
              href={`/albaranes/${albaranId}`}
              className="py-2.5 px-5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2.5 px-6 border border-transparent rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <FiSave className="mr-2 -ml-1 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
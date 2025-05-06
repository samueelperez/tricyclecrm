'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FiArrowLeft, FiCalendar, FiDollarSign, FiPackage, FiTag, FiTruck, FiAlertCircle, FiFileText } from 'react-icons/fi';
import ClienteSelector from '@/components/cliente-selector';

// Utilidades para manejar la conexión con Supabase
const getSupabaseClient = () => createClientComponentClient();

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

interface Proveedor {
  id: number;
  nombre: string;
}

interface Material {
  id: number;
  nombre: string;
  descripcion?: string;
}

export default function CrearNegocioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdNegocioId, setCreatedNegocioId] = useState<number | null>(null);
  
  // Estados para almacenar los datos cargados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    cliente_id: '',
    cliente_nombre: '',
    fecha_inicio: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
    descripcion: '',
    proveedor_ids: [] as number[],
    material_ids: [] as number[],
    valor_total: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Cargar proveedores
        const { data: proveedoresData, error: proveedoresError } = await supabase
          .from('proveedores')
          .select('id, nombre')
          .order('nombre');

        if (proveedoresError) throw proveedoresError;
        setProveedores(proveedoresData || []);
        
        // Cargar materiales
        const { data: materialesData, error: materialesError } = await supabase
          .from('materiales')
          .select('id, nombre, descripcion')
          .order('nombre');

        if (materialesError) throw materialesError;
        setMateriales(materialesData || []);
        
      } catch (error: any) {
        console.error('Error al cargar datos iniciales:', error);
        setError('No se pudieron cargar los datos necesarios. ' + error.message);
      }
    };

    cargarDatos();
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar selección de cliente
  const handleClienteSelect = (clienteId: number, clienteNombre: string) => {
    setFormData(prev => ({
      ...prev,
      cliente_id: clienteId.toString(),
      cliente_nombre: clienteNombre
    }));
  };

  // Manejar selección múltiple de proveedores
  const handleProveedorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions).map(option => parseInt(option.value));
    setFormData(prev => ({
      ...prev,
      proveedor_ids: options
    }));
  };

  // Manejar selección múltiple de materiales
  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions).map(option => parseInt(option.value));
    setFormData(prev => ({
      ...prev,
      material_ids: options
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validación básica
      if (!formData.nombre || !formData.cliente_id || !formData.fecha_inicio) {
        throw new Error('Por favor complete todos los campos obligatorios');
      }

      const supabase = getSupabaseClient();
      
      // Generar ID externo automáticamente
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const idExterno = `CON-${year}${month}${day}-${randomSuffix}`;
      
      // Preparar datos para enviar
      const negocioData = {
        nombre: formData.nombre,
        id_externo: idExterno, // ID externo generado automáticamente
        cliente_id: parseInt(formData.cliente_id),
        cliente_nombre: formData.cliente_nombre,
        fecha_inicio: formData.fecha_inicio,
        descripcion: formData.descripcion,
        valor_total: parseFloat(formData.valor_total) || 0,
        fecha_creacion: new Date().toISOString() // Añadir fecha de creación automáticamente
      };

      // Insertar en la tabla negocios
      const { data, error } = await supabase
        .from('negocios')
        .insert(negocioData)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No se pudo crear el contrato');
      
      const negocioId = data[0].id;
      
      // Si se creó el negocio, crear las relaciones con proveedores y materiales
      if (data && data[0]?.id) {
        const negocioId = data[0].id;
        
        // Si se seleccionaron proveedores, crear relaciones en negocios_proveedores
        if (formData.proveedor_ids.length > 0) {
          const proveedoresInsert = formData.proveedor_ids.map(proveedor_id => {
            // Buscar el nombre del proveedor
            const proveedorSeleccionado = proveedores.find(p => p.id === proveedor_id);
            return {
              negocio_id: negocioId,
              proveedor_id,
              proveedor_nombre: proveedorSeleccionado?.nombre || 'Proveedor sin nombre', // Añadir nombre del proveedor
              monto_estimado: parseFloat(formData.valor_total) / formData.proveedor_ids.length || 0
            };
          });
          
          const { error: proveedorError } = await supabase
            .from('negocios_proveedores')
            .insert(proveedoresInsert);
          
          if (proveedorError) {
            console.error('Error al crear relaciones con proveedores:', proveedorError);
          }
        }
        
        // Si se seleccionaron materiales, crear relaciones en negocios_materiales
        if (formData.material_ids.length > 0) {
          const materialesInsert = formData.material_ids.map(material_id => ({
            negocio_id: negocioId,
            material_id,
            cantidad: 1,
            material_nombre: materiales.find(m => m.id === material_id)?.nombre || 'Material desconocido'
          }));
          
          const { error: materialError } = await supabase
            .from('negocios_materiales')
            .insert(materialesInsert);
          
          if (materialError) throw materialError;
        }
        
        setSuccess(true);
        setCreatedNegocioId(negocioId);
        
        // Opcional: redireccionar automáticamente después de un tiempo
        setTimeout(() => {
          router.push(`/negocios/${negocioId}`);
        }, 1500);
      }
      
    } catch (error: any) {
      console.error('Error al crear contrato:', error);
      setError('Error al crear el contrato: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/negocios"
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiArrowLeft className="h-5 w-5 text-gray-500" />
            </Link>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Crear Nuevo Contrato
            </h1>
          </div>
        </div>
        
        {/* Mensaje de éxito */}
        {success && (
          <div className="mb-8 bg-green-50 border-l-4 border-green-500 p-4 rounded-md shadow-sm animate-fadeIn">
            <div className="flex">
              <div className="flex-shrink-0 text-green-500">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Contrato creado exitosamente. 
                  {createdNegocioId && (
                    <button 
                      onClick={() => router.push(`/negocios/${createdNegocioId}`)}
                      className="ml-2 font-medium underline text-green-700 hover:text-green-800"
                    >
                      Ver contrato
                    </button>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Mensajes de error */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm animate-fadeIn">
            <div className="flex items-center">
              <div className="flex-shrink-0 text-red-500">
                <FiAlertCircle className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Nombre del Contrato */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Contrato <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiTag className="text-gray-400 h-5 w-5" />
                </div>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej: Contrato de suministro"
                  required
                />
              </div>
            </div>
            
            {/* Cliente Selector */}
            <div>
              <label htmlFor="cliente_selector" className="block text-sm font-medium text-gray-700 mb-1">
                Cliente <span className="text-red-500">*</span>
              </label>
              <ClienteSelector
                value={formData.cliente_nombre}
                onSelect={handleClienteSelect}
                placeholder="Buscar cliente por nombre, CIF, ciudad..."
                className="w-full"
              />
              {formData.cliente_id && (
                <p className="mt-1 text-xs text-gray-500">Cliente seleccionado: {formData.cliente_nombre}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Fecha de Inicio */}
            <div>
              <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="text-gray-400 h-5 w-5" />
                </div>
                <input
                  type="date"
                  id="fecha_inicio"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Valor */}
            <div>
              <label htmlFor="valor_total" className="block text-sm font-medium text-gray-700 mb-1">
                Valor Total
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiDollarSign className="text-gray-400 h-5 w-5" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  id="valor_total"
                  name="valor_total"
                  value={formData.valor_total}
                  onChange={handleChange}
                  className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Materiales (selección múltiple) */}
            <div>
              <label htmlFor="material_ids" className="block text-sm font-medium text-gray-700 mb-1">
                Materiales <span className="text-gray-500 text-xs">(mantén presionado Ctrl para selección múltiple)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiPackage className="text-gray-400 h-5 w-5" />
                </div>
                <select
                  id="material_ids"
                  name="material_ids"
                  multiple
                  value={formData.material_ids.map(String)}
                  onChange={handleMaterialChange}
                  className="pl-10 pr-4 py-2 border rounded-md w-full h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {materiales.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500">Materiales seleccionados: {formData.material_ids.length}</p>
            </div>
            
            {/* Proveedores (selección múltiple) */}
            <div>
              <label htmlFor="proveedor_ids" className="block text-sm font-medium text-gray-700 mb-1">
                Proveedores <span className="text-gray-500 text-xs">(mantén presionado Ctrl para selección múltiple)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiTruck className="text-gray-400 h-5 w-5" />
                </div>
                <select
                  id="proveedor_ids"
                  name="proveedor_ids"
                  multiple
                  value={formData.proveedor_ids.map(String)}
                  onChange={handleProveedorChange}
                  className="pl-10 pr-4 py-2 border rounded-md w-full h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {proveedores.map((proveedor) => (
                    <option key={proveedor.id} value={proveedor.id}>
                      {proveedor.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500">Proveedores seleccionados: {formData.proveedor_ids.length}</p>
            </div>
          </div>
          
          {/* Descripción */}
          <div className="mb-6">
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FiFileText className="text-gray-400 h-5 w-5" />
              </div>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={4}
                className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Descripción del contrato, términos importantes, etc."
              ></textarea>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end mt-6">
            <Link
              href="/negocios"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando...
                </>
              ) : 'Crear Contrato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
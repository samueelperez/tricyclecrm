'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave, FiUser, FiCalendar, FiDollarSign, FiTag, FiPackage, FiTruck, FiMessageSquare, FiAlertCircle, FiLoader, FiHash } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';

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

interface RelacionProveedor {
  id: number;
  negocio_id: number;
  proveedor_id: number;
  monto_estimado?: number;
}

interface RelacionMaterial {
  id: number;
  negocio_id: number;
  material_id: number;
  cantidad: number;
  material_nombre: string;
}

export default function EditarNegocioPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Estado para las relaciones existentes
  const [relacionesProveedores, setRelacionesProveedores] = useState<RelacionProveedor[]>([]);
  const [relacionesMateriales, setRelacionesMateriales] = useState<RelacionMaterial[]>([]);

  // Estado para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    cliente_id: '',
    cliente_nombre: '',
    fecha_inicio: '',
    descripcion: '',
    valor_total: '',
    proveedor_ids: [] as number[], // Almacena múltiples proveedores
    material_ids: [] as number[],   // Almacena múltiples materiales
    id_externo: '', // Mantenemos este campo en el estado pero no lo mostramos en la UI
    fecha_creacion: '' // Mantenemos la fecha de creación original
  });

  // Cargar datos iniciales: clientes, proveedores, materiales y datos del negocio
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        const supabase = getSupabaseClient();
        
        // Cargar datos del negocio a editar
        const { data: negociosData, error: negociosError } = await supabase
          .from('negocios')
          .select('*')
          .eq('id', params.id);
        
        if (negociosError) throw negociosError;
        
        // Verificar si hay resultados
        if (!negociosData || negociosData.length === 0) {
          throw new Error('No se encontró el contrato');
        }
        
        // Tomar el primer resultado
        const negocioData = negociosData[0];
        
        // Actualizar el formulario con los datos del negocio
        setFormData({
          nombre: negocioData.nombre || '',
          cliente_id: negocioData.cliente_id ? String(negocioData.cliente_id) : '',
          cliente_nombre: negocioData.cliente_nombre || '',
          fecha_inicio: negocioData.fecha_inicio || new Date().toISOString().split('T')[0],
          descripcion: negocioData.descripcion || '',
          valor_total: negocioData.valor_total ? String(negocioData.valor_total) : '',
          proveedor_ids: [], // Se cargará a continuación
          material_ids: [],   // Se cargará a continuación
          id_externo: negocioData.id_externo || '', // Guardamos el ID externo existente
          fecha_creacion: negocioData.fecha_creacion || new Date().toISOString() // Guardamos la fecha de creación original
        });
        
        // Cargar proveedores relacionados
        const { data: proveedoresRelData, error: proveedoresRelError } = await supabase
          .from('negocios_proveedores')
          .select('*')
          .eq('negocio_id', params.id);
        
        if (proveedoresRelError) throw proveedoresRelError;
        setRelacionesProveedores(proveedoresRelData || []);
        
        // Extraer los IDs de proveedores para el formulario
        const proveedorIds = proveedoresRelData?.map(rel => rel.proveedor_id) || [];
        setFormData(prev => ({
          ...prev,
          proveedor_ids: proveedorIds
        }));
        
        // Cargar materiales relacionados
        const { data: materialesRelData, error: materialesRelError } = await supabase
          .from('negocios_materiales')
          .select('*')
          .eq('negocio_id', params.id);
        
        if (materialesRelError) throw materialesRelError;
        setRelacionesMateriales(materialesRelData || []);
        
        // Extraer los IDs de materiales para el formulario
        const materialIds = materialesRelData?.map(rel => rel.material_id) || [];
        setFormData(prev => ({
          ...prev,
          material_ids: materialIds
        }));
        
        // Cargar listas de clientes, proveedores y materiales
        const { data: clientesData, error: clientesError } = await supabase
          .from('clientes')
          .select('id, nombre')
          .order('nombre');

        if (clientesError) throw clientesError;
        setClientes(clientesData || []);
        
        const { data: proveedoresData, error: proveedoresError } = await supabase
          .from('proveedores')
          .select('id, nombre')
          .order('nombre');

        if (proveedoresError) throw proveedoresError;
        setProveedores(proveedoresData || []);
        
        const { data: materialesData, error: materialesError } = await supabase
          .from('materiales')
          .select('id, nombre, descripcion')
          .order('nombre');

        if (materialesError) throw materialesError;
        setMateriales(materialesData || []);
        
      } catch (error: any) {
        console.error('Error al cargar datos:', error);
        setError('No se pudieron cargar los datos necesarios. ' + error.message);
      } finally {
        setLoadingData(false);
      }
    };

    cargarDatos();
  }, [params.id]);

  // Manejar cambios en los campos de texto
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Si cambia el cliente_id, actualizar también el cliente_nombre
    if (name === 'cliente_id' && value) {
      const clienteSeleccionado = clientes.find(cliente => cliente.id === parseInt(value));
      if (clienteSeleccionado) {
        setFormData(prev => ({
          ...prev,
          cliente_nombre: clienteSeleccionado.nombre
        }));
      }
    }
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
      
      // Preparar datos para actualizar
      const negocioData = {
        nombre: formData.nombre,
        id_externo: formData.id_externo, // Mantener el ID externo existente
        cliente_id: parseInt(formData.cliente_id),
        cliente_nombre: formData.cliente_nombre,
        fecha_inicio: formData.fecha_inicio,
        descripcion: formData.descripcion,
        valor_total: parseFloat(formData.valor_total) || 0,
        fecha_creacion: formData.fecha_creacion // Mantener la fecha de creación original
      };

      // Actualizar el negocio
      const { error } = await supabase
        .from('negocios')
        .update(negocioData)
        .eq('id', params.id);

      if (error) throw error;

      // Actualizar relaciones con proveedores
      if (formData.proveedor_ids.length > 0) {
        // Primero eliminar relaciones existentes
        await supabase
          .from('negocios_proveedores')
          .delete()
          .eq('negocio_id', params.id);
        
        // Luego crear nuevas relaciones
        const proveedoresInsert = formData.proveedor_ids.map(proveedor_id => {
          // Buscar el nombre del proveedor
          const proveedorSeleccionado = proveedores.find(p => p.id === proveedor_id);
          return {
            negocio_id: parseInt(params.id),
            proveedor_id,
            proveedor_nombre: proveedorSeleccionado?.nombre || 'Proveedor sin nombre', // Añadir nombre del proveedor
            monto_estimado: parseFloat(formData.valor_total) / formData.proveedor_ids.length || 0
          };
        });
        
        const { error: proveedorError } = await supabase
          .from('negocios_proveedores')
          .insert(proveedoresInsert);
        
        if (proveedorError) {
          console.error('Error al actualizar relaciones con proveedores:', proveedorError);
        }
      }
      
      // Actualizar relaciones con materiales
      // 1. Eliminar todas las relaciones existentes
      const { error: deleteMaterialesError } = await supabase
        .from('negocios_materiales')
        .delete()
        .eq('negocio_id', params.id);
        
      if (deleteMaterialesError) throw deleteMaterialesError;
      
      // 2. Crear nuevas relaciones con los materiales seleccionados
      if (formData.material_ids.length > 0) {
        const materialesInsert = formData.material_ids.map(material_id => {
          const material = materiales.find(m => m.id === material_id);
          return {
            negocio_id: parseInt(params.id),
            material_id,
            cantidad: 1,
            material_nombre: material?.nombre || 'Material desconocido'
          };
        });
        
        const { error: insertMaterialesError } = await supabase
          .from('negocios_materiales')
          .insert(materialesInsert);
          
        if (insertMaterialesError) throw insertMaterialesError;
      }
      
      setSuccess(true);
      
      // Redirigir automáticamente después de un tiempo
      setTimeout(() => {
        router.push(`/negocios/${params.id}`);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error al actualizar contrato:', error);
      setError('Error al actualizar el contrato: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-gray-700">Cargando datos del contrato...</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href={`/negocios/${params.id}`}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiArrowLeft className="h-5 w-5 text-gray-500" />
            </Link>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Editar Contrato
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
                  Contrato actualizado exitosamente.
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
            
            {/* Cliente */}
            <div>
              <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-700 mb-1">
                Cliente <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="text-gray-400 h-5 w-5" />
                </div>
                <select
                  id="cliente_id"
                  name="cliente_id"
                  value={formData.cliente_id}
                  onChange={handleChange}
                  className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Seleccione un cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>
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
              <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                <FiMessageSquare className="text-gray-400 h-5 w-5" />
              </div>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={4}
                className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Información adicional sobre el contrato..."
              ></textarea>
            </div>
          </div>
          
          {/* Botones */}
          <div className="flex justify-end">
            <Link
              href={`/negocios/${params.id}`}
              className="mr-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <FiSave className="mr-2 -ml-1 h-5 w-5" /> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiArrowLeft, 
  FiSave, 
  FiX,
  FiPackage,
  FiTag,
  FiFileText,
  FiDollarSign,
  FiHash,
  FiBox
} from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';

interface MaterialFormData {
  nombre: string;
  descripcion: string;
  precio_unitario: number;
  unidad_medida: string;
}

export default function NewMaterialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado inicial del formulario
  const [formData, setFormData] = useState<MaterialFormData>({
    nombre: '',
    descripcion: '',
    precio_unitario: 0,
    unidad_medida: 'kg' // Valor por defecto
  });

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convertir a número para campos numéricos
    if (name === 'precio_unitario') {
      setFormData({
        ...formData,
        [name]: value === '' ? 0 : parseFloat(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validar el nombre del material (campo obligatorio)
      if (!formData.nombre.trim()) {
        throw new Error('El nombre del material es obligatorio');
      }
      
      const supabase = getSupabaseClient();
      
      // Método más básico posible, sin arrays ni .select()
      const { error } = await supabase
        .from('materiales')
        .insert({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          precio_unitario: formData.precio_unitario,
          unidad_medida: formData.unidad_medida
        });
          
      if (error) {
        throw new Error(`Error al guardar el material: ${error.message}`);
      }
      
      // Redirigir a la página de materiales
      router.push('/materiales');
      router.refresh();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al guardar material:', err);
    } finally {
      setLoading(false);
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
  }) => (
    <div className="relative">
      <input
        {...props}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                  focus:border-indigo-500 focus:ring-indigo-500 
                  transition-all duration-200 ease-in-out
                  hover:border-indigo-300 sm:text-sm
                  peer"
      />
      <div className="absolute inset-0 border border-indigo-500 rounded-md opacity-0 pointer-events-none transition-opacity duration-200 peer-focus:opacity-100"></div>
    </div>
  );

  // Función para renderizar un campo de textarea
  const renderTextarea = (props: {
    name: string;
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
  }) => (
    <div className="relative">
      <textarea
        {...props}
        rows={props.rows || 3}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                  focus:border-indigo-500 focus:ring-indigo-500 
                  transition-all duration-200 ease-in-out
                  hover:border-indigo-300 sm:text-sm
                  peer"
      />
      <div className="absolute inset-0 border border-indigo-500 rounded-md opacity-0 pointer-events-none transition-opacity duration-200 peer-focus:opacity-100"></div>
    </div>
  );

  // Función para renderizar un select
  const renderSelect = (props: {
    name: string;
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
  }) => (
    <div className="relative">
      <select
        {...props}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                  focus:border-indigo-500 focus:ring-indigo-500 
                  transition-all duration-200 ease-in-out
                  hover:border-indigo-300 sm:text-sm
                  peer"
      >
        {props.options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-0 border border-indigo-500 rounded-md opacity-0 pointer-events-none transition-opacity duration-200 peer-focus:opacity-100"></div>
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="bg-white shadow-md rounded-lg px-6 py-5 mb-8 flex items-center justify-between transition-all duration-300 ease-in-out transform hover:shadow-lg border-l-4 border-indigo-500">
          <div className="flex items-center">
            <Link href="/materiales" className="mr-4 text-gray-500 hover:text-indigo-600 transition-colors duration-200">
              <FiArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Nuevo Material
            </h1>
          </div>
          <div className="hidden sm:block text-sm text-gray-500">
            Complete el formulario para añadir un nuevo material al inventario
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
          {/* Información General */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out transform hover:shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <FiPackage className="mr-2 text-indigo-500" />
                Información del Material
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Datos básicos del material
              </p>
            </div>
            
            <div className="p-6 bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-1">
                {/* Nombre */}
                <div className="relative group">
                  {renderLabel('Nombre del Material', true, <FiPackage />)}
                  {renderInput({
                    type: "text",
                    name: "nombre",
                    id: "nombre",
                    required: true,
                    value: formData.nombre,
                    onChange: handleInputChange,
                    placeholder: "Nombre del material"
                  })}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
              </div>
              
              {/* Descripción */}
              <div className="mt-6">
                <div className="relative group">
                  {renderLabel('Descripción', false, <FiFileText />)}
                  {renderTextarea({
                    name: "descripcion",
                    id: "descripcion",
                    value: formData.descripcion,
                    onChange: handleInputChange,
                    placeholder: "Detalle del material, características, etc.",
                    rows: 3
                  })}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Información de Precio y Stock */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out transform hover:shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <FiDollarSign className="mr-2 text-indigo-500" />
                Precio y Stock
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Datos de precio y disponibilidad
              </p>
            </div>
            
            <div className="p-6 bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                {/* Precio Unitario */}
                <div className="relative group">
                  {renderLabel('Precio Unitario', false, <FiDollarSign />)}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">€</span>
                    </div>
                    {renderInput({
                      type: "number",
                      name: "precio_unitario",
                      id: "precio_unitario",
                      value: formData.precio_unitario,
                      onChange: handleInputChange,
                      placeholder: "0.00",
                      min: "0",
                      step: "0.01"
                    })}
                  </div>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
                
                {/* Unidad de Medida */}
                <div className="relative group">
                  {renderLabel('Unidad de Medida', false, <FiHash />)}
                  {renderSelect({
                    name: "unidad_medida",
                    id: "unidad_medida",
                    value: formData.unidad_medida,
                    onChange: handleInputChange,
                    options: [
                      { value: 'kg', label: 'Kilogramo (kg)' },
                      { value: 'g', label: 'Gramo (g)' },
                      { value: 'l', label: 'Litro (l)' },
                      { value: 'ml', label: 'Mililitro (ml)' },
                      { value: 'm', label: 'Metro (m)' },
                      { value: 'cm', label: 'Centímetro (cm)' },
                      { value: 'u', label: 'Unidad (u)' },
                      { value: 'pack', label: 'Paquete (pack)' },
                      { value: 'ton', label: 'Tonelada (ton)' }
                    ]
                  })}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 mt-8">
            <Link
              href="/materiales"
              className="py-2.5 px-5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2.5 px-6 border border-transparent rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {loading ? (
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
                  Guardar Material
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
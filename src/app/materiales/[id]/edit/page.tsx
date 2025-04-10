'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiArrowLeft, 
  FiSave, 
  FiX,
  FiPackage,
  FiFileText,
  FiTag
} from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';

interface Material {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string;
}

type FormData = {
  nombre: string;
  descripcion: string;
  categoria: string;
};

interface EditMaterialPageProps {
  params: {
    id: string;
  };
}

export default function EditMaterialPage({ params }: EditMaterialPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const materialId = params.id;
  
  // Estado inicial del formulario
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    categoria: 'plastico' // Valor por defecto
  });

  // Cargar datos del material
  useEffect(() => {
    async function loadMaterial() {
      try {
        setLoadingData(true);
        const supabase = getSupabaseClient();
        
        const { data, error } = await supabase
          .from('materiales')
          .select('id, nombre, descripcion, categoria')
          .eq('id', materialId)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setFormData({
            nombre: data.nombre || '',
            descripcion: data.descripcion || '',
            categoria: data.categoria || 'plastico'
          });
        } else {
          throw new Error('No se encontró el material');
        }
      } catch (err) {
        console.error('Error cargando material:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoadingData(false);
      }
    }
    
    loadMaterial();
  }, [materialId]);

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
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
      
      // Actualizar el material en Supabase
      const { error } = await supabase
        .from('materiales')
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          categoria: formData.categoria
        })
        .eq('id', materialId);
          
      if (error) {
        throw new Error(`Error al actualizar el material: ${error.message}`);
      }
      
      // Redirigir a la página de materiales
      router.push('/materiales');
      router.refresh();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al actualizar material:', err);
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

  // Mostrar estado de carga inicial
  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-gray-700">Cargando datos del material...</p>
      </div>
    );
  }

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
              Editar Material
            </h1>
          </div>
          <div className="hidden sm:block text-sm text-gray-500">
            ID: {materialId}
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
                
                {/* Categoría */}
                <div className="relative group mt-4">
                  {renderLabel('Categoría', true, <FiTag />)}
                  <select
                    name="categoria"
                    id="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                              focus:border-indigo-500 focus:ring-indigo-500 
                              transition-all duration-200 ease-in-out
                              hover:border-indigo-300 sm:text-sm
                              peer"
                  >
                    <option value="plastico">Plástico</option>
                    <option value="metal">Metal</option>
                    <option value="papel">Papel</option>
                  </select>
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
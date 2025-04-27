'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiArrowLeft, 
  FiSave, 
  FiX, 
  FiUser,
  FiCreditCard,
  FiHome,
  FiMapPin,
  FiMail,
  FiPhone,
  FiGlobe,
  FiFile,
  FiPackage
} from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import MaterialesSelector from '@/components/proveedores/materiales-selector';

interface ProveedorFormData {
  nombre: string;
  id_fiscal: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  pais: string;
  contacto_nombre: string;
  email: string;
  telefono: string;
  sitio_web: string;
  comentarios: string;
  material_ids: number[];
}

export default function EditProveedorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const proveedorId = parseInt(params.id);
  
  // Estado inicial del formulario
  const [formData, setFormData] = useState<ProveedorFormData>({
    nombre: '',
    id_fiscal: '',
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    pais: '',
    contacto_nombre: '',
    email: '',
    telefono: '',
    sitio_web: '',
    comentarios: '',
    material_ids: []
  });

  // Cargar datos del proveedor
  useEffect(() => {
    const fetchProveedor = async () => {
      if (isNaN(proveedorId)) {
        setError('ID de proveedor inválido');
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseClient();
        
        // Consultar proveedor por ID
        const { data, error: fetchError } = await supabase
          .from('proveedores')
          .select('*')
          .eq('id', proveedorId)
          .single();
        
        if (fetchError) {
          throw new Error(`Error al cargar el proveedor: ${fetchError.message}`);
        }
        
        if (!data) {
          throw new Error('Proveedor no encontrado');
        }
        
        // Actualizar el formulario con los datos del proveedor
        setFormData({
          nombre: data.nombre || '',
          id_fiscal: data.id_fiscal || '',
          direccion: data.direccion || '',
          ciudad: data.ciudad || '',
          codigo_postal: data.codigo_postal || '',
          pais: data.pais || '',
          contacto_nombre: data.contacto_nombre || '',
          email: data.email || '',
          telefono: data.telefono || '',
          sitio_web: data.sitio_web || '',
          comentarios: data.comentarios || '',
          material_ids: data.material_ids || []
        });
        
      } catch (err) {
        console.error('Error al cargar proveedor:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProveedor();
  }, [proveedorId]);

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Manejar cambios en los materiales seleccionados
  const handleMaterialesChange = (materialIds: number[]) => {
    setFormData({
      ...formData,
      material_ids: materialIds
    });
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      // Validar el nombre del proveedor (campo obligatorio)
      if (!formData.nombre.trim()) {
        throw new Error('El nombre del proveedor es obligatorio');
      }
      
      const supabase = getSupabaseClient();
      
      // Actualizar proveedor en Supabase
      const { error: updateError } = await supabase
        .from('proveedores')
        .update({
          nombre: formData.nombre,
          id_fiscal: formData.id_fiscal || null,
          direccion: formData.direccion || null,
          ciudad: formData.ciudad || null,
          codigo_postal: formData.codigo_postal || null,
          pais: formData.pais || null,
          contacto_nombre: formData.contacto_nombre || null,
          email: formData.email || null,
          telefono: formData.telefono || null,
          sitio_web: formData.sitio_web || null,
          comentarios: formData.comentarios || null
        })
        .eq('id', proveedorId);
        
      if (updateError) {
        throw new Error(`Error al actualizar el proveedor: ${updateError.message}`);
      }

      // Actualizar los materiales seleccionados
      const materialesResponse = await fetch('/api/proveedores/materiales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proveedor_id: proveedorId,
          material_ids: formData.material_ids,
        }),
      });
      
      if (!materialesResponse.ok) {
        console.error('Error al actualizar los materiales del proveedor, pero el proveedor se actualizó correctamente');
      }
      
      // Redirigir a la página del proveedor
      router.push(`/proveedores/${proveedorId}`);
      router.refresh();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al actualizar proveedor:', err);
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
    value: string;
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

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="ml-3 text-lg text-gray-500">Cargando proveedor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="bg-white shadow-md rounded-lg px-6 py-5 mb-8 flex items-center justify-between transition-all duration-300 ease-in-out transform hover:shadow-lg border-l-4 border-indigo-500">
          <div className="flex items-center">
            <Link href="/proveedores" className="mr-4 text-gray-500 hover:text-indigo-600 transition-colors duration-200">
              <FiArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Editar Proveedor
            </h1>
          </div>
          <div className="hidden sm:block text-sm text-gray-500">
            Actualice la información del proveedor. Los campos marcados con * son obligatorios.
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
                Información General
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Datos básicos del proveedor
              </p>
            </div>
            
            <div className="p-6 bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                {/* Nombre */}
                <div className="relative group">
                  {renderLabel('Nombre de empresa', true, <FiUser />)}
                  {renderInput({
                    type: "text",
                    name: "nombre",
                    id: "nombre",
                    required: true,
                    value: formData.nombre,
                    onChange: handleInputChange,
                    placeholder: "Nombre de la empresa o proveedor"
                  })}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
                
                {/* ID Fiscal */}
                <div className="relative group">
                  {renderLabel('ID Fiscal (CIF/NIF)', false, <FiCreditCard />)}
                  {renderInput({
                    type: "text",
                    name: "id_fiscal",
                    id: "id_fiscal",
                    value: formData.id_fiscal,
                    onChange: handleInputChange,
                    placeholder: "Ej. B12345678"
                  })}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dirección */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out transform hover:shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <FiHome className="mr-2 text-indigo-500" />
                Dirección
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Ubicación física del proveedor
              </p>
            </div>
            
            <div className="p-6 bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm">
              <div className="space-y-6">
                {/* Dirección completa */}
                <div className="relative group">
                  {renderLabel('Dirección', false, <FiHome />)}
                  {renderInput({
                    type: "text",
                    name: "direccion",
                    id: "direccion",
                    value: formData.direccion,
                    onChange: handleInputChange,
                    placeholder: "Calle, número, piso"
                  })}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
                
                <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-3">
                  {/* Ciudad */}
                  <div className="relative group">
                    {renderLabel('Ciudad', false, <FiMapPin />)}
                    {renderInput({
                      type: "text",
                      name: "ciudad",
                      id: "ciudad",
                      value: formData.ciudad,
                      onChange: handleInputChange,
                      placeholder: "Ciudad"
                    })}
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                  </div>
                  
                  {/* Código Postal */}
                  <div className="relative group">
                    {renderLabel('Código Postal', false, <FiFile />)}
                    {renderInput({
                      type: "text",
                      name: "codigo_postal",
                      id: "codigo_postal",
                      value: formData.codigo_postal,
                      onChange: handleInputChange,
                      placeholder: "Ej. 28001"
                    })}
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                  </div>
                  
                  {/* País */}
                  <div className="relative group">
                    {renderLabel('País', false, <FiGlobe />)}
                    {renderInput({
                      type: "text",
                      name: "pais",
                      id: "pais",
                      value: formData.pais,
                      onChange: handleInputChange,
                      placeholder: "País"
                    })}
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Información de Contacto */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out transform hover:shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <FiPhone className="mr-2 text-indigo-500" />
                Información de Contacto
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Detalles para comunicarse con el proveedor
              </p>
            </div>
            
            <div className="p-6 bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-3">
                {/* Nombre de Contacto */}
                <div className="relative group">
                  {renderLabel('Nombre de Contacto', false, <FiUser />)}
                  {renderInput({
                    type: "text",
                    name: "contacto_nombre",
                    id: "contacto_nombre",
                    value: formData.contacto_nombre,
                    onChange: handleInputChange,
                    placeholder: "Persona de contacto"
                  })}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
                
                {/* Email */}
                <div className="relative group">
                  {renderLabel('Email', false, <FiMail />)}
                  {renderInput({
                    type: "email",
                    name: "email",
                    id: "email",
                    value: formData.email,
                    onChange: handleInputChange,
                    placeholder: "ejemplo@empresa.com"
                  })}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
                
                {/* Teléfono */}
                <div className="sm:col-span-3">
                  {renderLabel('Teléfono', false, <FiPhone />)}
                  {renderInput({
                    type: "tel",
                    name: "telefono",
                    id: "telefono",
                    value: formData.telefono,
                    onChange: handleInputChange,
                    placeholder: "Ej: +34 600 000 000"
                  })}
                </div>

                {/* Sitio Web */}
                <div className="sm:col-span-3">
                  {renderLabel('Sitio Web', false, <FiGlobe />)}
                  {renderInput({
                    type: "url",
                    name: "sitio_web",
                    id: "sitio_web",
                    value: formData.sitio_web,
                    onChange: handleInputChange,
                    placeholder: "Ej: https://empresa.com"
                  })}
                </div>

                {/* Comentarios */}
                <div className="sm:col-span-6">
                  {renderLabel('Comentarios', false, <FiFile />)}
                  <div className="relative">
                    <textarea
                      name="comentarios"
                      id="comentarios"
                      rows={3}
                      value={formData.comentarios}
                      onChange={handleInputChange}
                      placeholder="Información adicional sobre el proveedor..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200 ease-in-out hover:border-indigo-300 sm:text-sm"
                    ></textarea>
                    <div className="absolute inset-0 border border-indigo-500 rounded-md opacity-0 pointer-events-none transition-opacity duration-200 peer-focus:opacity-100"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sección de Materiales */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out transform hover:shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <FiPackage className="mr-2 text-indigo-500" />
                Materiales
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Materiales que ofrece este proveedor
              </p>
            </div>
            
            <div className="p-6 bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm">
              <MaterialesSelector 
                proveedorId={proveedorId} 
                onMaterialesChange={handleMaterialesChange}
                disabled={loading}
              />
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 mt-8">
            <Link
              href="/proveedores"
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
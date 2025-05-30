'use client';

import { useState } from 'react';
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
  FiPackage,
  FiUpload,
  FiPaperclip,
  FiCheck,
  FiDownload
} from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import MaterialesSelector from '@/components/proveedores/materiales-selector';
import { toast } from 'react-hot-toast';

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
  archivo_adjunto?: File | null;
  nombre_archivo?: string | null;
  ruta_archivo?: string | null;
  archivo_url?: string | null; // Usado solo temporalmente para previsualización
}

export default function NewProveedorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    material_ids: [],
    archivo_adjunto: null,
    nombre_archivo: null,
    ruta_archivo: null,
    archivo_url: null
  });

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
    console.log('handleMaterialesChange llamado con materialIds:', materialIds);
    console.log('Estado actual de formData.material_ids:', formData.material_ids);
    
    // Comprobar si realmente hay un cambio
    const currentIds = [...formData.material_ids].sort();
    const newIds = [...materialIds].sort();
    const idsString = JSON.stringify(currentIds);
    const newIdsString = JSON.stringify(newIds);
    
    if (idsString !== newIdsString) {
      console.log('Materiales han cambiado, actualizando estado');
      setFormData(prevData => ({
        ...prevData,
        material_ids: materialIds
      }));
      console.log('Nuevo estado de material_ids:', materialIds);
    } else {
      console.log('No hay cambios en los materiales seleccionados');
    }
  };

  // Manejar cambio de archivo adjunto
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Verificar el tamaño del archivo (10MB máximo)
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo es demasiado grande. El tamaño máximo permitido es 10MB.');
        e.target.value = ''; // Limpiar el input file
        return;
      }
      
      // Verificar el tipo de archivo
      const fileType = file.type;
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(fileType)) {
        setError('Tipo de archivo no válido. Solo se permiten PDF, PNG, JPG.');
        e.target.value = ''; // Limpiar el input file
        return;
      }
      
      // Crear un objeto URL para previsualizar el archivo
      const fileUrl = URL.createObjectURL(file);
      
      // Liberamos la URL anterior si existe para evitar fugas de memoria
      if (formData.archivo_url && formData.archivo_adjunto) {
        URL.revokeObjectURL(formData.archivo_url);
      }
      
      setFormData(prevData => ({
        ...prevData,
        archivo_adjunto: file,
        nombre_archivo: file.name,
        archivo_url: fileUrl
      }));
      
      console.log('Archivo seleccionado:', {
        nombre: file.name,
        tipo: file.type,
        tamaño: `${Math.round(file.size / 1024)} KB`,
        previsualización: fileUrl
      });
      
      // Limpiar mensaje de error si existía
      if (error) setError(null);
    }
  };
  
  // Eliminar archivo adjunto
  const handleClearFile = () => {
    // Liberamos la URL de objeto antes de eliminar la referencia
    if (formData.archivo_url && formData.archivo_adjunto) {
      URL.revokeObjectURL(formData.archivo_url);
    }
    
    setFormData(prev => ({
      ...prev,
      archivo_adjunto: null,
      nombre_archivo: null,
      ruta_archivo: null,
      archivo_url: null
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validar el nombre del proveedor (campo obligatorio)
      if (!formData.nombre.trim()) {
        throw new Error('El nombre del proveedor es obligatorio');
      }
      
      const supabase = getSupabaseClient();
      
      // Insertar proveedor en Supabase
      const { data, error: insertError } = await supabase
        .from('proveedores')
        .insert([{
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
          comentarios: formData.comentarios || null,
          nombre_archivo: formData.nombre_archivo,
          ruta_archivo: null,
          archivo_url: null
        }])
        .select();
        
      if (insertError) {
        throw new Error(`Error al guardar el proveedor: ${insertError.message}`);
      }

      // Guardar los materiales seleccionados si hay alguno
      if (data && data[0] && formData.material_ids.length > 0) {
        const proveedorId = data[0].id;
        
        // Llamar al API para guardar la relación proveedor-materiales
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
          console.error('Error al guardar los materiales del proveedor, pero el proveedor se guardó correctamente');
        }
      }
      
      // Si hay un archivo adjunto, subirlo a Storage
      if (formData.archivo_adjunto && data && data[0]) {
        const proveedorId = data[0].id;
        const fileExt = formData.archivo_adjunto.name.split('.').pop();
        const timestamp = Date.now();
        const filePath = `proveedores/${proveedorId}_${timestamp}.${fileExt}`;
        
        console.log('Iniciando carga del archivo a Supabase Storage...', {
          bucket: 'documentos',
          filePath,
          fileSize: `${Math.round(formData.archivo_adjunto.size / 1024)} KB`,
          fileType: formData.archivo_adjunto.type
        });
        
        try {
          // Obtener el cliente de Supabase
          const supabase = getSupabaseClient();
          console.log('Supabase client creado');
          
          // Subir el archivo
          console.log('Subiendo archivo a path:', filePath);
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('documentos')
            .upload(filePath, formData.archivo_adjunto, {
              upsert: true,
              contentType: formData.archivo_adjunto.type
            });
          
          console.log('Resultado de subida:', { uploadData, error: uploadError ? uploadError.message : null });
          
          if (uploadError) {
            console.error('Error al subir el archivo adjunto:', uploadError);
            toast.error(`Error al subir el archivo: ${uploadError.message}`);
          } else {
            console.log('Archivo subido correctamente a Storage');
            
            // Actualizar el registro con la ruta del archivo (no guardamos la URL directamente)
            console.log('Actualizando proveedor con la ruta del archivo:', filePath);
            const { error: updateError } = await supabase
              .from('proveedores')
              .update({ 
                nombre_archivo: formData.archivo_adjunto.name,
                ruta_archivo: filePath
              })
              .eq('id', proveedorId);
              
            if (updateError) {
              console.error('Error al actualizar la información del archivo:', updateError);
              toast.error('Se creó el proveedor y se subió el archivo, pero hubo un error al guardar la referencia');
            } else {
              console.log('Archivo registrado con éxito.');
              toast.success('Proveedor y archivo guardados correctamente');
            }
          }
        } catch (error) {
          console.error('Error general en la carga de archivos:', error);
          toast.error(`Error en la carga: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }
      
      // Redirigir a la página de proveedores
      router.push('/proveedores');
      router.refresh();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al guardar proveedor:', err);
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
              Nuevo Proveedor
            </h1>
          </div>
          <div className="hidden sm:block text-sm text-gray-500">
            Complete el formulario para añadir un nuevo proveedor al sistema
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
              </div>
            </div>
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
          
          {/* Sección de Materiales */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out transform hover:shadow-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <FiPackage className="mr-2 text-indigo-500" />
                Materiales
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Materiales que ofrece este proveedor
              </p>
            </div>
            
            <div className="p-6 bg-white">
              <MaterialesSelector 
                selectedMaterialIds={formData.material_ids}
                onChange={handleMaterialesChange}
              />
            </div>
          </div>
          
          {/* Sección de Archivo Adjunto */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out transform hover:shadow-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <FiPaperclip className="mr-2 text-indigo-500" />
                Documento adjunto
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Añade un documento relacionado con este proveedor (PDF, JPG, PNG)
              </p>
            </div>
            
            <div className="p-6">
              {!formData.archivo_adjunto ? (
                <div className="flex items-center justify-center w-full">
                  <label 
                    htmlFor="file-upload" 
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Haz clic para seleccionar</span> o arrastra y suelta
                      </p>
                      <p className="text-xs text-gray-500">PDF, PNG, JPG (Max. 10MB)</p>
                    </div>
                    <input 
                      id="file-upload" 
                      name="archivo_adjunto" 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-blue-50">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiFile className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-gray-900 truncate" title={formData.nombre_archivo || ''}>
                          {formData.nombre_archivo}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {formData.archivo_adjunto && Math.round(formData.archivo_adjunto.size / 1024)} KB
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {formData.archivo_url && (
                        <a 
                          href={formData.archivo_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FiDownload className="h-4 w-4" />
                        </a>
                      )}
                      
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                  Guardar Proveedor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
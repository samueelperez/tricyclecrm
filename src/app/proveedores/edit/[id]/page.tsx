'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiArrowLeft, 
  FiEdit, 
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
    material_ids: [],
    archivo_adjunto: null,
    nombre_archivo: null,
    ruta_archivo: null,
    archivo_url: null
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
          material_ids: [], // Lo inicializamos vacío y lo cargamos por separado
          archivo_adjunto: null,
          nombre_archivo: data.nombre_archivo || null,
          ruta_archivo: data.ruta_archivo || null,
          archivo_url: null // Inicializamos en null y lo obtendremos después
        });
        
        // Cargar los materiales del proveedor
        try {
          console.log(`Cargando materiales para el proveedor ${proveedorId}...`);
          
          // Primero obtenemos los IDs de los materiales asociados al proveedor
          const { data: materialesRelaciones, error: relacionesError } = await supabase
            .from('proveedores_materiales')
            .select('material_id')
            .eq('proveedor_id', proveedorId);
          
          if (relacionesError) {
            console.error('Error al obtener relaciones de materiales:', relacionesError);
          } else if (materialesRelaciones && materialesRelaciones.length > 0) {
            console.log(`Encontradas ${materialesRelaciones.length} relaciones de materiales`);
            
            // Extraemos los IDs de los materiales
            const materialIds = materialesRelaciones.map(item => item.material_id);
            console.log('IDs de materiales encontrados:', materialIds);
            
            setFormData(prevData => ({
              ...prevData,
              material_ids: materialIds
            }));
            
            // También podemos cargar los detalles de los materiales si los necesitamos
            // para mostrarlos, pero no es necesario para el formData
            const { data: detallesMateriales, error: detallesError } = await supabase
              .from('materiales')
              .select('id, nombre, descripcion, categoria')
              .in('id', materialIds);
            
            if (detallesError) {
              console.error('Error al obtener detalles de materiales:', detallesError);
            } else {
              console.log('Detalles de materiales cargados:', detallesMateriales);
            }
          } else {
            console.log('No se encontraron materiales asociados a este proveedor');
          }
        } catch (materialesError) {
          console.error('Error al cargar los materiales del proveedor:', materialesError);
          // No bloqueamos el flujo por un error en la carga de materiales
        }
        
        // Si hay un archivo adjunto, obtener la URL firmada
        if (data.ruta_archivo) {
          try {
            console.log('Obteniendo URL firmada para:', data.ruta_archivo);
            const { data: fileData, error: fileError } = await supabase
              .storage
              .from('documentos')
              .createSignedUrl(data.ruta_archivo, 3600); // URL válida por 1 hora
              
            if (!fileError && fileData) {
              console.log('URL firmada obtenida correctamente');
              setFormData(prev => ({
                ...prev,
                archivo_url: fileData.signedUrl
              }));
            } else {
              console.error('Error al obtener URL firmada:', fileError);
              // Intentar obtener URL pública como fallback
              try {
                const publicUrl = supabase
                  .storage
                  .from('documentos')
                  .getPublicUrl(data.ruta_archivo);
                
                if (publicUrl && publicUrl.data) {
                  console.log('URL pública obtenida como alternativa');
                  setFormData(prev => ({
                    ...prev,
                    archivo_url: publicUrl.data.publicUrl
                  }));
                }
              } catch (pubUrlErr) {
                console.error('También falló al obtener URL pública:', pubUrlErr);
              }
            }
          } catch (urlError) {
            console.error('Error al generar URL del archivo:', urlError);
            // No bloqueamos la carga de la página por este error
          }
        }
        
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
      
      console.log('Archivo seleccionado:', {
        nombre: file.name,
        tipo: file.type,
        tamaño: `${Math.round(file.size / 1024)} KB`
      });
      
      // Liberar URL anterior si existe
      if (formData.archivo_url) {
        // Solo revocar si es una URL de objeto local, no una URL del servidor
        if (!formData.archivo_url.startsWith('http')) {
          URL.revokeObjectURL(formData.archivo_url);
        }
      }
      
      // Crear URL para vista previa
      const fileUrl = URL.createObjectURL(file);
      
      // Actualizar estado
      setFormData({
        ...formData,
        archivo_adjunto: file,
        nombre_archivo: file.name,
        archivo_url: fileUrl
      });
      
      console.log('Vista previa creada:', {
        archivo: file.name,
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
    setSaving(true);
    setError(null);
    
    try {
      // Validar el nombre del proveedor (campo obligatorio)
      if (!formData.nombre.trim()) {
        throw new Error('El nombre del proveedor es obligatorio');
      }
      
      const supabase = getSupabaseClient();
      
      // Preparar datos para actualizar
      const updateData = {
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
        ruta_archivo: formData.ruta_archivo
      };
      
      // Gestión de archivos
      if (formData.archivo_adjunto) {
        console.log('Subiendo archivo adjunto:', {
          nombre: formData.archivo_adjunto.name,
          tamaño: `${Math.round(formData.archivo_adjunto.size / 1024)} KB`,
          tipo: formData.archivo_adjunto.type
        });
        
        try {
          // Si hay un archivo previo, eliminarlo
          if (formData.ruta_archivo) {
            try {
              console.log('Eliminando archivo anterior:', formData.ruta_archivo);
              const { error: removeError } = await supabase.storage.from('documentos').remove([formData.ruta_archivo]);
              if (removeError) {
                console.warn('Error al eliminar archivo anterior:', removeError);
              } else {
                console.log('Archivo anterior eliminado correctamente');
              }
            } catch (removeError) {
              console.warn('No se pudo eliminar el archivo anterior:', removeError);
              // Continuamos con el proceso aunque no se pueda eliminar
            }
          }
          
          // Generar nombre único para el archivo usando timestamp para evitar colisiones
          const fileExt = formData.archivo_adjunto.name.split('.').pop()?.toLowerCase() || 'pdf';
          const timestamp = Date.now();
          const filePath = `proveedores/${proveedorId}_${timestamp}.${fileExt}`;
          console.log('Ruta del archivo generada:', filePath);
          
          // Subir el nuevo archivo, directamente con el objeto File
          console.log('Iniciando carga del archivo a Supabase Storage...');
          
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('documentos')
            .upload(filePath, formData.archivo_adjunto, {
              upsert: true,
              cacheControl: '3600'
            });
            
          if (uploadError) {
            console.error('Error al subir el archivo a Supabase:', uploadError);
            console.error('Detalles del error:', JSON.stringify(uploadError));
            
            // Si el error es porque el bucket no existe, lo creamos
            if (uploadError.message?.includes('bucket') && uploadError.message?.includes('not found')) {
              console.log('Intentando crear el bucket "documentos"...');
              await supabase.storage.createBucket('documentos', {
                public: false,
              });
              
              // Intentar subir de nuevo después de crear el bucket
              const retryUpload = await supabase
                .storage
                .from('documentos')
                .upload(filePath, formData.archivo_adjunto, {
                  upsert: true,
                  cacheControl: '3600'
                });
                
              if (retryUpload.error) {
                throw new Error(`Error en el segundo intento: ${retryUpload.error.message}`);
              }
              
              console.log('Archivo subido correctamente después de crear el bucket');
            } else {
              throw new Error(`Error al subir el archivo: ${uploadError.message}`);
            }
          }
          
          console.log('Archivo subido correctamente a:', filePath);
          
          // Actualizar referencias en la base de datos
          updateData.nombre_archivo = formData.archivo_adjunto.name;
          updateData.ruta_archivo = filePath;
          
          // Obtener URL firmada para previsualización inmediata después de guardado
          try {
            const { data: fileData } = await supabase
              .storage
              .from('documentos')
              .createSignedUrl(filePath, 3600); // URL válida por 1 hora
              
            if (fileData) {
              console.log('URL firmada generada correctamente');
            }
          } catch (urlError) {
            console.error('Error al generar URL del archivo (no crítico):', urlError);
          }
          
        } catch (uploadError) {
          console.error('Error durante la carga del archivo:', uploadError);
          throw new Error(`Error al procesar el archivo adjunto: ${uploadError instanceof Error ? uploadError.message : 'Error desconocido'}`);
        }
      } else if (formData.nombre_archivo === null) {
        // Si se eliminó el archivo, eliminar también de Storage
        if (formData.ruta_archivo) {
          try {
            console.log('Eliminando archivo:', formData.ruta_archivo);
            const { error: removeError } = await supabase.storage.from('documentos').remove([formData.ruta_archivo]);
            if (removeError) {
              console.warn('Error al eliminar el archivo:', removeError);
            } else {
              console.log('Archivo eliminado correctamente');
            }
          } catch (removeError) {
            console.warn('No se pudo eliminar el archivo:', removeError);
          }
        }
        updateData.nombre_archivo = null;
        updateData.ruta_archivo = null;
      }
      
      // Actualizar proveedor en Supabase
      console.log('Actualizando proveedor con datos:', updateData);
      const { error: updateError } = await supabase
        .from('proveedores')
        .update(updateData)
        .eq('id', proveedorId);
        
      if (updateError) {
        console.error('Error al actualizar proveedor en la base de datos:', updateError);
        throw new Error(`Error al actualizar el proveedor: ${updateError.message}`);
      }
      
      console.log('Proveedor actualizado correctamente');

      // Actualizar los materiales seleccionados
      try {
        console.log('Actualizando materiales del proveedor...');
        console.log('Material IDs a guardar:', formData.material_ids);
        
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
          const errorText = await materialesResponse.text();
          console.error('Error en la respuesta al actualizar materiales:', materialesResponse.status, errorText);
          throw new Error(`Error: ${materialesResponse.status} - ${errorText}`);
        }
        
        const materialesResult = await materialesResponse.json();
        console.log('Respuesta al actualizar materiales:', materialesResult);
        
        if (!materialesResult.success) {
          console.error('Error al actualizar materiales:', materialesResult.error || 'Error desconocido');
          // No bloqueamos el flujo pero registramos el error
        } else {
          console.log('Materiales actualizados correctamente');
        }
      } catch (materialesError) {
        console.error('Error al actualizar los materiales del proveedor:', materialesError);
        // No bloqueamos el flujo por un error en la actualización de materiales, 
        // pero notificamos al usuario
        toast.error('No se pudieron actualizar los materiales correctamente');
      }
      
      // Redirigir a la página del proveedor
      console.log('Redirección a la página del proveedor');
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
              <div className="relative z-30"> {/* Añadir z-index para asegurar visibilidad */}
                <MaterialesSelector 
                  selectedMaterialIds={formData.material_ids}
                  onChange={handleMaterialesChange}
                />
              </div>
            </div>
          </div>
          
          {/* Sección de Archivos Adjuntos */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out transform hover:shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <FiPaperclip className="mr-2 text-indigo-500" />
                Documentación
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Documentos relacionados con este proveedor
              </p>
            </div>
            
            <div className="p-6 bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm">
              {/* Previsualización del archivo si existe */}
              {(formData.archivo_url || (formData.archivo_adjunto && formData.nombre_archivo)) && (
                <div className="mb-4 border rounded-lg overflow-hidden bg-gray-50">
                  <div className="px-4 py-2 bg-gray-100 border-b flex justify-between items-center">
                    <span className="font-medium text-sm text-gray-700">
                      {formData.nombre_archivo}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    {/* Visualización según tipo de archivo */}
                    {formData.nombre_archivo?.toLowerCase().endsWith('.pdf') ? (
                      <div className="border border-gray-200 rounded-md overflow-hidden w-full h-96 mt-2">
                        {formData.archivo_url ? (
                          <iframe 
                            src={formData.archivo_url} 
                            className="w-full h-full"
                            title="Vista previa del PDF"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gray-50">
                            <div className="text-center p-4">
                              <FiFile className="mx-auto h-12 w-12 text-gray-400" />
                              <p className="mt-2 text-sm text-gray-500">
                                Cargando documento PDF...
                              </p>
                              <div className="mt-2 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700">
                                <svg className="animate-spin mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Cargando...
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : formData.archivo_url ? (
                      <div className="flex justify-center">
                        <img 
                          src={formData.archivo_url}
                          alt={formData.nombre_archivo || 'Vista previa'} 
                          className="max-h-64 max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-50">
                        <div className="text-center p-4">
                          <FiFile className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">
                            Cargando vista previa...
                          </p>
                          <div className="mt-2 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700">
                            <svg className="animate-spin mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Cargando...
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Botón para descargar archivo si existe */}
                    {formData.archivo_url && (
                      <div className="mt-3 text-center">
                        <a 
                          href={formData.archivo_url} 
                          download={formData.nombre_archivo || 'documento'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <FiDownload className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
                          Descargar archivo
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Sección para cargar archivo */}
              {!formData.archivo_adjunto && !formData.nombre_archivo && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adjuntar Documento
                  </label>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-24 w-24 border border-gray-200 rounded flex items-center justify-center mr-4">
                      <FiUpload className="h-6 w-6 text-gray-300" />
                    </div>
                    <div className="flex-1">
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500"
                        >
                          <span>Cargar archivo</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                        </label>
                        <p className="pl-1">o arrastrar y soltar</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF, PNG, JPG hasta 10MB</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Si ya hay un archivo cargado pero queremos cambiarlo */}
              {(formData.archivo_adjunto || formData.nombre_archivo) && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => document.getElementById('file-upload-change')?.click()}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FiUpload className="mr-1.5 h-4 w-4" />
                    Cambiar archivo
                  </button>
                  <input
                    id="file-upload-change"
                    name="file-upload-change"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
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
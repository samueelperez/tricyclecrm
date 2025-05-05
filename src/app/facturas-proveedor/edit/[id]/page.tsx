'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  FiSave, 
  FiArrowLeft, 
  FiCalendar, 
  FiUser, 
  FiDollarSign, 
  FiHash, 
  FiFileText, 
  FiUpload,
  FiX,
  FiPaperclip,
  FiDownload,
  FiEye
} from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import ProveedorSelector from '@/components/proveedor-selector';

interface Proveedor {
  id: string;
  nombre: string;
  id_fiscal?: string;
  email?: string;
  ciudad?: string;
  telefono?: string;
  sitio_web?: string;
}

interface FacturaProveedorFormData {
  fecha: Date;
  proveedor_id: number | null;
  numero_factura: string;
  descripcion: string;
  importe: number;
  nombre_archivo: string | null;
  archivo_adjunto: File | null;
}

export default function EditFacturaProveedorPage() {
  const router = useRouter();
  const { id } = useParams();
  const [formData, setFormData] = useState<FacturaProveedorFormData>({
    fecha: new Date(),
    proveedor_id: null,
    numero_factura: '',
    descripcion: '',
    importe: 0,
    nombre_archivo: null,
    archivo_adjunto: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proveedorNombre, setProveedorNombre] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Cargar datos de la factura
        const { data: facturaData, error: facturaError } = await supabase
          .from('facturas_proveedor')
          .select('*')
          .eq('id', id)
          .single();
          
        if (facturaError) {
          throw facturaError;
        }
        
        if (facturaData) {
          setFormData({
            fecha: new Date(facturaData.fecha),
            proveedor_id: facturaData.proveedor_id,
            numero_factura: facturaData.numero_factura,
            descripcion: facturaData.descripcion || '',
            importe: facturaData.importe,
            nombre_archivo: facturaData.nombre_archivo,
            archivo_adjunto: null
          });
          
          // Si hay un archivo adjunto, obtener la URL firmada
          if (facturaData.nombre_archivo) {
            // Determinar la extensión del archivo
            const fileExtension = facturaData.nombre_archivo.split('.').pop();
            const filePath = `facturas-proveedor/${id}.${fileExtension}`;
            
            const { data: fileData, error: fileError } = await supabase
              .storage
              .from('documentos')
              .createSignedUrl(filePath, 3600); // URL válida por 1 hora
              
            if (!fileError && fileData) {
              setFileUrl(fileData.signedUrl);
            }
          }
        }
        
        // Cargar proveedores
        const { data: proveedoresData, error: proveedoresError } = await supabase
          .from('proveedores')
          .select('id, nombre, id_fiscal, email, ciudad, telefono, sitio_web')
          .order('nombre', { ascending: true });
          
        if (proveedoresError) {
          throw proveedoresError;
        }
        
        setProveedores(proveedoresData || []);
        
        // Si hay un proveedor seleccionado, buscar su nombre
        if (facturaData?.proveedor_id) {
          const proveedorSeleccionado = proveedoresData?.find(p => p.id === facturaData.proveedor_id);
          if (proveedorSeleccionado) {
            setProveedorNombre(proveedorSeleccionado.nombre);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        toast.error('Error al cargar los datos de la factura');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es obligatoria';
    }
    
    if (!formData.proveedor_id) {
      newErrors.proveedor_id = 'Debe seleccionar un proveedor';
    }
    
    if (!formData.numero_factura) {
      newErrors.numero_factura = 'El número de factura es obligatorio';
    }
    
    if (formData.importe <= 0) {
      newErrors.importe = 'El importe debe ser mayor que cero';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'importe') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleDateChange = (date: Date | null) => {
    setFormData({
      ...formData,
      fecha: date || new Date()
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Verificar que sea un archivo PDF, Word o Excel
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.ms-excel'];
      
      if (!validTypes.includes(file.type)) {
        toast.error('Por favor, selecciona un archivo PDF, Word o Excel');
        return;
      }
      
      // Verificar tamaño máximo (10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB en bytes
      if (file.size > maxSize) {
        toast.error('El archivo es demasiado grande. El tamaño máximo es 10MB');
        return;
      }
      
      setFormData({
        ...formData,
        archivo_adjunto: file,
        nombre_archivo: file.name
      });
      
      // Revocar la URL del archivo anterior
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
        setFileUrl(null);
      }
    }
  };
  
  const handleClearFile = () => {
    setFormData({
      ...formData,
      archivo_adjunto: null,
      nombre_archivo: null
    });
    
    // Resetear el input de archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Revocar la URL del archivo
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }
    
    setSaving(true);
    
    try {
      const supabase = getSupabaseClient();
      
      // Actualizar la factura en la base de datos
      const { error: updateError } = await supabase
        .from('facturas_proveedor')
        .update({
          fecha: formData.fecha.toISOString(),
          proveedor_id: formData.proveedor_id,
          numero_factura: formData.numero_factura,
          monto: formData.importe,
          material: JSON.stringify({
            descripcion: formData.descripcion,
            nombre_archivo: formData.nombre_archivo
          })
        })
        .eq('id', id);
        
      if (updateError) {
        throw updateError;
      }
      
      // Si hay un nuevo archivo adjunto, subirlo a Supabase Storage
      if (formData.archivo_adjunto) {
        const fileExt = formData.archivo_adjunto.name.split('.').pop();
        const filePath = `facturas-proveedor/${id}.${fileExt}`;
        
        // Eliminar archivo anterior si existe
        await supabase
          .storage
          .from('documentos')
          .remove([filePath]);
        
        // Subir nuevo archivo
        const { error: uploadError } = await supabase
          .storage
          .from('documentos')
          .upload(filePath, formData.archivo_adjunto, { upsert: true });
          
        if (uploadError) {
          console.error('Error al subir el archivo:', uploadError);
          toast.error('Se actualizó la factura, pero hubo un error al subir el archivo');
        }
      } else if (!formData.nombre_archivo) {
        // Si se eliminó el archivo, eliminarlo del storage
        const { data: facturaData } = await supabase
          .from('facturas_proveedor')
          .select('nombre_archivo')
          .eq('id', id)
          .single();
          
        if (facturaData && facturaData.nombre_archivo) {
          const fileExt = facturaData.nombre_archivo.split('.').pop();
          const filePath = `facturas-proveedor/${id}.${fileExt}`;
          
          await supabase
            .storage
            .from('documentos')
            .remove([filePath]);
        }
      }
      
      toast.success('Factura de proveedor actualizada con éxito');
      router.push('/facturas-proveedor');
    } catch (err) {
      console.error('Error al actualizar la factura:', err);
      toast.error('Error al actualizar la factura de proveedor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
      return;
    }
    
    setSaving(true);
    
    try {
      const supabase = getSupabaseClient();
      
      // Eliminar archivo si existe
      if (formData.nombre_archivo) {
        const fileExt = formData.nombre_archivo.split('.').pop();
        const filePath = `facturas-proveedor/${id}.${fileExt}`;
        
        await supabase
          .storage
          .from('documentos')
          .remove([filePath]);
      }
      
      // Eliminar factura
      const { error } = await supabase
        .from('facturas_proveedor')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      toast.success('Factura de proveedor eliminada con éxito');
      router.push('/facturas-proveedor');
    } catch (err) {
      console.error('Error al eliminar la factura:', err);
      toast.error('Error al eliminar la factura de proveedor');
      setSaving(false);
    }
  };

  const handleProveedorChange = (nombreProveedor: string) => {
    setProveedorNombre(nombreProveedor);
    
    // Buscar el proveedor por su nombre y obtener el ID
    const proveedor = proveedores.find(p => p.nombre === nombreProveedor);
    
    // Actualizar el ID del proveedor en el formulario (convertir a número)
    setFormData(prev => ({
      ...prev,
      proveedor_id: proveedor ? Number(proveedor.id) : null
    }));
    
    // Limpiar error si existe
    if (errors.proveedor_id) {
      setErrors(prev => ({ ...prev, proveedor_id: '' }));
    }
  };

  const renderField = (label: string, name: string, type: string, value: string | number, placeholder: string, icon: React.ReactNode) => {
    return (
      <div className="mb-4">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
          <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={handleInputChange}
            className={`block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              errors[name] ? 'border-red-300' : ''
            }`}
            placeholder={placeholder}
          />
        </div>
        {errors[name] && (
          <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Factura de Proveedor</h1>
          <p className="mt-1 text-sm text-gray-500">Modifica la información de la factura</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/facturas-proveedor')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <FiArrowLeft className="mr-2 -ml-1" />
          Volver
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fecha */}
              <div className="mb-4">
                <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <DatePicker
                    selected={formData.fecha}
                    onChange={handleDateChange}
                    dateFormat="dd/MM/yyyy"
                    className={`block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.fecha ? 'border-red-300' : ''
                    }`}
                  />
                </div>
                {errors.fecha && (
                  <p className="mt-1 text-sm text-red-600">{errors.fecha}</p>
                )}
              </div>

              {/* Número de Factura */}
              {renderField(
                'Número de Factura',
                'numero_factura',
                'text',
                formData.numero_factura,
                'Ej: FACT-001',
                <FiHash className="h-5 w-5 text-gray-400" />
              )}

              {/* Proveedor */}
              <div className="mb-4">
                <label htmlFor="proveedor_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <ProveedorSelector
                    value={proveedorNombre}
                    proveedoresList={proveedores}
                    onChange={handleProveedorChange}
                    placeholder="Selecciona un proveedor"
                    className={errors.proveedor_id ? 'border-red-300' : ''}
                  />
                </div>
                {errors.proveedor_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.proveedor_id}</p>
                )}
              </div>

              {/* Importe */}
              <div className="mb-4">
                <label htmlFor="importe" className="block text-sm font-medium text-gray-700 mb-1">
                  Importe (€)
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiDollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="importe"
                    id="importe"
                    step="0.01"
                    min="0"
                    value={formData.importe}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.importe ? 'border-red-300' : ''
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.importe && (
                  <p className="mt-1 text-sm text-red-600">{errors.importe}</p>
                )}
              </div>
            </div>

            {/* Descripción */}
            <div className="mb-4">
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFileText className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  name="descripcion"
                  id="descripcion"
                  rows={3}
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Descripción de la factura..."
                ></textarea>
              </div>
            </div>

            {/* Documento Adjunto */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documento Adjunto
              </label>
              <div className="mt-1">
                {formData.nombre_archivo ? (
                  <div className="flex flex-col space-y-2 p-4 border border-gray-300 rounded-md w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FiPaperclip className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{formData.nombre_archivo}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Eliminar archivo"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {fileUrl && (
                      <div className="border border-gray-200 rounded-md overflow-hidden w-full h-96 mt-2">
                        {formData.nombre_archivo?.toLowerCase().endsWith('.pdf') ? (
                          <div className="w-full h-full">
                            <iframe 
                              src={fileUrl} 
                              className="w-full h-full"
                              title="Vista previa del archivo adjunto"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gray-50">
                            <div className="text-center p-4">
                              <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                              <p className="mt-2 text-sm text-gray-500">
                                Vista previa no disponible para este tipo de archivo
                              </p>
                              <a
                                href={fileUrl}
                                download={formData.nombre_archivo}
                                className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <FiDownload className="mr-2 -ml-1 h-5 w-5 text-gray-400" />
                                Descargar archivo
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      <FiUpload className="mr-2 -ml-1 h-5 w-5 text-gray-400" />
                      Adjuntar archivo
                    </button>
                    <p className="mt-1 text-xs text-gray-500">
                      Formatos permitidos: PDF, Word, Excel. Tamaño máximo: 10MB
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {saving ? 'Eliminando...' : 'Eliminar Factura'}
              </button>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/facturas-proveedor')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FiArrowLeft className="mr-2 -ml-1" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    saving ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
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
                      <FiSave className="mr-2 -ml-1" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
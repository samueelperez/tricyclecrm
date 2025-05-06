'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  FiSave, 
  FiPlusCircle, 
  FiArrowLeft, 
  FiCalendar, 
  FiUser, 
  FiDollarSign, 
  FiHash, 
  FiFileText, 
  FiUpload,
  FiX,
  FiPaperclip,
  FiEye,
  FiFile
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
  pdf_path?: string;
  archivo_adjunto?: File | null;
  nombre_archivo?: string | null;
}

export default function NewFacturaProveedorPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FacturaProveedorFormData>({
    fecha: new Date(),
    proveedor_id: null,
    numero_factura: '',
    descripcion: '',
    importe: 0,
    archivo_adjunto: null,
    nombre_archivo: null
  });
  const [loading, setLoading] = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proveedorNombre, setProveedorNombre] = useState('');

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('proveedores')
          .select('id, nombre, id_fiscal, email, ciudad, telefono, sitio_web')
          .order('nombre', { ascending: true });
          
        if (error) {
          throw error;
        }
        
        setProveedores(data || []);
      } catch (err) {
        console.error('Error al cargar proveedores:', err);
        toast.error('Error al cargar la lista de proveedores');
      }
    };
    
    fetchProveedores();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }
    
    setLoading(true);
    
    try {
      const supabase = getSupabaseClient();
      
      // Crear la factura en la base de datos
      const { data: facturaData, error: facturaError } = await supabase
        .from('facturas_proveedor')
        .insert({
          fecha: formData.fecha.toISOString(),
          proveedor_id: formData.proveedor_id,
          numero_factura: formData.numero_factura,
          descripcion: formData.descripcion,
          importe: formData.importe
        })
        .select('id')
        .single();
        
      if (facturaError) {
        throw facturaError;
      }
      
      const facturaId = facturaData.id;
      
      // Si hay un archivo adjunto, subirlo a Supabase Storage
      if (formData.archivo_adjunto) {
        const fileExt = formData.archivo_adjunto.name.split('.').pop();
        const filePath = `facturas-proveedor/${facturaId}.${fileExt}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('documentos')
          .upload(filePath, formData.archivo_adjunto);
          
        if (uploadError) {
          console.error('Error al subir el archivo:', uploadError);
          toast.error('Se creó la factura, pero hubo un error al subir el archivo');
        } else {
          // Actualizar la factura con el nombre del archivo
          await supabase
            .from('facturas_proveedor')
            .update({
              nombre_archivo: formData.archivo_adjunto.name
            })
            .eq('id', facturaId);
        }
      }
      
      toast.success('Factura de proveedor creada con éxito');
      router.push('/facturas-proveedor');
    } catch (err) {
      console.error('Error al crear la factura:', err);
      toast.error('Error al crear la factura de proveedor');
    } finally {
      setLoading(false);
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Factura de Proveedor</h1>
          <p className="mt-1 text-sm text-gray-500">Ingresa la información de la factura</p>
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

            {/* Adjuntar archivo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adjuntar Documento
              </label>
              <div className="mt-1">
                {formData.archivo_adjunto ? (
                  <div className="flex flex-col space-y-2 p-4 border border-gray-300 rounded-md w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FiPaperclip className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{formData.archivo_adjunto.name}</span>
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
                    
                    {formData.archivo_adjunto && (
                      <div className="border border-gray-200 rounded-md overflow-hidden w-full h-96 mt-2">
                        {formData.archivo_adjunto.type === 'application/pdf' ? (
                          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                            <div className="text-center p-4">
                              <FiFile className="mx-auto h-12 w-12 text-gray-400" />
                              <p className="mt-2 text-sm text-gray-500">
                                La vista previa estará disponible después de guardar
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gray-50">
                            <div className="text-center p-4">
                              <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                              <p className="mt-2 text-sm text-gray-500">
                                Vista previa no disponible para este tipo de archivo
                              </p>
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

            <div className="flex justify-end space-x-3">
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
                disabled={loading}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  loading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
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
                    <FiSave className="mr-2 -ml-1" />
                    Guardar Factura
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
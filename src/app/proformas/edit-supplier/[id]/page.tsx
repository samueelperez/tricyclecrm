'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiUpload, FiX } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import ProveedorSelector from '@/components/proveedor-selector';

interface SupplierProforma {
  id: string;
  dealNumber: string;
  date: string;
  supplierName: string;
  totalAmount: number;
  materialName: string;
  currency: string;
  attachment?: File | null;
  existingFileName?: string | null;
}

interface Proveedor {
  id: number;
  nombre: string;
  id_fiscal?: string;
  email?: string;
  ciudad?: string;
  telefono?: string;
  sitio_web?: string;
}

export default function EditSupplierProformaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [proforma, setProforma] = useState<SupplierProforma>({
    id: params.id,
    dealNumber: '',
    date: '',
    supplierName: '',
    totalAmount: 0,
    materialName: '',
    currency: 'EUR',
    attachment: null
  });
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Cargar datos reales desde Supabase
  useEffect(() => {
    const loadProforma = async () => {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        
        // Obtener la proforma de la base de datos
        const { data, error } = await supabase
          .from('proformas')
          .select('*')
          .eq('id', params.id)
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('No se encontró la proforma');
        
        // Extraer datos de las notas
        const proveedorMatch = data.notas?.match(/Proveedor: (.+?)(\n|$)/);
        const materialMatch = data.notas?.match(/Material: (.+?)(\n|$)/);
        const monedaMatch = data.notas?.match(/Moneda: (.+?)(\n|$)/);
        const attachmentMatch = data.notas?.match(/attachment_name: (.+?)(\n|$)/);
        
        // Crear objeto para mostrar nombre del archivo
        const attachmentName = attachmentMatch ? attachmentMatch[1] : null;
        let existingFileInfo = null;
        
        // Actualizar el estado
        setProforma({
          id: params.id,
          dealNumber: data.id_externo || '',
          date: data.fecha || new Date().toISOString().split('T')[0],
          supplierName: proveedorMatch ? proveedorMatch[1] : '',
          totalAmount: data.monto || 0,
          materialName: materialMatch ? materialMatch[1] : '',
          currency: monedaMatch ? monedaMatch[1] : 'EUR',
          attachment: null,
          existingFileName: attachmentName
        });
        
        // Intentar obtener URL del archivo si existe
        if (attachmentName) {
          try {
            // Obtener la extensión del archivo
            const fileExt = attachmentName.split('.').pop();
            // Construir la ruta del archivo en storage
            const filePath = `proformas/${params.id}.${fileExt}`;
            
            // Obtener URL firmada del archivo
            const { data: urlData } = await supabase
              .storage
              .from('documentos')
              .createSignedUrl(filePath, 60); // URL válida por 1 minuto (solo para verificar existencia)
              
            if (urlData) {
              console.log('Archivo existente encontrado:', attachmentName);
            }
          } catch (e) {
            console.warn('No se pudo verificar el archivo existente:', e);
          }
        }
        
      } catch (error) {
        console.error('Error loading proforma:', error);
        alert(`Error al cargar la proforma: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      } finally {
        setLoading(false);
      }
    };

    loadProforma();
  }, [params.id]);

  // Cargar datos de proveedores y proforma
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Cargar proveedores
        const { data: proveedoresData, error: proveedoresError } = await supabase
          .from('proveedores')
          .select('id, nombre, id_fiscal, email, ciudad, telefono, sitio_web')
          .order('nombre', { ascending: true });
        
        if (proveedoresError) {
          throw new Error(`Error al cargar proveedores: ${proveedoresError.message}`);
        }
        
        setProveedores(proveedoresData || []);

      } catch (error) {
        console.error('Error loading proveedores:', error);
        alert(`Error al cargar proveedores: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProforma(prev => ({
      ...prev,
      [name]: name === 'totalAmount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProforma(prev => ({
        ...prev,
        attachment: e.target.files![0]
      }));
    }
  };

  const handleClearAll = () => {
    setProforma({
      id: params.id,
      dealNumber: '',
      date: '',
      supplierName: '',
      totalAmount: 0,
      materialName: '',
      currency: 'EUR',
      attachment: null
    });
  };

  const handleProveedorChange = (nombreProveedor: string) => {
    setProforma(prev => ({
      ...prev,
      supplierName: nombreProveedor
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      // Validación básica
      if (!proforma.supplierName || !proforma.totalAmount) {
        alert('Por favor complete todos los campos obligatorios');
        setLoading(false);
        return;
      }
      
      const supabase = getSupabaseClient();
      
      // Preparar notas con la información básica
      let notasProforma = `Proveedor: ${proforma.supplierName}\nMaterial: ${proforma.materialName}\nMoneda: ${proforma.currency}`;
      
      // Mantener el nombre del archivo adjunto actual
      const nombreArchivo = proforma.attachment 
        ? proforma.attachment.name 
        : proforma.existingFileName;
        
      // Si hay un nombre de archivo, añadirlo a las notas
      if (nombreArchivo) {
        notasProforma += `\nattachment_name: ${nombreArchivo}`;
      }
      
      // Preparar datos para guardar en Supabase
      const proformaData = {
        id_externo: proforma.dealNumber,
        fecha: proforma.date,
        monto: proforma.totalAmount,
        notas: notasProforma
      };
      
      console.log('Actualizando proforma:', proformaData);
      
      // Actualizar la proforma en Supabase
      const { error } = await supabase
        .from('proformas')
        .update(proformaData)
        .eq('id', proforma.id);
      
      if (error) {
        throw new Error(`Error al guardar la proforma: ${error.message}`);
      }
      
      // Subir el archivo adjunto si existe
      if (proforma.attachment) {
        console.log('Subiendo archivo adjunto:', proforma.attachment.name);
        
        // Obtener la extensión del archivo
        const fileExt = proforma.attachment.name.split('.').pop();
        // Construir la ruta del archivo en storage
        const filePath = `proformas/${proforma.id}.${fileExt}`;
        
        // Eliminar archivo anterior si existe
        await supabase
          .storage
          .from('documentos')
          .remove([filePath]);
        
        // Subir nuevo archivo
        const { error: uploadError, data: uploadData } = await supabase
          .storage
          .from('documentos')
          .upload(filePath, proforma.attachment, { 
            upsert: true,
            contentType: proforma.attachment.type
          });
          
        if (uploadError) {
          console.error('Error al subir el archivo:', uploadError);
          alert('Se guardó la proforma, pero hubo un error al subir el archivo adjunto');
        } else {
          console.log('Archivo subido correctamente:', uploadData);
        }
      } else if (proforma.existingFileName === null) {
        // Si se eliminó el archivo (el archivo existente era no nulo y se cambió a nulo),
        // necesitamos buscar el nombre del archivo en la base de datos y eliminarlo
        const { data: existingProforma } = await supabase
          .from('proformas')
          .select('notas')
          .eq('id', proforma.id)
          .single();
          
        if (existingProforma && existingProforma.notas) {
          // Intentar extraer el nombre del archivo de las notas
          const match = existingProforma.notas.match(/attachment_name: (.*?)(?:\n|$)/);
          const nombreArchivo = match ? match[1] : null;
          
          if (nombreArchivo) {
            const fileExt = nombreArchivo.split('.').pop();
            const filePath = `proformas/${proforma.id}.${fileExt}`;
            
            await supabase
              .storage
              .from('documentos')
              .remove([filePath]);
              
            console.log('Archivo eliminado del storage:', filePath);
          }
        }
      }
      
      alert('Proforma actualizada correctamente');
      
      // Redirigir a la página de proformas con la pestaña de proveedores activa
      router.push('/proformas?tab=supplier');
    } catch (error) {
      console.error('Error saving proforma:', error);
      alert(`Error al guardar la proforma: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-100 rounded-lg w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link 
          href="/proformas?tab=supplier" 
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <FiArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Edit Supplier Proforma</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-700">Supplier Proforma Information</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deal Number */}
            <div>
              <label htmlFor="dealNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Deal Number
                <span className="ml-1 text-blue-500 text-xs font-normal">(editable)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="dealNumber"
                  name="dealNumber"
                  value={proforma.dealNumber}
                  onChange={handleInputChange}
                  placeholder="Ej: PRO-2023-001"
                  className="block w-full rounded-md border border-blue-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Supplier Proforma Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Proforma Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={proforma.date}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Supplier Name */}
            <div>
              <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Proveedor
              </label>
              <ProveedorSelector
                value={proforma.supplierName}
                proveedoresList={proveedores}
                onChange={handleProveedorChange}
                placeholder="Seleccionar proveedor"
                className=""
              />
            </div>

            {/* Total Amount */}
            <div>
              <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                total amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                id="totalAmount"
                name="totalAmount"
                value={proforma.totalAmount}
                onChange={handleInputChange}
                required
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Type Material Name */}
            <div>
              <label htmlFor="materialName" className="block text-sm font-medium text-gray-700 mb-1">
                Type Material Name
              </label>
              <input
                type="text"
                id="materialName"
                name="materialName"
                value={proforma.materialName}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <input
                type="text"
                id="currency"
                name="currency"
                value={proforma.currency}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Attachment */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adjunto
            </label>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-24 w-24 border border-gray-200 rounded flex items-center justify-center mr-4">
                {proforma.attachment ? (
                  <div className="text-center p-1">
                    <div className="text-xs text-gray-500 truncate w-full">
                      {proforma.attachment.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => setProforma(prev => ({ ...prev, attachment: null }))}
                      className="mt-2 text-red-500 hover:text-red-700"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                ) : proforma.existingFileName ? (
                  <div className="text-center p-1">
                    <div className="text-xs text-gray-500 truncate w-full">
                      {proforma.existingFileName}
                    </div>
                    <div className="mt-1 text-xs text-blue-500">
                      Archivo existente
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-300 text-sm">Sin archivo</span>
                )}
              </div>
              <div>
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                >
                  <FiUpload className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
                  {proforma.existingFileName ? 'Reemplazar archivo' : 'Subir archivo'}
                </label>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <p className="mt-1 text-xs text-gray-500">
                  PDF, JPEG, PNG, JPG, Máximo 4MB
                </p>
                {proforma.existingFileName && !proforma.attachment && (
                  <p className="mt-1 text-xs text-gray-600">
                    * El archivo existente se mantendrá a menos que suba uno nuevo
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <FiX className="mr-2 -ml-1 h-5 w-5" />
            Clear All
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
} 
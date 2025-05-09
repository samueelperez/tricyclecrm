'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiUpload, FiX, FiPackage, FiPlus } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import ProveedorSelector from '@/components/proveedor-selector';
import MaterialSelector from '@/components/material-selector';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Material {
  id: number;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
}

interface SupplierInvoice {
  id?: string;
  date: string;
  supplierName: string;
  totalAmount: number;
  materialName: string;
  currency: string;
  attachment?: File | null;
  fileName?: string;
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

export default function NewSupplierInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<SupplierInvoice>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    supplierName: '',
    totalAmount: 0,
    materialName: '',
    currency: 'EUR',
    attachment: null,
    fileName: ''
  });
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvoice(prev => ({
      ...prev,
      [name]: name === 'totalAmount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setInvoice(prev => ({
        ...prev,
        attachment: e.target.files![0],
        fileName: e.target.files![0].name
      }));
    }
  };

  const handleClearAttachment = () => {
    setInvoice(prev => ({
      ...prev,
      attachment: null,
      fileName: ''
    }));
  };

  const handleCancel = () => {
    router.push('/facturas?tab=supplier');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      // Validar campos obligatorios
      if (!invoice.supplierName || !invoice.date || !invoice.totalAmount || !invoice.materialName) {
        alert('Por favor, complete todos los campos obligatorios');
        setLoading(false);
        return;
      }
      
      // Validar que exista un archivo adjunto
      if (!invoice.attachment) {
        alert('Por favor, adjunte un documento de factura');
        setLoading(false);
        return;
      }
      
      // Obtener cliente de Supabase
      const supabase = getSupabaseClient();
      
      console.log('Procesando factura con archivo adjunto:', invoice.attachment.name);
      
      // Preparar datos para guardar en Supabase
      const facturaData = {
        fecha: invoice.date,
        monto: invoice.totalAmount,
        proveedor_nombre: invoice.supplierName,
        estado: 'pendiente',
        material: JSON.stringify({
          nombre_material: invoice.materialName,
          moneda: invoice.currency,
          notas: '',
          attachment_name: invoice.attachment.name
        }),
        numero_factura: invoice.id || undefined
      };
      
      console.log('Guardando factura de proveedor:', facturaData);
      
      // Insertar factura en Supabase
      const { data: facturaInsertada, error: facturaError } = await supabase
        .from('facturas_proveedor')
        .insert(facturaData)
        .select('id')
        .single();
      
      if (facturaError) {
        throw new Error(`Error al guardar la factura: ${facturaError.message}`);
      }
      
      console.log('Factura insertada correctamente con ID:', facturaInsertada.id);
      
      // Si hay un archivo adjunto, subirlo a Storage
      if (invoice.attachment) {
        // Obtener la extensión del archivo
        const fileExt = invoice.attachment.name.split('.').pop();
        // Construir la ruta del archivo en storage
        const filePath = `facturas-proveedor/${facturaInsertada.id}.${fileExt}`;
        
        console.log('Subiendo archivo a Supabase Storage:', filePath);
        
        // Subir archivo directamente al bucket "documentos"
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('documentos')
          .upload(filePath, invoice.attachment, { 
            contentType: invoice.attachment.type 
          });
        
        if (uploadError) {
          console.error('Error al subir el archivo adjunto:', uploadError);
          alert(`La factura se guardó correctamente, pero hubo un problema al subir el archivo adjunto: ${uploadError.message}`);
        } else {
          console.log('Archivo subido correctamente:', uploadData?.path);
          
          // Actualizar la URL del adjunto en la factura
          const { error: updateError } = await supabase
            .from('facturas_proveedor')
            .update({ attachment_url: filePath })
            .eq('id', facturaInsertada.id);
            
          if (updateError) {
            console.error('Error al actualizar la URL del adjunto:', updateError);
          }
          
          alert('Factura guardada correctamente con documento adjunto');
        }
      }
      
      // Redirigir a la página de facturas con la pestaña proveedor activa
      router.push('/facturas?tab=supplier');
    } catch (error) {
      console.error('Error al guardar la factura:', error);
      alert(`Error al guardar la factura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setLoading(false);
    }
  };

  // Cargar proveedores al inicializar
  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('proveedores')
          .select('id, nombre, id_fiscal, email, ciudad, telefono, sitio_web')
          .order('nombre', { ascending: true });
          
        if (error) {
          console.error('Error al cargar proveedores:', error);
          return;
        }
        
        setProveedores(data || []);
      } catch (error) {
        console.error('Error inesperado al cargar proveedores:', error);
      }
    };
    
    fetchProveedores();
  }, []);

  const handleProveedorChange = (nombreProveedor: string) => {
    setInvoice(prev => ({
      ...prev,
      supplierName: nombreProveedor
    }));
  };

  const handleMaterialChange = (value: string) => {
    setInvoice(prev => ({
      ...prev,
      materialName: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link 
          href="/facturas?tab=supplier" 
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <FiArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Nueva Factura de Proveedor</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-700">
            Información de Factura de Proveedor
          </h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
            {/* Número de factura */}
            <div>
              <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">
                Número de factura
              </label>
              <input
                type="text"
                id="id"
                name="id"
                value={invoice.id}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Introduzca número de factura"
              />
            </div>

            {/* Fecha de Factura */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Factura <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={invoice.date}
                  onChange={handleInputChange}
                  required
                  className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Nombre del Proveedor */}
            <div>
              <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Proveedor <span className="text-red-500">*</span>
              </label>
              <ProveedorSelector
                value={invoice.supplierName}
                proveedoresList={proveedores}
                onChange={handleProveedorChange}
                placeholder="Selecciona un proveedor"
                className=""
              />
            </div>

            {/* Importe Total */}
            <div>
              <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Importe Total <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                id="totalAmount"
                name="totalAmount"
                value={invoice.totalAmount}
                onChange={handleInputChange}
                required
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Nombre del Material */}
            <div>
              <label htmlFor="materialName" className="block text-sm font-medium text-gray-700 mb-1">
                Material <span className="text-red-500">*</span>
              </label>
              <MaterialSelector
                value={invoice.materialName}
                onChange={handleMaterialChange}
                placeholder="Buscar o añadir un material"
              />
            </div>

            {/* Moneda */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                id="currency"
                name="currency"
                value={invoice.currency}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="GBP">GBP - Libra Esterlina</option>
              </select>
            </div>
          </div>

          {/* Adjunto */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Documento de Factura</h3>
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adjuntar Factura <span className="text-red-500">*</span>
              </label>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-24 w-24 border border-gray-200 rounded flex items-center justify-center mr-4">
                  {invoice.attachment ? (
                    <div className="text-center p-1">
                      <div className="text-xs text-gray-500 truncate w-full">
                        {invoice.attachment.name}
                      </div>
                      <button
                        type="button"
                        onClick={handleClearAttachment}
                        className="mt-2 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                      >
                        <FiX className="mr-1" />
                        Eliminar
                      </button>
                    </div>
                  ) : (
                    <FiUpload className="h-6 w-6 text-gray-300" />
                  )}
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
                      />
                    </label>
                    <p className="pl-1">o arrastrar y soltar</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, PNG, JPG hasta 10MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Guardando...' : 'Guardar Factura'}
          </button>
        </div>
      </form>
    </div>
  );
} 
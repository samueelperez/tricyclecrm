'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiUpload, FiX } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';

interface MaterialData {
  nombre_material?: string;
  moneda?: string;
  attachment_name?: string;
  notas?: string;
}

interface SupplierInvoice {
  id: string;
  dealNumber: string;
  date: string;
  supplierName: string;
  totalAmount: number;
  materialName: string;
  currency: string;
  attachment?: File | null;
  fileName?: string;
}

export default function EditSupplierInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState<SupplierInvoice>({
    id: '',
    dealNumber: '',
    date: new Date().toISOString().split('T')[0],
    supplierName: '',
    totalAmount: 0,
    materialName: '',
    currency: 'EUR',
    attachment: null,
    fileName: ''
  });

  // Cargar datos de la factura
  useEffect(() => {
    const loadInvoice = async () => {
      setLoading(true);
      
      try {
        const supabase = getSupabaseClient();
        
        // Obtener la factura de la base de datos
        const { data, error: fetchError } = await supabase
          .from('facturas_proveedor')
          .select('*')
          .eq('id', id)
          .single();
        
        if (fetchError) throw fetchError;
        if (!data) throw new Error('No se encontró la factura');
        
        // Extraer información adicional del campo material si existe y es JSON válido
        let materialData: MaterialData = {};
        let nombreMaterial = '';
        let moneda = 'EUR';
        let attachmentName = '';
        
        try {
          if (data.material) {
            materialData = JSON.parse(data.material);
            nombreMaterial = materialData.nombre_material || '';
            moneda = materialData.moneda || 'EUR';
            attachmentName = materialData.attachment_name || '';
          }
        } catch (e) {
          // Si no es JSON válido, usar material como texto plano
          nombreMaterial = data.material || '';
        }
        
        // Transformar datos al formato esperado
        setInvoice({
          id: id,
          dealNumber: data.id_externo || '',
          date: data.fecha || new Date().toISOString().split('T')[0],
          supplierName: data.proveedor_nombre || '',
          totalAmount: data.monto || 0,
          materialName: nombreMaterial,
          currency: moneda,
          fileName: attachmentName
        });
      } catch (error) {
        console.error('Error al cargar la factura:', error);
        // En caso de error, inicializar con datos vacíos
        setInvoice({
          id: id,
          dealNumber: '',
          date: new Date().toISOString().split('T')[0],
          supplierName: '',
          totalAmount: 0,
          materialName: '',
          currency: 'EUR',
          fileName: ''
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadInvoice();
  }, [id]);

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
    
    setSaving(true);
    try {
      // Validar campos obligatorios
      if (!invoice.dealNumber || !invoice.supplierName || !invoice.date || !invoice.totalAmount || !invoice.materialName) {
        alert('Por favor, complete todos los campos obligatorios');
        setSaving(false);
        return;
      }
      
      const supabase = getSupabaseClient();
      
      // Preparar datos para actualizar en Supabase
      const facturaData = {
        id_externo: invoice.dealNumber,
        fecha: invoice.date,
        monto: invoice.totalAmount,
        proveedor_nombre: invoice.supplierName,
        estado: 'pendiente',
        material: JSON.stringify({
          nombre_material: invoice.materialName,
          moneda: invoice.currency,
          notas: '',
          attachment_name: invoice.attachment ? invoice.attachment.name : invoice.fileName
        })
      };
      
      console.log('Actualizando factura de proveedor:', facturaData);
      
      // Actualizar factura en Supabase
      const { error: updateError } = await supabase
        .from('facturas_proveedor')
        .update(facturaData)
        .eq('id', invoice.id);
      
      if (updateError) {
        throw new Error(`Error al actualizar la factura: ${updateError.message}`);
      }
      
      // Si hay un archivo adjunto nuevo, subirlo a Storage
      if (invoice.attachment) {
        const fileExt = invoice.attachment.name.split('.').pop();
        const fileName = `facturas-proveedor/${invoice.id}.${fileExt}`;
        
        // Primero eliminamos el archivo existente
        await supabase
          .storage
          .from('facturas')
          .remove([fileName]);
        
        // Subimos el nuevo archivo
        const { error: uploadError } = await supabase
          .storage
          .from('facturas')
          .upload(fileName, invoice.attachment);
        
        if (uploadError) {
          console.error('Error al subir el archivo adjunto:', uploadError);
          // No bloqueamos el flujo por un error en la subida del archivo
        }
      }
      
      alert('Factura actualizada correctamente');
      
      // Redirigir a la página de facturas con la pestaña proveedor activa
      router.push('/facturas?tab=supplier');
    } catch (error) {
      console.error('Error al guardar la factura:', error);
      alert(`Error al actualizar la factura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setSaving(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-800">Editar Factura de Proveedor</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-700">
              Información de Factura de Proveedor - {invoice.id}
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID de Factura (solo lectura) */}
              <div>
                <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">
                  ID de Factura
                </label>
                <input
                  type="text"
                  id="id"
                  name="id"
                  value={invoice.id}
                  readOnly
                  className="block w-full rounded-md border border-gray-300 bg-gray-50 py-2 px-3 text-gray-500 focus:outline-none sm:text-sm"
                />
              </div>

              {/* Número de Operación */}
              <div>
                <label htmlFor="dealNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Operación <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="dealNumber"
                    name="dealNumber"
                    value={invoice.dealNumber}
                    onChange={handleInputChange}
                    required
                    className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Selecciona un número de operación</option>
                    <option value="OP-2023-001">OP-2023-001</option>
                    <option value="OP-2023-010">OP-2023-010</option>
                    <option value="OP-2023-015">OP-2023-015</option>
                    <option value="OP-2023-022">OP-2023-022</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
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
                <div className="relative">
                  <select
                    id="supplierName"
                    name="supplierName"
                    value={invoice.supplierName}
                    onChange={handleInputChange}
                    required
                    className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Selecciona un proveedor</option>
                    <option value="Reciclajes Valencia S.L.">Reciclajes Valencia S.L.</option>
                    <option value="Plásticos Sevilla S.A.">Plásticos Sevilla S.A.</option>
                    <option value="Recuperaciones Madrid">Recuperaciones Madrid</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
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
                <input
                  type="text"
                  id="materialName"
                  name="materialName"
                  value={invoice.materialName}
                  onChange={handleInputChange}
                  required
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
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
                    {invoice.attachment || invoice.fileName ? (
                      <div className="text-center p-1">
                        <div className="text-xs text-gray-500 truncate w-full">
                          {invoice.attachment ? invoice.attachment.name : invoice.fileName}
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
                    {invoice.fileName && !invoice.attachment && (
                      <p className="mt-1 text-xs text-gray-500">
                        Documento actual: <span className="font-medium">{invoice.fileName}</span>
                      </p>
                    )}
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
              disabled={saving}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 
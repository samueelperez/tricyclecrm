'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { FiArrowLeft, FiEye, FiLoader } from 'react-icons/fi';

export default function FacturaProveedorPDFPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [factura, setFactura] = useState<any>(null);
  const [facturaNumero, setFacturaNumero] = useState<string>('');
  const [nombreProveedor, setNombreProveedor] = useState<string>('');
  
  // Cargar los datos de la factura
  useEffect(() => {
    const fetchFactura = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Obtener datos de la factura
        const { data: facturaData, error: facturaError } = await supabase
          .from('facturas_proveedor')
          .select('*')
          .eq('id', id)
          .single();
          
        if (facturaError) {
          throw facturaError;
        }
        
        if (facturaData) {
          // Obtener el nombre del proveedor
          let material = {};
          try {
            material = JSON.parse(facturaData.material || '{}');
          } catch (e) {
            console.error('Error al parsear material JSON:', e);
          }
          
          setFactura(facturaData);
          setFacturaNumero(facturaData.numero_factura || `FAC-${String(facturaData.id).padStart(4, '0')}`);
          
          // Obtener nombre del proveedor si existe
          if (facturaData.proveedor_id) {
            const { data: proveedorData } = await supabase
              .from('proveedores')
              .select('nombre')
              .eq('id', facturaData.proveedor_id)
              .single();
              
            if (proveedorData) {
              setNombreProveedor(proveedorData.nombre);
            } else {
              setNombreProveedor(facturaData.proveedor_nombre || 'Proveedor desconocido');
            }
          } else {
            setNombreProveedor(facturaData.proveedor_nombre || 'Proveedor desconocido');
          }
          
          setLoading(false);
        } else {
          setError('No se encontró la factura solicitada');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error al cargar la factura:', err);
        setError('Error al cargar los datos de la factura');
        setLoading(false);
      }
    };
    
    fetchFactura();
  }, [id]);
  
  // Función para mostrar el archivo adjunto
  const viewAttachment = async () => {
    setGenerating(true);
    
    try {
      // Verificar si existe un archivo PDF almacenado para esta factura
      const supabase = getSupabaseClient();
      
      let material;
      try {
        material = JSON.parse(factura.material || '{}');
      } catch (e) {
        console.error('Error al parsear material JSON:', e);
        material = {};
      }
      
      const nombreArchivo = material.nombre_archivo || factura.nombre_archivo;
      
      if (!nombreArchivo) {
        throw new Error('No hay archivo adjunto para esta factura');
      }
      
      const fileExtension = nombreArchivo.split('.').pop() || 'pdf';
      const filePath = `facturas-proveedor/${factura?.id}.${fileExtension}`;
      
      // Intentar obtener la URL firmada del archivo
      const { data: urlData, error: urlError } = await supabase
        .storage
        .from('documentos')
        .createSignedUrl(filePath, 60 * 60); // URL válida por 1 hora
      
      if (urlError) {
        // Si el archivo no existe en la carpeta específica, buscar en documentos
        const alternativeFilePath = `documentos/${factura?.id}.${fileExtension}`;
        const { data: altUrlData, error: altUrlError } = await supabase
          .storage
          .from('documentos')
          .createSignedUrl(alternativeFilePath, 60 * 60);
        
        if (altUrlError) {
          throw new Error(`No se encontró ningún archivo adjunto para esta factura`);
        }
        
        if (!altUrlData?.signedUrl) {
          throw new Error('No se pudo generar la URL del archivo adjunto');
        }
        
        // Abrir el archivo en una nueva pestaña
        window.open(altUrlData.signedUrl, '_blank');
        return;
      }
      
      if (!urlData?.signedUrl) {
        throw new Error('No se pudo generar la URL del archivo adjunto');
      }
      
      // Abrir el archivo en una nueva pestaña
      window.open(urlData.signedUrl, '_blank');
      
    } catch (err) {
      console.error('Error al acceder al archivo adjunto:', err);
      setError('No se encontró ningún archivo adjunto. Si desea visualizar un PDF, debe adjuntarlo primero en el formulario de la factura.');
    } finally {
      setGenerating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => router.push('/facturas-proveedor')}
                className="mr-3 text-gray-600 hover:text-gray-800"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-medium text-gray-800">
                Factura: {facturaNumero}
              </h1>
            </div>
            
            <button
              onClick={viewAttachment}
              disabled={generating}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <FiLoader className="animate-spin mr-2 h-5 w-5" />
                  Cargando PDF...
                </>
              ) : (
                <>
                  <FiEye className="mr-2 h-5 w-5" />
                  Ver PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Información de la Factura
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Detalles de la factura del proveedor
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Número de Factura
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {facturaNumero}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Proveedor
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {nombreProveedor}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Fecha
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(factura.fecha).toLocaleDateString('es-ES')}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Importe
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(factura.monto)}
                  </dd>
                </div>
                
                {factura.material && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Descripción
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {(() => {
                        try {
                          const materialData = JSON.parse(factura.material);
                          return materialData.descripcion || 'Sin descripción';
                        } catch (e) {
                          return 'Error al cargar la descripción';
                        }
                      })()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
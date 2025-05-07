'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiDownload, FiEye, FiFile, FiPrinter } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface FacturaProveedor {
  id: number;
  fecha: string;
  proveedor_id: number;
  proveedor_nombre?: string;
  numero_factura: string;
  descripcion: string;
  material: string;
  importe: number;
  created_at: string;
  nombre_archivo: string | null;
  ruta_archivo: string | null;
  url_adjunto: string | null;
}

export default function FacturaProveedorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [factura, setFactura] = useState<FacturaProveedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchFactura = async () => {
      try {
        const supabase = getSupabaseClient();
        const facturaId = parseInt(params.id);
        
        if (isNaN(facturaId)) {
          throw new Error('ID de factura inválido');
        }
        
        // Obtener los datos de la factura
        const { data, error } = await supabase
          .from('facturas_proveedor')
          .select(`
            *,
            proveedores:proveedor_id (
              nombre
            )
          `)
          .eq('id', facturaId)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('Factura no encontrada');
        }
        
        // Formatear los datos
        const facturaData: FacturaProveedor = {
          ...data,
          proveedor_nombre: data.proveedores?.nombre || 'Proveedor desconocido'
        };
        
        setFactura(facturaData);
        
        // Si hay un archivo adjunto o URL, obtener la URL firmada
        if (facturaData.ruta_archivo) {
          const { data: fileData, error: fileError } = await supabase
            .storage
            .from('documentos')
            .createSignedUrl(facturaData.ruta_archivo, 3600); // URL válida por 1 hora
            
          if (fileError) {
            console.error('Error al obtener URL firmada:', fileError);
          } else if (fileData) {
            setFileUrl(fileData.signedUrl);
          }
        } else if (facturaData.url_adjunto) {
          // Si hay una URL externa, usarla directamente
          setFileUrl(facturaData.url_adjunto);
        }
        
      } catch (err) {
        console.error('Error al cargar factura:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFactura();
  }, [params.id]);

  const formatDate = (dateString: string) => {
    // Asumimos que dateString es ISO string
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', options);
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  
  const handleDownloadFile = () => {
    if (!fileUrl) {
      toast.error('No hay archivo para descargar');
      return;
    }
    
    // Crear un enlace temporal para descargar el archivo
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = factura?.nombre_archivo || 'factura-proveedor.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-lg text-gray-600">Cargando factura...</span>
      </div>
    );
  }

  if (error || !factura) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error || 'No se pudo cargar la factura'}</p>
              </div>
              <div className="mt-4">
                <Link 
                  href="/facturas-proveedor"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiArrowLeft className="mr-2 -ml-1" />
                  Volver a facturas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link
              href="/facturas-proveedor"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiArrowLeft className="mr-2 -ml-1" />
              Volver
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Factura: {factura.numero_factura}
            </h1>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/facturas-proveedor/edit/${factura.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Editar
            </Link>
            <Link
              href={`/facturas-proveedor/${factura.id}/pdf`}
              target="_blank"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <FiPrinter className="mr-2 -ml-1" />
              Imprimir
            </Link>
          </div>
        </div>

        {/* Tarjeta de información principal */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h2 className="text-lg font-medium text-gray-900">Información de la Factura</h2>
          </div>
          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Proveedor</h3>
              <p className="text-base font-medium text-gray-900">{factura.proveedor_nombre}</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Número de Factura</h3>
              <p className="text-base font-medium text-gray-900">{factura.numero_factura}</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Fecha</h3>
              <p className="text-base text-gray-900">{formatDate(factura.fecha || factura.created_at)}</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Importe</h3>
              <p className="text-base text-gray-900">{formatCurrency(factura.importe)}</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Material</h3>
              <p className="text-base text-gray-900">{factura.material}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Descripción</h3>
              <p className="text-base text-gray-900">{factura.descripcion || 'Sin descripción'}</p>
            </div>
          </div>
        </div>

        {/* Archivo adjunto */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h2 className="text-lg font-medium text-gray-900">Documento Adjunto</h2>
          </div>
          <div className="px-6 py-5">
            {fileUrl ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiFile className="h-5 w-5 text-indigo-500 mr-2" />
                    <span className="text-gray-900 font-medium">
                      {factura.nombre_archivo || 'Documento adjunto'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleDownloadFile}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <FiDownload className="mr-1 h-4 w-4 text-gray-500" />
                      Descargar
                    </button>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 border border-indigo-500 shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <FiEye className="mr-1 h-4 w-4" />
                      Ver
                    </a>
                  </div>
                </div>
                
                {/* Vista previa del documento */}
                <div className="border border-gray-200 rounded-md overflow-hidden h-96">
                  {fileUrl.toLowerCase().endsWith('.pdf') ? (
                    <iframe 
                      src={fileUrl} 
                      className="w-full h-full" 
                      title="Vista previa del documento"
                    />
                  ) : fileUrl.toLowerCase().match(/\.(jpe?g|png|gif)$/i) ? (
                    <div className="flex items-center justify-center h-full">
                      <img 
                        src={fileUrl} 
                        alt="Vista previa del documento" 
                        className="max-h-full object-contain" 
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50">
                      <div className="text-center p-4">
                        <FiFile className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          Vista previa no disponible para este tipo de archivo
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <FiFile className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  No hay documento adjunto para esta factura
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
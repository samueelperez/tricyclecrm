'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiDownload, FiEye, FiFile, FiPrinter } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface FacturaLogistica {
  id: number;
  fecha: string;
  proveedor_id: number;
  proveedor: {
    nombre: string;
    direccion?: string;
    id_fiscal?: string;
    email?: string;
    telefono?: string;
  };
  numero_factura: string;
  descripcion: string;
  importe: number;
  estado: string;
  nombre_archivo: string | null;
  archivo_path: string | null;
}

export default function ViewFacturaLogisticaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [factura, setFactura] = useState<FacturaLogistica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchFactura = async () => {
      try {
        setLoading(true);
        const supabase = getSupabaseClient();
        
        const { data, error } = await supabase
          .from('facturas_logistica')
          .select('*, proveedor:proveedor_id(*)')
          .eq('id', params.id)
          .single();
          
        if (error) throw error;
        
        setFactura(data);
        
        // Si hay un archivo adjunto, obtener la URL firmada
        if (data.nombre_archivo) {
          const filePath = data.archivo_path || `facturas-logistica/${data.id}.${data.nombre_archivo.split('.').pop()}`;
          
          const { data: fileData, error: fileError } = await supabase
            .storage
            .from('documentos')
            .createSignedUrl(filePath, 3600); // URL válida por 1 hora
            
          if (!fileError && fileData) {
            setFileUrl(fileData.signedUrl);
          }
        }
      } catch (err) {
        console.error('Error cargando factura:', err);
        setError('Error al cargar la factura');
      } finally {
        setLoading(false);
      }
    };

    fetchFactura();
  }, [params.id]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !factura) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || 'No se pudo cargar la factura'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factura de Logística</h1>
          <p className="mt-1 text-sm text-gray-500">Detalles de la factura</p>
        </div>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => router.push('/facturas-logistica')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiArrowLeft className="mr-2 -ml-1" />
            Volver
          </button>
          {fileUrl && (
            <a
              href={fileUrl}
              download={factura.nombre_archivo || 'factura.pdf'}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FiDownload className="mr-2 -ml-1" />
              Descargar
            </a>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Información de la Factura
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Número de Factura</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{factura.numero_factura}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Proveedor</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{factura.proveedor.nombre}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Fecha</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(factura.fecha)}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Descripción</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{factura.descripcion || '-'}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Importe</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatCurrency(factura.importe)}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${factura.estado === 'pagada' ? 'bg-green-100 text-green-800' : 
                    factura.estado === 'vencida' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'}`}
                >
                  {factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)}
                </span>
              </dd>
            </div>
            {factura.nombre_archivo && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Documento Adjunto</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <FiFile className="mr-2" />
                    {factura.nombre_archivo}
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {fileUrl && (
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Vista Previa del Documento
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="h-[800px]">
              <iframe 
                src={fileUrl} 
                className="w-full h-full" 
                title="Vista previa del documento"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
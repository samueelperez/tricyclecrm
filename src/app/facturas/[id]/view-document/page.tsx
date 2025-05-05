'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiDownload, FiLoader } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';

export default function ViewDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [facturaInfo, setFacturaInfo] = useState<{
    numero: string;
    tipo: 'cliente' | 'proveedor';
    nombre_archivo: string | null;
  } | null>(null);

  useEffect(() => {
    const fetchDocumentInfo = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Intentar obtener primero de facturas_cliente
        const { data: clienteData, error: clienteError } = await supabase
          .from('facturas_cliente')
          .select('numero_factura, nombre_archivo')
          .eq('id', id)
          .single();
        
        if (clienteData) {
          setFacturaInfo({
            numero: clienteData.numero_factura || `Factura #${id}`,
            tipo: 'cliente',
            nombre_archivo: clienteData.nombre_archivo
          });
          
          // Obtener URL del documento
          const fileExtension = clienteData.nombre_archivo?.split('.').pop() || 'pdf';
          const filePath = `facturas-cliente/${id}.${fileExtension}`;
          
          const { data: urlData, error: urlError } = await supabase
            .storage
            .from('documentos')
            .createSignedUrl(filePath, 60 * 60); // URL válida por 1 hora
          
          if (urlError) {
            // Intentar ruta alternativa
            const altPath = `documentos/${id}.${fileExtension}`;
            const { data: altData, error: altError } = await supabase
              .storage
              .from('documentos')
              .createSignedUrl(altPath, 60 * 60);
            
            if (!altError && altData?.signedUrl) {
              setDocumentUrl(altData.signedUrl);
            } else {
              setError('No se encontró el documento adjunto para esta factura');
            }
          } else if (urlData?.signedUrl) {
            setDocumentUrl(urlData.signedUrl);
          }
          
          setLoading(false);
          return;
        }
        
        // Si no se encontró en ninguna tabla
        setError('No se encontró la factura solicitada');
        setLoading(false);
        
      } catch (err) {
        console.error('Error al cargar información del documento:', err);
        setError('Error al cargar el documento');
        setLoading(false);
      }
    };
    
    fetchDocumentInfo();
  }, [id]);
  
  const handleDownload = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin mb-4">
          <FiLoader className="h-8 w-8 text-indigo-600" />
        </div>
        <p className="text-gray-600">Cargando documento...</p>
      </div>
    );
  }
  
  if (error || !documentUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 w-full max-w-xl">
          <p className="text-red-700">{error || 'Error al cargar el documento'}</p>
        </div>
        <a href="/facturas" className="text-indigo-600 hover:text-indigo-800 flex items-center">
          <FiArrowLeft className="mr-2" />
          Volver a facturas
        </a>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      {/* Cabecera */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => router.back()}
                className="mr-3 text-gray-600 hover:text-gray-800"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-medium text-gray-800">
                {facturaInfo?.numero || 'Documento'}
              </h1>
            </div>
            
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiDownload className="mr-2 h-5 w-5" />
              Descargar
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenido */}
      <div className="flex-grow flex flex-col">
        <iframe 
          src={documentUrl} 
          className="w-full flex-grow"
          title={`Documento de factura ${facturaInfo?.numero}`}
        />
      </div>
    </div>
  );
} 
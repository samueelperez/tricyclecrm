'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FiArrowLeft, FiExternalLink, FiDownload, FiFile } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function ViewDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const tab = searchParams.get('tab') || 'customer';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const supabase = getSupabaseClient();
        
        // Obtener información de la proforma
        const { data: proforma, error: proformaError } = await supabase
          .from('proformas')
          .select('*')
          .eq('id', id)
          .single();
          
        if (proformaError) {
          throw new Error(`No se pudo obtener la información de la proforma: ${proformaError.message}`);
        }
        
        // Debug: imprimir información de la proforma
        console.log('Proforma obtenida:', { 
          id: proforma.id,
          id_externo: proforma.id_externo,
          notas: proforma.notas,
          campos: Object.keys(proforma),
          nombre_archivo: proforma.nombre_archivo
        });
        
        // Extraer nombre del archivo del campo material (que es un JSON stringificado)
        let nombreArchivo = null;
        if (proforma.notas) {
          // Intentar extraer el nombre del archivo desde las notas
          console.log('Buscando attachment_name en notas:', proforma.notas);
          const materialMatch = proforma.notas.match(/attachment_name: (.+?)($|\n)/);
          if (materialMatch && materialMatch[1]) {
            nombreArchivo = materialMatch[1].trim();
            console.log('Nombre de archivo encontrado en notas:', nombreArchivo);
            setFileName(nombreArchivo);
            
            // Determinar tipo de archivo
            const extension = nombreArchivo?.split('.').pop()?.toLowerCase();
            if (extension) {
              if (['pdf'].includes(extension)) {
                setFileType('pdf');
              } else if (['png', 'jpg', 'jpeg', 'gif'].includes(extension)) {
                setFileType('image');
              } else {
                setFileType('other');
              }
            }
          }
        }
        
        if (!nombreArchivo) {
          throw new Error('No hay documento adjunto para esta proforma');
        }
        
        // Crear una URL firmada para el archivo
        const fileExt = nombreArchivo.split('.').pop();
        const filePath = `proformas/${id}.${fileExt}`;
        
        const { data: urlData, error: urlError } = await supabase
          .storage
          .from('documentos')
          .createSignedUrl(filePath, 3600); // URL válida por 1 hora
          
        if (urlError) {
          throw new Error(`No se pudo acceder al documento: ${urlError.message}`);
        }
        
        setDocumentUrl(urlData?.signedUrl || null);
      } catch (err) {
        console.error('Error al obtener el documento:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocument();
  }, [id]);

  const handleBack = () => {
    router.push(`/proformas?tab=${tab}`);
  };

  const handleOpenExternal = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (documentUrl && fileName) {
      const a = document.createElement('a');
      a.href = documentUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={handleBack} 
          className="mr-4 text-blue-600 hover:text-blue-800"
        >
          <FiArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">
          Documento Adjunto - Proforma {id}
        </h1>
      </div>
      
      {loading && (
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner />
        </div>
      )}
      
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <p className="text-red-600 mt-2">
            Verifique que la proforma tenga un documento adjunto o intente nuevamente.
          </p>
          <button 
            onClick={handleBack} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Volver a Proformas
          </button>
        </div>
      )}
      
      {documentUrl && !loading && !error && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <div>
              <h2 className="font-medium text-lg">{fileName || 'Documento'}</h2>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={handleOpenExternal}
                className="flex items-center text-blue-600 hover:text-blue-800"
                title="Abrir en nueva ventana"
              >
                <FiExternalLink className="h-5 w-5" />
              </button>
              <button 
                onClick={handleDownload}
                className="flex items-center text-green-600 hover:text-green-800"
                title="Descargar"
              >
                <FiDownload className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="p-0 h-[70vh]">
            {fileType === 'pdf' ? (
              <iframe 
                src={`${documentUrl}#toolbar=0`} 
                className="w-full h-full" 
                title="Documento PDF"
              />
            ) : fileType === 'image' ? (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <img 
                  src={documentUrl} 
                  alt="Documento adjunto" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center p-4">
                  <FiFile className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Este tipo de archivo no se puede previsualizar aquí.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Descargar archivo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
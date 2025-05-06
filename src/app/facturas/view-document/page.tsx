'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiExternalLink, FiDownload } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function ViewDocumentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const tab = searchParams.get('tab') || 'client';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'image' | 'other'>('other');
  
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        
        // Validar que el ID existe y no es nulo
        if (!id) {
          console.error('ID de factura no proporcionado');
          setError('ID de factura no proporcionado. Verifique la URL.');
          setLoading(false);
          return;
        }
        
        const supabase = getSupabaseClient();
        
        console.log('Iniciando búsqueda de documento para factura ID:', id);
                
        // Obtener información de la factura
        const { data: factura, error: facturaError } = await supabase
          .from('facturas_proveedor')
          .select('*')
          .eq('id', id)
          .single();
          
        if (facturaError) {
          console.error('Error al obtener datos de factura:', facturaError);
          throw new Error(`No se pudo obtener la información de la factura: ${facturaError.message}`);
        }
        
        console.log('Factura encontrada:', factura.id);
        
        // Extraer nombre del archivo del campo material (que es un JSON stringificado)
        let nombreArchivo = null;
        if (factura.material) {
          try {
            console.log('Analizando campo material:', factura.material);
            
            const materialData = JSON.parse(factura.material);
            console.log('Material data parseado:', materialData);
            
            nombreArchivo = materialData.attachment_name;
            console.log('Nombre de archivo encontrado:', nombreArchivo);
            
            if (!nombreArchivo || nombreArchivo.trim() === '') {
              throw new Error('Esta factura no tiene un documento adjunto');
            }
            
            setFileName(nombreArchivo);
            
            // Determinar tipo de archivo
            const extension = nombreArchivo?.split('.').pop()?.toLowerCase();
            console.log('Extensión de archivo:', extension);
            
            if (extension) {
              if (['pdf'].includes(extension)) {
                setFileType('pdf');
              } else if (['png', 'jpg', 'jpeg', 'gif'].includes(extension)) {
                setFileType('image');
              } else {
                setFileType('other');
              }
            }
          } catch (e) {
            console.error('Error al parsear el campo material:', e);
            throw new Error('No se pudo obtener información del documento adjunto. Es posible que no exista un archivo adjunto para esta factura.');
          }
        } else {
          console.error('El campo material está vacío');
          throw new Error('Esta factura no tiene un documento adjunto');
        }
        
        if (!nombreArchivo) {
          throw new Error('No hay documento adjunto para esta factura');
        }
        
        // Crear una URL firmada para el archivo
        const fileExt = nombreArchivo.split('.').pop();
        let filePath = `facturas-proveedor/${id}.${fileExt}`;
        
        // Comprobar si existe attachment_url en la factura y usarlo si es necesario
        if (factura.attachment_url) {
          console.log('Campo attachment_url encontrado:', factura.attachment_url);
          filePath = factura.attachment_url;
        }
        
        console.log('Intentando obtener URL firmada para:', filePath);
        
        // Verificar si el archivo existe en el bucket antes de crear la URL firmada
        const pathParts = filePath.split('/');
        const folderPath = pathParts.slice(0, -1).join('/');
        const fileName = pathParts[pathParts.length - 1];
        
        console.log('Verificando existencia en carpeta:', folderPath);
        console.log('Buscando archivo:', fileName);
        
        const { data: fileList, error: fileError } = await supabase.storage
          .from('documentos')
          .list(folderPath);
        
        if (fileError) {
          console.error("Error al listar archivos:", fileError);
          setError("Error al buscar el documento");
          return;
        }
        
        console.log('Archivos encontrados en carpeta:', fileList.map(f => f.name));
        
        const fileExists = fileList.some(file => file.name === fileName);
        
        if (!fileExists) {
          console.error(`El archivo ${fileName} no existe en el bucket`);
          setError("El documento solicitado no existe");
          return;
        }
        
        // Generar URL firmada
        const { data: urlData, error: urlError } = await supabase.storage
          .from('documentos')
          .createSignedUrl(filePath, 3600); // URL válida por 1 hora
          
        if (urlError) {
          console.error('Error al crear URL firmada:', urlError);
          throw new Error(`No se pudo acceder al documento: ${urlError.message}`);
        }
        
        console.log('URL firmada obtenida correctamente');
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
    router.push(`/facturas?tab=${tab}`);
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
          Documento Adjunto - Factura {id}
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
            Verifique que la factura tenga un documento adjunto o intente nuevamente.
          </p>
          <button 
            onClick={handleBack} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Volver a Facturas
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
                  alt={fileName || 'Imagen adjunta'} 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <p className="text-gray-700 mb-4">
                  Este tipo de archivo no se puede previsualizar directamente.
                </p>
                <button
                  onClick={handleDownload}
                  className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  <FiDownload className="h-5 w-5 mr-2" />
                  Descargar Archivo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
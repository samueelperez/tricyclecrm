'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { 
  FiArrowLeft, 
  FiEdit,
  FiPackage, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiGlobe,
  FiFileText,
  FiCalendar,
  FiTrash2,
  FiCreditCard,
  FiHome,
  FiFile,
  FiDownload,
  FiPaperclip
} from 'react-icons/fi';

interface Proveedor {
  id: number;
  nombre: string;
  id_fiscal: string | null;
  direccion: string | null;
  codigo_postal: string | null;
  ciudad: string | null;
  pais: string | null;
  telefono: string | null;
  email: string | null;
  sitio_web: string | null;
  comentarios: string | null;
  contacto_nombre: string | null;
  contacto_telefono: string | null;
  contacto_email: string | null;
  created_at: string | null;
  nombre_archivo: string | null;
  ruta_archivo: string | null;
}

export default function ProveedorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [materiales, setMateriales] = useState<any[]>([]);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProveedor = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('proveedores')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setProveedor(data);
          
          // Obtener URL del archivo si existe
          if (data.nombre_archivo && data.ruta_archivo) {
            try {
              // Crear una URL firmada (válida por 1 hora) para el archivo
              const { data: fileData, error: fileError } = await supabase
                .storage
                .from('documentos')
                .createSignedUrl(data.ruta_archivo, 3600);
                
              if (fileError) {
                console.error('Error al obtener URL firmada:', fileError);
              } else if (fileData) {
                setFileUrl(fileData.signedUrl);
              }
            } catch (error) {
              console.error('Error al generar URL firmada:', error);
            }
          }
          
          // Obtener materiales
          const { data: materialesData, error: materialesError } = await supabase
            .from('proveedores_materiales')
            .select(`
              materiales (
                id,
                nombre,
                descripcion,
                precio_unidad,
                unidad
              )
            `)
            .eq('proveedor_id', params.id);
          
          if (materialesError) {
            console.error('Error al obtener materiales:', materialesError);
          } else if (materialesData) {
            const materialesMapped = materialesData.map(item => item.materiales);
            setMateriales(materialesMapped);
          }
        }
      } catch (err) {
        console.error('Error al cargar proveedor:', err);
        setError('Error al cargar los datos del proveedor');
      } finally {
        setLoading(false);
      }
    };

    fetchProveedor();
  }, [params.id]);

  // Añadir la sección de documentos adjuntos al componente
  const renderArchivoAdjunto = () => {
    if (!proveedor?.nombre_archivo) return null;
    
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 flex items-center">
          <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-indigo-100 rounded-full mr-4">
            <FiPaperclip className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Documento Adjunto</h3>
            <p className="max-w-2xl text-sm text-gray-500">
              {proveedor.nombre_archivo}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="flex flex-col items-center justify-center">
            {proveedor.nombre_archivo?.toLowerCase().endsWith('.pdf') ? (
              <div className="w-full flex flex-col items-center">
                <div className="border border-gray-200 rounded-md overflow-hidden w-full h-96 mb-3">
                  <iframe 
                    src={fileUrl || ''} 
                    className="w-full h-full"
                    title="Vista previa del PDF"
                  />
                </div>
                <a 
                  href={fileUrl || '#'}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiDownload className="mr-2 -ml-1 h-5 w-5" /> Ver en nueva pestaña
                </a>
              </div>
            ) : proveedor.nombre_archivo?.toLowerCase().match(/\.(jpe?g|png|gif)$/i) ? (
              <div className="flex flex-col items-center">
                <div className="border rounded-md p-2 mb-3">
                  <img 
                    src={fileUrl || '#'}
                    alt={proveedor.nombre_archivo} 
                    className="max-h-64 max-w-full object-contain"
                  />
                </div>
                <a 
                  href={fileUrl || '#'}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiDownload className="mr-2 -ml-1 h-5 w-5" /> Ver en tamaño completo
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <FiFile className="h-16 w-16 text-gray-500 mb-2" />
                <p className="text-sm text-gray-600 mb-3">Archivo adjunto</p>
                <a 
                  href={fileUrl || '#'}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiDownload className="mr-2 -ml-1 h-5 w-5" /> Descargar archivo
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-lg text-gray-500">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !proveedor) {
    return (
      <div className="bg-white min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-red-500 mb-4">{error || 'Proveedor no encontrado'}</p>
            <Link
              href="/proveedores"
              className="flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <FiArrowLeft className="mr-2" /> Volver a proveedores
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link
              href="/proveedores"
              className="text-indigo-600 hover:text-indigo-800 flex items-center mr-4"
            >
              <FiArrowLeft className="mr-2" /> Volver
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Detalles del Proveedor</h1>
          </div>

          <Link
            href={`/proveedores/edit/${proveedor.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiEdit className="mr-2 -ml-1 h-5 w-5" /> Editar Proveedor
          </Link>
        </div>

        {/* Tarjeta de detalles */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 flex items-center">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-indigo-100 rounded-full mr-4">
              <FiPackage className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">{proveedor.nombre}</h3>
              <p className="max-w-2xl text-sm text-gray-500">
                {proveedor.id_fiscal ? `ID Fiscal: ${proveedor.id_fiscal}` : 'Sin ID fiscal'}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
              {/* Información de contacto */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 flex items-center">
                  <FiUser className="mr-2 text-indigo-500" /> Información de Contacto
                </h4>

                <div className="pl-6 space-y-2">
                  {proveedor.email && (
                    <div className="flex items-start">
                      <FiMail className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email</p>
                        <a 
                          href={`mailto:${proveedor.email}`}
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          {proveedor.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {proveedor.telefono && (
                    <div className="flex items-start">
                      <FiPhone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Teléfono</p>
                        <p className="text-sm text-gray-900">{proveedor.telefono}</p>
                      </div>
                    </div>
                  )}

                  {proveedor.sitio_web && (
                    <div className="flex items-start">
                      <FiGlobe className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Sitio Web</p>
                        <a 
                          href={proveedor.sitio_web.startsWith('http') ? proveedor.sitio_web : `https://${proveedor.sitio_web}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          {proveedor.sitio_web}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {(proveedor.contacto_nombre || proveedor.contacto_email || proveedor.contacto_telefono) && (
                  <>
                    <h4 className="text-md font-medium text-gray-900 flex items-center mt-6">
                      <FiUser className="mr-2 text-indigo-500" /> Persona de Contacto
                    </h4>
                    <div className="pl-6 space-y-2">
                      {proveedor.contacto_nombre && (
                        <div className="flex items-start">
                          <FiUser className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Nombre</p>
                            <p className="text-sm text-gray-900">{proveedor.contacto_nombre}</p>
                          </div>
                        </div>
                      )}

                      {proveedor.contacto_email && (
                        <div className="flex items-start">
                          <FiMail className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Email</p>
                            <a 
                              href={`mailto:${proveedor.contacto_email}`}
                              className="text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              {proveedor.contacto_email}
                            </a>
                          </div>
                        </div>
                      )}

                      {proveedor.contacto_telefono && (
                        <div className="flex items-start">
                          <FiPhone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Teléfono</p>
                            <p className="text-sm text-gray-900">{proveedor.contacto_telefono}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Dirección y datos adicionales */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 flex items-center">
                  <FiMapPin className="mr-2 text-indigo-500" /> Dirección
                </h4>

                <div className="pl-6 space-y-2">
                  {proveedor.direccion && (
                    <div className="flex items-start">
                      <FiMapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Dirección</p>
                        <p className="text-sm text-gray-900">{proveedor.direccion}</p>
                      </div>
                    </div>
                  )}

                  {(proveedor.ciudad || proveedor.codigo_postal) && (
                    <div className="flex items-start">
                      <FiMapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5 opacity-0" />
                      <div>
                        <p className="text-sm text-gray-900">
                          {proveedor.ciudad && proveedor.codigo_postal 
                            ? `${proveedor.ciudad}, ${proveedor.codigo_postal}`
                            : proveedor.ciudad || proveedor.codigo_postal}
                        </p>
                      </div>
                    </div>
                  )}

                  {proveedor.pais && (
                    <div className="flex items-start">
                      <FiGlobe className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">País</p>
                        <p className="text-sm text-gray-900">{proveedor.pais}</p>
                      </div>
                    </div>
                  )}
                </div>

                {proveedor.comentarios && (
                  <>
                    <h4 className="text-md font-medium text-gray-900 flex items-center mt-6">
                      <FiFileText className="mr-2 text-indigo-500" /> Comentarios
                    </h4>
                    <div className="pl-6">
                      <p className="text-sm text-gray-700 whitespace-pre-line">{proveedor.comentarios}</p>
                    </div>
                  </>
                )}

                {proveedor.created_at && (
                  <div className="pt-4 mt-6 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-500">
                      <FiCalendar className="mr-1.5 h-4 w-4 text-gray-400" />
                      Registrado el: {new Date(proveedor.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mostrar documento adjunto si existe */}
        {renderArchivoAdjunto()}

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-6">
          <Link
            href="/proveedores"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiArrowLeft className="mr-2 -ml-1 h-5 w-5" /> Volver a la lista
          </Link>
        </div>
      </div>
    </div>
  );
} 
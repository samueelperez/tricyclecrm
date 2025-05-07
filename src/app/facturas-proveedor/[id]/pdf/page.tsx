'use client';

import { useState, useRef, forwardRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiLoader, FiDownload, FiEye } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Definir la interfaz para el tipo de factura proveedor
interface FacturaProveedor {
  id: number;
  numero_factura?: string;
  fecha_emision?: string;
  created_at?: string;
  descripcion?: string;
  importe?: number;
  proveedor_id?: number;
  metodo_pago?: string;
  notas?: string;
  nombre_archivo?: string;
  ruta_archivo?: string;
  proveedor?: {
    id?: number;
    nombre?: string;
    direccion?: string;
    ciudad?: string;
    codigo_postal?: string;
    pais?: string;
    id_fiscal?: string;
  };
  cliente?: {
    id?: number;
    nombre?: string;
    direccion?: string;
    id_fiscal?: string;
  };
  cliente_direccion?: string;
  cliente_id_fiscal?: string;
}

export default function FacturaProveedorPDFPage() {
  const { id } = useParams();
  const printRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [factura, setFactura] = useState<FacturaProveedor | null>(null);
  const [facturaNumero, setFacturaNumero] = useState('');
  const [nombreDestinatario, setNombreDestinatario] = useState('');
  const [multiClientes, setMultiClientes] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchFactura = async () => {
      try {
        setLoading(true);
        const supabase = getSupabaseClient();
        
        const { data, error } = await supabase
          .from('facturas_proveedor')
          .select('*, proveedor:proveedor_id(*)')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        if (!data) {
          throw new Error('Factura no encontrada');
        }
        
        setFactura(data);
        setFacturaNumero(data.numero_factura || `FP-${data.id}`);
        setNombreDestinatario(data.proveedor?.nombre || 'Proveedor');
        setMultiClientes(false);
      } catch (err) {
        console.error('Error al cargar la factura:', err);
        setError(
          err instanceof Error 
            ? err.message 
            : 'Error al cargar la factura'
        );
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchFactura();
    }
  }, [id]);

  // Función para generar el PDF
  const generatePDF = async () => {
    setGenerating(true);
    
    try {
      // Verificar si existe un archivo PDF almacenado para esta factura
      const supabase = getSupabaseClient();
      const fileExtension = factura?.nombre_archivo?.split('.').pop() || 'pdf';
      const filePath = `facturas-proveedor/${factura?.id}.${fileExtension}`;
      
      // Intentar obtener la URL firmada del archivo
      const { data: urlData, error: urlError } = await supabase
        .storage
        .from('documentos')
        .createSignedUrl(filePath, 60 * 60); // URL válida por 1 hora
      
      if (urlError) {
        // Si el archivo no existe en la carpeta facturas-proveedor, buscar en documentos
        const alternativeFilePath = `documentos/facturas-proveedor/${factura?.id}.${fileExtension}`;
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
      setError(
        err instanceof Error 
          ? err.message 
          : 'No se encontró ningún archivo adjunto. Si desea visualizar un PDF, debe adjuntarlo primero en el formulario de la factura.'
      );
    } finally {
      setGenerating(false);
    }
  };

  // Función para descargar el PDF
  const handleDownloadPDF = async () => {
    if (!factura) return;
    
    setGenerating(true);
    
    try {
      // Preparar fecha para la visualización
      if (factura.fecha_emision && isNaN(new Date(factura.fecha_emision).getTime())) {
        console.warn('Fecha inválida en factura, intentando corregir:', factura.fecha_emision);
        
        // Intentar corregir formato de fecha si está mal
        if (typeof factura.fecha_emision === 'string') {
          const parts = factura.fecha_emision.split(/[-/]/);
          if (parts.length === 3) {
            let correctedDate;
            
            // Probar diferentes formatos comunes
            if (parts[0].length === 4) {
              // Formato YYYY-MM-DD
              correctedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else if (parts[2].length === 4) {
              // Formato DD/MM/YYYY
              correctedDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
            
            if (correctedDate && !isNaN(correctedDate.getTime())) {
              console.log('Fecha corregida:', correctedDate);
              factura.fecha_emision = correctedDate.toISOString().split('T')[0];
            }
          }
        }
      }
      
      // Generar el PDF usando html2canvas y jsPDF
      if (!printRef.current) {
        setError("Error al acceder al documento");
        return;
      }
      
      // Convertir el componente a imagen
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // Mayor calidad
        useCORS: true, // Para imágenes externas
        logging: false
      });
      
      // Calcular dimensiones A4
      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Crear PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Añadir imagen al PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Generar nombre del archivo basado en el número de factura o ID
      const fileName = `factura-proveedor-${facturaNumero || id}.pdf`;
      
      // Descargar el PDF directamente
      pdf.save(fileName);
      
    } catch (e) {
      console.error("Error al descargar PDF:", e);
      setError(
        e instanceof Error 
          ? e.message 
          : "Error al generar el PDF para descarga"
      );
    } finally {
      setGenerating(false);
    }
  };

  // Formatear la fecha
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    
    try {
      // Comprobar si dateStr es una cadena JSON date o formato ISO
      if (typeof dateStr === 'string') {
        // Intentar convertir a fecha
        const date = new Date(dateStr);
        
        // Verificar si la fecha es válida
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).replace(/\//g, '/');
        }
        
        // Si llegamos aquí, intentar parsear el formato manualmente
        const isoPattern = /^(\d{4})-(\d{2})-(\d{2})T?/;
        const isoMatch = dateStr.match(isoPattern);
        
        if (isoMatch) {
          const [_, year, month, day] = isoMatch;
          return `${day}/${month}/${year}`;
        }
        
        // Intentar con formato DD/MM/YYYY o DD-MM-YYYY
        const datePattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
        const dateMatch = dateStr.match(datePattern);
        
        if (dateMatch) {
          const [_, day, month, year] = dateMatch;
          return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        }
      }
      
      console.error('Formato de fecha no reconocido:', dateStr);
      return 'N/A';
    } catch (e) {
      console.error('Error al formatear fecha:', e, typeof dateStr);
      return 'N/A';
    }
  };

  // Obtener dirección del destinatario
  const getDireccionDestinatario = (factura: FacturaProveedor) => {
    // Para facturas de proveedor, intentamos obtener la dirección de varias fuentes posibles
    const direccion = factura.cliente?.direccion || 
           factura.cliente_direccion || 
           (factura.cliente && typeof factura.cliente === 'object' ? factura.cliente.direccion : '') || 
           '';
    
    console.log('Dirección obtenida:', { 
      cliente_objeto: factura.cliente,
      cliente_direccion: factura.cliente_direccion,
      direccion_final: direccion
    });
    
    return direccion;
  };

  // Obtener Tax ID del destinatario
  const getTaxIDDestinatario = (factura: FacturaProveedor) => {
    // Para facturas de proveedor, intentamos obtener el ID fiscal de varias fuentes posibles
    const idFiscal = factura.id_fiscal || 
           factura.cliente_id_fiscal || 
           (factura.cliente && typeof factura.cliente === 'object' ? factura.cliente.id_fiscal : '') || 
           '';
    
    console.log('ID Fiscal obtenido:', {
      id_fiscal: factura.id_fiscal,
      cliente_id_fiscal: factura.cliente_id_fiscal,
      id_fiscal_final: idFiscal
    });
    
    return idFiscal;
  };

  // Función para generar el componente de vista previa del PDF
  const FacturaPrintView = forwardRef(({ factura, numeroFactura, nombreDestinatario, multiClientes }, ref) => {
    return (
      <div ref={ref} className="p-10 bg-white">
        {/* Cabecera - Logos */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          {/* Logo empresa */}
          <div>
            <div style={{ fontSize: '24pt', fontWeight: 'bold', color: '#333' }}>
              TRICYCLE
            </div>
            <div style={{ fontSize: '10pt', color: '#666', marginTop: '5px' }}>
              C.I.F: B67586172<br />
              C/ ARIBAU 114, 3º 2ª<br />
              08036 - BARCELONA, ESPAÑA<br />
              Teléfono: +34 635371824<br />
            </div>
          </div>
          
          {/* Nombre del documento */}
          <div>
            <div style={{ fontSize: '20pt', fontWeight: 'bold', textAlign: 'right', color: '#333' }}>
              FACTURA PROVEEDOR
            </div>
          </div>
        </div>
        
        {/* Número de factura y fecha */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <div style={{ fontSize: '18pt', fontWeight: 'bold' }}>
            {numeroFactura}
          </div>
          <div>
            <span style={{ fontWeight: 'normal' }}>Date </span> 
            {(() => {
              // Intentar obtener fecha válida
              let fechaFormateada = 'N/A';
              try {
                // Primero probar con created_at
                if (factura.created_at) {
                  const fecha = new Date(factura.created_at);
                  if (!isNaN(fecha.getTime())) {
                    fechaFormateada = fecha.toLocaleDateString('en-GB');
                    return fechaFormateada;
                  }
                }
                
                // Luego con fecha_emision
                if (factura.fecha_emision) {
                  const fecha = new Date(factura.fecha_emision);
                  if (!isNaN(fecha.getTime())) {
                    fechaFormateada = fecha.toLocaleDateString('en-GB');
                    return fechaFormateada;
                  }
                }
                
                // Si ninguna funciona, usar formatDate
                return formatDate(factura.created_at || factura.fecha_emision);
              } catch (e) {
                console.error('Error al formatear fecha:', e);
                return new Date().toLocaleDateString('en-GB');
              }
            })()}
          </div>
        </div>
        
        {/* Información del proveedor */}
        <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '12pt' }}>Proveedor:</div>
          <div style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '10px' }}>{factura.proveedor?.nombre || 'Proveedor no especificado'}</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '10pt' }}>
            {/* Dirección */}
            {factura.proveedor?.direccion && (
              <div>{factura.proveedor.direccion}</div>
            )}
            
            {/* Ciudad, CP, país */}
            {(factura.proveedor?.ciudad || factura.proveedor?.codigo_postal || factura.proveedor?.pais) && (
              <div>
                {[
                  factura.proveedor.ciudad,
                  factura.proveedor.codigo_postal,
                  factura.proveedor.pais
                ].filter(Boolean).join(', ')}
              </div>
            )}
            
            {/* ID Fiscal */}
            {factura.proveedor?.id_fiscal && (
              <div>CIF/NIF: {factura.proveedor.id_fiscal}</div>
            )}
          </div>
        </div>
        
        {/* Información del destinatario (TRICYCLE) */}
        <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '12pt' }}>Destinatario:</div>
          <div style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '10px' }}>TRICYCLE INTERIORWORKS S.L.</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '10pt' }}>
            <div>C/ ARIBAU 114, 3º 2ª</div>
            <div>08036 - BARCELONA, ESPAÑA</div>
            <div>CIF/NIF: B67586172</div>
          </div>
        </div>
        
        {/* Descripción */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '12pt' }}>Descripción:</div>
          <div style={{ fontSize: '11pt', marginBottom: '10px', whiteSpace: 'pre-wrap' }}>
            {factura.descripcion || 'Sin descripción'}
          </div>
        </div>
        
        {/* Datos de pago */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          {/* Método de pago */}
          <div style={{ width: '48%' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '12pt' }}>Método de pago:</div>
            <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
              {factura.metodo_pago || 'No especificado'}
            </div>
          </div>
          
          {/* Total */}
          <div style={{ width: '48%' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '12pt' }}>Importe:</div>
            <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>TOTAL:</span>
              <span>{factura.importe ? `${parseFloat(factura.importe).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '-'}</span>
            </div>
          </div>
        </div>
        
        {/* Notas */}
        {factura.notas && (
          <div style={{ marginBottom: '30px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '12pt' }}>Notas:</div>
            <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '10pt', whiteSpace: 'pre-wrap' }}>
              {factura.notas}
            </div>
          </div>
        )}
      </div>
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin mb-4">
          <FiLoader className="h-8 w-8 text-indigo-600" />
        </div>
        <p className="text-gray-600">Cargando factura...</p>
      </div>
    );
  }

  if (error || !factura) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 w-full max-w-xl">
          <p className="text-red-700">{error || 'Error al cargar la factura'}</p>
        </div>
        <a href="/facturas-proveedor" className="text-indigo-600 hover:text-indigo-800">
          Volver a facturas
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 p-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Cabecera */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center">
                <a 
                  href="/facturas-proveedor" 
                  className="mr-3 text-gray-600 hover:text-gray-800"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </a>
                <h1 className="text-xl font-medium text-gray-800">Ver PDF Factura Proveedor</h1>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={generating}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <FiLoader className="animate-spin mr-2 h-5 w-5" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FiDownload className="mr-2 h-5 w-5" />
                      Descargar PDF
                    </>
                  )}
                </button>
              
                <button
                  onClick={generatePDF}
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
        </div>
        
        {/* Vista previa */}
        <div className="bg-white shadow-xl mb-8 mx-auto" style={{ maxWidth: '210mm' }}>
          <FacturaPrintView 
            factura={factura} 
            numeroFactura={facturaNumero} 
            nombreDestinatario={nombreDestinatario}
            multiClientes={multiClientes}
            ref={printRef} 
          />
        </div>
      </div>
    </div>
  );
}
 
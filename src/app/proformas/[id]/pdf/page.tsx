'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiArrowLeft, 
  FiDownload, 
  FiPrinter,
  FiX,
  FiAlertTriangle,
  FiFileText
} from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Interfaces para los datos
interface ProformaProducto {
  id?: number;
  descripcion: string;
  cantidad: number;
  peso: number | null;
  precio_unitario: number;
  tipo_empaque: string | null;
  valor_total: number | null;
}

interface Proforma {
  id: number;
  id_externo: string;
  numero?: string;
  fecha: string;
  monto: number;
  cliente_id: number | null;
  cliente?: {
    nombre: string;
    id_fiscal: string | null;
  };
  negocio_id: number | null;
  origen: string | null;
  puerto: string | null;
  id_fiscal: string | null;
  cuenta_bancaria: string | null;
  terminos_pago: string | null;
  terminos_entrega: string | null;
  notas: string | null;
  cantidad_contenedores: number | null;
  peso_total: number | null;
  monto_total?: number;
  productos?: ProformaProducto[];
}

// Componente para la vista de impresión de proforma
const ProformaPrintView = forwardRef<HTMLDivElement, { proforma: Proforma }>(
  ({ proforma }, ref) => {
    // Extraer fecha formateada
    const formattedDate = new Date(proforma.fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Calcular el total si no está disponible
    const montoTotal = proforma.monto_total || proforma.monto || 0;

    // Determinar si es proforma para cliente o proveedor basado en el contenido del campo notas
    const esProveedor = proforma.notas?.includes('Proveedor:') || false;
    const tipoProforma = esProveedor ? 'PROFORMA PROVEEDOR' : 'PROFORMA CLIENTE';

    return (
      <div ref={ref} className="bg-white p-8 max-w-[21cm] mx-auto shadow-none" style={{ display: 'none' }}>
        {/* Cabecera con logo */}
        <div className="mb-8 flex justify-between items-start border-b pb-6">
          <div className="flex items-center">
            <img 
              src="/images/logo.png" 
              alt="Logo TriCycle CRM" 
              className="h-20 mr-4" 
              style={{ objectFit: 'contain' }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">TRICYCLE CRM</h1>
              <p className="text-gray-600">C/ Principal 123</p>
              <p className="text-gray-600">28001 Madrid, España</p>
              <p className="text-gray-600">CIF: B12345678</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-800 mb-2">{tipoProforma}</div>
            <table className="ml-auto text-right">
              <tbody>
                <tr>
                  <td className="pr-2 text-gray-600 font-medium">Número:</td>
                  <td className="font-bold">{proforma.numero || proforma.id_externo}</td>
                </tr>
                <tr>
                  <td className="pr-2 text-gray-600 font-medium">Fecha:</td>
                  <td>{formattedDate}</td>
                </tr>
                {proforma.origen && (
                  <tr>
                    <td className="pr-2 text-gray-600 font-medium">Origen:</td>
                    <td>{proforma.origen}</td>
                  </tr>
                )}
                {proforma.puerto && (
                  <tr>
                    <td className="pr-2 text-gray-600 font-medium">Puerto:</td>
                    <td>{proforma.puerto}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Información del cliente/proveedor */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <h2 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-1">
              {esProveedor ? 'Proveedor' : 'Cliente'}
            </h2>
            <p className="font-medium text-lg">
              {proforma.cliente?.nombre || (esProveedor ? 
                proforma.notas?.match(/Proveedor: (.+?)(\n|$)/)?.[1] :
                proforma.notas?.match(/Cliente: (.+?)(\n|$)/)?.[1]) || 'No especificado'}
            </p>
            {proforma.id_fiscal && <p className="text-gray-600">CIF/NIF: {proforma.id_fiscal}</p>}
          </div>
          
          {/* Términos */}
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <h2 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-1">Condiciones</h2>
            {proforma.terminos_pago && (
              <p className="mb-1"><span className="font-medium">Pago:</span> {proforma.terminos_pago}</p>
            )}
            {proforma.terminos_entrega && (
              <p className="mb-1"><span className="font-medium">Entrega:</span> {proforma.terminos_entrega}</p>
            )}
            {proforma.cuenta_bancaria && (
              <p className="mb-1"><span className="font-medium">Cuenta:</span> {proforma.cuenta_bancaria}</p>
            )}
          </div>
        </div>

        {/* Líneas de proforma */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">Detalle de proforma</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left border border-gray-300">Descripción</th>
                <th className="py-2 px-4 text-right border border-gray-300">Cantidad</th>
                {!esProveedor && <th className="py-2 px-4 text-right border border-gray-300">Peso</th>}
                <th className="py-2 px-4 text-right border border-gray-300">Precio unitario</th>
                {!esProveedor && <th className="py-2 px-4 text-center border border-gray-300">Tipo empaque</th>}
                <th className="py-2 px-4 text-right border border-gray-300">Total</th>
              </tr>
            </thead>
            <tbody>
              {proforma.productos && proforma.productos.length > 0 ? (
                proforma.productos.map((producto, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 px-4 border border-gray-300">{producto.descripcion}</td>
                    <td className="py-2 px-4 text-right border border-gray-300">{producto.cantidad}</td>
                    {!esProveedor && <td className="py-2 px-4 text-right border border-gray-300">{producto.peso || '-'}</td>}
                    <td className="py-2 px-4 text-right border border-gray-300">{producto.precio_unitario.toFixed(2)} €</td>
                    {!esProveedor && <td className="py-2 px-4 text-center border border-gray-300">{producto.tipo_empaque || '-'}</td>}
                    <td className="py-2 px-4 text-right border border-gray-300">{producto.valor_total?.toFixed(2) || (producto.cantidad * producto.precio_unitario).toFixed(2)} €</td>
                  </tr>
                ))
              ) : (
                <tr className="bg-white">
                  <td className="py-2 px-4 border border-gray-300">
                    {proforma.notas?.match(/Material: (.+?)(\n|$)/)?.[1] || 'Material no especificado'}
                  </td>
                  <td className="py-2 px-4 text-right border border-gray-300">1</td>
                  {!esProveedor && <td className="py-2 px-4 text-right border border-gray-300">{proforma.peso_total || '-'}</td>}
                  <td className="py-2 px-4 text-right border border-gray-300">{montoTotal.toFixed(2)} €</td>
                  {!esProveedor && <td className="py-2 px-4 text-center border border-gray-300">-</td>}
                  <td className="py-2 px-4 text-right border border-gray-300">{montoTotal.toFixed(2)} €</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen */}
        <div className="mb-6 flex justify-end">
          <div className="w-64 border border-gray-300 rounded-md overflow-hidden">
            {proforma.peso_total && (
              <div className="flex justify-between py-2 px-4 bg-gray-50 border-b">
                <span className="font-medium">Peso total:</span>
                <span>{proforma.peso_total} kg</span>
              </div>
            )}
            {proforma.cantidad_contenedores && (
              <div className="flex justify-between py-2 px-4 bg-white border-b">
                <span className="font-medium">Contenedores:</span>
                <span>{proforma.cantidad_contenedores}</span>
              </div>
            )}
            <div className="flex justify-between py-3 px-4 bg-gray-100 font-bold">
              <span>Total:</span>
              <span>{montoTotal.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Notas adicionales */}
        {proforma.notas && (
          <div className="mb-8 border border-gray-200 rounded-md p-4 bg-gray-50">
            <h2 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-1">Notas</h2>
            <p className="text-gray-700 whitespace-pre-line">{proforma.notas}</p>
          </div>
        )}
        
        {/* Pie de página */}
        <div className="mt-10 pt-4 border-t text-center text-gray-500 text-xs">
          <p>Esta proforma ha sido generada por TriCycle CRM</p>
          <p>www.tricyclecrm.com | soporte@tricyclecrm.com | +34 912 345 678</p>
        </div>
      </div>
    );
  }
);

ProformaPrintView.displayName = 'ProformaPrintView';

export default function ProformaPdfPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [proforma, setProforma] = useState<Proforma | null>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);

  // Cargar datos de la proforma
  useEffect(() => {
    const loadProforma = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabaseClient();
        
        // Obtener la proforma con los datos del cliente
        const { data, error: fetchError } = await supabase
          .from('proformas')
          .select(`
            *,
            cliente:cliente_id (
              nombre,
              id_fiscal
            )
          `)
          .eq('id', params.id)
          .single();
        
        if (fetchError) throw fetchError;
        if (!data) throw new Error('No se encontró la proforma');

        // Cargar productos relacionados
        const { data: productos, error: productosError } = await supabase
          .from('proformas_productos')
          .select('*')
          .eq('proforma_id', params.id);

        if (productosError) {
          console.warn('Error al cargar productos de la proforma:', productosError);
        }

        // Asignar productos si existen
        const proformaCompleta: Proforma = {
          ...data,
          productos: productos || []
        };
        
        setProforma(proformaCompleta);
      } catch (error) {
        console.error('Error al cargar la proforma:', error);
        setError('Ha ocurrido un error al cargar los datos de la proforma');
      } finally {
        setLoading(false);
      }
    };

    loadProforma();
  }, [params.id]);

  // Generar PDF y descargar
  const handleGeneratePdf = async () => {
    if (!printComponentRef.current || !proforma) return;
    
    try {
      setGeneratingPdf(true);
      
      // Hacer visible el componente de impresión
      const printElement = printComponentRef.current;
      const originalStyle = printElement.style.display;
      printElement.style.display = 'block';
      
      // Configurar opciones para html2canvas
      const options = {
        scale: 2,
        useCORS: true,
        logging: false
      };
      
      // Capturar el contenido HTML como canvas
      const canvas = await html2canvas(printElement, options);
      
      // Volver a ocultar el componente
      printElement.style.display = originalStyle;
      
      // Convertir a PDF con jsPDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calcular dimensiones para ajustar a A4
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Si la altura es mayor que una página, se dividirá en varias
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Agregar páginas adicionales si es necesario
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Descargar PDF
      const fileName = `Proforma_${proforma.numero || proforma.id_externo || params.id}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtelo de nuevo.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Previsualizar PDF en nueva ventana
  const handlePreviewPdf = async () => {
    if (!printComponentRef.current || !proforma) return;
    
    try {
      setGeneratingPdf(true);
      
      // Hacer visible el componente de impresión
      const printElement = printComponentRef.current;
      const originalStyle = printElement.style.display;
      printElement.style.display = 'block';
      
      // Configurar opciones para html2canvas
      const options = {
        scale: 2,
        useCORS: true,
        logging: false
      };
      
      // Capturar el contenido HTML como canvas
      const canvas = await html2canvas(printElement, options);
      
      // Volver a ocultar el componente
      printElement.style.display = originalStyle;
      
      // Convertir a PDF con jsPDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calcular dimensiones para ajustar a A4
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Si la altura es mayor que una página, se dividirá en varias
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Agregar páginas adicionales si es necesario
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Mostrar PDF en nueva ventana
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtelo de nuevo.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !proforma) {
    return (
      <div className="bg-white min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error || 'No se ha podido cargar la proforma. Por favor, inténtelo de nuevo.'}
                </p>
              </div>
            </div>
          </div>
          <Link 
            href="/proformas"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiArrowLeft className="mr-2 -ml-1 h-5 w-5" />
            Volver a proformas
          </Link>
        </div>
      </div>
    );
  }

  // Determinar si es proforma para cliente o proveedor basado en el contenido del campo notas
  const esProveedor = proforma.notas?.includes('Proveedor:') || false;
  const tipoProforma = esProveedor ? 'proveedor' : 'cliente';

  return (
    <div className="bg-white min-h-screen">
      {/* Componente oculto para impresión/generación de PDF */}
      <ProformaPrintView ref={printComponentRef} proforma={proforma} />
      
      {/* Cabecera */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap">
            <div className="flex items-center text-white">
              <Link 
                href="/proformas"
                className="mr-4 hover:text-indigo-100 transition-colors"
              >
                <FiArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-xl font-semibold">
                Proforma {proforma.numero || proforma.id_externo}
              </h1>
            </div>
            
            <div className="flex space-x-3 mt-3 sm:mt-0">
              <button
                onClick={handleGeneratePdf}
                disabled={generatingPdf}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                <FiDownload className="mr-2 -ml-1 h-5 w-5" />
                {generatingPdf ? 'Generando...' : 'Descargar PDF'}
              </button>
              
              <button
                onClick={handlePreviewPdf}
                disabled={generatingPdf}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-800 bg-opacity-60 hover:bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiFileText className="mr-2 -ml-1 h-5 w-5" />
                {generatingPdf ? 'Generando...' : 'Vista Previa'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">
              Información de la Proforma
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-gray-600 text-sm font-medium mb-2">Detalles generales</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Número:</dt>
                    <dd className="text-sm text-gray-900">{proforma.numero || proforma.id_externo}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Fecha:</dt>
                    <dd className="text-sm text-gray-900">{new Date(proforma.fecha).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Tipo:</dt>
                    <dd className="text-sm text-gray-900 capitalize">{tipoProforma}</dd>
                  </div>
                  {proforma.origen && (
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Origen:</dt>
                      <dd className="text-sm text-gray-900">{proforma.origen}</dd>
                    </div>
                  )}
                  {proforma.puerto && (
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Puerto:</dt>
                      <dd className="text-sm text-gray-900">{proforma.puerto}</dd>
                    </div>
                  )}
                </dl>
              </div>
              
              <div>
                <h3 className="text-gray-600 text-sm font-medium mb-2">
                  {esProveedor ? 'Datos del proveedor' : 'Datos del cliente'}
                </h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Nombre:</dt>
                    <dd className="text-sm text-gray-900">
                      {proforma.cliente?.nombre || (esProveedor ? 
                        proforma.notas?.match(/Proveedor: (.+?)(\n|$)/)?.[1] :
                        proforma.notas?.match(/Cliente: (.+?)(\n|$)/)?.[1]) || 'No especificado'}
                    </dd>
                  </div>
                  {proforma.id_fiscal && (
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">ID Fiscal:</dt>
                      <dd className="text-sm text-gray-900">{proforma.id_fiscal}</dd>
                    </div>
                  )}
                  {proforma.terminos_pago && (
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Términos de pago:</dt>
                      <dd className="text-sm text-gray-900">{proforma.terminos_pago}</dd>
                    </div>
                  )}
                  {proforma.terminos_entrega && (
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Términos de entrega:</dt>
                      <dd className="text-sm text-gray-900">{proforma.terminos_entrega}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Productos</h3>
              {proforma.productos && proforma.productos.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        {!esProveedor && (
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Peso
                          </th>
                        )}
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio Unitario
                        </th>
                        {!esProveedor && (
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                        )}
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {proforma.productos.map((producto, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {producto.descripcion}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {producto.cantidad}
                          </td>
                          {!esProveedor && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {producto.peso || '-'}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {producto.precio_unitario.toFixed(2)} €
                          </td>
                          {!esProveedor && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                              {producto.tipo_empaque || '-'}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {producto.valor_total?.toFixed(2) || (producto.cantidad * producto.precio_unitario).toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 text-center">
                  <p className="text-gray-500">No hay productos detallados en esta proforma</p>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-between items-end">
              {proforma.notas && (
                <div className="w-2/3">
                  <h3 className="text-gray-600 text-sm font-medium mb-2">Notas</h3>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{proforma.notas}</p>
                  </div>
                </div>
              )}
              
              <div className={`${proforma.notas ? 'w-1/3 pl-6' : 'w-full'}`}>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  {proforma.peso_total && (
                    <div className="flex justify-between py-2 px-4 bg-gray-50 border-b">
                      <span className="text-sm font-medium text-gray-500">Peso total:</span>
                      <span className="text-sm text-gray-900">{proforma.peso_total} kg</span>
                    </div>
                  )}
                  {proforma.cantidad_contenedores && (
                    <div className="flex justify-between py-2 px-4 bg-white border-b">
                      <span className="text-sm font-medium text-gray-500">Contenedores:</span>
                      <span className="text-sm text-gray-900">{proforma.cantidad_contenedores}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 px-4 bg-indigo-50">
                    <span className="text-sm font-semibold text-gray-900">Total:</span>
                    <span className="text-sm font-bold text-indigo-700">
                      {(proforma.monto_total || proforma.monto).toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
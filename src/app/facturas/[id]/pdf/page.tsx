'use client';

import { useEffect, useState, useRef, forwardRef } from 'react';
import { useParams } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getSupabaseClient } from '@/lib/supabase';
import Image from 'next/image';
import { FiDownload, FiLoader } from 'react-icons/fi';

// Interfaz para la factura
interface Factura {
  id: string;
  id_externo?: string;
  numero_factura?: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  cliente?: string;
  cliente_direccion?: string;
  cliente_tax_id?: string;
  cliente_ciudad?: string;
  cliente_pais?: string;
  proveedor?: string;
  proveedor_direccion?: string;
  proveedor_tax_id?: string;
  total: number;
  estado: string;
  divisa: string;
  notas?: string;
  tipo?: 'cliente' | 'proveedor';
  items?: FacturaItem[];
}

interface FacturaItem {
  id: string;
  descripcion: string;
  cantidad: number;
  peso?: number;
  peso_unidad?: string;
  precio_unitario: number;
  total: number;
  codigo?: string;
}

// Componente para la vista de impresión de factura
const FacturaPrintView = forwardRef<HTMLDivElement, { factura: Factura; numeroFactura: string, nombreDestinatario: string }>((props, ref) => {
  const { factura, numeroFactura, nombreDestinatario } = props;
  
  // Formatear la fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/');
  };
  
  // Formatear moneda
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency === '$' ? 'USD' : currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(amount).replace('€', currency === '$' ? '$' : '€');
  };

  // Calcular totales
  const totalPeso = factura.items?.reduce((acc, item) => acc + (item.peso || 0), 0) || 0;
  
  // Obtener dirección del destinatario
  const getDireccionDestinatario = () => {
    if (factura.tipo === 'proveedor') {
      return factura.proveedor_direccion || '';
    }
    return factura.cliente_direccion || '';
  };
  
  // Obtener ID fiscal del destinatario
  const getTaxIDDestinatario = () => {
    if (factura.tipo === 'proveedor') {
      return factura.proveedor_tax_id || '';
    }
    return factura.cliente_tax_id || '';
  };
  
  // Extraer información de las notas
  const extractConsigneeInfo = () => {
    if (factura.notas) {
      const lines = factura.notas.split('\n');
      const consigneeIndex = lines.findIndex(line => line.includes('CONSIGNEE:'));
      if (consigneeIndex >= 0) {
        return lines.slice(consigneeIndex).join('\n');
      }
    }
    return '';
  };
  
  // Obtener número de factura
  const getInvoiceNumber = () => {
    return factura.numero_factura || factura.id_externo || `INV${String(factura.id).padStart(4, '0')}`;
  };

  return (
    <div ref={ref} className="bg-white p-10" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontFamily: 'Arial, sans-serif', fontSize: '9pt', position: 'relative' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        {/* Logo */}
        <div style={{ width: '150px' }}>
          <Image 
            src="/images/logo.png" 
            alt="Tricycle Products S.L."
            width={150}
            height={80}
            style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
            priority
            unoptimized
          />
        </div>
        
        {/* Datos empresa */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>TRICYCLE PRODUCTS, S.L</div>
          <div>PEREZ DOLZ, 8, ENTRS. 12003 Castellon – SPAIN</div>
          <div>VAT: B56194830</div>
          <div>Tel. +34 964 041 556</div>
          <div>E-mail: info@tricycleproducts.es</div>
        </div>
      </div>
      
      {/* Número de factura y fecha */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ fontSize: '18pt', fontWeight: 'bold' }}>
          {numeroFactura}
        </div>
        <div>
          <span style={{ fontWeight: 'normal' }}>Date </span> 
          {formatDate(factura.fecha_emision)}
        </div>
      </div>
      
      {/* Datos del cliente */}
      <div style={{ marginBottom: '30px' }}>
        <div><span style={{ fontWeight: 'bold' }}>Name:</span> {nombreDestinatario}</div>
        <div><span style={{ fontWeight: 'bold' }}>Address:</span> {getDireccionDestinatario()}</div>
        {factura.cliente_ciudad && factura.cliente_pais && (
          <div>{factura.cliente_ciudad} {factura.cliente_pais}</div>
        )}
        <div><span style={{ fontWeight: 'bold' }}>TAX ID:</span> {getTaxIDDestinatario()}</div>
      </div>
      
      {/* Tabla de productos */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9f9f9' }}>
            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>FULL DESCRIPTION OF GOODS</th>
            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '100px' }}>WEIGHT</th>
            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '100px' }}>PRICE</th>
            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '130px' }}>TOTAL VALUE</th>
          </tr>
        </thead>
        <tbody>
          {factura.items && factura.items.length > 0 ? (
            factura.items.map((item, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {item.descripcion} {item.codigo ? `- ${item.codigo}` : ''}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {item.peso ? `${item.peso.toFixed(2)} ${item.peso_unidad || 'MT'}` : ''}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {formatCurrency(item.precio_unitario, factura.divisa)}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                  {formatCurrency(item.total, factura.divisa)}
                </td>
              </tr>
            ))
          ) : (
            // Si no hay items, mostrar una fila de ejemplo
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>
                PP PLASTIC SCRAP - SAMPLE CODE
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                20.00 MT
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                {formatCurrency(200, factura.divisa)}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                {formatCurrency(4000, factura.divisa)}
              </td>
            </tr>
          )}
          
          {/* Fila de totales */}
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              ORIGIN OF GOODS: SPAIN
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {totalPeso.toFixed(2)} MT
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              Total Amount
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
              {formatCurrency(factura.total, factura.divisa)}
            </td>
          </tr>
        </tbody>
      </table>
      
      {/* Información fiscal */}
      <div style={{ marginBottom: '15px', fontSize: '9pt' }}>
        Exempt VAT. EXPORT Section 21.1 Ley 37/1992
      </div>
      
      {/* Notas */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>NOTES:</div>
        <div style={{ whiteSpace: 'pre-wrap', fontSize: '8pt' }}>
          {extractConsigneeInfo() || factura.notas}
        </div>
      </div>
      
      {/* Datos bancarios */}
      <div style={{ marginTop: '30px', marginBottom: '20px' }}>
        <div style={{ color: '#ff0000', fontWeight: 'bold', marginBottom: '5px' }}>BANK DETAILS:</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '150px', paddingBottom: '5px' }}>BENEFICIARY:</td>
              <td style={{ fontWeight: 'bold' }}>TRICYCLE PRODUCTS S.L.</td>
            </tr>
            <tr>
              <td style={{ paddingBottom: '5px' }}>BANK NUMBER.:</td>
              <td style={{ fontWeight: 'bold' }}>ES60004953321426100088XX</td>
            </tr>
            <tr>
              <td style={{ paddingBottom: '5px' }}>BANK:</td>
              <td style={{ fontWeight: 'bold' }}>Banco Santander S.A</td>
            </tr>
            <tr>
              <td>SWIFT:</td>
              <td style={{ fontWeight: 'bold' }}>BSCHESMM</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Firma */}
      <div style={{ position: 'absolute', bottom: '30px', right: '50px', textAlign: 'center' }}>
        <div style={{ borderBottom: '1px solid #000', width: '200px', marginBottom: '5px' }}></div>
        <div style={{ fontSize: '8pt' }}>Autorizado / Authorized</div>
      </div>
    </div>
  );
});

FacturaPrintView.displayName = 'FacturaPrintView';

// Componente principal para la página de PDF
export default function FacturaPDFPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [factura, setFactura] = useState<Factura | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [facturaNumero, setFacturaNumero] = useState('');
  const [savingNumero, setSavingNumero] = useState(false);
  const [nombreDestinatario, setNombreDestinatario] = useState('');
  
  // Estados para editar el nombre
  const [editingNombre, setEditingNombre] = useState(false);
  const [savingNombre, setSavingNombre] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  
  // Cargar los datos de la factura
  useEffect(() => {
    const fetchFactura = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Intentar obtener de facturas_cliente sin la relación que causa errores
        const { data: clienteData, error: clienteError } = await supabase
          .from('facturas_cliente')
          .select('*')
          .eq('id', id)
          .single();
        
        if (clienteData) {
          // Obtener los items en una consulta separada si es necesario
          // const { data: itemsData } = await supabase
          //   .from('facturas_items')
          //   .select('*')
          //   .eq('factura_id', id);
          
          const facturaData = {
            ...clienteData,
            tipo: 'cliente',
            items: [] // itemsData || []
          };
          
          setFactura(facturaData);
          setFacturaNumero(facturaData.numero_factura || facturaData.id_externo || `INV${String(facturaData.id).padStart(4, '0')}`);
          setNombreDestinatario(facturaData.cliente || 'Cliente sin especificar');
          setLoading(false);
          return;
        }
        
        // Si no, intentar obtener de facturas_proveedor sin la relación
        const { data: proveedorData, error: proveedorError } = await supabase
          .from('facturas_proveedor')
          .select('*')
          .eq('id', id)
          .single();
        
        if (proveedorData) {
          // Obtener los items en una consulta separada si es necesario
          // const { data: itemsData } = await supabase
          //   .from('facturas_items')
          //   .select('*')
          //   .eq('factura_id', id);
          
          const facturaData = {
            ...proveedorData,
            tipo: 'proveedor',
            items: [] // itemsData || []
          };
          
          setFactura(facturaData);
          setFacturaNumero(facturaData.numero_factura || facturaData.id_externo || `INV${String(facturaData.id).padStart(4, '0')}`);
          setNombreDestinatario(facturaData.proveedor || 'Proveedor sin especificar');
          setLoading(false);
        } else {
          // Si no se encuentra, mostrar error
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
  
  // Guardar el número de factura
  const handleSaveNumeroFactura = async () => {
    if (!factura) return;
    
    setSavingNumero(true);
    
    try {
      const supabase = getSupabaseClient();
      const tableName = factura.tipo === 'cliente' ? 'facturas_cliente' : 'facturas_proveedor';
      
      // Actualizar el número de factura
      const { error } = await supabase
        .from(tableName)
        .update({ 
          numero_factura: facturaNumero,
          // También podemos actualizar id_externo si es necesario
          id_externo: facturaNumero 
        })
        .eq('id', factura.id);
      
      if (error) throw error;
      
      // Actualizar el estado local
      setFactura(prev => {
        if (!prev) return null;
        return {
          ...prev,
          numero_factura: facturaNumero,
          id_externo: facturaNumero
        };
      });
      
      // Desactivar el modo de edición
      setEditing(false);
      
    } catch (err) {
      console.error('Error al guardar el número de factura:', err);
      setError('Error al guardar el número de factura');
    } finally {
      setSavingNumero(false);
    }
  };
  
  // Guardar el nombre del cliente/proveedor
  const handleSaveNombre = async () => {
    if (!factura) return;
    
    setSavingNombre(true);
    
    try {
      const supabase = getSupabaseClient();
      
      // Actualizar según el tipo de factura
      if (factura.tipo === 'proveedor') {
        // Para facturas de proveedor
        const { error } = await supabase
          .from('facturas')
          .update({ proveedor: nombreDestinatario })
          .eq('id', factura.id);
        
        if (error) throw error;
        
        // Actualizar el estado local
        setFactura(prev => {
          if (!prev) return null;
          return {
            ...prev,
            proveedor: nombreDestinatario
          };
        });
      } else {
        // Para facturas de cliente
        const { error } = await supabase
          .from('facturas')
          .update({ cliente: nombreDestinatario })
          .eq('id', factura.id);
        
        if (error) throw error;
        
        // Actualizar el estado local
        setFactura(prev => {
          if (!prev) return null;
          return {
            ...prev,
            cliente: nombreDestinatario
          };
        });
      }
      
      // Desactivar el modo de edición
      setEditingNombre(false);
      
    } catch (err) {
      console.error('Error al guardar el nombre:', err);
      setError('Error al guardar el nombre del destinatario');
    } finally {
      setSavingNombre(false);
    }
  };
  
  // Función para generar el PDF
  const generatePDF = async () => {
    if (!printRef.current) return;
    
    setGenerating(true);
    
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // Mayor calidad
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Dimensiones A4
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Nombre del archivo con el número de factura
      const fileName = factura?.numero_factura
        ? `factura_${factura.numero_factura.replace(/[\\/]/g, '_')}.pdf`
        : 'factura.pdf';
      
      // Descargar PDF
      pdf.save(fileName);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      setError('Error al generar el PDF');
    } finally {
      setGenerating(false);
    }
  };
  
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
        <a href="/facturas" className="text-indigo-600 hover:text-indigo-800">
          Volver a facturas
        </a>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-100 p-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Botones */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-col sm:flex-row items-center justify-between">
          <a 
            href="/facturas" 
            className="text-indigo-600 hover:text-indigo-800 mb-3 sm:mb-0"
          >
            ← Volver a facturas
          </a>
          
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-3 sm:mb-0">
            {/* Control para editar el número de factura */}
            <div className="flex items-center space-x-2">
              {editing ? (
                <>
                  <input
                    type="text"
                    value={facturaNumero}
                    onChange={(e) => setFacturaNumero(e.target.value)}
                    className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSaveNumeroFactura}
                    disabled={savingNumero}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {savingNumero ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      // Restaurar el número original
                      if (factura) {
                        setFacturaNumero(factura.numero_factura || factura.id_externo || `INV${String(factura.id).padStart(4, '0')}`);
                      }
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Editar número
                </button>
              )}
            </div>
            
            {/* Control para editar el nombre del cliente/proveedor */}
            <div className="flex items-center space-x-2">
              {editingNombre ? (
                <>
                  <input
                    type="text"
                    value={nombreDestinatario}
                    onChange={(e) => setNombreDestinatario(e.target.value)}
                    className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSaveNombre}
                    disabled={savingNombre}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {savingNombre ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingNombre(false);
                      // Restaurar el nombre original
                      if (factura) {
                        if (factura.tipo === 'proveedor') {
                          setNombreDestinatario(factura.proveedor || 'Proveedor sin especificar');
                        } else {
                          setNombreDestinatario(factura.cliente || 'Cliente sin especificar');
                        }
                      }
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditingNombre(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Editar nombre
                </button>
              )}
            </div>
          </div>
          
          <button
            onClick={generatePDF}
            disabled={generating}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {generating ? (
              <>
                <FiLoader className="animate-spin mr-2 h-4 w-4" />
                Generando PDF...
              </>
            ) : (
              <>
                <FiDownload className="mr-2 h-4 w-4" />
                Descargar PDF
              </>
            )}
          </button>
        </div>
        
        {/* Vista previa */}
        <div className="bg-white shadow-xl mb-8 mx-auto" style={{ maxWidth: '210mm' }}>
          <FacturaPrintView factura={factura} numeroFactura={facturaNumero} nombreDestinatario={nombreDestinatario} ref={printRef} />
        </div>
      </div>
    </div>
  );
} 
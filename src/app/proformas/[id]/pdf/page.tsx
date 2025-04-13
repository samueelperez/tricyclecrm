'use client';

import { useEffect, useState, useRef, forwardRef } from 'react';
import { useParams } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getSupabaseClient } from '@/lib/supabase';
import Image from 'next/image';
import { FiDownload, FiLoader, FiArrowLeft } from 'react-icons/fi';

// Interfaz para la proforma
interface Proforma {
  id: string;
  id_externo?: string;
  fecha: string;
  cliente_id?: number | null;
  cliente?: any;
  id_fiscal?: string;
  monto: number;
  puerto?: string;
  origen?: string;
  terminos_entrega?: string;
  terminos_pago?: string;
  cuenta_bancaria?: string;
  notas?: string;
  tipo?: 'cliente' | 'proveedor';
  productos?: ProformaProducto[];
  peso_total?: number;
  cantidad_contenedores?: number;
  clientes_adicionales?: ProformaCliente[];
}

interface ProformaProducto {
  id: string;
  descripcion: string;
  cantidad: number;
  peso?: number;
  precio_unitario: number;
  valor_total?: number;
  tipo_empaque?: string;
  proveedor_id?: string;
}

interface ProformaCliente {
  id: string;
  nombre: string;
  porcentaje?: number;
  productos?: string[];
}

// Componente para la vista de impresión de proforma
const ProformaPrintView = forwardRef<HTMLDivElement, { proforma: Proforma; numeroProforma: string; nombreDestinatario: string; multiClientes: ProformaCliente[] }>((props, ref) => {
  const { proforma, numeroProforma, nombreDestinatario, multiClientes } = props;
  
  // Formatear la fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '.');
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
  const totalPeso = proforma.peso_total || proforma.productos?.reduce((acc, item) => acc + (item.peso || 0), 0) || 0;
  
  // Obtener material desde notas
  const getMaterial = () => {
    if (proforma.notas) {
      const match = proforma.notas.match(/Material: (.+?)(\n|$)/);
      if (match) {
        return match[1]; // Devuelve solo el valor, sin la etiqueta "Material:"
      }
    }
    return proforma.productos && proforma.productos.length > 0 ? proforma.productos[0].descripcion : '';
  };
  
  // Extraer información de consignatario
  const extractConsigneeInfo = () => {
    if (proforma.notas) {
      const lines = proforma.notas.split('\n');
      const consigneeIndex = lines.findIndex(line => line.includes('CONSIGNEE:'));
      if (consigneeIndex >= 0) {
        return lines.slice(consigneeIndex).join('\n');
      }
    }
    return '';
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
      
      {/* Número de proforma y fecha */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ fontSize: '18pt', fontWeight: 'bold' }}>
          {numeroProforma}
        </div>
        <div>
          <span style={{ fontWeight: 'normal' }}>Date </span> 
          {formatDate(proforma.fecha)}
        </div>
      </div>
      
      {/* Datos del cliente */}
      <div style={{ marginBottom: '30px' }}>
        <div><span style={{ fontWeight: 'bold' }}>Name:</span> {nombreDestinatario}</div>
        <div><span style={{ fontWeight: 'bold' }}>Address:</span> {proforma.cliente?.direccion || ''}</div>
        {proforma.cliente?.ciudad && proforma.cliente?.pais && (
          <div>{proforma.cliente.ciudad} {proforma.cliente.pais}</div>
        )}
        <div><span style={{ fontWeight: 'bold' }}>TAX ID:</span> {proforma.id_fiscal || proforma.cliente?.id_fiscal || ''}</div>
      </div>
      
      {/* Términos de pago */}
      {proforma.terminos_pago && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>PAYMENT TERMS:</div>
          <div>{proforma.terminos_pago}</div>
        </div>
      )}
      
      {/* Información de múltiples clientes */}
      {proforma.tipo === 'proveedor' && multiClientes.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>CLIENTES ADICIONALES:</div>
          <ul>
            {multiClientes.map((cliente, index) => (
              <li key={index}>{cliente.nombre} {cliente.porcentaje && `(${cliente.porcentaje}%)`}</li>
            ))}
          </ul>
        </div>
      )}
      
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
          {proforma.productos && proforma.productos.length > 0 ? (
            proforma.productos.map((item, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {item.descripcion}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {item.peso ? `${item.peso.toFixed(2)} MT` : `${item.cantidad} MT`}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {formatCurrency(item.precio_unitario, 'EUR')}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                  {formatCurrency(item.valor_total || (item.cantidad * item.precio_unitario), 'EUR')}
                </td>
              </tr>
            ))
          ) : (
            // Si no hay items, mostrar una fila de ejemplo con el material de las notas
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>
                {getMaterial() || 'PP PLASTIC SCRAP - SAMPLE CODE'}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                {totalPeso.toFixed(2)} MT
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                {formatCurrency(200, 'EUR')}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                {formatCurrency(proforma.monto, 'EUR')}
              </td>
            </tr>
          )}
          
          {/* Fila de totales */}
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              ORIGIN OF GOODS: {proforma.origen || 'SPAIN'}
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {totalPeso.toFixed(2)} MT
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              Total Amount
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
              {formatCurrency(proforma.monto, 'EUR')}
            </td>
          </tr>
        </tbody>
      </table>
      
      {/* Información fiscal */}
      <div style={{ marginBottom: '15px', fontSize: '9pt' }}>
        Exempt VAT. EXPORT Section 21.1 Ley 37/1992
      </div>
      
      {/* Información de puertos */}
      {proforma.puerto && (
        <div style={{ marginBottom: '20px', fontSize: '9pt' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>PORT INFORMATION:</div>
          <div><span style={{ fontWeight: 'bold' }}>Port of Discharge:</span> CIF - {proforma.puerto}</div>
        </div>
      )}
      
      {/* Información bancaria */}
      {proforma.cuenta_bancaria && (
        <div style={{ marginBottom: '20px', fontSize: '9pt' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>BANK ACCOUNT:</div>
          <div>{proforma.cuenta_bancaria}</div>
        </div>
      )}
      
      {/* Consignatario */}
      {extractConsigneeInfo() && (
        <div style={{ marginBottom: '20px', fontSize: '9pt' }}>
          {extractConsigneeInfo()}
        </div>
      )}

      {/* Notas adicionales */}
      {proforma.notas && !extractConsigneeInfo() && (
        <div style={{ marginBottom: '20px', fontSize: '9pt' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>NOTES:</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {proforma.notas
              .split('\n')
              .filter(line => !line.startsWith('Cliente:') && !line.startsWith('Material:'))
              .join('\n')}
          </div>
        </div>
      )}
      
      {/* Texto fijo de instrucciones de envío - Siempre visible */}
      <div style={{ marginBottom: '20px', fontSize: '8pt', lineHeight: '1.3' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>SHIPPING INSTRUCTIONS:</div>
        <p>PROVIDED PRIOR SHIPPING INSTRUCTIONS BY BUYER. CONSIGNEE MUST BE A COMPANY OF IMPORTING COUNTRY</p>
        <p>AS ANNEX VII SHOWING THIS IS OBLIGATORY BE PROVIDED BY SELLER TO CUSTOMS IN EXPORTING COUNTRY</p>
        <p>Loading date: Type of transport: Modifications on BL: AS SOON AS POSSIBLE, MAXIMUM 30 DAYS FROM CONTRACT SIGNING DATE</p>
        <p>40 FT SEA CONTAINER</p>
        <p>BL AMENDMENTS CAN BE DONE BEFORE SHIP LEAVES BCN PORT OF ORIGIN, AFTERWARDS AMENDMENTS WILL BE ON</p>
        <p>BUYER´S ACCOUNT AS SHIPPING LINE CHARGE (100 USD/AMENDMENT APROX)</p>
        <p>Special conditions: Loading Pictures: LOI, AP, PSIC, IMPORT PERMISSIONS UNDER PURCHASER´S ACCOUNT</p>
        <p>FULL SET OF LOADING PICTURES WILL BE PROVI DED</p>
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
      <div style={{ position: 'absolute', bottom: '60px', right: '60px', width: '200px' }}>
        <Image 
          src="/images/firma.png" 
          alt="Firma autorizada"
          width={200}
          height={100}
          style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
          priority
          unoptimized
        />
      </div>
    </div>
  );
});

ProformaPrintView.displayName = 'ProformaPrintView';

// Componente principal para la página de PDF
export default function ProformaPDFPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [proforma, setProforma] = useState<Proforma | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [proformaNumero, setProformaNumero] = useState('');
  const [savingNumero, setSavingNumero] = useState(false);
  
  // Estados para editar el nombre del cliente/proveedor
  const [editingNombre, setEditingNombre] = useState(false);
  const [nombreDestinatario, setNombreDestinatario] = useState('');
  const [savingNombre, setSavingNombre] = useState(false);
  
  const [multiClientes, setMultiClientes] = useState<ProformaCliente[]>([]);
  const [showMultiDialog, setShowMultiDialog] = useState(false);
  const [currentNuevoItem, setCurrentNuevoItem] = useState('');
  const [currentPorcentaje, setCurrentPorcentaje] = useState('');
  
  const printRef = useRef<HTMLDivElement>(null);
  
  // Cargar los datos de la proforma
  useEffect(() => {
    const fetchProforma = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Obtener proforma
        const { data, error } = await supabase
          .from('proformas')
          .select('*, cliente:clientes(*)')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Determinar si es proforma para cliente o proveedor basado en el contenido del campo notas
          const esProveedor = data.notas?.includes('Proveedor:') || false;
          
          // Obtener los productos de la proforma
          const { data: productosData } = await supabase
            .from('proformas_productos')
            .select('*')
            .eq('proforma_id', id);
          
          const proformaData: Proforma = {
            ...data,
            id: String(data.id),
            tipo: esProveedor ? 'proveedor' : 'cliente',
            productos: productosData || []
          };
          
          setProforma(proformaData);
          setProformaNumero(proformaData.id_externo || `PRO${String(proformaData.id).padStart(4, '0')}`);
          
          // Inicializar el nombre del destinatario
          if (esProveedor) {
            const nombreProveedor = proformaData.notas?.match(/Proveedor: (.+?)(\n|$)/)?.[1] || 'Proveedor sin especificar';
            setNombreDestinatario(nombreProveedor);
          } else {
            // Intentar obtener el nombre del cliente desde varias fuentes
            const nombreCliente = proformaData.cliente?.nombre || 
                                 (proformaData.notas?.match(/Cliente: (.+?)(\n|$)/)?.[1]) || 
                                 'Cliente sin especificar';
            setNombreDestinatario(nombreCliente);
          }
          
          // Cargar proveedores o clientes adicionales si existen
          if (esProveedor) {
            // Extraer clientes adicionales de las notas o cargar desde tabla relacionada
            const clientesMatch = proformaData.notas?.match(/Clientes adicionales:([\s\S]*?)(?=\n\n|\n$|$)/);
            if (clientesMatch && clientesMatch[1]) {
              const clientesTexto = clientesMatch[1].trim();
              const clientesArray = clientesTexto.split('\n').map(linea => {
                const [nombre, porcentaje] = linea.split(':').map(s => s.trim());
                return {
                  id: `temp-${Math.random().toString(36).substr(2, 9)}`,
                  nombre,
                  porcentaje: porcentaje ? parseInt(porcentaje) : undefined
                };
              });
              setMultiClientes(clientesArray);
            }
          }
          
          setLoading(false);
        } else {
          setError('No se encontró la proforma solicitada');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error al cargar la proforma:', err);
        setError('Error al cargar los datos de la proforma');
        setLoading(false);
      }
    };
    
    fetchProforma();
  }, [id]);
  
  // Guardar el número de proforma
  const handleSaveNumeroProforma = async () => {
    if (!proforma) return;
    
    setSavingNumero(true);
    
    try {
      const supabase = getSupabaseClient();
      
      // Actualizar el número de proforma (solo usando id_externo)
      const { error } = await supabase
        .from('proformas')
        .update({ 
          id_externo: proformaNumero 
        })
        .eq('id', proforma.id);
      
      if (error) throw error;
      
      // Actualizar el estado local
      setProforma(prev => {
        if (!prev) return null;
        return {
          ...prev,
          id_externo: proformaNumero
        };
      });
      
      // Desactivar el modo de edición
      setEditing(false);
      
    } catch (err) {
      console.error('Error al guardar el número de proforma:', err);
      setError('Error al guardar el número de proforma');
    } finally {
      setSavingNumero(false);
    }
  };
  
  // Guardar el nombre del cliente/proveedor
  const handleSaveNombre = async () => {
    if (!proforma) return;
    
    setSavingNombre(true);
    
    try {
      // Si es una proforma de proveedor, actualizamos las notas
      if (proforma.tipo === 'proveedor') {
        const supabase = getSupabaseClient();
        
        // Actualizar las notas reemplazando la línea de "Proveedor:"
        let nuevasNotas = proforma.notas || '';
        
        if (nuevasNotas.includes('Proveedor:')) {
          // Reemplazar la línea existente
          nuevasNotas = nuevasNotas.replace(/Proveedor:.+?(\n|$)/, `Proveedor: ${nombreDestinatario}$1`);
        } else {
          // Agregar al inicio si no existe
          nuevasNotas = `Proveedor: ${nombreDestinatario}\n${nuevasNotas}`;
        }
        
        const { error } = await supabase
          .from('proformas')
          .update({ notas: nuevasNotas })
          .eq('id', proforma.id);
        
        if (error) throw error;
        
        // Actualizar el estado local
        setProforma(prev => {
          if (!prev) return null;
          return {
            ...prev,
            notas: nuevasNotas
          };
        });
      } else if (proforma.cliente_id) {
        // Si es una proforma de cliente y tiene cliente_id, actualizamos el nombre del cliente
        const supabase = getSupabaseClient();
        
        const { error } = await supabase
          .from('clientes')
          .update({ nombre: nombreDestinatario })
          .eq('id', proforma.cliente_id);
        
        if (error) throw error;
        
        // Actualizar el estado local
        setProforma(prev => {
          if (!prev || !prev.cliente) return prev;
          return {
            ...prev,
            cliente: {
              ...prev.cliente,
              nombre: nombreDestinatario
            }
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
  
  // Guardar proveedores o clientes adicionales
  const handleSaveMulti = async () => {
    if (!proforma) return;
    
    try {
      const supabase = getSupabaseClient();
      
      // Actualizar las notas con la información de proveedores o clientes
      let nuevasNotas = proforma.notas || '';
      
      if (proforma.tipo === 'proveedor') {
        // Actualizar clientes adicionales
        if (multiClientes.length > 0) {
          // Eliminar sección de clientes adicionales existente si la hay
          nuevasNotas = nuevasNotas.replace(/Clientes adicionales:[\s\S]*?(?=\n\n|\n$|$)/, '');
          
          // Añadir nuevos clientes
          const clientesTexto = multiClientes.map(c => 
            `${c.nombre}${c.porcentaje ? `: ${c.porcentaje}%` : ''}`
          ).join('\n');
          
          if (clientesTexto) {
            nuevasNotas = nuevasNotas.trim() + `\n\nClientes adicionales:\n${clientesTexto}`;
          }
        }
      }
      
      // Guardar notas actualizadas
      const { error } = await supabase
        .from('proformas')
        .update({ notas: nuevasNotas })
        .eq('id', proforma.id);
      
      if (error) throw error;
      
      // Actualizar el estado local
      setProforma(prev => {
        if (!prev) return null;
        return {
          ...prev,
          notas: nuevasNotas
        };
      });
      
      setShowMultiDialog(false);
      
    } catch (err) {
      console.error('Error al guardar:', err);
      setError('Error al guardar la información adicional');
    }
  };
  
  // Añadir nuevo proveedor o cliente
  const handleAddMultiItem = () => {
    if (!currentNuevoItem.trim()) return;
    
    if (proforma?.tipo === 'proveedor') {
      // Añadir cliente adicional
      setMultiClientes([
        ...multiClientes,
        {
          id: `temp-${Math.random().toString(36).substr(2, 9)}`,
          nombre: currentNuevoItem,
          porcentaje: currentPorcentaje ? parseInt(currentPorcentaje) : undefined
        }
      ]);
    }
    
    // Limpiar el formulario
    setCurrentNuevoItem('');
    setCurrentPorcentaje('');
  };
  
  // Eliminar proveedor o cliente
  const handleRemoveMultiItem = (id: string) => {
    if (proforma?.tipo === 'proveedor') {
      setMultiClientes(multiClientes.filter(c => c.id !== id));
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
      
      // Nombre del archivo con el número de proforma
      const fileName = proforma?.id_externo
        ? `proforma_${proforma.id_externo.replace(/[\\/]/g, '_')}.pdf`
        : 'proforma.pdf';
      
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
        <p className="text-gray-600">Cargando proforma...</p>
      </div>
    );
  }
  
  if (error || !proforma) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 w-full max-w-xl">
          <p className="text-red-700">{error || 'Error al cargar la proforma'}</p>
        </div>
        <a href="/proformas" className="text-indigo-600 hover:text-indigo-800">
          Volver a proformas
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
                  href="/proformas" 
                  className="mr-3 text-gray-600 hover:text-gray-800"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </a>
                <h1 className="text-xl font-medium text-gray-800">Vista PDF Proforma</h1>
              </div>
              
              <button
                onClick={generatePDF}
                disabled={generating}
                className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <FiLoader className="animate-spin mr-2 h-5 w-5" />
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <FiDownload className="mr-2 h-5 w-5" />
                    Descargar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Vista previa */}
        <div className="bg-white shadow-xl mb-8 mx-auto" style={{ maxWidth: '210mm' }}>
          <ProformaPrintView 
            proforma={proforma} 
            numeroProforma={proformaNumero} 
            nombreDestinatario={nombreDestinatario} 
            multiClientes={multiClientes}
            ref={printRef} 
          />
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar la lista de proveedores/clientes adicionales
interface MultiEntidadListProps {
  proforma: Proforma;
  multiClientes: ProformaCliente[];
  currentNuevoItem: string;
  setCurrentNuevoItem: (value: string) => void;
  currentPorcentaje: string;
  setCurrentPorcentaje: (value: string) => void;
  handleAddMultiItem: () => void;
  handleRemoveMultiItem: (id: string) => void;
  handleSaveMulti: () => void;
}

const MultiEntidadList = ({
  proforma,
  multiClientes,
  currentNuevoItem,
  setCurrentNuevoItem,
  currentPorcentaje,
  setCurrentPorcentaje,
  handleAddMultiItem,
  handleRemoveMultiItem,
  handleSaveMulti
}: MultiEntidadListProps) => {
  const items = multiClientes;
  const titulo = 'Clientes adicionales';
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-3">{titulo}</h3>
      
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay {titulo.toLowerCase()} configurados.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between items-center border-b pb-2">
              <span>{item.nombre} {item.porcentaje && `(${item.porcentaje}%)`}</span>
              <button 
                onClick={() => handleRemoveMultiItem(item.id)} 
                className="text-red-500 hover:text-red-700"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
      
      <div className="mt-4 space-y-3">
        <input
          type="text"
          value={currentNuevoItem}
          onChange={(e) => setCurrentNuevoItem(e.target.value)}
          placeholder={`Nombre del cliente`}
          className="w-full border rounded-md px-3 py-2"
        />
        
        <input
          type="number"
          value={currentPorcentaje}
          onChange={(e) => setCurrentPorcentaje(e.target.value)}
          placeholder="Porcentaje (opcional)"
          className="w-full border rounded-md px-3 py-2"
        />
        
        <div className="flex justify-between">
          <button
            onClick={handleAddMultiItem}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Añadir
          </button>
          
          <button
            onClick={handleSaveMulti}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}; 
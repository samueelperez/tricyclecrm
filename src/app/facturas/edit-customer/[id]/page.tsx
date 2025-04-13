'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiChevronDown, 
  FiPlus, 
  FiTrash2,
  FiSave,
  FiAlertTriangle,
  FiFileText
} from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Interfaces para los datos
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalValue: number;
  weight?: number;
  packaging?: string;
}

// Interfaz para los datos almacenados en el campo material
interface NotasData {
  cliente_nombre?: string;
  taxId?: string;
  paymentTerms?: string;
  ports?: string;
  deliveryTerms?: string;
  notas?: string;
  items?: InvoiceItem[];
  descripcion?: string;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  customerName: string;
  taxId: string;
  paymentTerms: string;
  invoiceNotes: string;
  estado: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  bankAccount?: string;
  ports: string;
  deliveryTerms: string;
}

// Componente para la vista de impresión de factura
const InvoicePrintView = forwardRef<HTMLDivElement, { invoice: Invoice }>(
  ({ invoice }, ref) => {
    // Extraer fecha formateada
    const formattedDate = new Date(invoice.date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Calcular totales
    const subtotal = invoice.items.reduce((sum, item) => sum + item.totalValue, 0);
    const taxAmount = invoice.items.reduce((sum, item) => sum + (item.totalValue * (item.taxRate / 100)), 0);
    const totalAmount = subtotal + taxAmount;

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
            <div className="text-xl font-bold text-gray-800 mb-2">FACTURA</div>
            <table className="ml-auto text-right">
              <tbody>
                <tr>
                  <td className="pr-2 text-gray-600 font-medium">Número:</td>
                  <td className="font-bold">{invoice.number}</td>
                </tr>
                <tr>
                  <td className="pr-2 text-gray-600 font-medium">Fecha:</td>
                  <td>{formattedDate}</td>
                </tr>
                <tr>
                  <td className="pr-2 text-gray-600 font-medium">Estado:</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      invoice.estado === 'pagada' ? 'bg-green-100 text-green-800' :
                      invoice.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {invoice.estado.charAt(0).toUpperCase() + invoice.estado.slice(1)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Información del cliente */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <h2 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-1">Cliente</h2>
            <p className="font-medium text-lg">{invoice.customerName}</p>
            {invoice.taxId && <p className="text-gray-600">CIF/NIF: {invoice.taxId}</p>}
          </div>
          
          {/* Términos de pago */}
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <h2 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-1">Términos de pago</h2>
            <p>{invoice.paymentTerms || "No especificado"}</p>
          </div>
        </div>

        {/* Términos de Entrega */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Términos de Entrega</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Puertos</label>
              <input 
                type="text" 
                placeholder="Ej: TEMA PORT - GHANA, BARCELONA - ESPAÑA"
                value={invoice.ports}
                onChange={(e) => setInvoice({...invoice, ports: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Términos de Entrega</label>
              <input 
                type="text" 
                placeholder="ej. CIF (Cost, Insurance, and Freight)"
                value={invoice.deliveryTerms}
                onChange={(e) => setInvoice({...invoice, deliveryTerms: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Líneas de factura */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">Detalle de factura</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left border border-gray-300">Descripción</th>
                <th className="py-2 px-4 text-right border border-gray-300">Cantidad</th>
                <th className="py-2 px-4 text-right border border-gray-300">Precio unitario</th>
                <th className="py-2 px-4 text-right border border-gray-300">IVA %</th>
                <th className="py-2 px-4 text-right border border-gray-300">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-4 border border-gray-300">{item.description}</td>
                  <td className="py-2 px-4 text-right border border-gray-300">{item.quantity}</td>
                  <td className="py-2 px-4 text-right border border-gray-300">{item.unitPrice.toFixed(2)} €</td>
                  <td className="py-2 px-4 text-right border border-gray-300">{item.taxRate}%</td>
                  <td className="py-2 px-4 text-right border border-gray-300">{item.totalValue.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen */}
        <div className="mb-6 flex justify-end">
          <div className="w-64 border border-gray-300 rounded-md overflow-hidden">
            <div className="flex justify-between py-2 px-4 bg-gray-50 border-b">
              <span className="font-medium">Subtotal:</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between py-2 px-4 bg-white border-b">
              <span className="font-medium">IVA:</span>
              <span>{taxAmount.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between py-3 px-4 bg-gray-100 font-bold">
              <span>Total:</span>
              <span>{totalAmount.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Notas */}
        {invoice.invoiceNotes && (
          <div className="mb-8 border border-gray-200 rounded-md p-4 bg-gray-50">
            <h2 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-1">Notas</h2>
            <p className="text-gray-700 whitespace-pre-line">{invoice.invoiceNotes}</p>
          </div>
        )}
        
        {/* Pie de página */}
        <div className="mt-10 pt-4 border-t text-center text-gray-500 text-xs">
          <p>Esta factura ha sido generada por TriCycle CRM</p>
          <p>www.tricyclecrm.com | soporte@tricyclecrm.com | +34 912 345 678</p>
        </div>
      </div>
    );
  }
);

InvoicePrintView.displayName = 'InvoicePrintView';

export default function EditCustomerInvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const printComponentRef = useRef<HTMLDivElement>(null);
  const [clientesList, setClientesList] = useState<{id: string, nombre: string}[]>([]);
  
  // Estado para la factura
  const [invoice, setInvoice] = useState<Invoice>({
    id: params.id,
    number: '',
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    taxId: '',
    paymentTerms: '',
    invoiceNotes: '',
    estado: 'pendiente',
    items: [
      {
        id: '1',
        description: '',
        quantity: 0,
        unitPrice: 0,
        taxRate: 21,
        totalValue: 0
      }
    ],
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    bankAccount: 'Santander S.A. - ES6000495332142610008899 - USD',
    ports: '',
    deliveryTerms: ''
  });

  // Cargar lista de clientes al iniciar
  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const supabaseClient = getSupabaseClient();
        const { data, error } = await supabaseClient
          .from('clientes')
          .select('id, nombre')
          .order('nombre');
          
        if (error) {
          console.error('Error cargando clientes:', error);
          return;
        }
        
        setClientesList(data || []);
      } catch (err) {
        console.error('Error al cargar los clientes:', err);
      }
    };
    
    cargarClientes();
  }, []);

  // Cargar datos de la factura
  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('facturas_cliente')
          .select('*')
          .eq('id', params.id)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          // Parsear el campo material que contiene datos adicionales
          const materialData: NotasData = data.material ? JSON.parse(data.material) : {};
          
          // Construir el objeto de factura
          const facturaData: Invoice = {
            id: data.id,
            number: data.id_externo || '',
            date: data.fecha || new Date().toISOString().split('T')[0],
            customerName: materialData.cliente_nombre || '',
            taxId: materialData.taxId || '',
            paymentTerms: materialData.paymentTerms || '',
            invoiceNotes: materialData.notas || '',
            estado: data.estado || 'pendiente',
            items: materialData.items || [{
              id: '1',
              description: '',
              quantity: 0,
              unitPrice: 0,
              taxRate: 21,
              totalValue: 0
            }],
            subtotal: data.monto || 0,
            taxAmount: (data.monto || 0) * 0.21,
            totalAmount: (data.monto || 0) * 1.21,
            bankAccount: 'Santander S.A. - ES6000495332142610008899 - USD',
            ports: materialData.ports || '',
            deliveryTerms: materialData.deliveryTerms || ''
          };
          
          setInvoice(facturaData);
        }
      } catch (error) {
        console.error('Error al cargar la factura:', error);
        alert('Error al cargar los datos de la factura');
      }
    };
    
    loadInvoice();
  }, [params.id]);

  const handleCancel = () => {
    router.push(`/facturas?tab=customer`);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validar campos obligatorios
      if (!invoice.customerName) {
        alert('Por favor, seleccione un cliente');
        setLoading(false);
        return;
      }
      
      const supabase = getSupabaseClient();
      
      // Obtener el ID del cliente seleccionado
      let cliente_id = null;
      const clienteSeleccionado = clientesList.find(c => c.nombre === invoice.customerName);
      if (clienteSeleccionado) {
        cliente_id = clienteSeleccionado.id;
      }
      
      // Recalcular totales
      const subtotal = invoice.items.reduce((sum, item) => sum + item.totalValue, 0);
      const taxAmount = invoice.items.reduce((sum, item) => sum + (item.totalValue * (item.taxRate / 100)), 0);
      const totalAmount = subtotal + taxAmount;
      
      // Preparar datos para guardar en Supabase
      const facturaData = {
        id_externo: invoice.number,
        fecha: invoice.date,
        cliente_id: cliente_id,
        monto: invoice.totalAmount,
        material: JSON.stringify({
          cliente_nombre: invoice.customerName,
          taxId: invoice.taxId,
          paymentTerms: invoice.paymentTerms,
          ports: invoice.ports,
          deliveryTerms: invoice.deliveryTerms,
          notas: invoice.invoiceNotes,
          items: invoice.items,
          descripcion: invoice.items[0]?.description || ''
        }),
        notas: invoice.invoiceNotes,
        estado: invoice.estado
      };
      
      console.log('Actualizando factura:', facturaData);
      
      // Actualizar factura en Supabase
      const { error: updateError } = await supabase
        .from('facturas_cliente')
        .update(facturaData)
        .eq('id', invoice.id);
      
      if (updateError) {
        throw new Error(`Error al actualizar la factura: ${updateError.message}`);
      }
      
      alert('Factura actualizada correctamente');
      
      // Redirigir de vuelta a la página de facturas
      router.push(`/facturas?tab=customer`);
    } catch (error) {
      console.error('Error al actualizar la factura:', error);
      setError(`Error al actualizar la factura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...invoice.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Recalcular el valor total si cambia la cantidad o el precio unitario
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalValue = 
        updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setInvoice({
      ...invoice,
      items: updatedItems
    });
  };

  const addNewItem = () => {
    setInvoice({
      ...invoice,
      items: [
        ...invoice.items,
        {
          id: Date.now().toString(),
          description: '',
          quantity: 0,
          weight: 0,
          unitPrice: 0,
          packaging: 'Type',
          totalValue: 0,
          taxRate: 21
        }
      ]
    });
  };

  const removeItem = (index: number) => {
    const updatedItems = [...invoice.items];
    updatedItems.splice(index, 1);
    setInvoice({
      ...invoice,
      items: updatedItems
    });
  };

  const handlePreviewPdf = async () => {
    if (!printComponentRef.current) return;
    
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
      <div className="bg-gray-50 min-h-screen pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-100 rounded-lg w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Cabecera */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={handleCancel}
                className="mr-3 text-gray-600 hover:text-gray-800"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-medium text-gray-800">Editar Factura</h1>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
              >
                <FiSave className="h-5 w-5 mr-2" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenido del formulario */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Factura Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Detalles de Factura</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Factura 
                <span className="ml-1 text-blue-500 text-xs font-normal">(editable)</span>
              </label>
              <input 
                type="text" 
                value={invoice.number}
                onChange={(e) => setInvoice({...invoice, number: e.target.value})}
                className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: INV-2023-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Factura</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={invoice.date}
                  onChange={(e) => setInvoice({...invoice, date: e.target.value})}
                  className="w-full p-2 border rounded-md pr-10"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiCalendar className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Customer Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Información del Cliente</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente</label>
              <div className="relative">
                <select 
                  className="w-full p-2 border rounded-md appearance-none"
                  value={invoice.customerName}
                  onChange={(e) => {
                    const nombreCliente = e.target.value;
                    setInvoice({...invoice, customerName: nombreCliente});
                    
                    // Buscar el ID fiscal del cliente seleccionado
                    const clienteSeleccionado = clientesList.find(c => c.nombre === nombreCliente);
                    if (clienteSeleccionado) {
                      // Obtener el ID fiscal de este cliente
                      const fetchClienteTaxId = async () => {
                        try {
                          const supabaseClient = getSupabaseClient();
                          const { data, error } = await supabaseClient
                            .from('clientes')
                            .select('id_fiscal')
                            .eq('id', clienteSeleccionado.id)
                            .single();
                            
                          if (!error && data) {
                            setInvoice(prev => ({...prev, taxId: data.id_fiscal || ''}));
                          }
                        } catch (err) {
                          console.error('Error al obtener ID fiscal:', err);
                        }
                      };
                      
                      fetchClienteTaxId();
                    }
                  }}
                >
                  {clientesList.map((cliente) => (
                    <option key={cliente.id} value={cliente.nombre}>{cliente.nombre}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Fiscal</label>
              <input 
                type="text" 
                placeholder="ej. XXXX30283-9-00"
                value={invoice.taxId}
                onChange={(e) => setInvoice({...invoice, taxId: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>
        
        {/* Términos de Entrega */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Términos de Entrega</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Puertos</label>
              <input 
                type="text" 
                placeholder="Ej: TEMA PORT - GHANA, BARCELONA - ESPAÑA"
                value={invoice.ports}
                onChange={(e) => setInvoice({...invoice, ports: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Términos de Entrega</label>
              <input 
                type="text" 
                placeholder="ej. CIF (Cost, Insurance, and Freight)"
                value={invoice.deliveryTerms}
                onChange={(e) => setInvoice({...invoice, deliveryTerms: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>
        
        {/* Payment Terms */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Términos de Pago</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Términos de Pago</label>
            <input 
              type="text" 
              placeholder="Ej: 30% PAGO POR ADELANTADO 70% PAGO CONTRA DOCUMENTOS"
              value={invoice.paymentTerms}
              onChange={(e) => setInvoice({...invoice, paymentTerms: e.target.value})}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
        
        {/* Good Descriptions */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Descripción de Bienes</h3>
          
          {/* Líneas de productos */}
          {invoice.items.map((item, index) => (
            <div key={item.id} className="mb-4 border rounded-md overflow-hidden">
              <div className="grid grid-cols-6 gap-2 p-3 bg-white">
                <div className="col-span-6 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                  <input 
                    type="text" 
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                  <input 
                    type="number" 
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Precio Unitario</label>
                  <input 
                    type="number" 
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Valor Total <span className="text-blue-500">auto</span></label>
                  <input 
                    type="text" 
                    value={item.totalValue.toFixed(2)}
                    className="w-full p-2 border rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
              <div className="flex justify-end border-t p-2 bg-white">
                <button 
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                  onClick={() => removeItem(index)}
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          
          {/* Nueva línea de producto (vacía) */}
          <div className="mb-4 border rounded-md overflow-hidden">
            <div className="grid grid-cols-6 gap-2 p-3 bg-white">
              <div className="col-span-6 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                <input 
                  type="text" 
                  placeholder="ej. PP PLASTICS"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                <input 
                  type="text" 
                  placeholder="ej. 3"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Precio Unitario</label>
                <input 
                  type="text" 
                  placeholder="ej. 80€"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Valor Total <span className="text-blue-500">auto</span></label>
                <input 
                  type="text" 
                  placeholder="ej. 80€"
                  className="w-full p-2 border rounded-md bg-gray-50"
                  readOnly
                />
              </div>
            </div>
            <div className="flex justify-end border-t p-2 bg-white">
              <button 
                className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                onClick={addNewItem}
              >
                <FiPlus className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value={invoice.subtotal.toFixed(2)}
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Impuestos <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value={invoice.taxAmount.toFixed(2)}
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value={invoice.totalAmount.toFixed(2)}
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
          </div>
        </div>
        
        {/* Bank Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Datos Bancarios</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Bancaria</label>
            <div className="relative">
              <select 
                className="w-full p-2 border rounded-md appearance-none"
                value={invoice.bankAccount}
                onChange={(e) => setInvoice({...invoice, bankAccount: e.target.value})}
              >
                <option>Santander S.A. - ES6000495332142610008899 - USD</option>
                <option>BBVA - ES9101822370420201558843 - EUR</option>
                <option>CaixaBank - ES7121000418401234567891 - USD</option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <FiChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Shipping Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Detalles de Envío</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea 
              placeholder="ej. INVO0149 HDPE PLASTIC SCRAP HS CODE 39151020 -CFR MERSIN PORT- TURKEY CONSIGNEE: OZ BESLENEN TARIMÜRUNLERI NAK. PET.TEKS. SAN VE TİC LTD ŞTİ. AKÇATAŞ MAH. 1CAD, NO:11-1 VİRANŞEHİR/ŞANLIURFA)"
              value={invoice.invoiceNotes}
              onChange={(e) => setInvoice({...invoice, invoiceNotes: e.target.value})}
              className="w-full p-2 border rounded-md h-24"
            ></textarea>
          </div>
        </div>
        
        {/* Pie con botones */}
        <div className="flex justify-end space-x-3 mt-6">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50">
            Exportar
          </button>
          <button 
            onClick={handlePreviewPdf}
            disabled={generatingPdf}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 flex items-center"
          >
            <FiFileText className="h-5 w-5 mr-2" />
            {generatingPdf ? 'Generando...' : 'Vista Previa PDF'}
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
          >
            <FiSave className="h-5 w-5 mr-2" />
            Guardar
          </button>
        </div>
      </div>
      
      {/* Componente oculto para la vista de impresión */}
      <InvoicePrintView invoice={invoice} ref={printComponentRef} />
    </div>
  );
} 
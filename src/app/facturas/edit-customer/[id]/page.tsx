'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiChevronDown, 
  FiPlus, 
  FiTrash2,
  FiSave,
  FiAlertTriangle,
  FiFileText,
  FiSearch
} from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ClienteSelector, { Cliente } from '@/components/cliente-selector';
import { PUERTOS_SUGERIDOS, TERMINOS_PAGO_SUGERIDOS } from '@/lib/constants';
import InvoicePrintView from '@/components/invoice-print-view';
import { useCuentasBancarias, CuentaBancaria, getCuentasBancariasFallback } from '@/hooks/useCuentasBancarias';

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
  packagingType?: string;
}

// Interfaz para los datos almacenados en el campo material
interface NotasData {
  cliente_nombre?: string;
  taxId?: string;
  paymentTerms?: string;
  notas?: string;
  items?: InvoiceItem[];
  descripcion?: string;
  deliveryTerms?: string;
  puerto_origen?: string;
  puerto_destino?: string;
  pesoTotal?: number;
  // Claves abreviadas
  cn?: string;
  tax?: string;
  pt?: string;
  dt?: string;
  po?: string;
  pd?: string;
  peso?: number;
  cont?: string;
  orig?: string;
  items_resumen?: any[];
  contenedores?: string;
  origen?: string;
  // Campos de dirección
  direccion?: string;
  ciudad?: string;
  pais?: string;
  codigo_postal?: string;
  // Claves abreviadas para dirección
  dir?: string;
  ciu?: string;
  pa?: string;
  cp?: string;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  customerName: string;
  taxId: string;
  paymentTerms: string;
  invoiceNotes: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  bankAccount: string;
  estado: string;
  puerto_origen: string;
  puerto_destino: string;
  deliveryTerms: string;
  origen?: string;
  contenedores?: string;
  pesoTotal?: number;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  codigo_postal?: string;
}

export default function EditCustomerInvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const printComponentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice>({
    id: '',
    number: '',
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    taxId: '',
    paymentTerms: '',
    invoiceNotes: '',
    estado: 'pendiente',
    items: [{
      id: '1',
      description: '',
      quantity: 0,
      unitPrice: 0,
      taxRate: 21,
      totalValue: 0,
      weight: 0,
      packaging: '',
      packagingType: ''
    }],
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    bankAccount: 'Santander S.A. - ES6000495332142610008899 - USD',
    puerto_origen: '',
    puerto_destino: '',
    deliveryTerms: '',
    origen: '',
    contenedores: '',
    pesoTotal: 0,
    direccion: '',
    ciudad: '',
    pais: '',
    codigo_postal: ''
  });
  
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showPortSuggestions, setShowPortSuggestions] = useState(false);
  const [showPortDestSuggestions, setShowPortDestSuggestions] = useState(false);
  const [showPaymentTermsSuggestions, setShowPaymentTermsSuggestions] = useState(false);

  // Obtener cuentas bancarias desde la base de datos
  const { cuentas: cuentasBancarias, loading: loadingCuentas, error: errorCuentas } = useCuentasBancarias();

  // Manejador para cerrar la lista de sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.ports-combobox')) {
        setShowPortSuggestions(false);
      }
      if (!target.closest('.ports-combobox-dest')) {
        setShowPortDestSuggestions(false);
      }
      if (!target.closest('.payment-terms-combobox')) {
        setShowPaymentTermsSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cargar lista de clientes al iniciar
  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const supabaseClient = getSupabaseClient();
        const { data, error } = await supabaseClient
          .from('clientes')
          .select('id, nombre, id_fiscal, email, ciudad, telefono')
          .order('nombre');
          
        if (error) {
          console.error('Error cargando clientes:', error);
          return;
        }
        
        // Convertir explícitamente los IDs de string a number para que coincidan con la interfaz Cliente
        const clientesConIdNumerico = (data || []).map(cliente => ({
          ...cliente,
          id: typeof cliente.id === 'string' ? parseInt(cliente.id, 10) : cliente.id
        }));
        
        setClientesList(clientesConIdNumerico);
      } catch (err) {
        console.error('Error al cargar los clientes:', err);
      }
    };
    
    cargarClientes();
  }, []);

  // Cargar datos de la factura
  useEffect(() => {
    const loadInvoice = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Cargando factura con ID:', params.id);
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('facturas_cliente')
          .select('*')
          .eq('id', params.id)
          .single();
          
        if (error) {
          console.error('Error al consultar la factura:', error);
          throw error;
        }
        
        if (!data) {
          console.error('No se encontró la factura con ID:', params.id);
          throw new Error(`No se encontró la factura con ID: ${params.id}`);
        }
        
        console.log('Datos de factura recibidos:', data);
        
        // Parsear el campo material que contiene datos adicionales
        let materialData: NotasData = {};
        try {
          materialData = data.material ? JSON.parse(data.material) : {};
        } catch (parseError) {
          console.error('Error al parsear el campo material:', parseError);
          materialData = {};
        }
        
        // Extraer datos usando tanto las claves completas como las abreviadas
        const customerName = materialData.cliente_nombre || materialData.cn || '';
        const taxId = materialData.taxId || materialData.tax || '';
        const paymentTerms = materialData.paymentTerms || materialData.pt || '';
        const deliveryTerms = materialData.deliveryTerms || materialData.dt || '';
        const invoiceNotes = materialData.notas || data.notas || '';
        const puerto_origen = materialData.puerto_origen || materialData.po || '';
        const puerto_destino = materialData.puerto_destino || materialData.pd || '';
        const pesoTotal = materialData.pesoTotal || materialData.peso || 0;
        const contenedores = materialData.contenedores || materialData.cont || '';
        const origen = materialData.origen || materialData.orig || '';
        const direccion = materialData.direccion || materialData.dir || '';
        const ciudad = materialData.ciudad || materialData.ciu || '';
        const pais = materialData.pais || materialData.pa || '';
        const codigo_postal = materialData.codigo_postal || materialData.cp || '';
        
        // Obtener información adicional del cliente si no tenemos los datos de dirección
        let clienteDireccion = direccion || '';
        let clienteCiudad = ciudad || '';
        let clientePais = pais || '';
        let clienteCP = codigo_postal || '';
        
        // Si no hay información de dirección y tenemos el cliente_id, buscar los datos del cliente
        if ((!clienteDireccion || !clienteCiudad || !clientePais) && data.cliente_id) {
          try {
            const { data: clienteData, error: clienteError } = await supabase
              .from('clientes')
              .select('direccion, ciudad, pais, codigo_postal')
              .eq('id', data.cliente_id)
              .single();
              
            if (!clienteError && clienteData) {
              clienteDireccion = clienteDireccion || clienteData.direccion;
              clienteCiudad = clienteCiudad || clienteData.ciudad;
              clientePais = clientePais || clienteData.pais;
              clienteCP = clienteCP || clienteData.codigo_postal;
            }
          } catch (clienteError) {
            console.error('Error al obtener datos del cliente:', clienteError);
          }
        }
        
        // Parsear los items cuando están disponibles
        let items: InvoiceItem[] = [];
        try {
          if (data.items) {
            items = JSON.parse(data.items);
          } else if (materialData.items_completos) {
            // Usar los items completos si están disponibles
            items = materialData.items_completos;
          } else if (materialData.items) {
            items = materialData.items;
          } else {
            items = [{
              id: '1',
              description: '',
              quantity: 0,
              unitPrice: 0,
              taxRate: 21,
              totalValue: 0,
              weight: 0,
              packaging: '',
              packagingType: ''
            }];
          }
        } catch (parseError) {
          console.error('Error al parsear los items:', parseError);
          items = [{
            id: '1',
            description: '',
            quantity: 0,
            unitPrice: 0,
            taxRate: 21,
            totalValue: 0,
            weight: 0,
            packaging: '',
            packagingType: ''
          }];
        }
        
        // Obtener cuentas bancarias de fallback si no hay cuentas de la BD
        const cuentasBancariasDisponibles = cuentasBancarias.length > 0 
          ? cuentasBancarias 
          : getCuentasBancariasFallback();
        
        // Encontrar la cuenta bancaria correspondiente o usar la primera disponible
        const cuentaSeleccionada = data.cuenta_bancaria 
          ? cuentasBancariasDisponibles.find(c => c.descripcion === data.cuenta_bancaria) 
          : null;
        
        // Construir el objeto de factura
        const facturaData: Invoice = {
          id: data.id,
          number: data.id_externo || '',
          date: data.fecha || new Date().toISOString().split('T')[0],
          customerName: customerName,
          taxId: taxId,
          paymentTerms: paymentTerms,
          invoiceNotes: invoiceNotes,
          estado: data.estado || 'pendiente',
          items: items,
          subtotal: data.monto || 0,
          taxAmount: (data.monto || 0) * 0.21,
          totalAmount: (data.monto || 0) * 1.21,
          bankAccount: data.cuenta_bancaria || (cuentasBancariasDisponibles.length > 0 ? cuentasBancariasDisponibles[0].descripcion : ''),
          puerto_origen: puerto_origen,
          puerto_destino: puerto_destino,
          deliveryTerms: deliveryTerms,
          origen: origen,
          contenedores: contenedores,
          pesoTotal: pesoTotal,
          direccion: clienteDireccion,
          ciudad: clienteCiudad,
          pais: clientePais,
          codigo_postal: clienteCP
        };
        
        console.log('Objeto de factura construido:', facturaData);
        setInvoice(facturaData);
      } catch (error) {
        console.error('Error al cargar la factura:', error);
        setError(`Error al cargar los datos de la factura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadInvoice();
  }, [params.id, cuentasBancarias]);

  // Validar y corregir valores undefined después de cargar la factura
  useEffect(() => {
    if (!loading && invoice) {
      // Verificar y corregir valores undefined en el objeto principal
      const validatedInvoice = { ...invoice };
      
      // Definir campos y sus valores por defecto
      const defaultValues: Record<string, any> = {
        customerName: '',
        taxId: '',
        paymentTerms: '',
        invoiceNotes: '',
        puerto_origen: '',
        puerto_destino: '',
        deliveryTerms: '',
        origen: '',
        contenedores: '',
        pesoTotal: 0,
        direccion: '',
        ciudad: '',
        pais: '',
        codigo_postal: ''
      };
      
      // Aplicar valores por defecto donde sea necesario
      Object.entries(defaultValues).forEach(([field, defaultValue]) => {
        if (validatedInvoice[field] === undefined) {
          validatedInvoice[field] = defaultValue;
        }
      });
      
      // Verificar y corregir elementos en la matriz de items
      if (validatedInvoice.items && Array.isArray(validatedInvoice.items)) {
        validatedInvoice.items = validatedInvoice.items.map(item => ({
          id: item.id || `item_${Math.random().toString(36).substr(2, 9)}`,
          description: item.description || '',
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          taxRate: item.taxRate || 21,
          totalValue: item.totalValue || 0,
          weight: item.weight || 0,
          packaging: item.packaging || '',
          packagingType: item.packagingType || ''
        }));
      }
      
      // Actualizar el estado solo si hubo cambios
      if (JSON.stringify(validatedInvoice) !== JSON.stringify(invoice)) {
        console.log('Corrigiendo valores undefined en la factura');
        setInvoice(validatedInvoice);
      }
    }
  }, [loading, invoice]);

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
      
      // Calcular peso total
      const pesoTotal = invoice.items.reduce((sum, item) => sum + (item.weight || 0), 0);
      
      // Preparar datos para guardar en Supabase
      const facturaData = {
        id_externo: invoice.number,
        fecha: invoice.date,
        cliente_id: cliente_id,
        monto: subtotal,
        material: JSON.stringify({
          cn: invoice.customerName ? invoice.customerName.substring(0, 30) : "",
          tax: invoice.taxId || "",
          pt: invoice.paymentTerms ? invoice.paymentTerms.substring(0, 30) : "",
          dt: invoice.deliveryTerms || "",
          desc: invoice.items[0]?.description ? invoice.items[0].description.substring(0, 20) : "",
          pd: invoice.puerto_destino ? invoice.puerto_destino.substring(0, 30) : "",
          po: invoice.puerto_origen ? invoice.puerto_origen.substring(0, 30) : "",
          peso: invoice.pesoTotal || 0,
          cont: invoice.contenedores || "",
          orig: invoice.origen || "",
          dir: invoice.direccion || "",
          ciu: invoice.ciudad || "",
          pa: invoice.pais || "",
          cp: invoice.codigo_postal || "",
          // Guardar los items completos
          items_completos: invoice.items,
          // Mantener el resumen para compatibilidad con versiones anteriores
          items: invoice.items.map(item => ({
            d: item.description ? item.description.substring(0, 15) : "",
            q: item.quantity,
            p: item.unitPrice,
            t: item.packagingType ? item.packagingType.substring(0, 1) : ""
          }))
        }),
        notas: invoice.invoiceNotes ? invoice.invoiceNotes.substring(0, 200) : "",
        estado: invoice.estado,
        // Guardar los puertos en sus columnas específicas
        puerto_origen: invoice.puerto_origen || "",
        puerto_destino: invoice.puerto_destino || "",
        // Añadir la cuenta bancaria seleccionada
        cuenta_bancaria: invoice.bankAccount || ""
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
      
      // NUEVO: Actualizar los items en la tabla facturas_items
      try {
        // 1. Primero eliminamos los items existentes para esta factura
        const { error: deleteError } = await supabase
          .from('facturas_items')
          .delete()
          .eq('factura_id', invoice.id);
          
        if (deleteError) {
          console.error('Error al eliminar items antiguos:', deleteError);
          // Continuamos aunque haya error, para intentar insertar los nuevos
        }
        
        // 2. Luego insertamos los nuevos items
        if (invoice.items && invoice.items.length > 0) {
          const itemsToInsert = invoice.items.map(item => ({
            factura_id: invoice.id,
            descripcion: item.description || 'Sin descripción',
            cantidad: item.quantity || 1,
            peso: item.weight || null,
            peso_unidad: 'MT',
            precio_unitario: item.unitPrice || 0,
            total: item.totalValue || 0,
            codigo: item.packaging || null
          }));
          
          const { error: insertError } = await supabase
            .from('facturas_items')
            .insert(itemsToInsert);
            
          if (insertError) {
            console.error('Error al insertar nuevos items:', insertError);
            // Alertamos pero no interrumpimos el flujo
            console.warn('Los items no se guardaron correctamente en la tabla facturas_items');
          } else {
            console.log('Items guardados correctamente en facturas_items');
          }
        }
      } catch (itemsError) {
        console.error('Error en el proceso de actualización de items:', itemsError);
        // No interrumpimos el flujo principal por esto
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
    
    // Calcular subtotal, impuestos y total
    const subtotal = updatedItems.reduce((sum, item) => sum + item.totalValue, 0);
    const taxAmount = updatedItems.reduce((sum, item) => sum + (item.totalValue * (item.taxRate / 100)), 0);
    const totalAmount = subtotal + taxAmount; // El total incluye el IVA pero solo para mostrar
    
    // Calcular peso total
    const pesoTotal = updatedItems.reduce((sum, item) => sum + (item.weight || 0), 0);
    
    setInvoice({
      ...invoice,
      items: updatedItems,
      subtotal, // El subtotal es el monto sin IVA
      taxAmount,
      totalAmount, // El totalAmount incluye el IVA pero solo se usa para mostrar
      pesoTotal
    });
  };

  const addNewItem = () => {
    const newItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 0,
      weight: 0,
      unitPrice: 0,
      packaging: 'Type',
      packagingType: '',
      totalValue: 0,
      taxRate: 21
    };
    
    const updatedItems = [...invoice.items, newItem];
    
    // Recalcular totales
    const subtotal = updatedItems.reduce((sum, item) => sum + item.totalValue, 0);
    const taxAmount = updatedItems.reduce((sum, item) => sum + (item.totalValue * (item.taxRate / 100)), 0);
    const totalAmount = subtotal + taxAmount; // El total incluye el IVA pero solo para mostrar
    
    // Calcular peso total
    const pesoTotal = updatedItems.reduce((sum, item) => sum + (item.weight || 0), 0);
    
    setInvoice({
      ...invoice,
      items: updatedItems,
      subtotal, // Guardamos el subtotal sin IVA
      taxAmount,
      totalAmount, // Solo para mostrar
      pesoTotal
    });
  };

  const removeItem = (index: number) => {
    const updatedItems = [...invoice.items];
    updatedItems.splice(index, 1);
    
    // Recalcular totales
    const subtotal = updatedItems.reduce((sum, item) => sum + item.totalValue, 0);
    const taxAmount = updatedItems.reduce((sum, item) => sum + (item.totalValue * (item.taxRate / 100)), 0);
    const totalAmount = subtotal + taxAmount; // El total incluye el IVA pero solo para mostrar
    
    // Calcular peso total
    const pesoTotal = updatedItems.reduce((sum, item) => sum + (item.weight || 0), 0);
    
    setInvoice({
      ...invoice,
      items: updatedItems,
      subtotal, // Guardamos el subtotal sin IVA como monto principal
      taxAmount,
      totalAmount, // Solo para mostrar
      pesoTotal
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

  // Función para manejar cuando se selecciona un cliente de la lista
  const handleClienteSelect = (clienteSeleccionado: Cliente) => {
    console.log('Cliente seleccionado:', clienteSeleccionado);
    
    if (clienteSeleccionado) {
      // Actualizar la factura con la información del cliente
      setInvoice(prev => ({
        ...prev,
        customerName: clienteSeleccionado.nombre || '',
        taxId: clienteSeleccionado.id_fiscal || '',
        // Añadir otros campos del cliente si están disponibles
        direccion: clienteSeleccionado.direccion || '',
        ciudad: clienteSeleccionado.ciudad || '',
        pais: clienteSeleccionado.pais || '',
        codigo_postal: clienteSeleccionado.codigo_postal || ''
      }));
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
              <ClienteSelector 
                value={invoice.customerName}
                clientesList={clientesList}
                onChange={(nombreCliente) => {
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
                placeholder="Seleccionar cliente"
              />
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puerto de Descarga</label>
            <div className="relative ports-combobox-dest">
              <input 
                type="text" 
                placeholder="Buscar o escribir puerto de destino..."
                value={invoice.puerto_destino}
                onChange={(e) => {
                  setInvoice({...invoice, puerto_destino: e.target.value});
                }}
                onFocus={() => setShowPortDestSuggestions(true)}
                className="w-full p-2 border rounded-md pr-10"
              />
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              
              {/* Lista de sugerencias */}
              {showPortDestSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {PUERTOS_SUGERIDOS
                    .filter(port => 
                      port.toLowerCase().includes(invoice.puerto_destino.toLowerCase())
                    )
                    .map((port, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setInvoice({...invoice, puerto_destino: port});
                          setShowPortDestSuggestions(false);
                        }}
                      >
                        {port}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Payment Terms */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Términos de Pago</h3>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Términos de Pago</label>
            <div className="relative payment-terms-combobox">
              <input 
                type="text" 
                placeholder="Buscar o escribir términos de pago..."
                value={invoice.paymentTerms}
                onChange={(e) => {
                  setInvoice({...invoice, paymentTerms: e.target.value});
                }}
                onFocus={() => setShowPaymentTermsSuggestions(true)}
                className="w-full p-2 border rounded-md pr-10"
              />
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              
              {/* Lista de sugerencias */}
              {showPaymentTermsSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {TERMINOS_PAGO_SUGERIDOS
                    .filter(term => 
                      term.toLowerCase().includes(invoice.paymentTerms.toLowerCase())
                    )
                    .map((term, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setInvoice({...invoice, paymentTerms: term});
                          setShowPaymentTermsSuggestions(false);
                        }}
                      >
                        {term}
                      </div>
                    ))}
                </div>
              )}
            </div>
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
                  <label className="block text-xs font-medium text-gray-500 mb-1">Peso (MT)</label>
                  <input 
                    type="number" 
                    value={item.weight || 0}
                    onChange={(e) => handleItemChange(index, 'weight', parseFloat(e.target.value) || 0)}
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
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tipo Empaque</label>
                  <select 
                    className="w-full p-2 border rounded-md appearance-none"
                    value={item.packagingType || ''}
                    onChange={(e) => handleItemChange(index, 'packagingType', e.target.value)}
                  >
                    <option value="">Tipo</option>
                    <option value="Bales">Bales</option>
                    <option value="Bags">Bags</option>
                    <option value="Bulk">Bulk</option>
                  </select>
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Valor Total <span className="text-blue-500">auto</span></label>
                  <input 
                    type="text" 
                    value={(item.totalValue || 0).toFixed(2)}
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
                  placeholder="Descripción del producto"
                  className="w-full p-2 border rounded-md"
                  id="new-item-description"
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                <input 
                  type="number" 
                  placeholder="0"
                  className="w-full p-2 border rounded-md"
                  id="new-item-quantity"
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Peso (MT)</label>
                <input 
                  type="number" 
                  placeholder="0"
                  className="w-full p-2 border rounded-md"
                  id="new-item-weight"
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Precio Unitario</label>
                <input 
                  type="number" 
                  placeholder="0"
                  className="w-full p-2 border rounded-md"
                  id="new-item-price"
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo Empaque</label>
                <select 
                  className="w-full p-2 border rounded-md appearance-none"
                  id="new-item-packaging"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Bales">Bales</option>
                  <option value="Bags">Bags</option>
                  <option value="Bulk">Bulk</option>
                </select>
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Valor Total <span className="text-blue-500">auto</span></label>
                <input 
                  type="text" 
                  placeholder="0.00"
                  className="w-full p-2 border rounded-md bg-gray-50"
                  readOnly
                />
              </div>
            </div>
            <div className="flex justify-end border-t p-2 bg-white">
              <button 
                className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                onClick={() => {
                  // Obtener los valores de los campos
                  const description = (document.getElementById('new-item-description') as HTMLInputElement)?.value || '';
                  const quantity = parseFloat((document.getElementById('new-item-quantity') as HTMLInputElement)?.value || '0');
                  const weight = parseFloat((document.getElementById('new-item-weight') as HTMLInputElement)?.value || '0');
                  const unitPrice = parseFloat((document.getElementById('new-item-price') as HTMLInputElement)?.value || '0');
                  const packagingType = (document.getElementById('new-item-packaging') as HTMLSelectElement)?.value || '';
                  
                  // Crear un nuevo item con estos valores
                  const newItem = {
                    id: Date.now().toString(),
                    description,
                    quantity,
                    weight,
                    unitPrice,
                    packaging: '',
                    packagingType,
                    totalValue: quantity * unitPrice,
                    taxRate: 21
                  };
                  
                  // Añadir el nuevo item al array
                  const updatedItems = [...invoice.items, newItem];
                  
                  // Recalcular totales
                  const subtotal = updatedItems.reduce((sum, item) => sum + item.totalValue, 0);
                  const taxAmount = updatedItems.reduce((sum, item) => sum + (item.totalValue * (item.taxRate / 100)), 0);
                  const totalAmount = subtotal + taxAmount;
                  
                  // Calcular peso total
                  const pesoTotal = updatedItems.reduce((sum, item) => sum + (item.weight || 0), 0);
                  
                  // Actualizar el estado
                  setInvoice({
                    ...invoice,
                    items: updatedItems,
                    subtotal,
                    taxAmount,
                    totalAmount,
                    pesoTotal
                  });
                  
                  // Limpiar los campos
                  if (document.getElementById('new-item-description')) {
                    (document.getElementById('new-item-description') as HTMLInputElement).value = '';
                  }
                  if (document.getElementById('new-item-quantity')) {
                    (document.getElementById('new-item-quantity') as HTMLInputElement).value = '';
                  }
                  if (document.getElementById('new-item-weight')) {
                    (document.getElementById('new-item-weight') as HTMLInputElement).value = '';
                  }
                  if (document.getElementById('new-item-price')) {
                    (document.getElementById('new-item-price') as HTMLInputElement).value = '';
                  }
                  if (document.getElementById('new-item-packaging')) {
                    (document.getElementById('new-item-packaging') as HTMLSelectElement).value = '';
                  }
                }}
                title="Añadir nueva línea"
              >
                <FiPlus className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origen <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                name="origen"
                value={invoice.puerto_origen || "Spain"}
                onChange={(e) => setInvoice({...invoice, puerto_origen: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenedores <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value={invoice.contenedores || "0"}
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso Total (MT) <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value={(invoice.pesoTotal || 0).toFixed(2)}
                className="w-full p-2 border rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total <span className="text-blue-500">auto</span></label>
              <input 
                type="text" 
                value={invoice.subtotal.toFixed(2)}
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
              {loadingCuentas ? (
                <div className="w-full p-2 border rounded-md">Cargando cuentas bancarias...</div>
              ) : (
                <select 
                  className="w-full p-2 border rounded-md appearance-none"
                  value={invoice.bankAccount}
                  onChange={(e) => setInvoice({...invoice, bankAccount: e.target.value})}
                >
                  {(cuentasBancarias.length > 0 ? cuentasBancarias : getCuentasBancariasFallback()).map(cuenta => (
                    <option key={cuenta.id} value={cuenta.descripcion}>
                      {cuenta.nombre} - {cuenta.banco} ({cuenta.moneda})
                    </option>
                  ))}
                </select>
              )}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <FiChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          {/* Mostrar detalles bancarios */}
          {invoice.bankAccount && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
              {(cuentasBancarias.length > 0 ? cuentasBancarias : getCuentasBancariasFallback())
                .filter(cuenta => cuenta.descripcion === invoice.bankAccount)
                .map(cuenta => (
                  <div key={cuenta.id}>
                    <p><span className="font-medium">Banco:</span> {cuenta.banco}</p>
                    <p><span className="font-medium">IBAN:</span> {cuenta.iban}</p>
                    <p><span className="font-medium">SWIFT:</span> {cuenta.swift}</p>
                    <p><span className="font-medium">Moneda:</span> {cuenta.moneda}</p>
                    <p><span className="font-medium">Beneficiario:</span> {cuenta.beneficiario}</p>
                  </div>
                ))
              }
            </div>
          )}
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
      <InvoicePrintView 
        invoice={{
          ...invoice,
          // Asegurar que todos los campos necesarios estén disponibles
          subtotal: invoice.subtotal || 0,
          taxAmount: invoice.taxAmount || 0,
          totalAmount: invoice.totalAmount || 0,
          puerto_origen: invoice.puerto_origen || '',
          puerto_destino: invoice.puerto_destino || '',
          origen: invoice.origen || '',
          contenedores: invoice.contenedores || '0',
          pesoTotal: invoice.pesoTotal || 0,
          items: invoice.items.map(item => ({
            ...item,
            description: item.description || '',
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || 0,
            totalValue: item.totalValue || 0,
            weight: item.weight || 0,
            packagingType: item.packagingType || ''
          }))
        }} 
        ref={printComponentRef} 
      />
    </div>
  );
} 
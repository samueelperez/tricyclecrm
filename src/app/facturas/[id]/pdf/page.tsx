'use client';

import { useEffect, useState, useRef, forwardRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getSupabaseClient } from '@/lib/supabase';
import Image from 'next/image';
import { FiDownload, FiLoader, FiArrowLeft, FiEye } from 'react-icons/fi';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useCuentasBancarias, getCuentasBancariasFallback } from '@/hooks/useCuentasBancarias';

// Interfaz para la factura
interface Factura {
  id: string;
  id_externo?: string;
  numero_factura?: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  cliente_id?: number | null;
  cliente?: any;
  cliente_nombre?: string;
  cliente_direccion?: string;
  cliente_ciudad?: string;
  cliente_pais?: string;
  cliente_cp?: string;
  cliente_id_fiscal?: string;
  id_fiscal?: string;
  total: number;
  estado: string;
  divisa?: string;
  notas?: string;
  tipo?: 'cliente' | 'proveedor';
  items?: FacturaItem[];
  clientes_adicionales?: FacturaCliente[];
  cuenta_bancaria?: string;
  puerto_origen?: string;
  puerto_destino?: string;
  nombre_archivo?: string;
  created_at?: string;
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

interface FacturaCliente {
  id: string;
  nombre: string;
  porcentaje?: number;
  productos?: string[];
}

// Componente para la vista de impresión de factura
const FacturaPrintView = forwardRef<HTMLDivElement, { factura: Factura; numeroFactura: string, nombreDestinatario: string, multiClientes: FacturaCliente[] }>((props, ref) => {
  const { factura, numeroFactura, nombreDestinatario, multiClientes } = props;
  
  // Usar el hook para obtener las cuentas bancarias
  const { cuentas: cuentasBancarias } = useCuentasBancarias();
  const cuentasBancariasDisponibles = cuentasBancarias.length > 0 
    ? cuentasBancarias 
    : getCuentasBancariasFallback();
  
  // Formatear la fecha
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    
    try {
      const date = new Date(dateStr);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.error('Fecha inválida:', dateStr);
        return 'N/A';
      }
      
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '/');
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return 'N/A';
    }
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
  
  // Depuración de cálculos
  console.log('Cálculos de factura:', {
    items: factura.items?.map(item => ({
      descripcion: item.descripcion,
      precio_unitario: item.precio_unitario,
      cantidad: item.cantidad,
      peso: item.peso,
      total_guardado: item.total,
      total_calculado_peso: item.peso ? item.precio_unitario * item.peso : null,
      total_calculado_cantidad: item.cantidad ? item.precio_unitario * item.cantidad : item.precio_unitario
    })),
    total_factura: factura.total,
    total_calculado: factura.items?.reduce((sum, item) => {
      const itemTotal = item.peso 
        ? item.precio_unitario * item.peso 
        : item.precio_unitario * (item.cantidad || 1);
      return sum + (Number.isFinite(itemTotal) ? itemTotal : (item.total || 0));
    }, 0)
  });
  
  // Obtener dirección del destinatario
  const getDireccionDestinatario = () => {
    if (factura.tipo === 'proveedor') {
      return factura.cliente_direccion || '';
    } else {
      // Para facturas de cliente, intentamos obtener la dirección de varias fuentes posibles
      return factura.cliente?.direccion || 
             factura.cliente_direccion || 
             (factura.cliente && typeof factura.cliente === 'object' ? factura.cliente.direccion : '') || 
             '';
    }
  };
  
  // Obtener Tax ID del destinatario
  const getTaxIDDestinatario = () => {
    if (factura.tipo === 'proveedor') {
      return factura.id_fiscal || '';
    } else {
      // Para facturas de cliente, intentamos obtener el ID fiscal de varias fuentes posibles
      return factura.id_fiscal || 
             factura.cliente_id_fiscal || 
             (factura.cliente && typeof factura.cliente === 'object' ? factura.cliente.id_fiscal : '') || 
             '';
    }
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

  // Función para obtener detalles bancarios
  function getBankDetails(cuenta_bancaria?: string) {
    if (!cuenta_bancaria) return { banco: '', iban: '', moneda: '', swift: '', beneficiario: '' };
    
    // Buscar la cuenta bancaria en la lista de cuentas
    const cuentaBancaria = cuentasBancariasDisponibles.find(cuenta => cuenta.descripcion === cuenta_bancaria);
    
    if (cuentaBancaria) {
      return {
        banco: cuentaBancaria.banco,
        iban: cuentaBancaria.iban,
        moneda: cuentaBancaria.moneda,
        swift: cuentaBancaria.swift,
        beneficiario: cuentaBancaria.beneficiario
      };
    }
    
    // Si no se encuentra en las predefinidas, intentar parsear el formato antiguo
    const bankDetails = cuenta_bancaria.split(' - ');
    // Asignar SWIFT según el banco
    let swift = '';
    const bancoNombre = bankDetails[0]?.toLowerCase() || '';
    if (bancoNombre.includes('santander')) {
      swift = 'BSCHESMM';
    } else if (bancoNombre.includes('bbva')) {
      swift = 'BBVAESMM';
    } else if (bancoNombre.includes('sabadell')) {
      swift = 'BSABESBB';
    } else if (bancoNombre.includes('caixa')) {
      swift = 'CAIXESBB';
    }
    
    return {
      banco: bankDetails[0] || '',
      iban: bankDetails[1] || '',
      moneda: bankDetails[2] || '',
      swift: swift,
      beneficiario: 'Tricycle Import Export SL'
    };
  }
  
  // Obtener detalles bancarios para esta factura
  const bankInfo = getBankDetails(factura.cuenta_bancaria);

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
          <div>E-mail: info@tricycle.es</div>
        </div>
      </div>
      
      {/* Número de factura y fecha */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ fontSize: '18pt', fontWeight: 'bold' }}>
          {numeroFactura}
        </div>
        <div>
          <span style={{ fontWeight: 'normal' }}>Date </span> 
          {formatDate(factura.created_at || factura.fecha_emision)}
        </div>
      </div>
      
      {/* Datos del cliente */}
      <div style={{ marginBottom: '30px' }}>
        <div><span style={{ fontWeight: 'bold' }}>Name:</span> {nombreDestinatario}</div>
        <div><span style={{ fontWeight: 'bold' }}>Address:</span> {getDireccionDestinatario()}</div>
        {(factura.cliente_ciudad || (factura.cliente && factura.cliente.ciudad)) && 
         (factura.cliente_pais || (factura.cliente && factura.cliente.pais)) && (
          <div>
            {factura.cliente_ciudad || factura.cliente?.ciudad || ''} 
            {' '}
            {factura.cliente_pais || factura.cliente?.pais || ''}
          </div>
        )}
        <div><span style={{ fontWeight: 'bold' }}>TAX ID:</span> {getTaxIDDestinatario()}</div>
      </div>
      
      {/* Información de múltiples clientes */}
      {factura.tipo === 'proveedor' && multiClientes.length > 0 && (
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
          {factura.items && factura.items.length > 0 ? (
            factura.items.map((item, index) => {
              // Calcular el total correcto basado en peso o cantidad
              const calculatedTotal = item.peso 
                ? item.precio_unitario * item.peso 
                : item.precio_unitario * (item.cantidad || 1);
              
              // Usar el total calculado o el guardado, priorizando el calculado
              const totalToShow = Number.isFinite(calculatedTotal) ? calculatedTotal : (item.total || 0);
              
              return (
                <tr key={index}>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>
                    {(item.descripcion || 'Producto sin descripción')} {item.codigo ? `- ${item.codigo}` : ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                    {item.peso ? `${item.peso.toFixed(2)} ${item.peso_unidad || 'MT'}` : (item.cantidad ? `${item.cantidad}` : '1')}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                    {formatCurrency(item.precio_unitario || 0, factura.divisa)}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                    {formatCurrency(totalToShow, factura.divisa)}
                  </td>
                </tr>
              );
            })
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
              {(() => {
                // Calcular el total sumando los totales individuales de cada ítem
                if (factura.items && factura.items.length > 0) {
                  const sumTotal = factura.items.reduce((sum, item) => {
                    const itemTotal = item.peso 
                      ? item.precio_unitario * item.peso 
                      : item.precio_unitario * (item.cantidad || 1);
                    
                    return sum + (Number.isFinite(itemTotal) ? itemTotal : (item.total || 0));
                  }, 0);
                  
                  return formatCurrency(sumTotal, factura.divisa);
                }
                
                // Si no hay ítems o hay error en el cálculo, usar el total de la factura
                return formatCurrency(factura.total, factura.divisa);
              })()}
            </td>
          </tr>
        </tbody>
      </table>
      
      {/* Información fiscal */}
      <div style={{ marginBottom: '15px', fontSize: '9pt' }}>
        Exempt VAT. EXPORT Section 21.1 Ley 37/1992
      </div>
      
      {/* Información de puertos */}
      {factura.puerto_destino && (
        <div style={{ marginBottom: '20px', fontSize: '9pt' }}>
          <div><span style={{ fontWeight: 'bold' }}>Port of Discharge:</span> CIF - {factura.puerto_destino}</div>
        </div>
      )}
      
      {/* Notas con formato específico para consignatario */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>NOTES:</div>
        <div style={{ whiteSpace: 'pre-wrap', fontSize: '9pt', marginLeft: '0' }}>
          {factura.id_externo ? `${factura.id_externo} ` : ''}{factura.notas?.includes('PP PLASTICS') ? factura.notas : 'PP PLASTICS - ' + (factura.notas || '')}
        </div>
        {extractConsigneeInfo() && (
          <div style={{ marginTop: '5px', fontSize: '9pt' }}>
            <div>CONSIGNEE: {extractConsigneeInfo().replace('CONSIGNEE:', '').trim().split('\n')[0]}</div>
            <div style={{ marginLeft: '75px' }}>
              {extractConsigneeInfo().replace('CONSIGNEE:', '').trim().split('\n').slice(1).map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        )}
        
        {/* Texto fijo de instrucciones de envío */}
        <div style={{ marginTop: '15px', fontSize: '8pt', lineHeight: '1.3' }}>
          <p>SHIPPING INSTRUCTIONS: PROVIDED PRIOR SHIPPING INSTRUCTIONS BY BUYER. CONSIGNEE MUST BE A COMPANY OF IMPORTING COUNTRY</p>
          <p>AS ANNEX VII SHOWING THIS IS OBLIGATORY BE PROVIDED BY SELLER TO CUSTOMS IN EXPORTING COUNTRY</p>
          <p>Loading date: Type of transport: Modifications on BL: AS SOON AS POSSIBLE, MAXIMUM 30 DAYS FROM CONTRACT SIGNING DATE</p>
          <p>40 FT SEA CONTAINER</p>
          <p>BL AMENDMENTS CAN BE DONE BEFORE SHIP LEAVES BCN PORT OF ORIGIN, AFTERWARDS AMENDMENTS WILL BE ON</p>
          <p>BUYER´S ACCOUNT AS SHIPPING LINE CHARGE (100 USD/AMENDMENT APROX)</p>
          <p>Special conditions: Loading Pictures: LOI, AP, PSIC, IMPORT PERMISSIONS UNDER PURCHASER´S ACCOUNT</p>
          <p>FULL SET OF LOADING PICTURES WILL BE PROVI DED</p>
        </div>
      </div>
      
      {/* BANK DETAILS */}
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: '5px', fontSize: '10pt' }}>BANK DETAILS:</div>
        <div><span style={{ fontWeight: 'bold' }}>Bank:</span> {bankInfo.banco}</div>
        <div><span style={{ fontWeight: 'bold' }}>IBAN:</span> {bankInfo.iban}</div>
        <div><span style={{ fontWeight: 'bold' }}>SWIFT:</span> {bankInfo.swift}</div>
        <div><span style={{ fontWeight: 'bold' }}>Currency:</span> {bankInfo.moneda || factura.divisa || "EUR"}</div>
        <div><span style={{ fontWeight: 'bold' }}>Beneficiary:</span> {bankInfo.beneficiario}</div>
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

FacturaPrintView.displayName = 'FacturaPrintView';

// Componente principal para la página de PDF
export default function FacturaPDFPage() {
  const params = useParams();
  const router = useRouter();
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
  
  const [multiClientes, setMultiClientes] = useState<FacturaCliente[]>([]);
  const [showMultiDialog, setShowMultiDialog] = useState(false);
  const [currentNuevoItem, setCurrentNuevoItem] = useState('');
  const [currentPorcentaje, setCurrentPorcentaje] = useState('');
  
  const printRef = useRef<HTMLDivElement>(null);
  
  // Cargar los datos de la factura
  useEffect(() => {
    const fetchFactura = async () => {
      try {
        const supabase = getSupabaseClient();
        console.log('Buscando factura con ID:', id);
        
        // Intentar obtener de facturas_cliente incluyendo la relación con el cliente
        const { data: clienteData, error: clienteError } = await supabase
          .from('facturas_cliente')
          .select(`
            *,
            cliente:cliente_id (
              id, 
              nombre, 
              direccion, 
              ciudad, 
              pais, 
              id_fiscal
            )
          `)
          .eq('id', id)
          .single();
        
        console.log('Resultado de la consulta de facturas_cliente:', { clienteData, clienteError });
        
        if (clienteData) {
          // Verificar si tenemos campo created_at
          console.log('¿Tiene created_at?', {
            has_created_at: !!clienteData.created_at,
            created_at: clienteData.created_at,
            fecha_emision: clienteData.fecha_emision
          });
          
          // Extraer el nombre del cliente y otros datos
          let nombreCliente = 'Cliente sin especificar';
          let cliente_direccion = '';
          let cliente_id_fiscal = '';
          let cliente_ciudad = '';
          let cliente_pais = '';
          
          try {
            // Primero, intentar obtener datos directamente de la relación cliente
            if (clienteData.cliente) {
              console.log('Datos del cliente desde la relación:', clienteData.cliente);
              nombreCliente = clienteData.cliente.nombre || nombreCliente;
              cliente_direccion = clienteData.cliente.direccion || '';
              cliente_id_fiscal = clienteData.cliente.id_fiscal || '';
              cliente_ciudad = clienteData.cliente.ciudad || '';
              cliente_pais = clienteData.cliente.pais || '';
            }
            
            // Luego, intentar obtener datos del JSON de material (como respaldo)
            if (!nombreCliente || nombreCliente === 'Cliente sin especificar') {
              if (clienteData.material) {
                console.log('Intentando extraer datos del material JSON');
                const materialData = JSON.parse(clienteData.material || '{}');
                nombreCliente = materialData.cliente_nombre || clienteData.cliente || nombreCliente;
                cliente_direccion = cliente_direccion || materialData.cliente_direccion || '';
                cliente_id_fiscal = cliente_id_fiscal || materialData.cliente_id_fiscal || '';
              }
            }
            
            // Si todavía no tenemos datos y hay un cliente_id, intentar obtener directamente
            if ((!nombreCliente || nombreCliente === 'Cliente sin especificar') && clienteData.cliente_id) {
              console.log('Realizando consulta adicional para cliente_id:', clienteData.cliente_id);
              const { data: clienteInfo } = await supabase
                .from('clientes')
                .select('*')
                .eq('id', clienteData.cliente_id)
                .single();
                
              if (clienteInfo) {
                console.log('Datos del cliente obtenidos directamente:', clienteInfo);
                nombreCliente = clienteInfo.nombre || nombreCliente;
                cliente_direccion = cliente_direccion || clienteInfo.direccion || '';
                cliente_id_fiscal = cliente_id_fiscal || clienteInfo.id_fiscal || '';
                cliente_ciudad = cliente_ciudad || clienteInfo.ciudad || '';
                cliente_pais = cliente_pais || clienteInfo.pais || '';
              }
            }
          } catch (e) {
            console.error('Error al obtener datos del cliente:', e);
          }
          
          console.log('Datos del cliente obtenidos:', {
            nombreCliente,
            cliente_direccion,
            cliente_id_fiscal,
            cliente_ciudad,
            cliente_pais
          });
          
          // Es una factura de cliente, también obtener sus items
          const { data: itemsData } = await supabase
            .from('facturas_items')
            .select('*')
            .eq('factura_id', id);
          
          console.log('Items de la factura:', itemsData);
          
          // Convertir los items recuperados al formato esperado por el componente
          const itemsFormateados = itemsData && itemsData.length > 0
            ? itemsData.map(item => ({
                id: item.id.toString(),
                descripcion: item.descripcion || 'Sin descripción',
                cantidad: item.cantidad || 1,
                peso: item.peso || null,
                peso_unidad: item.peso_unidad || 'MT',
                precio_unitario: item.precio_unitario || 0,
                total: item.total || 0,
                codigo: item.codigo || ''
              }))
            : [];
          
          // Si no hay items en facturas_items, intentar extraer del JSON material
          let itemsFromMaterial = [];
          if (itemsFormateados.length === 0 && clienteData.material) {
            try {
              const materialData = JSON.parse(clienteData.material || '{}');
              if (materialData.items_completos && Array.isArray(materialData.items_completos)) {
                itemsFromMaterial = materialData.items_completos.map((item: any) => ({
                  id: item.id?.toString() || Math.random().toString(),
                  descripcion: item.description || 'Sin descripción',
                  cantidad: item.quantity || 1,
                  peso: item.weight || null,
                  peso_unidad: 'MT',
                  precio_unitario: item.unitPrice || 0,
                  total: item.totalValue || 0,
                  codigo: item.packaging || ''
                }));
              }
            } catch (error) {
              console.error('Error al parsear items desde material:', error);
            }
          }
          
          // Asegurarse de que los items tengan todos los campos necesarios
          const itemsFinales = (itemsFormateados.length > 0 ? itemsFormateados : itemsFromMaterial).map((item: FacturaItem) => ({
            id: item.id,
            descripcion: item.descripcion || 'Sin descripción',
            cantidad: item.cantidad || 1,
            peso: item.peso || null,
            peso_unidad: item.peso_unidad || 'MT',
            precio_unitario: item.precio_unitario || 0,
            total: item.total || (item.precio_unitario * (item.peso || item.cantidad || 1)),
            codigo: item.codigo || ''
          }));
          
          const facturaData = {
            ...clienteData,
            tipo: 'cliente',
            items: itemsFinales,
            cliente_nombre: nombreCliente,
            cliente_direccion: cliente_direccion,
            cliente_id_fiscal: cliente_id_fiscal,
            cliente_ciudad: cliente_ciudad,
            cliente_pais: cliente_pais,
            cliente: {
              nombre: nombreCliente,
              direccion: cliente_direccion,
              id_fiscal: cliente_id_fiscal,
              ciudad: cliente_ciudad,
              pais: cliente_pais
            }
          };
          
          console.log('Datos de factura de cliente procesados:', facturaData);
          
          setFactura(facturaData);
          setFacturaNumero(facturaData.numero_factura || facturaData.id_externo || `INV${String(facturaData.id).padStart(4, '0')}`);
          setNombreDestinatario(nombreCliente);
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
          // Extraer clientes adicionales de las notas
          const clientesMatch = proveedorData.notas?.match(/Clientes adicionales:([\s\S]*?)(?=\n\n|\n$|$)/);
          if (clientesMatch && clientesMatch[1]) {
            const clientesTexto = clientesMatch[1].trim();
            const clientesArray = clientesTexto.split('\n').map((linea: string) => {
              const [nombre, porcentaje] = linea.split(':').map((s: string) => s.trim());
              return {
                id: `temp-${Math.random().toString(36).substr(2, 9)}`,
                nombre,
                porcentaje: porcentaje ? parseInt(porcentaje) : undefined
              };
            });
            setMultiClientes(clientesArray);
          }
          
          // Obtener los items de la factura
          const { data: itemsData } = await supabase
            .from('facturas_items')
            .select('*')
            .eq('factura_id', id);
          
          // Convertir los items recuperados al formato esperado por el componente
          const itemsFormateados = itemsData && itemsData.length > 0
            ? itemsData.map(item => ({
                id: item.id.toString(),
                descripcion: item.descripcion || 'Sin descripción',
                cantidad: item.cantidad || 1,
                peso: item.peso || null,
                peso_unidad: item.peso_unidad || 'MT',
                precio_unitario: item.precio_unitario || 0,
                total: item.total || 0,
                codigo: item.codigo || ''
              }))
            : [];
          
          // Si no hay items en facturas_items, intentar extraer del JSON material
          let itemsFromMaterial = [];
          if (itemsFormateados.length === 0 && proveedorData.material) {
            try {
              const materialData = JSON.parse(proveedorData.material || '{}');
              if (materialData.items_completos && Array.isArray(materialData.items_completos)) {
                itemsFromMaterial = materialData.items_completos.map((item: any) => ({
                  id: item.id?.toString() || Math.random().toString(),
                  descripcion: item.description || 'Sin descripción',
                  cantidad: item.quantity || 1,
                  peso: item.weight || null,
                  peso_unidad: 'MT',
                  precio_unitario: item.unitPrice || 0,
                  total: item.totalValue || 0,
                  codigo: item.packaging || ''
                }));
              }
            } catch (error) {
              console.error('Error al parsear items desde material:', error);
            }
          }
          
          const facturaData = {
            ...proveedorData,
            tipo: 'proveedor',
            items: itemsFormateados.length > 0 ? itemsFormateados : itemsFromMaterial
          };
          
          console.log('Datos de factura de proveedor cargados:', facturaData);
          
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
      
      // Validar que el número no esté vacío
      if (!facturaNumero.trim()) {
        throw new Error('El número de factura no puede estar vacío');
      }
      
      // Actualizar el número de factura
      const { error } = await supabase
        .from(tableName)
        .update({ 
          numero_factura: facturaNumero,
          // También actualizar id_externo si es necesario
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
      
      // Mostrar mensaje de éxito
      setError(null);
      
      // Desactivar el modo de edición
      setEditing(false);
      
      // Feedback visual temporal
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50';
      successMessage.innerHTML = 'Número de factura actualizado correctamente';
      document.body.appendChild(successMessage);
      
      // Remover el mensaje después de 3 segundos
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
      
    } catch (err: any) {
      console.error('Error al guardar el número de factura:', err);
      setError(`Error al guardar el número de factura: ${err.message || 'Ocurrió un error desconocido'}`);
      
      // Mostrar alerta de error
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50';
      errorMessage.innerHTML = `Error: ${err.message || 'Ocurrió un error al guardar'}`;
      document.body.appendChild(errorMessage);
      
      // Remover el mensaje después de 5 segundos
      setTimeout(() => {
        if (document.body.contains(errorMessage)) {
          document.body.removeChild(errorMessage);
        }
      }, 5000);
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
  
  // Guardar clientes adicionales
  const handleSaveMulti = async () => {
    if (!factura) return;
    
    try {
      const supabase = getSupabaseClient();
      const tableName = factura.tipo === 'cliente' ? 'facturas_cliente' : 'facturas_proveedor';
      
      // Actualizar las notas con la información de clientes
      let nuevasNotas = factura.notas || '';
      
      if (factura.tipo === 'proveedor') {
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
        .from(tableName)
        .update({ notas: nuevasNotas })
        .eq('id', factura.id);
      
      if (error) throw error;
      
      // Actualizar el estado local
      setFactura(prev => {
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
    
    if (factura?.tipo === 'proveedor') {
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
  const handleRemoveMulti = (id: string) => {
    if (factura?.tipo === 'proveedor') {
      setMultiClientes(multiClientes.filter(c => c.id !== id));
    }
  };
  
  // Componente para mostrar la lista de clientes adicionales
  const MultiEntidadList = () => {
    const items = multiClientes;
    const titulo = 'Clientes adicionales';
    
    return (
      <div className="mt-4 border rounded-md overflow-hidden">
        <div className="p-3 bg-gray-50 font-medium">
          {titulo}
        </div>
        <div className="p-4">
          {items.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay {titulo.toLowerCase()} configurados.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>
                    {item.nombre} {item.porcentaje && <span className="text-gray-500">({item.porcentaje}%)</span>}
                  </span>
                  <button 
                    onClick={() => handleRemoveMulti(item.id)} 
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-3 border-t">
          <button 
            onClick={() => setShowMultiDialog(true)}
            className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
          >
            <span className="mr-1">+</span> Añadir {factura?.tipo === 'proveedor' ? 'cliente' : ''}
          </button>
        </div>
      </div>
    );
  };
  
  // Función para generar el PDF
  const generatePDF = async () => {
    setGenerating(true);
    
    try {
      // Verificar si existe un archivo PDF almacenado para esta factura
      const supabase = getSupabaseClient();
      const fileExtension = factura?.nombre_archivo?.split('.').pop() || 'pdf';
      const filePath = `facturas/${factura?.id}.${fileExtension}`;
      
      // Intentar obtener la URL firmada del archivo
      const { data: urlData, error: urlError } = await supabase
        .storage
        .from('documentos')
        .createSignedUrl(filePath, 60 * 60); // URL válida por 1 hora
      
      if (urlError) {
        // Si el archivo no existe en la carpeta facturas, buscar en documentos
        const alternativeFilePath = `documentos/facturas/${factura?.id}.${fileExtension}`;
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
      setError('No se encontró ningún archivo adjunto. Si desea visualizar un PDF, debe adjuntarlo primero en el formulario de la factura.');
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
      const fileName = `factura-${facturaNumero || id}.pdf`;
      
      // Descargar el PDF directamente
      pdf.save(fileName);
      
    } catch (e) {
      console.error("Error al descargar PDF:", e);
      setError("Error al generar el PDF para descarga");
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
        <Link href="/facturas" className="text-indigo-600 hover:text-indigo-800">
          Volver a facturas
        </Link>
      </div>
    );
  }
  
  // Función para obtener detalles bancarios
  const getBankDetailsPage = (cuenta_bancaria?: string) => {
    // Obtener cuentas bancarias
    const cuentasBancariasDisponibles = getCuentasBancariasFallback();
    
    if (!cuenta_bancaria) return { banco: '', iban: '', moneda: '', swift: '', beneficiario: '' };
    
    // Buscar la cuenta bancaria en la lista de cuentas
    const cuentaBancaria = cuentasBancariasDisponibles.find(cuenta => cuenta.descripcion === cuenta_bancaria);
    
    if (cuentaBancaria) {
      return {
        banco: cuentaBancaria.banco,
        iban: cuentaBancaria.iban,
        moneda: cuentaBancaria.moneda,
        swift: cuentaBancaria.swift,
        beneficiario: cuentaBancaria.beneficiario
      };
    }
    
    // Si no se encuentra en las predefinidas, intentar parsear el formato antiguo
    const bankDetails = cuenta_bancaria.split(' - ');
    
    // Asignar SWIFT según el banco
    let swift = '';
    const bancoNombre = bankDetails[0]?.toLowerCase() || '';
    if (bancoNombre.includes('santander')) {
      swift = 'BSCHESMM';
    } else if (bancoNombre.includes('bbva')) {
      swift = 'BBVAESMM';
    } else if (bancoNombre.includes('sabadell')) {
      swift = 'BSABESBB';
    } else if (bancoNombre.includes('caixa')) {
      swift = 'CAIXESBB';
    }
    
    return {
      banco: bankDetails[0] || '',
      iban: bankDetails[1] || '',
      moneda: bankDetails[2] || '',
      swift: swift,
      beneficiario: 'Tricycle Import Export SL'
    };
  };
  
  // Obtener detalles bancarios para esta factura
  const bankInfo = getBankDetailsPage(factura.cuenta_bancaria);
  
  return (
    <div className="bg-gray-100 p-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Cabecera */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center">
                <Link 
                  href="/facturas" 
                  className="mr-3 text-gray-600 hover:text-gray-800"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-medium text-gray-800">Ver PDF Factura</h1>
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
        
        {/* Cuenta Bancaria */}
        <div className="flex justify-end">
          <div className="w-full max-w-lg mx-auto mt-6 mb-4 border border-gray-300 p-4 rounded-md bg-gray-50">
            <h3 className="text-md font-bold text-gray-800 mb-2 border-b pb-1">Información Bancaria</h3>
            <div className="grid grid-cols-2 gap-2">
              {factura.cuenta_bancaria && (
                <>
                  {(() => {
                    const { banco, iban, moneda, swift } = bankInfo;
                    return (
                      <>
                        <div>
                          <p className="text-sm"><span className="font-semibold">Banco:</span> {banco}</p>
                          <p className="text-sm"><span className="font-semibold">IBAN:</span> {iban}</p>
                        </div>
                        <div>
                          <p className="text-sm"><span className="font-semibold">SWIFT:</span> {swift}</p>
                          <p className="text-sm"><span className="font-semibold">Moneda:</span> {moneda}</p>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
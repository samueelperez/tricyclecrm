'use client';

import { useEffect, useState, useRef, forwardRef } from 'react';
import { useParams } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getSupabaseClient } from '@/lib/supabase';
import Image from 'next/image';
import { FiDownload, FiLoader } from 'react-icons/fi';

// Interfaz para la lista de empaque
interface PackingList {
  id: string;
  id_externo: string;
  fecha: string;
  cliente_nombre: string;
  cliente_direccion: string;
  peso_total: number;
  bales_total: number;
}

// Interfaz para item de lista de empaque
interface PackingListItem {
  id: string;
  packing_list_id: string;
  container: string;
  precinto: string;
  bales: number;
  weight: number;
  date: string;
}

// Componente para la vista de impresión de la lista de empaque
const PackingListPrintView = forwardRef<HTMLDivElement, { 
  packingList: PackingList; 
  items: PackingListItem[];
}>((props, ref) => {
  const { packingList, items } = props;
  
  // Formatear fecha
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/');
  };

  return (
    <div ref={ref} className="bg-white p-10" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontFamily: 'Arial, sans-serif', fontSize: '9pt', position: 'relative' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        {/* Logo */}
        <div style={{ width: '200px' }}>
          <Image 
            src="/images/logo.png" 
            alt="Tricycle Products S.L."
            width={200}
            height={100}
            style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
            priority
            unoptimized
          />
        </div>
        
        {/* Datos empresa */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>TRICYCLE PRODUCTS, S.L.</div>
          <div>VAT: B56194830</div>
          <div>C/PEREZ DOLZ, 8</div>
          <div>CASTELLÓN (SPAIN)</div>
        </div>
      </div>
      
      {/* Datos del cliente */}
      <div style={{ marginBottom: '40px', marginTop: '60px' }}>
        <div><span style={{ fontWeight: 'bold' }}>Name:</span> {packingList.cliente_nombre}</div>
        <div><span style={{ fontWeight: 'bold' }}>Address:</span> {packingList.cliente_direccion}</div>
      </div>
      
      {/* Título de la lista de empaque */}
      <div style={{ border: '1px solid #000', display: 'inline-block', padding: '5px 15px', marginBottom: '5px' }}>
        <span style={{ fontWeight: 'bold' }}>PACKING LIST</span>
      </div>
      
      {/* Tabla de contenedores */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '30px' }}></th>
            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>CONTAINER</th>
            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>PRECINTO</th>
            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '80px' }}>BALES</th>
            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '100px' }}>WEIGHT</th>
            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '100px' }}>DATE</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                {index + 1}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                {item.container}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                {item.precinto}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                {item.bales}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                {item.weight.toLocaleString('es-ES')}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                {formatDate(item.date)}
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              GRAND TOTAL
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}></td>
            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {packingList.bales_total}
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {packingList.peso_total.toLocaleString('es-ES')}
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}></td>
          </tr>
        </tbody>
      </table>
      
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

PackingListPrintView.displayName = 'PackingListPrintView';

// Componente principal para la página de PDF
export default function PackingListPDFPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [items, setItems] = useState<PackingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  
  // Cargar datos de la lista de empaque
  useEffect(() => {
    const fetchPackingList = async () => {
      try {
        setLoading(true);
        const supabase = getSupabaseClient();
        
        // Obtener la lista de empaque
        const { data: packingListData, error: packingListError } = await supabase
          .from('packing_lists')
          .select('*')
          .eq('id', id)
          .single();
        
        if (packingListError) throw packingListError;
        if (!packingListData) throw new Error('No se encontró la lista de empaque');
        
        // Obtener los items
        const { data: itemsData, error: itemsError } = await supabase
          .from('packing_list_items')
          .select('*')
          .eq('packing_list_id', id)
          .order('id', { ascending: true });
        
        if (itemsError) throw itemsError;
        
        setPackingList(packingListData);
        setItems(itemsData || []);
        
      } catch (err) {
        console.error('Error al cargar la lista de empaque:', err);
        setError('Error al cargar los datos de la lista de empaque');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPackingList();
  }, [id]);
  
  // Generar PDF
  const generatePDF = async () => {
    if (!printRef.current) return;
    
    setGenerating(true);
    
    try {
      const element = printRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Configuración de PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calcular dimensiones para ajustar a A4
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Guardar el PDF
      pdf.save(`Packing_List_${packingList?.id_externo || id}.pdf`);
      
    } catch (err) {
      console.error('Error al generar el PDF:', err);
      setError('Error al generar el PDF');
    } finally {
      setGenerating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <FiLoader className="animate-spin h-10 w-10 text-blue-500 mb-4" />
        <p className="text-gray-600">Cargando lista de empaque...</p>
      </div>
    );
  }
  
  if (error || !packingList) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'No se pudo cargar la lista de empaque'}</p>
          <a href="/packing-lists" className="text-blue-500 hover:text-blue-600">
            Volver a la lista
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Barra superior */}
      <div className="bg-white shadow-sm border-b p-4 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">
            Lista de Empaque: {packingList.id_externo || `PL-${id.slice(0, 8)}`}
          </h1>
          
          <div className="flex items-center space-x-4">
            <a
              href="/packing-lists"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Volver a la lista
            </a>
            
            <button 
              onClick={generatePDF}
              disabled={generating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <FiLoader className="animate-spin h-5 w-5 mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <FiDownload className="h-5 w-5 mr-2" />
                  Descargar PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Vista previa del PDF */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-1">
            <PackingListPrintView 
              ref={printRef}
              packingList={packingList}
              items={items}
            />
          </div>
        </div>
      </div>
      
      {/* Espacio para mostrar cuando se está generando */}
      <div style={{ display: generating ? 'block' : 'none' }} className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <FiLoader className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-800 text-center">Generando PDF...</p>
        </div>
      </div>
    </div>
  );
} 
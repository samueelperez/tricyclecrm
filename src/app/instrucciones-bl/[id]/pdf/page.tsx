"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient, ejecutarMigracionInstruccionesBL } from "@/lib/supabase";
import Link from "next/link";
import { FiArrowLeft, FiPrinter } from "react-icons/fi";

export default function BLInfoPage() {
  const params = useParams();
  const id = params.id as string;
  const [instruccion, setInstruccion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>(""); // Número de factura asociada
  const [hsCode, setHsCode] = useState<string>(""); // HS Code

  useEffect(() => {
    const fetchInstruccion = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Ejecutar migración para asegurar que la tabla existe
        console.log('Ejecutando migración de instrucciones BL...');
        const resultadoMigracion = await ejecutarMigracionInstruccionesBL();
        
        if (!resultadoMigracion.success) {
          console.error('Error en la migración de instrucciones BL:', resultadoMigracion.error);
          setError('Error inicializando la tabla de instrucciones BL: ' + resultadoMigracion.message);
          // A pesar del error, seguimos con datos de ejemplo
          setInstruccion({
            id: id,
            numero_instruccion: `BL-${id}`,
            cliente_nombre: "Cliente de ejemplo",
            consignatario: "LAO QIXIN CO.,LTD\nPHONKHAM VILLAGE, KEOOUDOM DISTRICT,\nVIENTIANE PROVINCE. LAO PDR\nTEL: +856 309883676 & +856 304890993\nEmail:laoqixin2018@gmail.com\nTAX ID:662330283-9-00",
            puerto_carga: "Barcelona, España",
            puerto_descarga: "LAEM CHABANG,THAILAND",
            tipo_carga: "FCL (Full Container Load)",
            incoterm: "FOB",
            notas: "CONSIGNEE: LAO QIXIN CO.,LTD\nPHONKHAM VILLAGE, KEOOUDOM DISTRICT,\nVIENTIANE PROVINCE. LAO PDR\n\nNOTIFY: NANON ENTERPRISE CO., LTD\nNO.7 HAPPY PLACE ROAD, KLONGSAMPRAVET,\nLADKRABANG, BANGKOK THAILAND 10520"
          });
          setInvoiceNumber(`INV${String(id).padStart(4, '0')}`);
          setHsCode("6305.33");
          setLoading(false);
          return;
        }
        
        console.log('Migración completada, cargando datos...');
        
        // 1. Primero obtener datos básicos de la instrucción
        const { data, error } = await supabase
          .from("instrucciones_bl")
          .select("*")
          .eq("id", id);

        if (error) throw error;
        
        // Verificar si tenemos resultados
        if (!data || data.length === 0) {
          console.log('No se encontró ninguna instrucción BL con el ID:', id);
          throw new Error("No se encontró la instrucción BL solicitada");
        }
        
        // Usar el primer resultado
        const instruccionData = data[0];
        
        // 2. Obtener datos del cliente si existe cliente_id
        if (instruccionData.cliente_id) {
          const { data: clienteData, error: clienteError } = await supabase
            .from("clientes")
            .select("nombre, direccion, nif, telefono, email")
            .eq("id", instruccionData.cliente_id);
            
          if (!clienteError && clienteData && clienteData.length > 0) {
            instruccionData.cliente_nombre = clienteData[0].nombre;
            instruccionData.cliente_info = clienteData[0];
          }
        }
        
        // 3. Obtener datos del envío si existe envio_id
        if (instruccionData.envio_id) {
          const { data: envioData, error: envioError } = await supabase
            .from("envios")
            .select("numero_envio")
            .eq("id", instruccionData.envio_id);
            
          if (!envioError && envioData && envioData.length > 0) {
            instruccionData.numero_envio = envioData[0].numero_envio;
          }
        }
        
        // 4. Obtener número de factura relacionada si existe
        if (instruccionData.cliente_id) {
          const { data: facturaData, error: facturaError } = await supabase
            .from("facturas_cliente")
            .select("id_externo, codigo_hs")
            .eq("cliente_id", instruccionData.cliente_id)
            .order("created_at", { ascending: false })
            .limit(1);
          
          if (!facturaError && facturaData && facturaData.length > 0) {
            setInvoiceNumber(facturaData[0].id_externo || "");
            setHsCode(facturaData[0].codigo_hs || "");
          }
        }
        
        setInstruccion(instruccionData);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(`Error al cargar los datos: ${err.message}`);
        
        // Usar datos de ejemplo para permitir la visualización
        setInstruccion({
          id: id,
          numero_instruccion: `BL-${id}`,
          cliente_nombre: "Cliente de ejemplo",
          consignatario: "LAO QIXIN CO.,LTD\nPHONKHAM VILLAGE, KEOOUDOM DISTRICT,\nVIENTIANE PROVINCE. LAO PDR\nTEL: +856 309883676 & +856 304890993\nEmail:laoqixin2018@gmail.com\nTAX ID:662330283-9-00",
          puerto_carga: "Barcelona, España",
          puerto_descarga: "LAEM CHABANG,THAILAND",
          tipo_carga: "FCL (Full Container Load)",
          incoterm: "FOB",
          notas: "CONSIGNEE: LAO QIXIN CO.,LTD\nPHONKHAM VILLAGE, KEOOUDOM DISTRICT,\nVIENTIANE PROVINCE. LAO PDR\n\nNOTIFY: NANON ENTERPRISE CO., LTD\nNO.7 HAPPY PLACE ROAD, KLONGSAMPRAVET,\nLADKRABANG, BANGKOK THAILAND 10520"
        });
        
        setInvoiceNumber(`INV${String(id).padStart(4, '0')}`);
        setHsCode("6305.33");
      } finally {
        setLoading(false);
      }
    };

    fetchInstruccion();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !instruccion) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">
            {error || "No se pudo encontrar la instrucción BL solicitada."}
          </p>
          <Link href="/instrucciones-bl" className="text-indigo-600 hover:underline mt-2 inline-block">
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  // Extraer datos del consignatario de las notas si están disponibles
  const extractConsigneeInfo = () => {
    if (!instruccion.notas) return null;
    
    const lines = instruccion.notas.split('\n');
    const consigneeStartIndex = lines.findIndex(line => 
      line.toUpperCase().includes('CONSIGNEE:')
    );
    
    if (consigneeStartIndex === -1) return null;
    
    let consigneeInfo = [];
    let i = consigneeStartIndex;
    
    // Extraer todas las líneas consecutivas del consignatario
    while (i < lines.length && 
           !lines[i].toUpperCase().includes('NOTIFY:') && 
           !lines[i].toUpperCase().includes('PORT OF') &&
           !lines[i].toUpperCase().includes('HS CODE')) {
      consigneeInfo.push(lines[i]);
      i++;
    }
    
    return consigneeInfo.join('\n');
  };

  // Extraer datos del notify party
  const extractNotifyInfo = () => {
    if (!instruccion.notas) return null;
    
    const lines = instruccion.notas.split('\n');
    const notifyStartIndex = lines.findIndex(line => 
      line.toUpperCase().includes('NOTIFY:')
    );
    
    if (notifyStartIndex === -1) return null;
    
    let notifyInfo = [];
    let i = notifyStartIndex;
    
    // Extraer todas las líneas consecutivas del notify party
    while (i < lines.length && 
           !lines[i].toUpperCase().includes('CONSIGNEE:') && 
           !lines[i].toUpperCase().includes('PORT OF') &&
           !lines[i].toUpperCase().includes('HS CODE')) {
      notifyInfo.push(lines[i]);
      i++;
    }
    
    return notifyInfo.join('\n');
  };

  // Extraer la descripción del producto
  const extractDescription = () => {
    if (!instruccion.notas) return "PP JUMBO BAGS";
    
    const lines = instruccion.notas.split('\n');
    const descIndex = lines.findIndex(line => 
      line.toUpperCase().includes('DESCRIPTION:')
    );
    
    if (descIndex === -1) return "PP JUMBO BAGS";
    
    const descLine = lines[descIndex];
    return descLine.replace('DESCRIPTION:', '').trim() || "PP JUMBO BAGS";
  };

  // Extraer la nota especial
  const extractNote = () => {
    if (!instruccion.notas) return "";
    
    const lines = instruccion.notas.split('\n');
    const noteIndex = lines.findIndex(line => 
      line.toUpperCase().includes('NOTE:')
    );
    
    if (noteIndex === -1) return "";
    
    let noteInfo = [];
    let i = noteIndex;
    
    // Extraer todas las líneas consecutivas de la nota
    while (i < lines.length && 
           !lines[i].toUpperCase().includes('CONSIGNEE:') && 
           !lines[i].toUpperCase().includes('NOTIFY:')) {
      noteInfo.push(lines[i]);
      i++;
    }
    
    return noteInfo.join('\n').replace('NOTE:', '').trim();
  };

  return (
    <>
      {/* Barra de navegación solo visible cuando no se imprime */}
      <div className="bg-white shadow-md p-4 print:hidden">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link 
            href="/instrucciones-bl"
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <FiArrowLeft className="mr-2" /> Volver al listado
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiPrinter className="mr-2" /> Imprimir
          </button>
        </div>
      </div>

      {/* Contenido principal para imprimir */}
      <div className="max-w-4xl mx-auto px-4 py-8 print:px-0 print:py-0">
        <div className="bg-white rounded-lg shadow-md print:shadow-none p-6 print:p-0">
          <h1 className="text-2xl font-bold text-center mb-6">BL info for {invoiceNumber || `INV${String(id).padStart(4, '0')}`}</h1>
          
          <div className="grid grid-cols-1 divide-y border border-gray-300">
            {/* Fila 1: Remitente y Descripción */}
            <div className="grid grid-cols-2 divide-x">
              <div className="p-4">
                <h2 className="font-bold mb-2">Shipper:</h2>
                <p>
                  TRICYCLE PRODUCTS, S.L PEREZ DOLZ, 8,<br />
                  ENTRS. 12003<br />
                  Castellon - SPAIN VAT: B56194830
                </p>
              </div>
              <div className="p-4 bg-blue-50">
                <h2 className="font-bold mb-2">Description of commodity on BL</h2>
                <p className="uppercase">{extractDescription()}</p>
              </div>
            </div>
            
            {/* Fila 2: Consignatario y HS CODE */}
            <div className="grid grid-cols-2 divide-x">
              <div className="p-4">
                <h2 className="font-bold mb-2">Consignee:</h2>
                <p className="whitespace-pre-line">
                  {extractConsigneeInfo()?.replace('CONSIGNEE:', '').trim() || instruccion.consignatario || (instruccion.cliente_nombre ? instruccion.cliente_nombre + ' ' + (instruccion.cliente_info?.direccion || '') : '')}
                </p>
              </div>
              <div className="p-4">
                <h2 className="font-bold mb-2">HS CODE:</h2>
                <p>{hsCode || "6305.33"}</p>
              </div>
            </div>
            
            {/* Fila 3: Notify Party y UNIT */}
            <div className="grid grid-cols-2 divide-x">
              <div className="p-4">
                <h2 className="font-bold mb-2">Notify party:</h2>
                <p className="whitespace-pre-line">
                  {extractNotifyInfo()?.replace('NOTIFY:', '').trim() || 
                   extractConsigneeInfo()?.replace('CONSIGNEE:', '').trim() || 
                   instruccion.consignatario || instruccion.cliente_nombre}
                </p>
              </div>
              <div className="p-4">
                <h2 className="font-bold mb-2">UNIT: BALES/ Lot / package / bulks (please highlight the right one)</h2>
              </div>
            </div>
            
            {/* Fila 4: Puerto y Notas */}
            <div className="grid grid-cols-2 divide-x">
              <div className="p-4">
                <h2 className="font-bold mb-2">PORT OF DISCHARGE:</h2>
                <p className="uppercase">{instruccion.puerto_descarga}</p>
              </div>
              <div className="p-4">
                <h2 className="font-bold mb-2">NOTE :</h2>
                <p className="mb-4">{extractNote() || `${extractConsigneeInfo()?.replace('CONSIGNEE:', '').trim() || instruccion.consignatario || instruccion.cliente_nombre} VIA ${instruccion.puerto_descarga} IN TRANSIT CARGO TO LAOS VIA ${instruccion.puerto_descarga}`}</p>
                
                <div className="text-xs">
                  <p className="font-semibold mb-1">SHIPPING INSTRUCTIONS:</p>
                  <p>PROVIDED PRIOR SHIPPING INSTRUCTIONS BY BUYER. CONSIGNEE MUST BE A COMPANY OF IMPORTING COUNTRY</p>
                  <p>AS ANNEX VII SHOWING THIS IS OBLIGATORY BE PROVIDED BY SELLER TO CUSTOMS IN EXPORTING COUNTRY</p>
                  
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div>
                      <p className="font-semibold">Loading date:</p>
                      <p>AS SOON AS POSSIBLE, MAXIMUM 30 DAYS FROM CONTRACT SIGNING DATE</p>
                    </div>
                    <div>
                      <p className="font-semibold">Type of transport:</p>
                      <p>40 FT SEA CONTAINER</p>
                    </div>
                    <div>
                      <p className="font-semibold">Modifications on BL:</p>
                      <p>BL AMENDMENTS CAN BE DONE BEFORE SHIP LEAVES BCN PORT OF ORIGIN, AFTERWARDS AMENDMENTS WILL BE ON</p>
                      <p>BUYER´S ACCOUNT AS SHIPPING LINE CHARGE (100 USD/AMENDMENT APROX)</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="font-semibold">Special conditions:</p>
                      <p>LOI, AP, PSIC, IMPORT PERMISSIONS UNDER PURCHASER´S ACCOUNT</p>
                    </div>
                    <div>
                      <p className="font-semibold">Loading Pictures:</p>
                      <p>FULL SET OF LOADING PICTURES WILL BE PROVIDED</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fila 5: Descripción de mercancía y destino final */}
            <div className="grid grid-cols-2 divide-x">
              <div className="p-4">
                <h2 className="font-bold mb-2">Description of goods on Invoice</h2>
                <p>Pp jumbo bags</p>
              </div>
              <div className="p-4">
                <h2 className="font-bold mb-2">Final Destination on invoice:</h2>
                <p></p>
              </div>
            </div>
          </div>
          
          {/* Pie de página con información adicional */}
          <div className="mt-8 print:fixed print:bottom-4 print:left-0 print:right-0 print:text-sm">
            <p className="text-xs text-gray-600 text-center">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 
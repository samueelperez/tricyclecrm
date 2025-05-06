"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiPlus, FiSearch, FiAlertCircle } from "react-icons/fi";
import { getSupabaseClient, ejecutarMigracionFacturas, crearBucketDocumentos } from "@/lib/supabase";
import { Factura, FacturaTab } from "./components/types";
import FacturaTabs from "./components/factura-tabs";
import FacturaTable from "./components/factura-table";

// Componente de carga mientras se resuelve el suspense
function LoadingFallback() {
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-8"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

// Componente interno que utiliza useSearchParams
function FacturasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Obtener la pestaña activa desde la URL o usar 'customer' por defecto
  const [activeTab, setActiveTab] = useState<FacturaTab>(
    (searchParams.get('tab') as FacturaTab) || 'customer'
  );
  
  const [customerFacturas, setCustomerFacturas] = useState<Factura[]>([]);
  const [supplierFacturas, setSupplierFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Cargar facturas al montar el componente
  useEffect(() => {
    const initStorage = async () => {
      try {
        // Verificar y crear bucket de almacenamiento 'documentos' si es necesario
        console.log('Iniciando verificación del bucket de documentos...');
        const resultado = await crearBucketDocumentos();
        
        if (!resultado.success) {
          console.warn('Alerta: No se pudo verificar el bucket de documentos:', resultado.message);
          // Continuar con la carga de facturas aunque no se encuentre el bucket
          // Pero mostrar una notificación para el administrador
          const alertElement = document.createElement('div');
          alertElement.className = 'fixed top-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-md z-50';
          alertElement.innerHTML = `
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm">El sistema no puede encontrar el bucket de almacenamiento 'documentos'.</p>
                <p class="text-xs mt-1">La carga de facturas puede fallar. Contacte al administrador.</p>
              </div>
              <div class="ml-auto pl-3">
                <button class="inline-flex text-gray-400 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150">
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          `;
          document.body.appendChild(alertElement);
          
          // Agregar funcionalidad para cerrar la notificación
          const closeButton = alertElement.querySelector('button');
          if (closeButton) {
            closeButton.addEventListener('click', () => {
              document.body.removeChild(alertElement);
            });
          }
          
          // Auto-remover después de 10 segundos
          setTimeout(() => {
            if (document.body.contains(alertElement)) {
              document.body.removeChild(alertElement);
            }
          }, 10000);
        } else {
          console.log('Bucket de documentos disponible:', resultado.message);
        }
        
        // Continuar con la carga de facturas
        cargarFacturas();
      } catch (error) {
        console.error('Error inicializando almacenamiento:', error);
        // Continuar con la carga de facturas aunque falle la creación del bucket
        cargarFacturas();
      }
    };
    
    initStorage();
  }, []);

  // Actualizar URL cuando cambia la pestaña
  const handleTabChange = (tab: FacturaTab) => {
    setActiveTab(tab);
    router.push(`/facturas?tab=${tab}`, { scroll: false });
  };

  // Función para cargar facturas desde Supabase
  const cargarFacturas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = getSupabaseClient();
      
      // Ejecutar migración para asegurar que la tabla existe
      console.log('Ejecutando migración de facturas...');
      const resultadoMigracion = await ejecutarMigracionFacturas();
      
      if (!resultadoMigracion.success) {
        console.error('Error en la migración de facturas:', resultadoMigracion.error);
        setError('Error inicializando la tabla de facturas: ' + resultadoMigracion.message);
        setLoading(false);
        // Usar datos de ejemplo si hay un error
        setCustomerFacturas(datosEjemploCliente);
        setSupplierFacturas(datosEjemploProveedor);
        return;
      }
      
      // Cargar facturas de clientes
      const { data: clienteData, error: clienteError } = await supabase
        .from('facturas_cliente')
        .select('*')
        .order('fecha', { ascending: false });
      
      // Cargar facturas de proveedores
      const { data: proveedorData, error: proveedorError } = await supabase
        .from('facturas_proveedor')
        .select('*')
        .order('fecha', { ascending: false });
      
      if (clienteError && proveedorError) {
        console.error('Error cargando facturas de clientes:', clienteError);
        console.error('Error cargando facturas de proveedores:', proveedorError);
        setError('Error al cargar las facturas');
        // Usar datos de ejemplo si hay un error
        setCustomerFacturas(datosEjemploCliente);
        setSupplierFacturas(datosEjemploProveedor);
      } else {
        // Formatear facturas de clientes
        const facturasCliente = (clienteData || []).map(factura => {
          // Obtener información de puertos del campo material si no están en las columnas
          let puerto_origen = factura.puerto_origen;
          let puerto_destino = factura.puerto_destino;
          
          // Si hay material JSON, intentar extraer puertos de ahí
          if (!puerto_origen || !puerto_destino) {
            try {
              const material = factura.material ? JSON.parse(factura.material) : {};
              if (!puerto_origen) {
                puerto_origen = material.puerto_origen || material.po || null;
              }
              if (!puerto_destino) {
                puerto_destino = material.puerto_destino || material.pd || null;
              }
            } catch (e) {
              console.warn('Error al parsear material para puertos:', e);
            }
          }
          
          return {
            ...factura,
            id: String(factura.id),
            fecha_emision: factura.fecha_emision || factura.fecha || new Date().toISOString(),
            fecha_vencimiento: factura.fecha_vencimiento || factura.fecha || new Date().toISOString(),
            total: factura.total || factura.monto || 0,
            estado: factura.estado || 'pendiente',
            divisa: factura.divisa || 'EUR',
            cliente: factura.cliente || 'Cliente sin especificar',
            tipo: 'cliente',
            puerto_origen,
            puerto_destino
          };
        });
        
        // Formatear facturas de proveedores
        const facturasProveedor = (proveedorData || []).map(factura => ({
          ...factura,
          id: String(factura.id),
          fecha_emision: factura.fecha_emision || factura.fecha || new Date().toISOString(),
          fecha_vencimiento: factura.fecha_vencimiento || factura.fecha || new Date().toISOString(),
          total: factura.total || factura.monto || 0,
          estado: factura.estado || 'pendiente',
          divisa: factura.divisa || 'EUR',
          cliente: factura.proveedor || 'Proveedor sin especificar',
          tipo: 'proveedor'
        }));
        
        setCustomerFacturas(facturasCliente);
        setSupplierFacturas(facturasProveedor);
      }
    } catch (err) {
      console.error('Error cargando facturas:', err);
      setError('Error al cargar las facturas');
      // Usar datos de ejemplo si hay un error
      setCustomerFacturas(datosEjemploCliente);
      setSupplierFacturas(datosEjemploProveedor);
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar una factura
  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta factura? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setDeleteLoading(id);
    
    try {
      const supabase = getSupabaseClient();
      
      // Determinar la tabla correcta según el tipo de factura
      const tableName = activeTab === 'customer' ? 'facturas_cliente' : 'facturas_proveedor';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Actualizar listas según el tipo de factura
      if (activeTab === 'customer') {
        setCustomerFacturas(prev => prev.filter(p => p.id !== id));
      } else {
        setSupplierFacturas(prev => prev.filter(p => p.id !== id));
      }
      
    } catch (err) {
      console.error('Error eliminando factura:', err);
      setError('Error al eliminar la factura');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filtrar facturas según búsqueda
  const filteredFacturas = (activeTab === 'customer' ? customerFacturas : supplierFacturas)
    .filter(factura => {
      if (!searchQuery) return true;
      
      // Buscar en número de factura
      if (factura.numero_factura && factura.numero_factura.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true;
      }
      
      // Buscar en cliente
      if (factura.cliente && factura.cliente.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true;
      }
      
      // Buscar en estado
      if (factura.estado && factura.estado.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true;
      }
      
      return false;
    });

  // Funciones de formateo
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: currency || 'EUR'
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 sm:mb-0">
            Facturas
          </h1>
          <Link 
            href={`/facturas/new-${activeTab}`}
            className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nueva Factura {activeTab === 'customer' ? 'Cliente' : 'Proveedor'}
          </Link>
        </div>
        
        {/* Pestañas de Cliente/Proveedor */}
        <FacturaTabs 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
        
        {/* Buscador */}
        <div className="bg-white shadow-md rounded-lg p-5 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder={`Buscar facturas de ${activeTab === 'customer' ? 'clientes' : 'proveedores'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
        </div>
        
        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Tabla de facturas */}
        <FacturaTable
          facturas={filteredFacturas}
          isLoading={loading}
          onDelete={handleDelete}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
}

// Componente principal que usa Suspense
export default function FacturasPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FacturasContent />
    </Suspense>
  );
}

// Datos de ejemplo para facturas de clientes
const datosEjemploCliente: Factura[] = [
  {
    id: '1',
    numero_factura: "FAC-2023-001",
    fecha_emision: "2023-05-10",
    fecha_vencimiento: "2023-06-10",
    cliente: "Comercial Acme, S.L.",
    cliente_id: 1,
    total: 1250.75,
    estado: "pagada",
    divisa: "EUR",
    condiciones_pago: "30 días",
    tipo: 'cliente'
  },
  {
    id: '2',
    numero_factura: "FAC-2023-002",
    fecha_emision: "2023-05-20",
    fecha_vencimiento: "2023-06-20",
    cliente: "Distribuciones García",
    cliente_id: 2,
    total: 2350.00,
    estado: "pendiente",
    divisa: "EUR",
    condiciones_pago: "60 días",
    tipo: 'cliente'
  },
  {
    id: '3',
    numero_factura: "FAC-2023-003",
    fecha_emision: "2023-06-01",
    fecha_vencimiento: "2023-07-01",
    cliente: "Industrias Martínez, S.A.",
    cliente_id: 3,
    total: 4500.00,
    estado: "emitida",
    divisa: "EUR",
    condiciones_pago: "30 días",
    tipo: 'cliente'
  }
];

// Datos de ejemplo para facturas de proveedores
const datosEjemploProveedor: Factura[] = [
  {
    id: '101',
    numero_factura: "PROV-2023-001",
    fecha_emision: "2023-04-15",
    fecha_vencimiento: "2023-05-15",
    cliente: "Suministros Industriales López",
    proveedor_id: 101,
    total: 875.50,
    estado: "pagada",
    divisa: "EUR",
    condiciones_pago: "30 días",
    tipo: 'proveedor'
  },
  {
    id: '102',
    numero_factura: "PROV-2023-002",
    fecha_emision: "2023-05-05",
    fecha_vencimiento: "2023-06-05",
    cliente: "Materiales Construcción S.A.",
    proveedor_id: 102,
    total: 3150.25,
    estado: "pendiente",
    divisa: "EUR",
    condiciones_pago: "30 días",
    tipo: 'proveedor'
  },
  {
    id: '103',
    numero_factura: "PROV-2023-003",
    fecha_emision: "2023-05-18",
    fecha_vencimiento: "2023-06-18",
    cliente: "Recisur",
    proveedor_id: 103,
    total: 1980.00,
    estado: "vencida",
    divisa: "EUR",
    condiciones_pago: "30 días",
    tipo: 'proveedor'
  }
]; 
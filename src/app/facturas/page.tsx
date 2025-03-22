'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiPlus, FiSearch, FiChevronLeft, FiChevronRight, FiEdit, FiTrash2, FiCheck, FiClock, FiAlertTriangle } from 'react-icons/fi';

// Tipos
type InvoiceTab = 'customer' | 'supplier';
type Invoice = {
  id: string;
  numero?: string;
  fecha: string;
  cliente_nombre?: string;
  proveedor_nombre?: string;
  monto: number;
  material?: string;
  estado: 'pagada' | 'pendiente' | 'vencida';
  numero_operacion?: string;
};

export default function FacturasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estados
  const [activeTab, setActiveTab] = useState<InvoiceTab>('customer');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Detectar el tab activo desde la URL
  useEffect(() => {
    const tab = searchParams.get('tab') as InvoiceTab;
    if (tab && (tab === 'customer' || tab === 'supplier')) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  
  // Cargar datos según el tab activo
  useEffect(() => {
    setLoading(true);
    
    // Simulamos la carga de datos
    setTimeout(() => {
      if (activeTab === 'customer') {
        // Datos de facturas de cliente
        setInvoices([
          {
            id: 'inv-001',
            numero: 'FC-2023-001',
            fecha: '2023-09-15',
            cliente_nombre: 'DDH TRADE CO.,LIMITED',
            monto: 12500.00,
            material: 'PP JUMBO BAGS',
            estado: 'pagada'
          },
          {
            id: 'inv-002',
            numero: 'FC-2023-002',
            fecha: '2023-10-22',
            cliente_nombre: 'LAO QIXIN CO.,LTD.',
            monto: 8750.50,
            material: 'PET BOTTLES',
            estado: 'pendiente'
          },
          {
            id: 'inv-003',
            numero: 'FC-2023-003',
            fecha: '2023-11-05',
            cliente_nombre: 'JIANGSU INTCO',
            monto: 15200.75,
            material: 'HDPE BOTTLES',
            estado: 'pendiente'
          },
          {
            id: 'inv-004',
            numero: 'FC-2023-004',
            fecha: '2023-11-18',
            cliente_nombre: 'DDH TRADE CO.,LIMITED',
            monto: 9300.25,
            material: 'PP JUMBO BAGS',
            estado: 'vencida'
          }
        ]);
      } else {
        // Datos de facturas de proveedor
        setInvoices([
          {
            id: 'sup-001',
            numero_operacion: 'OP-2023-001',
            fecha: '2023-09-10',
            proveedor_nombre: 'Reciclajes Valencia S.L.',
            monto: 5800.00,
            material: 'PP SCRAP',
            estado: 'pagada'
          },
          {
            id: 'sup-002',
            numero_operacion: 'OP-2023-015',
            fecha: '2023-10-05',
            proveedor_nombre: 'Plásticos Sevilla S.A.',
            monto: 7200.50,
            material: 'PET BOTTLES',
            estado: 'pendiente'
          },
          {
            id: 'sup-003',
            numero_operacion: 'OP-2023-022',
            fecha: '2023-11-12',
            proveedor_nombre: 'Recuperaciones Madrid',
            monto: 4300.75,
            material: 'HDPE BOTTLES',
            estado: 'pendiente'
          }
        ]);
      }
      
      setTotalPages(3); // Simulación de paginación
      setLoading(false);
    }, 500);
  }, [activeTab]);
  
  // Función para filtrar facturas según el término de búsqueda
  const filteredInvoices = invoices.filter(invoice => {
    const searchLower = searchTerm.toLowerCase();
    
    if (activeTab === 'customer') {
      return (
        invoice.numero?.toLowerCase().includes(searchLower) ||
        invoice.cliente_nombre?.toLowerCase().includes(searchLower) ||
        invoice.material?.toLowerCase().includes(searchLower)
      );
    } else {
      return (
        invoice.numero_operacion?.toLowerCase().includes(searchLower) ||
        invoice.proveedor_nombre?.toLowerCase().includes(searchLower) ||
        invoice.material?.toLowerCase().includes(searchLower)
      );
    }
  });
  
  // Manejar cambio de tab
  const handleTabChange = (tab: InvoiceTab) => {
    setActiveTab(tab);
    router.push(`/facturas?tab=${tab}`);
  };
  
  // Manejar eliminación
  const handleDelete = (id: string) => {
    setInvoices(invoices.filter(invoice => invoice.id !== id));
  };
  
  // Manejar edición
  const handleEdit = (id: string) => {
    if (activeTab === 'customer') {
      router.push(`/facturas/edit-customer/${id}?tab=${activeTab}`);
    } else {
      router.push(`/facturas/edit-supplier/${id}?tab=${activeTab}`);
    }
  };
  
  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Obtener ícono según el estado
  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'pagada':
        return <FiCheck className="w-5 h-5 text-green-500" />;
      case 'pendiente':
        return <FiClock className="w-5 h-5 text-yellow-500" />;
      case 'vencida':
        return <FiAlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  // Obtener color de badge según el estado
  const getStatusBadgeClass = (estado: string) => {
    switch (estado) {
      case 'pagada':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'vencida':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Facturas</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/facturas/new-${activeTab}?tab=${activeTab}`)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" />
            Nueva Factura {activeTab === 'customer' ? 'Cliente' : 'Proveedor'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => handleTabChange('customer')}
          className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${
            activeTab === 'customer'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Facturas Cliente
        </button>
        <button
          onClick={() => handleTabChange('supplier')}
          className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${
            activeTab === 'supplier'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Facturas Proveedor
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md h-10"
            placeholder="Buscar facturas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Contenido de facturas */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando facturas...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-500">No se encontraron facturas</p>
        </div>
      ) : (
        <div>
          {/* Cabeceras */}
          <div className="hidden md:grid md:grid-cols-7 gap-4 px-6 py-3 mb-4 text-xs font-medium text-gray-500 uppercase bg-gray-50 rounded-lg">
            <div>{activeTab === 'customer' ? 'Número' : 'Operación'}</div>
            <div>Fecha</div>
            <div>{activeTab === 'customer' ? 'Cliente' : 'Proveedor'}</div>
            <div>Material</div>
            <div>Monto</div>
            <div className="text-center">Estado</div>
            <div className="text-center">Acciones</div>
          </div>
          
          {/* Tarjetas de facturas */}
          <div className="space-y-6">
            {filteredInvoices.map((invoice) => (
              <div 
                key={invoice.id} 
                className="bg-white rounded-lg border border-gray-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
              >
                <div className="md:hidden px-4 py-3 bg-gray-50 border-b">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">
                      {activeTab === 'customer' ? invoice.numero : invoice.numero_operacion}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(invoice.estado)}`}>
                      {invoice.estado.charAt(0).toUpperCase() + invoice.estado.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 md:grid md:grid-cols-7 md:gap-4 md:items-center">
                  {/* Número/Operación */}
                  <div className="hidden md:block">
                    <span className="font-medium text-gray-700">
                      {activeTab === 'customer' ? invoice.numero : invoice.numero_operacion}
                    </span>
                  </div>
                  
                  {/* Fecha */}
                  <div className="md:col-span-1">
                    <div className="md:hidden text-xs text-gray-500 uppercase mb-1">Fecha</div>
                    <span className="text-gray-600">{invoice.fecha}</span>
                  </div>
                  
                  {/* Cliente/Proveedor */}
                  <div className="md:col-span-1 mt-2 md:mt-0">
                    <div className="md:hidden text-xs text-gray-500 uppercase mb-1">
                      {activeTab === 'customer' ? 'Cliente' : 'Proveedor'}
                    </div>
                    <span className="text-gray-800 font-medium">
                      {activeTab === 'customer' ? invoice.cliente_nombre : invoice.proveedor_nombre}
                    </span>
                  </div>
                  
                  {/* Material */}
                  <div className="md:col-span-1 mt-2 md:mt-0">
                    <div className="md:hidden text-xs text-gray-500 uppercase mb-1">Material</div>
                    <span className="text-gray-600">{invoice.material}</span>
                  </div>
                  
                  {/* Monto */}
                  <div className="md:col-span-1 mt-2 md:mt-0">
                    <div className="md:hidden text-xs text-gray-500 uppercase mb-1">Monto</div>
                    <span className="text-gray-800 font-medium">
                      {invoice.monto.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  
                  {/* Estado */}
                  <div className="md:col-span-1 mt-2 md:mt-0 md:flex md:justify-center">
                    <div className="md:hidden text-xs text-gray-500 uppercase mb-1">Estado</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(invoice.estado)}`}>
                      {invoice.estado.charAt(0).toUpperCase() + invoice.estado.slice(1)}
                    </span>
                  </div>
                  
                  {/* Acciones - Ahora integradas en la misma línea */}
                  <div className="flex justify-end space-x-2 mt-4 md:mt-0 md:col-span-1">
                    <button
                      onClick={() => handleEdit(invoice.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <FiEdit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Paginación */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${
                  currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{Math.min(1, filteredInvoices.length)}</span> a{' '}
                  <span className="font-medium">{Math.min(currentPage * 10, filteredInvoices.length)}</span> de{' '}
                  <span className="font-medium">{filteredInvoices.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                      currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Anterior</span>
                    <FiChevronLeft className="h-5 w-5" />
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handlePageChange(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        currentPage === index + 1
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                      } text-sm font-medium`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                      currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Siguiente</span>
                    <FiChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiPlus, FiSearch, FiEdit, FiEye, FiTrash2, FiDownload, FiFileText, FiX, FiAlertCircle, FiRefreshCw, FiClock, FiCheckCircle, FiTag } from "react-icons/fi";
import { getSupabaseClient, ejecutarMigracionProformas } from "@/lib/supabase";
import ProformaTabs from "./components/proforma-tabs";
import { Proforma, ProformaTab } from "./components/types";
import ProformaTable from "./components/proforma-table";

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
function ProformasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Obtener la pestaña activa desde la URL o usar 'customer' por defecto
  const [activeTab, setActiveTab] = useState<ProformaTab>(
    (searchParams.get('tab') as ProformaTab) || 'customer'
  );
  
  const [customerProformas, setCustomerProformas] = useState<Proforma[]>([]);
  const [supplierProformas, setSupplierProformas] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Cargar proformas al montar el componente
  useEffect(() => {
    cargarProformas();
  }, []);

  // Actualizar URL cuando cambia la pestaña
  const handleTabChange = (tab: ProformaTab) => {
    setActiveTab(tab);
    router.push(`/proformas?tab=${tab}`, { scroll: false });
  };

  // Función para cargar proformas desde Supabase
  const cargarProformas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = getSupabaseClient();
      
      // Ejecutar migración para asegurar que la tabla existe
      console.log('Ejecutando migración de proformas...');
      const resultadoMigracion = await ejecutarMigracionProformas();
      
      if (!resultadoMigracion.success) {
        console.error('Error en la migración de proformas:', resultadoMigracion.error);
        setError('Error inicializando la tabla de proformas: ' + resultadoMigracion.message);
        setLoading(false);
        return;
      }
      
      // Cargar todas las proformas con información completa
      const { data, error: fetchError } = await supabase
        .from('proformas')
        .select('*, clientes(nombre)')
        .order('fecha', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (data) {
        // Imprimir para depuración
        console.log('Datos de proformas completos:', data);
        
        // Separar proformas por tipo (cliente/proveedor) basado en las notas
        const customerProfs: Proforma[] = [];
        const supplierProfs: Proforma[] = [];
        
        data.forEach(proforma => {
          // Imprimir cada proforma para depuración
          console.log(`Proforma ID ${proforma.id}:`, {
            id_externo: proforma.id_externo,
            cliente_id: proforma.cliente_id,
            cliente: proforma.clientes?.nombre,
            notas: proforma.notas
          });
          
          // Si tiene notas y contiene "Proveedor:" es una proforma de proveedor
          if (proforma.notas && proforma.notas.includes('Proveedor:')) {
            supplierProfs.push({
              ...proforma,
              id: String(proforma.id) // Asegurar que id es string para el componente
            });
          } else {
            // Por defecto, asumimos que es una proforma de cliente
            customerProfs.push({
              ...proforma,
              id: String(proforma.id) // Asegurar que id es string para el componente
            });
          }
        });
        
        setCustomerProformas(customerProfs);
        setSupplierProformas(supplierProfs);
      }
    } catch (err) {
      console.error('Error cargando proformas:', err);
      setError('Error al cargar las proformas');
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar una proforma
  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta proforma? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setDeleteLoading(id);
    
    try {
      const supabase = getSupabaseClient();
      
      // Eliminar la proforma directamente
      const { error } = await supabase
        .from('proformas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Actualizar listas según el tipo de proforma
      if (activeTab === 'customer') {
        setCustomerProformas(prev => prev.filter(p => p.id !== id));
      } else {
        setSupplierProformas(prev => prev.filter(p => p.id !== id));
      }
      
    } catch (err) {
      console.error('Error eliminando proforma:', err);
      alert(`Error al eliminar la proforma: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setError('Error al eliminar la proforma');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filtrar proformas según búsqueda
  const filteredProformas = (activeTab === 'customer' ? customerProformas : supplierProformas)
    .filter(proforma => {
      if (!searchQuery) return true;
      
      // Buscar en ID externo
      if (proforma.id_externo && proforma.id_externo.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true;
      }
      
      // Buscar en notas
      if (proforma.notas && proforma.notas.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true;
      }
      
      return false;
    });

  // Funciones de formateo
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR'
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
            Proformas
          </h1>
          <Link 
            href={`/proformas/new-${activeTab}`}
            className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nueva Proforma {activeTab === 'customer' ? 'Cliente' : 'Proveedor'}
          </Link>
        </div>
        
        {/* Pestañas de Cliente/Proveedor */}
        <ProformaTabs 
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
              placeholder={`Buscar proformas de ${activeTab === 'customer' ? 'clientes' : 'proveedores'}...`}
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
        
        {/* Tabla de proformas */}
        <ProformaTable
          proformas={filteredProformas}
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
export default function ProformasPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProformasContent />
    </Suspense>
  );
} 
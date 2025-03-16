'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchBar from './components/search-bar';
import ProformaTabs from './components/proforma-tabs';
import ProformaTable from './components/proforma-table';
import ActionBar from './components/action-bar';
import { Proforma, ProformaTab } from './components/types';
import { generateMockProformas } from './utils/mock-data';

export default function ProformasPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProformaTab>('customer');
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Caché para almacenar datos por pestaña
  const [cachedData, setCachedData] = useState<{
    customer: Proforma[];
    supplier: Proforma[];
  }>({
    customer: [],
    supplier: []
  });

  // Cargamos los datos una sola vez al inicio para cada pestaña
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      
      // Generamos datos para ambas pestañas al mismo tiempo
      const customerData = generateMockProformas('customer', 20);
      const supplierData = generateMockProformas('supplier', 20);
      
      setCachedData({
        customer: customerData,
        supplier: supplierData
      });
      
      // Determinamos la pestaña activa desde la URL
      const tabParam = searchParams.get('tab');
      const currentTab = (tabParam === 'supplier' || tabParam === 'customer') 
        ? tabParam 
        : 'customer';
      
      setActiveTab(currentTab);
      
      // Aplicamos paginación a los datos de la pestaña actual
      const dataToUse = currentTab === 'customer' ? customerData : supplierData;
      const pageSize = 5;
      const totalP = Math.ceil(dataToUse.length / pageSize);
      const paginatedData = dataToUse.slice(0, pageSize);
      
      setProformas(paginatedData);
      setTotalPages(totalP || 1);
      setLoading(false);
    };
    
    loadInitialData();
  }, [searchParams]);

  // Memoizamos la función para filtrar y paginar los datos
  const filterAndPaginateData = useCallback((
    tab: ProformaTab, 
    search: string, 
    page: number,
    data: Proforma[]
  ) => {
    // Filtramos según el término de búsqueda
    const filteredData = search 
      ? data.filter(p => 
          p.cliente_nombre.toLowerCase().includes(search.toLowerCase()) ||
          (p.id_externo && p.id_externo.toLowerCase().includes(search.toLowerCase())) ||
          p.material.toLowerCase().includes(search.toLowerCase())
        )
      : data;
    
    // Aplicamos paginación
    const pageSize = 5;
    const totalP = Math.ceil(filteredData.length / pageSize);
    const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);
    
    return { paginatedData, totalPages: totalP || 1 };
  }, []);

  // Este efecto maneja cambios en la página o en el término de búsqueda
  useEffect(() => {
    if (cachedData[activeTab].length === 0) return;
    
    const processData = () => {
      setLoading(true);
      
      // Usamos los datos en caché para la pestaña actual
      const { paginatedData, totalPages: totalP } = filterAndPaginateData(
        activeTab,
        searchTerm,
        currentPage,
        cachedData[activeTab]
      );
      
      // Actualizamos el estado con un pequeño retraso para mostrar el indicador de carga
      setTimeout(() => {
        setProformas(paginatedData);
        setTotalPages(totalP);
        setLoading(false);
      }, 200); // Reducido de 800ms a 200ms para una respuesta más rápida
    };
    
    processData();
  }, [activeTab, searchTerm, currentPage, cachedData, filterAndPaginateData]);

  const handleTabChange = (tab: ProformaTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    // No llamamos a fetchProformas porque el useEffect se encargará de procesar los datos
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleDelete = (id: string) => {
    // Actualizamos tanto la vista actual como la caché
    setProformas(proformas.filter(p => p.id !== id));
    
    setCachedData(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(p => p.id !== id)
    }));
    
    alert(`Proforma ${id} eliminada`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Proformas</h1>
      
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
        <SearchBar onSearch={handleSearch} />
      </div>
      
      <ProformaTabs activeTab={activeTab} onTabChange={handleTabChange} />
      
      <ProformaTable
        proformas={proformas}
        isLoading={loading}
        onDelete={handleDelete}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        activeTab={activeTab}
      />
      
      <ActionBar
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        activeTab={activeTab}
      />
    </div>
  );
} 
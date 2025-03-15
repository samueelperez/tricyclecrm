'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Importar componentes
import SearchBar from './components/search-bar';
import ProformaTabs from './components/proforma-tabs';
import ProformaTable from './components/proforma-table';
import ActionBar from './components/action-bar';

// Importar tipos
import { Proforma, ProformaTab } from './components/types';

export default function ProformasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProformaTab>('customer');
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Determinar la pestaña activa desde la URL
    const tab = searchParams.get('tab');
    if (tab === 'supplier') {
      setActiveTab('supplier');
    } else {
      setActiveTab('customer');
    }

    fetchProformas();
  }, [searchParams, activeTab, currentPage]);

  const fetchProformas = async () => {
    setLoading(true);
    try {
      // En un entorno real, esto sería una llamada a la API
      // Por ahora, simulamos los datos
      const mockData: Proforma[] = [
        {
          id: 1,
          id_externo: 'INV003',
          fecha: '2025-01-13',
          cliente_nombre: 'DDH TRADE CO.,LIMITED',
          monto: 48000.00,
          material: 'PP JUMBO BAGS'
        },
        {
          id: 2,
          id_externo: 'INV002',
          fecha: '2025-01-08',
          cliente_nombre: 'DDH TRADE CO.,LIMITED',
          monto: 64000.00,
          material: 'PP JUMBO BAGS'
        },
        {
          id: 3,
          id_externo: 'INV001',
          fecha: '2024-11-28',
          cliente_nombre: 'LAO QIXIN CO.,LTD.',
          monto: 20000.00,
          material: 'PP JUMBO BAGS'
        }
      ];

      // Filtrar por búsqueda si existe un término
      const filtered = searchTerm
        ? mockData.filter(p => 
            p.id_externo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.material.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : mockData;

      setProformas(filtered);
      setTotalPages(Math.ceil(filtered.length / 10) || 1);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching proformas:", error);
      setLoading(false);
    }
  };

  const handleTabChange = (tab: ProformaTab) => {
    setActiveTab(tab);
    router.push(`/proformas?tab=${tab}`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Resetear a la primera página al buscar
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta proforma?')) {
      try {
        // En un entorno real, aquí haríamos la llamada a la API para eliminar
        setProformas(proformas.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting proforma:", error);
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  return (
    <div className="p-6">
      {/* Barra de búsqueda */}
      <SearchBar 
        searchTerm={searchTerm} 
        onSearch={handleSearch} 
      />

      {/* Pestañas */}
      <ProformaTabs 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />

      {/* Tabla de proformas */}
      <ProformaTable 
        proformas={proformas}
        loading={loading}
        onDelete={handleDelete}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
      />

      {/* Botón de añadir y paginación */}
      <ActionBar 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
} 
'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { FiEdit2, FiTrash2, FiFileText } from 'react-icons/fi';
import { Proforma, ProformaTab } from './types';

interface ProformaTableProps {
  proformas: Proforma[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  activeTab: ProformaTab;
}

// Función para extraer información del cliente de las notas
const extractClientInfo = (notes?: string): string => {
  if (!notes) return '';
  
  // Buscar patrones específicos en distintos formatos
  const clientPatterns = [
    /Cliente: (.+?)($|\n)/,
    /Cliente:(.+?)($|\n)/,
    /Cliente (.+?)($|\n)/,
    /Proveedor: (.+?)($|\n)/,
    /Proveedor:(.+?)($|\n)/,
    /Proveedor (.+?)($|\n)/
  ];
  
  // Intentar cada patrón
  for (const pattern of clientPatterns) {
    const match = notes.match(pattern);
    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }
  }
  
  // Si no hay coincidencia, buscar otras pistas en el texto
  const lines = notes.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('cliente') || line.toLowerCase().includes('proveedor')) {
      // Extraer la parte después de "Cliente" o "Proveedor" si existe
      const afterLabel = line.split(/cliente|proveedor/i)[1];
      if (afterLabel && afterLabel.trim()) {
        return afterLabel.trim().replace(/^[:\s]+/, '');
      }
    }
  }
  
  // Si aún no hay coincidencia, devolver las primeras palabras de las notas
  return notes.split('\n')[0].substring(0, 25) + (notes.length > 25 ? '...' : '');
};

// Función para extraer información del material de las notas
const extractMaterialInfo = (notes?: string): string => {
  if (!notes) return '';
  
  // Buscar patrones específicos en distintos formatos
  const materialPatterns = [
    /Material: (.+?)($|\n)/,
    /Material:(.+?)($|\n)/,
    /Material (.+?)($|\n)/,
    /Producto: (.+?)($|\n)/,
    /Producto:(.+?)($|\n)/,
    /Producto (.+?)($|\n)/
  ];
  
  // Intentar cada patrón
  for (const pattern of materialPatterns) {
    const match = notes.match(pattern);
    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }
  }
  
  // Si no hay coincidencia, buscar líneas con palabras clave
  const lines = notes.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('material') || line.toLowerCase().includes('producto')) {
      // Extraer la parte después de "Material" o "Producto" si existe
      const afterLabel = line.split(/material|producto/i)[1];
      if (afterLabel && afterLabel.trim()) {
        return afterLabel.trim().replace(/^[:\s]+/, '');
      }
    }
  }
  
  // Si no hay coincidencia, devolver vacío
  return '';
};

// Componente memoizado para la tarjeta de proforma individual
const ProformaCard = memo(({
  proforma,
  formatCurrency,
  formatDate,
  onDelete,
  activeTab
}: {
  proforma: Proforma;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  onDelete: (id: string) => void;
  activeTab: ProformaTab;
}) => {
  // Determinar la ruta de edición según el tipo de proforma
  const editLink = activeTab === 'supplier' 
    ? `/proformas/edit-supplier/${proforma.id}?tab=${activeTab}` 
    : `/proformas/edit-customer/${proforma.id}?tab=${activeTab}`;

  // Obtener el nombre del cliente desde diferentes fuentes
  const clientName = proforma.clientes?.nombre || 
                     (proforma.material ? proforma.material : extractClientInfo(proforma.notas)) || 
                     'Sin cliente';
  
  // Obtener el material desde diferentes fuentes
  const materialInfo = proforma.material || 
                       proforma.producto || 
                       extractMaterialInfo(proforma.notas) || 
                       'Sin material';

  return (
    <div 
      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100"
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="mb-4 md:mb-0">
          <h3 className="text-lg font-semibold text-gray-800">
            {proforma.id_externo || `Sin ID`}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === 'customer' ? 'Cliente' : 'Proveedor'}: {clientName}
          </p>
        </div>
        
        <div className="flex flex-col md:items-end">
          <p className="text-lg font-bold text-gray-800">
            {formatCurrency(proforma.monto)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Fecha: {formatDate(proforma.fecha)}
          </p>
        </div>
      </div>
      
      <div className="mt-4 flex flex-col md:flex-row md:justify-between md:items-center">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Material:</span> {materialInfo}
        </p>
        
        <div className="mt-4 md:mt-0 flex space-x-4">
          <Link 
            href={`/proformas/${proforma.id}/pdf`}
            className="flex items-center text-green-600 hover:text-green-800"
          >
            <FiFileText className="mr-1 h-4 w-4" />
            <span>PDF</span>
          </Link>
          
          <Link 
            href={editLink}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <FiEdit2 className="mr-1 h-4 w-4" />
            <span>Editar</span>
          </Link>
          
          <button
            onClick={() => onDelete(proforma.id)}
            className="flex items-center text-red-600 hover:text-red-800"
          >
            <FiTrash2 className="mr-1 h-4 w-4" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  );
});

ProformaCard.displayName = 'ProformaCard';

// Estado de carga optimizado con menos elementos animados
const LoadingState = () => (
  <div className="mt-6 space-y-4">
    {[1, 2].map((i) => (
      <div key={i} className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

// Componente principal memoizado
const ProformaTable = ({
  proformas,
  isLoading,
  onDelete,
  formatCurrency,
  formatDate,
  activeTab
}: ProformaTableProps) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (proformas.length === 0) {
    return (
      <div className="mt-6 bg-white p-8 rounded-lg shadow-md text-center">
        <p className="text-gray-500 text-lg">No se encontraron proformas.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {proformas.map((proforma) => (
        <ProformaCard
          key={proforma.id}
          proforma={proforma}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onDelete={onDelete}
          activeTab={activeTab}
        />
      ))}
    </div>
  );
};

export default memo(ProformaTable); 
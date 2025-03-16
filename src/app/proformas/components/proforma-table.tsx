'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Proforma, ProformaTab } from './types';

interface ProformaTableProps {
  proformas: Proforma[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  activeTab: ProformaTab;
}

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
}) => (
  <div 
    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100"
  >
    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
      <div className="mb-4 md:mb-0">
        <h3 className="text-lg font-semibold text-gray-800">
          {proforma.id_externo || `PRF-${proforma.id.substring(0, 8)}`}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {activeTab === 'customer' ? 'Cliente' : 'Proveedor'}: {proforma.cliente_nombre}
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
        <span className="font-medium">Material:</span> {proforma.material}
      </p>
      
      <div className="mt-4 md:mt-0 flex space-x-4">
        <Link 
          href={`/proformas/edit/${proforma.id}`} 
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
));

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
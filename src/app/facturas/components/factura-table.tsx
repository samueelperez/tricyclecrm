'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { FiEdit2, FiTrash2, FiFileText, FiDollarSign, FiCalendar, FiTag } from 'react-icons/fi';
import { Factura, FacturaTab } from './types';

interface FacturaTableProps {
  facturas: Factura[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (date: string) => string;
  activeTab: FacturaTab;
}

// Función para obtener el color y clase según el estado
const getEstadoClasses = (estado: string): { bgColor: string, textColor: string } => {
  switch (estado) {
    case 'pagada':
      return { bgColor: 'bg-green-100', textColor: 'text-green-800' };
    case 'pendiente':
      return { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
    case 'emitida':
      return { bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
    case 'vencida':
      return { bgColor: 'bg-orange-100', textColor: 'text-orange-800' };
    case 'anulada':
      return { bgColor: 'bg-red-100', textColor: 'text-red-800' };
    default:
      return { bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  }
};

// Componente memoizado para la tarjeta de factura individual
const FacturaCard = memo(({
  factura,
  formatCurrency,
  formatDate,
  onDelete,
  activeTab
}: {
  factura: Factura;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (date: string) => string;
  onDelete: (id: string) => void;
  activeTab: FacturaTab;
}) => {
  // Determinar la ruta de edición según el tipo de factura
  const editLink = activeTab === 'supplier' 
    ? `/facturas/edit-supplier/${factura.id}?tab=${activeTab}` 
    : `/facturas/edit-customer/${factura.id}?tab=${activeTab}`;

  const { bgColor, textColor } = getEstadoClasses(factura.estado);

  return (
    <div 
      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100"
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="mb-4 md:mb-0">
          <h3 className="text-lg font-semibold text-gray-800">
            {factura.numero_factura || factura.id_externo || `Sin Número`}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === 'customer' ? 'Cliente' : 'Proveedor'}: {factura.cliente || 'Sin especificar'}
          </p>
          {factura.puerto_destino && (
            <p className="text-xs text-gray-500 mt-1">
              <span className="font-medium">Puerto destino:</span> {factura.puerto_destino}
            </p>
          )}
        </div>
        
        <div className="flex flex-col md:items-end">
          <p className="text-lg font-bold text-gray-800">
            {formatCurrency(factura.total, factura.divisa)}
          </p>
          <div className="flex items-center mt-1">
            <FiCalendar className="text-gray-500 mr-1 h-3 w-3" />
            <p className="text-sm text-gray-500">
              Emisión: {formatDate(factura.fecha_emision)}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="flex items-center">
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
            {factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)}
          </span>
          
          <div className="ml-4 flex items-center">
            <FiCalendar className="text-gray-500 mr-1 h-3 w-3" />
            <p className="text-sm text-gray-500">
              Vencimiento: {formatDate(factura.fecha_vencimiento)}
            </p>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-4">
          {activeTab === 'supplier' ? (
            <Link 
              href={`/facturas/view-document?id=${factura.id}&tab=${activeTab}`}
              className="flex items-center text-green-600 hover:text-green-800"
            >
              <FiFileText className="mr-1 h-4 w-4" />
              <span>Documento</span>
            </Link>
          ) : (
            <Link 
              href={`/facturas/${factura.id}/pdf`}
              className="flex items-center text-green-600 hover:text-green-800"
            >
              <FiFileText className="mr-1 h-4 w-4" />
              <span>PDF</span>
            </Link>
          )}
          
          <Link 
            href={editLink}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <FiEdit2 className="mr-1 h-4 w-4" />
            <span>Editar</span>
          </Link>
          
          <button
            onClick={() => onDelete(factura.id)}
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

FacturaCard.displayName = 'FacturaCard';

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
const FacturaTable = ({
  facturas,
  isLoading,
  onDelete,
  formatCurrency,
  formatDate,
  activeTab
}: FacturaTableProps) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (facturas.length === 0) {
    return (
      <div className="mt-6 bg-white p-8 rounded-lg shadow-md text-center">
        <p className="text-gray-500 text-lg">No se encontraron facturas de {activeTab === 'customer' ? 'clientes' : 'proveedores'}.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {facturas.map((factura) => (
        <FacturaCard
          key={factura.id}
          factura={factura}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onDelete={onDelete}
          activeTab={activeTab}
        />
      ))}
    </div>
  );
};

export default memo(FacturaTable); 
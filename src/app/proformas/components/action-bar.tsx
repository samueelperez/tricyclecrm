'use client';

import { useRouter } from 'next/navigation';
import { FiPlus } from 'react-icons/fi';
import { ProformaTab } from './types';

interface ActionBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  activeTab: ProformaTab;
}

export default function ActionBar({ currentPage, totalPages, onPageChange, activeTab }: ActionBarProps) {
  const router = useRouter();
  
  const handleAddNew = () => {
    // Redirigir a la página correspondiente según el tipo de proforma
    if (activeTab === 'supplier') {
      router.push(`/proformas/new-supplier?tab=${activeTab}`);
    } else {
      router.push(`/proformas/new-customer?tab=${activeTab}`);
    }
  };
  
  return (
    <div className="mt-6 flex justify-between items-center">
      <button
        onClick={handleAddNew}
        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
      >
        <FiPlus className="mr-2" /> Add New {activeTab === 'customer' ? 'Customer' : 'Supplier'} Proforma
      </button>

      <div className="flex items-center justify-end space-x-2">
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border'
          }`}
        >
          previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border'
          }`}
        >
          next
        </button>
      </div>
    </div>
  );
} 
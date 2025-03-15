'use client';

interface ProformaTabsProps {
  activeTab: 'customer' | 'supplier';
  onTabChange: (tab: 'customer' | 'supplier') => void;
}

export default function ProformaTabs({ activeTab, onTabChange }: ProformaTabsProps) {
  return (
    <div className="mb-4">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => onTabChange('customer')}
            className={`py-4 px-6 ${
              activeTab === 'customer'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customer proformas
          </button>
          <button
            onClick={() => onTabChange('supplier')}
            className={`py-4 px-6 ${
              activeTab === 'supplier'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Supplier proformas
          </button>
        </nav>
      </div>
    </div>
  );
} 
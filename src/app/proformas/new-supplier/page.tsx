'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiUpload, FiX } from 'react-icons/fi';

interface SupplierProforma {
  dealNumber: string;
  date: string;
  supplierName: string;
  totalAmount: number;
  materialName: string;
  currency: string;
  attachment?: File | null;
}

export default function NewSupplierProformaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [proforma, setProforma] = useState<SupplierProforma>({
    dealNumber: '',
    date: new Date().toISOString().split('T')[0],
    supplierName: '',
    totalAmount: 0,
    materialName: '',
    currency: 'EUR',
    attachment: null
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProforma(prev => ({
      ...prev,
      [name]: name === 'totalAmount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProforma(prev => ({
        ...prev,
        attachment: e.target.files![0]
      }));
    }
  };

  const handleClearAll = () => {
    setProforma({
      dealNumber: '',
      date: new Date().toISOString().split('T')[0],
      supplierName: '',
      totalAmount: 0,
      materialName: '',
      currency: 'EUR',
      attachment: null
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulación de guardado
    setLoading(true);
    try {
      // Aquí iría la lógica para guardar los datos
      console.log('Saving new proforma:', proforma);
      
      // Simulamos un tiempo de procesamiento
      setTimeout(() => {
        setLoading(false);
        // Redirigir a la página de proformas con la pestaña de proveedores activa
        router.push('/proformas?tab=supplier');
      }, 500);
    } catch (error) {
      console.error('Error saving proforma:', error);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link 
          href="/proformas?tab=supplier" 
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <FiArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">New Supplier Proforma</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-700">Supplier Proforma Information</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deal Number */}
            <div>
              <label htmlFor="dealNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Deal Number
              </label>
              <div className="relative">
                <select
                  id="dealNumber"
                  name="dealNumber"
                  value={proforma.dealNumber}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a deal number</option>
                  <option value="INV001">INV001</option>
                  <option value="INV002">INV002</option>
                  <option value="INV003">INV003</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Supplier Proforma Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Proforma Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={proforma.date}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Supplier Name */}
            <div>
              <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name
              </label>
              <div className="relative">
                <select
                  id="supplierName"
                  name="supplierName"
                  value={proforma.supplierName}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a supplier</option>
                  <option value="Recisur">Recisur</option>
                  <option value="Materiales Construcción S.A.">Materiales Construcción S.A.</option>
                  <option value="Suministros Industriales López">Suministros Industriales López</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div>
              <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                total amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                id="totalAmount"
                name="totalAmount"
                value={proforma.totalAmount}
                onChange={handleInputChange}
                required
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Type Material Name */}
            <div>
              <label htmlFor="materialName" className="block text-sm font-medium text-gray-700 mb-1">
                Type Material Name
              </label>
              <input
                type="text"
                id="materialName"
                name="materialName"
                value={proforma.materialName}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <input
                type="text"
                id="currency"
                name="currency"
                value={proforma.currency}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Attachment */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachment
            </label>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-24 w-24 border border-gray-200 rounded flex items-center justify-center mr-4">
                {proforma.attachment ? (
                  <div className="text-center p-1">
                    <div className="text-xs text-gray-500 truncate w-full">
                      {proforma.attachment.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => setProforma(prev => ({ ...prev, attachment: null }))}
                      className="mt-2 text-red-500 hover:text-red-700"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-300 text-sm">File</span>
                )}
              </div>
              <div>
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                >
                  <FiUpload className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
                  Upload Attachment
                </label>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <p className="mt-1 text-xs text-gray-500">
                  PDF, JPEG, PNG, JPG, Max 4MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <FiX className="mr-2 -ml-1 h-5 w-5" />
            Clear All
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
} 
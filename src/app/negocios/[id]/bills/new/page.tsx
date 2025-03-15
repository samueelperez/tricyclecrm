'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiArrowLeft, FiCalendar, FiUpload } from 'react-icons/fi';

export default function AddNewBillPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const negocioId = params.id;
  
  const [formData, setFormData] = useState({
    vendor: '',
    shippingInvoiceDate: '2025-03-15',
    totalAmount: '',
    notes: '',
    attachment: null as File | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData(prev => ({ ...prev, attachment: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Datos del recibo:', formData);
    // Aquí iría la lógica para guardar el recibo
    router.push(`/negocios/${negocioId}?tab=bills`);
  };

  const handleClearAll = () => {
    setFormData({
      vendor: '',
      shippingInvoiceDate: '2025-03-15',
      totalAmount: '',
      notes: '',
      attachment: null,
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white h-full">
      {/* Encabezado */}
      <div className="flex items-center mb-8 pt-6 px-6">
        <Link href={`/negocios/${negocioId}?tab=bills`} className="mr-4">
          <FiArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <h1 className="text-2xl font-medium text-gray-800">Añadir Nuevo Recibo</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Sección de Información del Recibo */}
        <div className="px-6 pb-8">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-medium text-gray-700">Información del Recibo</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            {/* Vendor */}
            <div>
              <label htmlFor="vendor" className="block mb-2 text-gray-700">
                Proveedor
              </label>
              <input
                type="text"
                id="vendor"
                name="vendor"
                placeholder="Nombre del Proveedor"
                value={formData.vendor}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Shipping Invoice Date */}
            <div>
              <label htmlFor="shippingInvoiceDate" className="block mb-2 text-gray-700">
                Fecha de Factura de Envío
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="shippingInvoiceDate"
                  name="shippingInvoiceDate"
                  value={formData.shippingInvoiceDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiCalendar className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div>
              <label htmlFor="totalAmount" className="block mb-2 text-gray-700">
                Importe Total <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="totalAmount"
                name="totalAmount"
                placeholder="€1.500"
                value={formData.totalAmount}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block mb-2 text-gray-700">
                Notas <span className="text-red-500">*</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                placeholder="Notas"
                value={formData.notes}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg h-[42px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Attachment */}
            <div className="md:col-span-2">
              <label htmlFor="attachment" className="block mb-2 text-gray-700">
                Adjunto
              </label>
              <div className="flex">
                <div className="w-24 h-24 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                  {formData.attachment ? (
                    formData.attachment.name
                  ) : (
                    <span className="text-center text-sm">Archivo</span>
                  )}
                </div>
                <div className="ml-4">
                  <label 
                    htmlFor="attachment-input" 
                    className="flex items-center text-blue-600 cursor-pointer hover:text-blue-700 mb-2"
                  >
                    <FiUpload className="mr-2" /> 
                    Subir Adjunto
                  </label>
                  <input
                    type="file"
                    id="attachment-input"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpeg,.png,.jpg"
                  />
                  <p className="text-sm text-gray-500">
                    PDF, JPEG, PNG, JPG, Máx 4MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-5 py-2.5 border border-red-200 bg-red-50 text-red-600 rounded-lg flex items-center hover:bg-red-100 transition-colors"
            >
              Limpiar Todo
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 border border-green-200 bg-green-50 text-green-600 rounded-lg flex items-center hover:bg-green-100 transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 
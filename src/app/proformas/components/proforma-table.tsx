'use client';

import Link from 'next/link';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

interface Proforma {
  id: number;
  id_externo: string;
  fecha: string;
  cliente_nombre: string;
  monto: number;
  material: string;
}

interface ProformaTableProps {
  proformas: Proforma[];
  loading: boolean;
  onDelete: (id: number) => void;
  formatDate: (dateString: string) => string;
  formatCurrency: (amount: number) => string;
}

export default function ProformaTable({ 
  proformas, 
  loading, 
  onDelete, 
  formatDate, 
  formatCurrency 
}: ProformaTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="h-14">
              <th scope="col" className="px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proforma Number
              </th>
              <th scope="col" className="px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th scope="col" className="px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th scope="col" className="px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Materials
              </th>
              <th scope="col" className="px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Cargando proformas...
                </td>
              </tr>
            ) : proformas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No se encontraron proformas
                </td>
              </tr>
            ) : (
              proformas.map((proforma) => (
                <tr 
                  key={proforma.id} 
                  className="h-16 hover:bg-gray-50 transition-colors my-2"
                >
                  <td className="px-6 text-sm font-medium text-gray-900">
                    {proforma.id_externo}
                  </td>
                  <td className="px-6 text-sm text-gray-500">
                    {formatDate(proforma.fecha)}
                  </td>
                  <td className="px-6 text-sm text-gray-500">
                    {proforma.cliente_nombre}
                  </td>
                  <td className="px-6 text-sm font-medium text-gray-900">
                    {formatCurrency(proforma.monto)}
                  </td>
                  <td className="px-6 text-sm text-gray-500">
                    {proforma.material}
                  </td>
                  <td className="px-6 text-sm text-gray-500">
                    <div className="flex space-x-5">
                      <Link 
                        href={`/proformas/edit/${proforma.id}`}
                        aria-label="Editar proforma"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FiEdit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => onDelete(proforma.id)}
                        aria-label="Eliminar proforma"
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
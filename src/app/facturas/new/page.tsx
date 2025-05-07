'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiChevronDown } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import InvoicePrintView from '@/components/invoice-print-view';
import ClienteSelector, { Cliente } from '@/components/cliente-selector';
import { PUERTOS_SUGERIDOS, TERMINOS_PAGO_SUGERIDOS } from '@/lib/constants';
import { useCuentasBancarias, getCuentasBancariasFallback } from '@/hooks/useCuentasBancarias';

interface Invoice {
  // Definición básica para evitar errores de TypeScript
  bankAccount: string;
  // Añade más campos según sea necesario
}

export default function NewInvoicePage() {
  const router = useRouter();
  const printComponentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Obtener cuentas bancarias desde la base de datos
  const { cuentas: cuentasBancarias, loading: loadingCuentas, error: errorCuentas } = useCuentasBancarias();
  const cuentasBancariasDisponibles = cuentasBancarias.length > 0 
    ? cuentasBancarias 
    : getCuentasBancariasFallback();
  
  // Actualizar la inicialización de invoice para usar cuentas dinámicas
  const [invoice, setInvoice] = useState<Invoice>({
    bankAccount: cuentasBancariasDisponibles.length > 0 ? cuentasBancariasDisponibles[0].descripcion : '',
    // Añade más propiedades iniciales aquí
  });
  
  // Actualizar el useEffect para la inicialización si es necesario
  useEffect(() => {
    if (cuentasBancarias.length > 0 && !invoice.bankAccount) {
      setInvoice(prev => ({
        ...prev,
        bankAccount: cuentasBancarias[0].descripcion
      }));
    }
  }, [cuentasBancarias, invoice.bankAccount]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Nueva Factura</h1>
      
      {/* Bank Details */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Datos Bancarios</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Bancaria</label>
          <div className="relative">
            {loadingCuentas ? (
              <div className="w-full p-2 border rounded-md">Cargando cuentas bancarias...</div>
            ) : (
              <select 
                className="w-full p-2 border rounded-md appearance-none"
                value={invoice.bankAccount}
                onChange={(e) => setInvoice({...invoice, bankAccount: e.target.value})}
              >
                {cuentasBancariasDisponibles.map(cuenta => (
                  <option key={cuenta.id} value={cuenta.descripcion}>
                    {cuenta.nombre} - {cuenta.banco} ({cuenta.moneda})
                  </option>
                ))}
              </select>
            )}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              <FiChevronDown className="w-5 h-5" />
            </div>
          </div>
        </div>
        
        {/* Mostrar detalles bancarios */}
        {invoice.bankAccount && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
            {cuentasBancariasDisponibles
              .filter(cuenta => cuenta.descripcion === invoice.bankAccount)
              .map(cuenta => (
                <div key={cuenta.id}>
                  <p><span className="font-medium">Banco:</span> {cuenta.banco}</p>
                  <p><span className="font-medium">IBAN:</span> {cuenta.iban}</p>
                  <p><span className="font-medium">SWIFT:</span> {cuenta.swift}</p>
                  <p><span className="font-medium">Moneda:</span> {cuenta.moneda}</p>
                  <p><span className="font-medium">Beneficiario:</span> {cuenta.beneficiario}</p>
                </div>
              ))
            }
          </div>
        )}
      </div>
      
      {/* Aquí iría el resto del contenido del formulario */}
    </div>
  );
} 
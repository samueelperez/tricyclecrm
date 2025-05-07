'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiUpload, FiX, FiPackage, FiPlus, FiSearch, FiChevronDown } from 'react-icons/fi';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CUENTAS_BANCARIAS } from '@/lib/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getSupabaseClient } from '@/lib/supabase';
import ClienteSelector, { Cliente } from '@/components/cliente-selector';
import { PUERTOS_SUGERIDOS, TERMINOS_PAGO_SUGERIDOS, EMPAQUE_OPCIONES } from '@/lib/constants';
import { useCuentasBancarias, getCuentasBancariasFallback } from '@/hooks/useCuentasBancarias';

interface Material {
  id: number;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
}

interface SupplierProforma {
  dealNumber: string;
  date: string;
  supplierName: string;
  totalAmount: number;
  materialName: string;
  currency: string;
  attachment?: File | null;
  bankAccount: string;
}

// Componente interno MaterialSelector con autocompletado
interface MaterialSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function MaterialSelector({ value, onChange, placeholder = "Busca o añade un material" }: MaterialSelectorProps) {
  const [query, setQuery] = useState(value);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<Material[]>([]);
  const [isCustomValue, setIsCustomValue] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();
  
  // Cargar materiales al montar el componente
  useEffect(() => {
    const fetchMateriales = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('materiales')
          .select('id, nombre, descripcion, categoria')
          .order('nombre');
        
        if (error) throw error;
        setMateriales(data || []);
        setFilteredOptions(data || []);
      } catch (err) {
        console.error('Error al cargar materiales:', err);
        // Valores predeterminados por si falla la carga
        const defaultMaterials = [
          { id: 1, nombre: "PP JUMBO BAGS" },
          { id: 2, nombre: "HDPE PLASTICO" },
          { id: 3, nombre: "PP FILMS" },
          { id: 4, nombre: "PET BOTTLE" }
        ];
        setMateriales(defaultMaterials);
        setFilteredOptions(defaultMaterials);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMateriales();
  }, []);
  
  // Filtrar opciones cuando cambia la consulta
  useEffect(() => {
    if (!query) {
      setFilteredOptions(materiales);
      return;
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    const filtered = materiales.filter(material => 
      material.nombre.toLowerCase().includes(normalizedQuery) ||
      (material.descripcion && material.descripcion.toLowerCase().includes(normalizedQuery))
    );
    
    setFilteredOptions(filtered);
    
    // Determinar si es un valor personalizado
    const exactMatch = materiales.some(material => 
      material.nombre.toLowerCase() === normalizedQuery
    );
    setIsCustomValue(!exactMatch && query.length > 0);
    
  }, [query, materiales]);
  
  // Cerrar opciones al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        optionsRef.current && 
        !optionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onChange(value);
    
    if (!showOptions) {
      setShowOptions(true);
    }
  };
  
  const handleOptionSelect = (material: Material) => {
    setQuery(material.nombre);
    onChange(material.nombre);
    setShowOptions(false);
  };
  
  const handleAddCustomValue = () => {
    if (!query.trim()) return;
    
    onChange(query.trim());
    setShowOptions(false);
  };
  
  return (
    <div className="relative">
      <div className="relative mt-1 rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiPackage className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowOptions(true)}
          placeholder={placeholder}
          className="block w-full rounded-md border-2 border-blue-300 py-2 pl-10 pr-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
      </div>
      
      {showOptions && (
        <div
          ref={optionsRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto max-h-60 focus:outline-none sm:text-sm"
        >
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <svg className="animate-spin h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-500">Cargando materiales...</span>
            </div>
          ) : filteredOptions.length === 0 && !isCustomValue ? (
            <div className="text-gray-500 text-center py-2">
              No se encontraron materiales
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {isCustomValue && (
                <li 
                  className="flex items-center justify-between px-4 py-2 cursor-pointer text-indigo-600 hover:bg-indigo-50"
                  onClick={handleAddCustomValue}
                >
                  <span>
                    <FiPlus className="inline-block mr-2" />
                    Añadir "{query}"
                  </span>
                </li>
              )}
              {filteredOptions.map((material) => (
                <li
                  key={material.id}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleOptionSelect(material)}
                >
                  {material.nombre}
                  {material.categoria && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({material.categoria})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// Componente interno que usa useSearchParams
function NewProformaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'supplier' ? 'supplier' : 'customer';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [showPortSuggestions, setShowPortSuggestions] = useState(false);
  const [showPortDestSuggestions, setShowPortDestSuggestions] = useState(false);
  
  // Obtener cuentas bancarias desde la base de datos
  const { cuentas: cuentasBancarias, loading: loadingCuentas, error: errorCuentas } = useCuentasBancarias();
  const cuentasBancariasDisponibles = cuentasBancarias.length > 0 
    ? cuentasBancarias 
    : getCuentasBancariasFallback();
  
  // Estados para manejar los modos de creación de proforma
  const [createMode, setCreateMode] = useState<'blank' | 'duplicate'>('blank');
  const [proformasToDuplicate, setProformasToDuplicate] = useState<any[]>([]);
  const [selectedProformaId, setSelectedProformaId] = useState('');
  
  // Datos iniciales para la proforma
  const [proforma, setProforma] = useState({
    id: '',
    numero: generateProformaNumber(),
    fecha: format(new Date(), 'yyyy-MM-dd'),
    clienteNombre: '',
    idFiscal: '',
    incoterm: '',
    condicionesPago: '',
    notas: '',
    items: [{
      id: '1',
      descripcion: '',
      cantidad: 0,
      peso: 0,
      precio_unitario: 0,
      valor_total: 0,
      empaque: ''
    }],
    puerto_origen: 'SPAIN', // Valor predeterminado
    puerto_destino: '',
    bankAccount: cuentasBancariasDisponibles.length > 0 ? cuentasBancariasDisponibles[0].descripcion : '',
    subtotal: 0,
    total: 0
  });

  // Actualizar la cuenta bancaria cuando se carguen las cuentas
  useEffect(() => {
    if (cuentasBancarias.length > 0 && !proforma.bankAccount) {
      setProforma(prev => ({
        ...prev,
        bankAccount: cuentasBancarias[0].descripcion
      }));
    }
  }, [cuentasBancarias]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProforma(prev => ({
      ...prev,
      [name]: name === 'subtotal' || name === 'total' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Este campo no se usa en el modelo actual de proforma
    // pero mantenemos la función para futuras implementaciones
    if (e.target.files && e.target.files[0]) {
      console.log("Archivo seleccionado:", e.target.files[0].name);
    }
  };

  const handleClearAll = () => {
    setProforma({
      id: '',
      numero: generateProformaNumber(),
      fecha: new Date().toISOString().split('T')[0],
      clienteNombre: '',
      idFiscal: '',
      incoterm: '',
      condicionesPago: '',
      notas: '',
      items: [{
        id: '1',
        descripcion: '',
        cantidad: 0,
        peso: 0,
        precio_unitario: 0,
        valor_total: 0,
        empaque: ''
      }],
      puerto_origen: 'SPAIN',
      puerto_destino: '',
      bankAccount: cuentasBancariasDisponibles.length > 0 ? cuentasBancariasDisponibles[0].descripcion : '',
      subtotal: 0,
      total: 0
    });
  };

  const handleMaterialChange = (value: string) => {
    const updatedItems = [...proforma.items];
    if (updatedItems[0]) {
      updatedItems[0].descripcion = value;
    }
    setProforma(prev => ({
      ...prev,
      items: updatedItems
    }));
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
        // Redirigir a la página de proformas con la pestaña activa
        router.push(`/proformas?tab=${initialTab}`);
      }, 500);
    } catch (error) {
      console.error('Error saving proforma:', error);
      setLoading(false);
    }
  };

  const pageTitle = initialTab === 'supplier' ? 'New Supplier Proforma' : 'New Customer Proforma';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link 
          href={`/proformas?tab=${initialTab}`} 
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <FiArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-700">
            {initialTab === 'supplier' ? 'Supplier' : 'Customer'} Proforma Information
          </h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deal Number */}
            <div>
              <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-1">
                Número de Proforma
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="numero"
                  name="numero"
                  value={proforma.numero}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="PRO-2023-001"
                />
              </div>
            </div>

            {/* Proforma Date */}
            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
                {initialTab === 'supplier' ? 'Proveedor' : 'Cliente'} Fecha de Proforma
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={proforma.fecha}
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

            {/* Supplier/Customer Name */}
            <div>
              <label htmlFor="clienteNombre" className="block text-sm font-medium text-gray-700 mb-1">
                {initialTab === 'supplier' ? 'Proveedor' : 'Cliente'} Nombre
              </label>
              <div className="relative">
                <select
                  id="clienteNombre"
                  name="clienteNombre"
                  value={proforma.clienteNombre}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Seleccionar {initialTab === 'supplier' ? 'proveedor' : 'cliente'}</option>
                  {initialTab === 'supplier' ? (
                    <>
                      <option value="Recisur">Recisur</option>
                      <option value="Materiales Construcción S.A.">Materiales Construcción S.A.</option>
                      <option value="Suministros Industriales López">Suministros Industriales López</option>
                    </>
                  ) : (
                    <>
                      <option value="Construcciones Martínez S.L.">Construcciones Martínez S.L.</option>
                      <option value="Edificaciones Modernas">Edificaciones Modernas</option>
                      <option value="Obras y Proyectos García">Obras y Proyectos García</option>
                    </>
                  )}
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
              <label htmlFor="subtotal" className="block text-sm font-medium text-gray-700 mb-1">
                Monto Total <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                id="subtotal"
                name="subtotal"
                value={proforma.subtotal}
                onChange={handleInputChange}
                required
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Type Material Name */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción del Material
              </label>
              <input
                type="text"
                id="descripcion"
                name="descripcion"
                value={proforma.items[0]?.descripcion || ''}
                onChange={(e) => {
                  const updatedItems = [...proforma.items];
                  if (updatedItems[0]) {
                    updatedItems[0].descripcion = e.target.value;
                  }
                  setProforma({...proforma, items: updatedItems});
                }}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Descripción del material"
              />
            </div>

            {/* Condiciones de Pago */}
            <div>
              <label htmlFor="condicionesPago" className="block text-sm font-medium text-gray-700 mb-1">
                Condiciones de Pago
              </label>
              <input
                type="text"
                id="condicionesPago"
                name="condicionesPago"
                value={proforma.condicionesPago}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="30% anticipado, 70% contra entrega"
              />
            </div>

            {/* Incoterm */}
            <div>
              <label htmlFor="incoterm" className="block text-sm font-medium text-gray-700 mb-1">
                Incoterm
              </label>
              <input
                type="text"
                id="incoterm"
                name="incoterm"
                value={proforma.incoterm}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="EXW, FOB, CIF, etc."
              />
            </div>
          </div>

          {/* Bank Details - Añadido para igualar con facturas */}
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
                    value={proforma.bankAccount}
                    onChange={(e) => setProforma({...proforma, bankAccount: e.target.value})}
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
            {proforma.bankAccount && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
                {cuentasBancariasDisponibles
                  .filter(cuenta => cuenta.descripcion === proforma.bankAccount)
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

          {/* Attachment */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adjunto
            </label>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-24 w-24 border border-gray-200 rounded flex items-center justify-center mr-4">
                <span className="text-gray-300 text-sm">Archivo</span>
              </div>
              <div>
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                >
                  <FiUpload className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
                  Subir Adjunto
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

// Componente de carga fallback
function LoadingFallback() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
        <div className="h-96 bg-gray-100 rounded"></div>
      </div>
    </div>
  );
}

// Función para generar un número de proforma con formato PRO-yyyy-nnn
function generateProformaNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PRO-${year}-${random}`;
}

// Componente principal que envuelve con Suspense
export default function NewProformaPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewProformaContent />
    </Suspense>
  );
} 
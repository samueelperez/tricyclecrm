'use client';

import { useState, useEffect, useRef } from 'react';
import { FiUser, FiPlus, FiSearch } from 'react-icons/fi';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Cliente {
  id: number;
  nombre: string;
  id_fiscal?: string | null;
  email?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
}

interface ClienteSelectorProps {
  value: string;
  onChange: (clienteNombre: string) => void;
  clientesList?: Cliente[];
  placeholder?: string;
  className?: string;
  onSelect?: (clienteId: number, clienteNombre: string) => void;
}

export default function ClienteSelector({ 
  value,
  onChange,
  onSelect,
  clientesList,
  placeholder = "Buscar cliente...",
  className = ""
}: ClienteSelectorProps) {
  const [query, setQuery] = useState(value);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<Cliente[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();
  
  // Cargar clientes al montar el componente
  useEffect(() => {
    // Si se proporciona una lista de clientes, usarla directamente
    if (clientesList && clientesList.length > 0) {
      setClientes(clientesList);
      setFilteredOptions(clientesList);
      return;
    }
    
    const fetchClientes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('id, nombre, id_fiscal, email, ciudad, telefono')
          .order('nombre');
        
        if (error) throw error;
        setClientes(data || []);
        setFilteredOptions(data || []);
      } catch (err) {
        console.error('Error al cargar clientes:', err);
        setClientes([]);
        setFilteredOptions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClientes();
  }, [clientesList]);
  
  // Actualizar el query cuando cambie el valor externo
  useEffect(() => {
    setQuery(value);
  }, [value]);
  
  // Filtrar opciones cuando cambia la consulta
  useEffect(() => {
    if (!query) {
      setFilteredOptions(clientes);
      return;
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    const filtered = clientes.filter(cliente => 
      cliente.nombre.toLowerCase().includes(normalizedQuery) ||
      (cliente.id_fiscal && cliente.id_fiscal.toLowerCase().includes(normalizedQuery)) ||
      (cliente.email && cliente.email.toLowerCase().includes(normalizedQuery)) ||
      (cliente.ciudad && cliente.ciudad.toLowerCase().includes(normalizedQuery))
    );
    
    setFilteredOptions(filtered);
  }, [query, clientes]);
  
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
  
  const handleOptionSelect = (cliente: Cliente) => {
    setQuery(cliente.nombre);
    
    // Llamar a ambos callbacks si están disponibles
    if (onChange) {
      onChange(cliente.nombre);
    }
    
    if (onSelect) {
      onSelect(cliente.id, cliente.nombre);
    }
    
    setShowOptions(false);
  };
  
  return (
    <div className={`relative ${className}`}>
      <div className="relative mt-1 rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiUser className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowOptions(true)}
          placeholder={placeholder}
          className="block w-full rounded-md border-gray-300 py-2 pl-10 pr-3 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <FiSearch className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {showOptions && (
        <div
          ref={optionsRef}
          className="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto max-h-60 focus:outline-none sm:text-sm"
        >
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <svg className="animate-spin h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-500">Cargando clientes...</span>
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="text-gray-500 text-center py-2">
              No se encontraron clientes
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredOptions.map((cliente) => (
                <li
                  key={cliente.id}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleOptionSelect(cliente)}
                >
                  <div className="font-medium text-gray-900">{cliente.nombre}</div>
                  <div className="flex flex-wrap text-xs text-gray-500 mt-1">
                    {cliente.id_fiscal && (
                      <span className="mr-3">CIF: {cliente.id_fiscal}</span>
                    )}
                    {cliente.ciudad && (
                      <span className="mr-3">{cliente.ciudad}</span>
                    )}
                    {cliente.email && (
                      <span className="mr-3">{cliente.email}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
} 
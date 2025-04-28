'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiSearch, FiX, FiUser, FiMail, FiMapPin } from 'react-icons/fi';

interface Cliente {
  id: string;
  nombre: string;
  id_fiscal?: string;
  email?: string;
  ciudad?: string;
  telefono?: string;
}

interface ClienteSelectorProps {
  value: string;
  clientesList: Cliente[];
  onChange: (nombreCliente: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ClienteSelector({
  value,
  clientesList,
  onChange,
  placeholder = "Seleccionar cliente",
  className = ""
}: ClienteSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtrar clientes basado en el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClientes(clientesList);
    } else {
      const normalizedSearch = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const filtered = clientesList.filter(cliente => {
        const normalizedNombre = cliente.nombre?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
        const normalizedEmail = cliente.email?.toLowerCase() || '';
        const normalizedCiudad = cliente.ciudad?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
        const normalizedIdFiscal = cliente.id_fiscal?.toLowerCase() || '';
        const normalizedTelefono = cliente.telefono?.toLowerCase() || '';
        
        return normalizedNombre.includes(normalizedSearch) || 
               normalizedEmail.includes(normalizedSearch) || 
               normalizedCiudad.includes(normalizedSearch) || 
               normalizedIdFiscal.includes(normalizedSearch) ||
               normalizedTelefono.includes(normalizedSearch);
      });
      setFilteredClientes(filtered);
    }
  }, [searchTerm, clientesList]);

  // Cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Maneja la selección de un cliente
  const handleSelectCliente = (nombre: string) => {
    onChange(nombre);
    setShowDropdown(false);
    setSearchTerm('');
  };

  // Limpiar selección
  const handleClear = () => {
    onChange('');
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className={`relative cliente-selector ${className}`}>
      <div 
        className="flex items-center w-full p-2 border rounded-md cursor-pointer bg-white"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {value ? (
          <div className="flex items-center justify-between w-full">
            <span className="block truncate">{value}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 ml-2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full text-gray-500">
            <span>{placeholder}</span>
            <FiChevronDown className="w-5 h-5" />
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="sticky top-0 p-2 bg-white border-b">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente por nombre, ID, email..."
                className="w-full p-2 pl-8 border rounded-md"
                autoFocus
              />
              <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {filteredClientes.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No se encontraron clientes
            </div>
          ) : (
            <div>
              {filteredClientes.map((cliente) => (
                <div
                  key={cliente.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectCliente(cliente.nombre)}
                >
                  <div className="font-medium">{cliente.nombre}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-1">
                    {cliente.id_fiscal && (
                      <div className="flex items-center text-xs text-gray-500">
                        <FiUser className="mr-1 h-3 w-3" />
                        <span className="truncate">{cliente.id_fiscal}</span>
                      </div>
                    )}
                    {cliente.email && (
                      <div className="flex items-center text-xs text-gray-500">
                        <FiMail className="mr-1 h-3 w-3" />
                        <span className="truncate">{cliente.email}</span>
                      </div>
                    )}
                    {cliente.ciudad && (
                      <div className="flex items-center text-xs text-gray-500">
                        <FiMapPin className="mr-1 h-3 w-3" />
                        <span className="truncate">{cliente.ciudad}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
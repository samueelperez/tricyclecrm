'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiSearch, FiX, FiUser, FiMail, FiMapPin } from 'react-icons/fi';

interface Proveedor {
  id: string;
  nombre: string;
  id_fiscal?: string;
  email?: string;
  ciudad?: string;
  telefono?: string;
  sitio_web?: string;
}

interface ProveedorSelectorProps {
  value: string;
  proveedoresList: Proveedor[];
  onChange: (nombreProveedor: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ProveedorSelector({
  value,
  proveedoresList,
  onChange,
  placeholder = "Seleccionar proveedor",
  className = ""
}: ProveedorSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredProveedores, setFilteredProveedores] = useState<Proveedor[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtrar proveedores basado en el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProveedores(proveedoresList);
    } else {
      const normalizedSearch = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const filtered = proveedoresList.filter(proveedor => {
        const normalizedNombre = proveedor.nombre?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
        const normalizedEmail = proveedor.email?.toLowerCase() || '';
        const normalizedCiudad = proveedor.ciudad?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
        const normalizedIdFiscal = proveedor.id_fiscal?.toLowerCase() || '';
        const normalizedTelefono = proveedor.telefono?.toLowerCase() || '';
        const normalizedWeb = proveedor.sitio_web?.toLowerCase() || '';
        
        return normalizedNombre.includes(normalizedSearch) || 
               normalizedEmail.includes(normalizedSearch) || 
               normalizedCiudad.includes(normalizedSearch) || 
               normalizedIdFiscal.includes(normalizedSearch) ||
               normalizedTelefono.includes(normalizedSearch) ||
               normalizedWeb.includes(normalizedSearch);
      });
      setFilteredProveedores(filtered);
    }
  }, [searchTerm, proveedoresList]);

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

  // Maneja la selección de un proveedor
  const handleSelectProveedor = (nombre: string) => {
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
    <div ref={containerRef} className={`relative proveedor-selector ${className}`}>
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
                placeholder="Buscar proveedor por nombre, ID, email..."
                className="w-full p-2 pl-8 border rounded-md"
                autoFocus
              />
              <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {filteredProveedores.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No se encontraron proveedores
            </div>
          ) : (
            <div>
              {filteredProveedores.map((proveedor) => (
                <div
                  key={proveedor.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectProveedor(proveedor.nombre)}
                >
                  <div className="font-medium">{proveedor.nombre}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-1">
                    {proveedor.id_fiscal && (
                      <div className="flex items-center text-xs text-gray-500">
                        <FiUser className="mr-1 h-3 w-3" />
                        <span className="truncate">{proveedor.id_fiscal}</span>
                      </div>
                    )}
                    {proveedor.email && (
                      <div className="flex items-center text-xs text-gray-500">
                        <FiMail className="mr-1 h-3 w-3" />
                        <span className="truncate">{proveedor.email}</span>
                      </div>
                    )}
                    {proveedor.ciudad && (
                      <div className="flex items-center text-xs text-gray-500">
                        <FiMapPin className="mr-1 h-3 w-3" />
                        <span className="truncate">{proveedor.ciudad}</span>
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
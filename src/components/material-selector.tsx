'use client';

import { useState, useEffect, useRef } from 'react';
import { FiPackage, FiPlus } from 'react-icons/fi';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Material {
  id: number;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
}

interface MaterialSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MaterialSelector({ 
  value, 
  onChange, 
  placeholder = "Busca o añade un material" 
}: MaterialSelectorProps) {
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
  
  // Actualizar el query cuando cambie el valor externo
  useEffect(() => {
    setQuery(value);
  }, [value]);
  
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
          className="block w-full rounded-md border-gray-300 py-2 pl-10 pr-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
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
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FiPackage, FiPlus, FiLoader, FiX } from 'react-icons/fi';

interface Material {
  id: number;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
}

interface MaterialSelectorAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function MaterialSelectorAutocomplete({
  value,
  onChange,
  placeholder = 'Selecciona un material',
  className = '',
  disabled = false
}: MaterialSelectorAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<Material[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCustomValue, setIsCustomValue] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();
  
  // Cargar los materiales al montar el componente
  useEffect(() => {
    const fetchMateriales = async () => {
      if (loading) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('materiales')
          .select('id, nombre, descripcion, categoria')
          .order('nombre');
        
        if (error) throw error;
        setMateriales(data || []);
      } catch (err) {
        console.error('Error al cargar materiales:', err);
        setError('No se pudieron cargar los materiales');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMateriales();
  }, []);
  
  // Filtrar materiales cuando cambia la consulta
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
  
  const handleInputFocus = () => {
    if (!disabled) {
      setShowOptions(true);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (!showOptions) {
      setShowOptions(true);
    }
  };
  
  const handleOptionSelect = (option: Material) => {
    setSelectedOption(option.nombre);
    setQuery(option.nombre);
    onChange(option.nombre);
    setShowOptions(false);
    setIsCustomValue(false);
  };
  
  const handleAddCustomValue = () => {
    if (!query.trim()) return;
    
    onChange(query.trim());
    setShowOptions(false);
    setIsCustomValue(false);
  };
  
  const handleClearSelection = () => {
    setQuery('');
    setSelectedOption(null);
    onChange('');
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
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          } ${className}`}
        />
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              disabled={disabled}
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      
      {showOptions && !disabled && (
        <div
          ref={optionsRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto max-h-60 focus:outline-none sm:text-sm"
        >
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <FiLoader className="animate-spin h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500">Cargando materiales...</span>
            </div>
          ) : filteredOptions.length === 0 && !isCustomValue ? (
            <div className="text-gray-500 text-center py-2">
              {error || 'No se encontraron materiales'}
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
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                    selectedOption === material.nombre ? 'bg-indigo-50 text-indigo-600' : ''
                  }`}
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
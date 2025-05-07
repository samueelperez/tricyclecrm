'use client';

import { useEffect, useState, useRef } from 'react';
import { FiPlus, FiX, FiSearch, FiPackage } from 'react-icons/fi';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

interface Material {
  id: number;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
}

interface MaterialesSelectorProps {
  selectedMaterialIds: number[];
  onChange: (materialIds: number[]) => void;
}

export default function MaterialesSelector({ selectedMaterialIds, onChange }: MaterialesSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  // Cargar materiales al montar el componente
  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('materiales')
          .select('*')
          .order('nombre');
        
        if (error) {
          throw error;
        }
        
        console.log('MaterialesSelector: Materiales cargados de la base de datos:', data?.length || 0);
        setMaterials(data || []);
      } catch (err) {
        console.error('MaterialesSelector: Error al cargar materiales:', err);
        toast.error('Error al cargar la lista de materiales');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaterials();
  }, []);

  // Actualizar los materiales seleccionados cuando cambien los IDs seleccionados
  useEffect(() => {
    console.log('MaterialesSelector: selectedMaterialIds cambiado:', selectedMaterialIds);
    
    if (materials.length > 0) {
      if (selectedMaterialIds.length > 0) {
        const selected = materials.filter(m => selectedMaterialIds.includes(m.id));
        console.log('MaterialesSelector: Materiales seleccionados encontrados:', selected.length);
        setSelectedMaterials(selected);
      } else {
        console.log('MaterialesSelector: No hay materiales seleccionados');
        setSelectedMaterials([]);
      }
    }
  }, [materials, selectedMaterialIds]);

  // Actualizar materiales filtrados cuando cambie la búsqueda
  useEffect(() => {
    if (!searchQuery) {
      setFilteredMaterials(materials);
      return;
    }
    
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const filtered = materials.filter(
      material => 
        material.nombre.toLowerCase().includes(normalizedQuery) ||
        (material.descripcion && material.descripcion.toLowerCase().includes(normalizedQuery)) ||
        (material.categoria && material.categoria.toLowerCase().includes(normalizedQuery))
    );
    
    setFilteredMaterials(filtered);
  }, [searchQuery, materials]);

  // Cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleMaterial = (material: Material) => {
    console.log('MaterialesSelector: Toggle material', material.id, material.nombre);
    
    let newSelectedIds: number[];
    
    if (selectedMaterialIds.includes(material.id)) {
      console.log('MaterialesSelector: Eliminando material de selección');
      // Si ya está seleccionado, lo quitamos
      newSelectedIds = selectedMaterialIds.filter(id => id !== material.id);
    } else {
      console.log('MaterialesSelector: Añadiendo material a selección');
      // Si no está seleccionado, lo añadimos
      newSelectedIds = [...selectedMaterialIds, material.id];
    }
    
    console.log('MaterialesSelector: Nuevos IDs seleccionados:', newSelectedIds);
    onChange(newSelectedIds);
  };

  const handleRemoveMaterial = (id: number) => {
    console.log('MaterialesSelector: Removiendo material', id);
    const newSelectedIds = selectedMaterialIds.filter(materialId => materialId !== id);
    console.log('MaterialesSelector: Nuevos IDs después de remover:', newSelectedIds);
    onChange(newSelectedIds);
  };

  return (
    <div className="w-full">
      {/* Lista de materiales seleccionados */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedMaterials.map(material => (
          <div 
            key={material.id} 
            className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
          >
            <FiPackage className="h-4 w-4" />
            <span>{material.nombre}</span>
            <button 
              type="button"
              onClick={() => handleRemoveMaterial(material.id)}
              className="text-blue-600 hover:text-blue-800 ml-1"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        ))}
        {selectedMaterials.length === 0 && (
          <div className="text-sm text-gray-500 italic">
            No hay materiales seleccionados
          </div>
        )}
      </div>
      
      {/* Botón para abrir el selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className="text-gray-700">Seleccionar materiales</span>
          <FiPlus className="h-5 w-5 text-gray-400" />
        </button>
        
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg">
            <div className="p-2 border-b">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar material..."
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            
            <ul className="max-h-60 overflow-auto py-1">
              {loading ? (
                <li className="px-4 py-2 text-sm text-gray-500">Cargando materiales...</li>
              ) : filteredMaterials.length === 0 ? (
                <li className="px-4 py-2 text-sm text-gray-500">No se encontraron materiales</li>
              ) : (
                filteredMaterials.map(material => (
                  <li 
                    key={material.id}
                    onClick={() => handleToggleMaterial(material)}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center justify-between ${
                      selectedMaterialIds.includes(material.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="ml-2">{material.nombre}</span>
                      {material.categoria && (
                        <span className="ml-2 text-xs text-gray-500">({material.categoria})</span>
                      )}
                    </div>
                    {selectedMaterialIds.includes(material.id) && (
                      <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FiPackage, FiLoader, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

interface Material {
  id: number;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
}

interface MaterialesSelectorProps {
  clienteId: number | null;
  onMaterialesChange?: (materialIds: number[]) => void;
  disabled?: boolean;
}

export default function MaterialesSelector({ clienteId, onMaterialesChange, disabled = false }: MaterialesSelectorProps) {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Cargar todos los materiales disponibles
  const fetchMateriales = async () => {
    if (isLoading) return; // Evitar múltiples cargas simultáneas
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('materiales')
        .select('id, nombre, descripcion, categoria')
        .order('nombre');
      
      if (error) throw error;
      setMateriales(data || []);
      
      // Si hay un cliente ID, intentar cargar sus materiales seleccionados
      if (clienteId) {
        try {
          const response = await fetch(`/api/clientes/materiales?cliente_id=${clienteId}`);
          if (response.ok) {
            const materialesData = await response.json();
            const ids = materialesData?.map((m: Material) => m.id) || [];
            setSelectedMaterialIds(ids);
            if (onMaterialesChange) onMaterialesChange(ids);
          }
        } catch (selectedError) {
          console.error('Error al cargar materiales seleccionados:', selectedError);
          // No mostramos error al usuario aquí
        }
      }
    } catch (err) {
      console.error('Error al cargar materiales:', err);
      setError('No se pudieron cargar los materiales. Verifique la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambios en la selección de materiales
  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => parseInt(option.value));
    setSelectedMaterialIds(selectedOptions);
    if (onMaterialesChange) onMaterialesChange(selectedOptions);
  };

  // Cargar datos al montar el componente (sólo una vez) o bajo demanda
  useEffect(() => {
    // Iniciar con una carga inmediata
    fetchMateriales();
    
    // Forzar finalización de carga después de 3 segundos
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex">
          <FiAlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
          <button 
            onClick={fetchMateriales} 
            className="ml-auto text-red-700 hover:text-red-900"
            disabled={isLoading}
          >
            <FiRefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label htmlFor="material_ids" className="block text-sm font-medium text-gray-700">
          Materiales que compra <span className="text-gray-500 text-xs">(mantén Ctrl para selección múltiple)</span>
        </label>
        <button 
          onClick={fetchMateriales} 
          className="text-gray-500 hover:text-indigo-700 p-1"
          disabled={isLoading}
          title="Recargar materiales"
        >
          <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiPackage className="text-gray-400 h-5 w-5" />
        </div>
        
        {isLoading ? (
          <div className="pl-10 pr-4 py-2 border rounded-md w-full h-32 flex items-center justify-center bg-gray-50">
            <FiLoader className="h-5 w-5 text-blue-500 animate-spin mr-2" />
            <span className="text-gray-500">Cargando materiales...</span>
          </div>
        ) : materiales.length === 0 ? (
          <div className="pl-10 pr-4 py-2 border rounded-md w-full h-32 flex flex-col items-center justify-center bg-gray-50">
            <span className="text-gray-500 mb-2">No hay materiales disponibles</span>
            <button 
              onClick={fetchMateriales} 
              className="text-xs text-indigo-600 hover:text-indigo-800 underline"
              disabled={isLoading}
            >
              Intentar cargar de nuevo
            </button>
          </div>
        ) : (
          <select
            id="material_ids"
            name="material_ids"
            multiple
            value={selectedMaterialIds.map(String)}
            onChange={handleMaterialChange}
            disabled={disabled}
            className={`pl-10 pr-4 py-2 border rounded-md w-full h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          >
            {materiales.map((material) => (
              <option key={material.id} value={material.id}>
                {material.nombre} {material.categoria ? `(${material.categoria})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>
      {!isLoading && materiales.length > 0 && (
        <p className="mt-1 text-xs text-gray-500">Materiales seleccionados: {selectedMaterialIds.length}</p>
      )}
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FiEye, FiEyeOff, FiSave, FiLoader, FiRefreshCw, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface Section {
  id: string;
  name: string;
  route: string;
  icon: string;
  description: string;
  visible: boolean;
  orden: number;
}

export default function SectionVisibilityManager() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadSections();
  }, []);

  async function loadSections() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('orden');

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error al cargar secciones:', error);
      toast.error('No se pudieron cargar las secciones');
    } finally {
      setLoading(false);
    }
  }

  const toggleVisibility = (id: string) => {
    setSections(sections.map(section =>
      section.id === id
        ? { ...section, visible: !section.visible }
        : section
    ));
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex(section => section.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sections.length - 1)
    ) {
      return; // No se puede mover más arriba/abajo
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newSections = [...sections];
    
    // Intercambiar elementos
    [newSections[currentIndex], newSections[newIndex]] = 
    [newSections[newIndex], newSections[currentIndex]];
    
    // Actualizar orden
    newSections[currentIndex].orden = currentIndex + 1;
    newSections[newIndex].orden = newIndex + 1;
    
    setSections(newSections);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      // Actualizar cada sección con sus cambios
      for (const section of sections) {
        const { error } = await supabase
          .from('sections')
          .update({
            visible: section.visible,
            orden: section.orden
          })
          .eq('id', section.id);
        
        if (error) throw error;
      }
      
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error al guardar secciones:', error);
      toast.error('No se pudieron guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="h-8 w-8 animate-spin text-blue-500 mr-2" />
        <span className="text-gray-600">Cargando secciones...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Configure qué secciones serán visibles para los usuarios en la navegación principal.
                Los cambios se aplicarán inmediatamente para todos los usuarios.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sección
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruta
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orden
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visible
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sections.map((section) => (
                <tr key={section.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{section.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {section.route}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {section.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => moveSection(section.id, 'up')}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={sections.indexOf(section) === 0}
                      >
                        <FiArrowUp className="h-4 w-4" />
                      </button>
                      <span className="text-sm text-gray-500">{section.orden}</span>
                      <button 
                        onClick={() => moveSection(section.id, 'down')}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={sections.indexOf(section) === sections.length - 1}
                      >
                        <FiArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => toggleVisibility(section.id)}
                      className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md ${
                        section.visible
                          ? 'text-green-700 bg-green-100 hover:bg-green-200'
                          : 'text-red-700 bg-red-100 hover:bg-red-200'
                      } transition-colors`}
                    >
                      {section.visible ? (
                        <>
                          <FiEye className="mr-1 h-4 w-4" /> Visible
                        </>
                      ) : (
                        <>
                          <FiEyeOff className="mr-1 h-4 w-4" /> Oculto
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 text-right">
        <button
          type="button"
          onClick={saveChanges}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {saving ? (
            <>
              <FiRefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Guardando...
            </>
          ) : (
            <>
              <FiSave className="-ml-1 mr-2 h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
} 
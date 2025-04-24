'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Seccion {
  id: string;
  nombre: string;
  visible: boolean;
}

const SECCIONES_DEFAULT: Seccion[] = [
  { id: "dashboard", nombre: "Dashboard", visible: true },
  { id: "negocios", nombre: "Negocios", visible: true },
  { id: "proformas", nombre: "Proformas", visible: true },
  { id: "facturas", nombre: "Facturas", visible: true },
  { id: "clientes", nombre: "Clientes", visible: true },
  { id: "productos", nombre: "Productos", visible: true },
  { id: "calendario", nombre: "Calendario", visible: true },
  { id: "reportes", nombre: "Reportes", visible: false },
];

export default function SeccionesManager() {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function cargarSecciones() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/secciones');
        
        if (!response.ok) {
          throw new Error('Error al cargar las secciones');
        }
        
        const data = await response.json();
        
        if (data.secciones_visibles) {
          // Convertir el array de IDs a objetos de sección
          const seccionesVisibles = new Set(data.secciones_visibles);
          
          const seccionesActualizadas = SECCIONES_DEFAULT.map(seccion => ({
            ...seccion,
            visible: seccionesVisibles.has(seccion.id)
          }));
          
          setSecciones(seccionesActualizadas);
        } else {
          setSecciones(SECCIONES_DEFAULT);
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('No se pudieron cargar las secciones');
        setSecciones(SECCIONES_DEFAULT);
      } finally {
        setIsLoading(false);
      }
    }
    
    cargarSecciones();
  }, []);

  const handleToggle = (id: string) => {
    setSecciones(prevSecciones => 
      prevSecciones.map(seccion => 
        seccion.id === id 
          ? { ...seccion, visible: !seccion.visible } 
          : seccion
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      // Extraer solo los IDs de las secciones visibles
      const seccionesVisibles = secciones
        .filter(seccion => seccion.visible)
        .map(seccion => seccion.id);
      
      const response = await fetch('/api/admin/secciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secciones: seccionesVisibles,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar las configuraciones');
      }
      
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 mb-8">
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <p className="text-amber-800 text-sm">
            <strong>Nota:</strong> Ocultar una sección no elimina los datos asociados,
            solo impide su visualización en la navegación principal.
          </p>
        </div>
        
        {secciones.map((seccion) => (
          <div
            key={seccion.id}
            className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
          >
            <div className="font-medium">{seccion.nombre}</div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={seccion.visible}
                onChange={() => handleToggle(seccion.id)}
                disabled={isSaving}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          onClick={() => setSecciones(SECCIONES_DEFAULT)}
          disabled={isSaving}
        >
          Restablecer
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={isSaving}
        >
          {isSaving ? (
            <div className="flex items-center">
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
              Guardando...
            </div>
          ) : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
} 
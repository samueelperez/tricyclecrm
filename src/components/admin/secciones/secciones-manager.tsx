'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Check, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

// Define la estructura de una sección
interface Seccion {
  id: string;
  nombre: string;
  ruta: string;
  visible: boolean;
  orden: number;
}

export default function SeccionesManager() {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Cargar las secciones desde la base de datos
  useEffect(() => {
    const fetchSecciones = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('secciones')
          .select('*')
          .order('orden');

        if (error) throw error;
        setSecciones(data || []);
      } catch (err) {
        console.error('Error al cargar secciones:', err);
        setError('No se pudieron cargar las secciones. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchSecciones();
  }, [supabase]);

  // Manejar cambios en la visibilidad de las secciones
  const toggleVisibility = (id: string) => {
    setSecciones(prevSecciones => 
      prevSecciones.map(seccion => 
        seccion.id === id ? { ...seccion, visible: !seccion.visible } : seccion
      )
    );
  };

  // Guardar los cambios en la base de datos
  const handleSave = async () => {
    setSaving(true);
    try {
      // Actualizar cada sección
      for (const seccion of secciones) {
        const { error } = await supabase
          .from('secciones')
          .update({ visible: seccion.visible })
          .eq('id', seccion.id);
        
        if (error) throw error;
      }
      
      toast.success('Configuración de secciones guardada correctamente');
    } catch (err) {
      console.error('Error al guardar secciones:', err);
      toast.error('No se pudieron guardar los cambios. Por favor, intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Cargando secciones...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <p className="text-gray-600 mb-6">
          Configure qué secciones serán visibles para los usuarios en la navegación principal.
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ruta</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Visible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {secciones.map((seccion) => (
                <tr key={seccion.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-800">{seccion.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{seccion.ruta}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleVisibility(seccion.id)}
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                        seccion.visible
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                    >
                      {seccion.visible ? <Check size={18} /> : <X size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {secciones.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay secciones disponibles.
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 px-6 py-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
} 
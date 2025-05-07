'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  FiSave, 
  FiArrowLeft,
  FiPackage,
  FiFileText,
  FiUser,
  FiDollarSign,
  FiHash,
  FiCalendar,
  FiPlusCircle,
  FiMinusCircle,
  FiUpload,
  FiPaperclip
} from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Definir la interfaz para los items de la factura
interface FacturaItem {
  descripcion: string;
  cantidad: number;
  peso: number;
  peso_unidad: string;
  precio_unitario: number;
  total: number;
  codigo: string;
}

// Definir la interfaz para los datos del formulario
interface FormData {
  fecha: Date;
  proveedor_id: number | null;
  numero_factura: string;
  descripcion: string;
  material: string;
  importe: number;
  items: FacturaItem[];
  nombre_archivo?: string | null;
  archivo_adjunto?: File | null;
}

export default function NuevaFacturaProveedorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fecha: new Date(),
    proveedor_id: null,
    numero_factura: '',
    descripcion: '',
    material: '',
    importe: 0,
    items: [],
    nombre_archivo: null,
    archivo_adjunto: null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Función para manejar el cambio de material
  const handleMaterialChange = (value: string) => {
    setFormData({
      ...formData,
      material: value
    });
  };

  // Funciones para manejar los items de la factura
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          descripcion: '',
          cantidad: 1,
          peso: 0,
          peso_unidad: 'MT',
          precio_unitario: 0,
          total: 0,
          codigo: ''
        }
      ]
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);

    // Recalcular el importe total
    const nuevoImporte = updatedItems.reduce((sum, item) => sum + item.total, 0);
    
    setFormData({
      ...formData,
      items: updatedItems,
      importe: nuevoImporte
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Recalcular el total del item si cambia el precio o la cantidad/peso
    if (field === 'precio_unitario' || field === 'cantidad' || field === 'peso') {
      const item = updatedItems[index];
      // Si hay peso, calculamos por peso, sino por cantidad
      if (item.peso && item.peso > 0) {
        updatedItems[index].total = item.precio_unitario * item.peso;
      } else {
        updatedItems[index].total = item.precio_unitario * item.cantidad;
      }
    }
    
    // Recalcular el importe total de la factura
    const nuevoImporte = updatedItems.reduce((sum, item) => sum + item.total, 0);
    
    setFormData({
      ...formData,
      items: updatedItems,
      importe: nuevoImporte
    });
  };
  
  // Aquí implementaríamos el resto de funciones como handleSubmit, handleInputChange, etc.
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // La lógica para enviar el formulario se implementaría aquí
    toast.success('Factura guardada con éxito');
    router.push('/facturas-proveedor');
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Factura de Proveedor</h1>
          <p className="mt-1 text-sm text-gray-500">Ingresa los datos de la nueva factura</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/facturas-proveedor')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <FiArrowLeft className="mr-2 -ml-1" /> Volver
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Aquí irían los campos del formulario */}
            <div className="mb-4">
              <label htmlFor="numero_factura" className="block text-sm font-medium text-gray-700 mb-1">
                Número de Factura
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiHash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="numero_factura"
                  name="numero_factura"
                  value={formData.numero_factura}
                  onChange={(e) => setFormData({...formData, numero_factura: e.target.value})}
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Ej: FACT-001"
                />
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="col-span-1 md:col-span-2 flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => router.push('/facturas-proveedor')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiSave className="mr-2 -ml-1" />
                {saving ? 'Guardando...' : 'Guardar Factura'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
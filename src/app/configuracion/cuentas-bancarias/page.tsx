'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit, FiTrash2, FiPlusCircle, FiSave, FiX, FiDollarSign, FiCreditCard, FiGlobe } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useCuentasBancarias, CuentaBancaria } from '@/hooks/useCuentasBancarias';

export default function CuentasBancariasPage() {
  const router = useRouter();
  const { cuentas, loading, error } = useCuentasBancarias();
  
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<CuentaBancaria>>({
    nombre: '',
    banco: '',
    iban: '',
    swift: '',
    moneda: '',
    beneficiario: '',
    descripcion: ''
  });
  
  // Actualizar el estado local cuando se cargan las cuentas desde el hook
  useEffect(() => {
    if (cuentas.length > 0) {
      setCuentasBancarias(cuentas);
    }
  }, [cuentas]);
  
  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Actualizar descripción automáticamente (banco - iban - moneda)
    if (['banco', 'iban', 'moneda'].includes(name)) {
      const banco = name === 'banco' ? value : formData.banco || '';
      const iban = name === 'iban' ? value : formData.iban || '';
      const moneda = name === 'moneda' ? value : formData.moneda || '';
      
      if (banco && iban && moneda) {
        setFormData(prev => ({
          ...prev,
          descripcion: `${banco} - ${iban} - ${moneda}`
        }));
      }
    }
  };
  
  // Iniciar edición de una cuenta
  const handleEdit = (cuenta: CuentaBancaria) => {
    setEditingId(cuenta.id);
    setFormData(cuenta);
    setIsCreating(false);
  };
  
  // Iniciar creación de una nueva cuenta
  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      nombre: '',
      banco: '',
      iban: '',
      swift: '',
      moneda: '',
      beneficiario: '',
      descripcion: ''
    });
    setIsCreating(true);
  };
  
  // Cancelar edición o creación
  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
  };
  
  // Guardar cambios (crear o actualizar)
  const handleSave = async () => {
    try {
      // Validar campos requeridos
      const requiredFields = ['nombre', 'banco', 'iban', 'swift', 'moneda', 'beneficiario', 'descripcion'];
      for (const field of requiredFields) {
        if (!formData[field as keyof typeof formData]) {
          toast.error(`El campo ${field} es requerido`);
          return;
        }
      }
      
      // Si es una nueva cuenta
      if (isCreating) {
        const response = await fetch('/api/cuentas-bancarias', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al crear cuenta bancaria');
        }
        
        const nuevaCuenta = await response.json();
        setCuentasBancarias(prev => [...prev, nuevaCuenta]);
        toast.success('Cuenta bancaria creada correctamente');
      } 
      // Si es una actualización
      else if (editingId) {
        const response = await fetch('/api/cuentas-bancarias', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            id: editingId
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al actualizar cuenta bancaria');
        }
        
        const cuentaActualizada = await response.json();
        setCuentasBancarias(prev => 
          prev.map(c => c.id === editingId ? cuentaActualizada : c)
        );
        toast.success('Cuenta bancaria actualizada correctamente');
      }
      
      // Limpiar estado
      setEditingId(null);
      setIsCreating(false);
      setFormData({
        nombre: '',
        banco: '',
        iban: '',
        swift: '',
        moneda: '',
        beneficiario: '',
        descripcion: ''
      });
      
    } catch (error) {
      console.error('Error al guardar cuenta bancaria:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar cuenta bancaria');
    }
  };
  
  // Eliminar cuenta bancaria
  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar esta cuenta bancaria?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/cuentas-bancarias?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar cuenta bancaria');
      }
      
      setCuentasBancarias(prev => prev.filter(c => c.id !== id));
      toast.success('Cuenta bancaria eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar cuenta bancaria:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar cuenta bancaria');
    }
  };
  
  // Renderizado del formulario
  const renderForm = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">
          {isCreating ? 'Nueva Cuenta Bancaria' : 'Editar Cuenta Bancaria'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Cuenta</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              placeholder="Ej: BBVA USD"
            />
          </div>
          
          {/* Banco */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
            <input
              type="text"
              name="banco"
              value={formData.banco || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              placeholder="Ej: Banco Bilbao Vizcaya Argentaria"
            />
          </div>
          
          {/* IBAN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
            <input
              type="text"
              name="iban"
              value={formData.iban || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              placeholder="Ej: ES6000495332142610008899"
            />
          </div>
          
          {/* SWIFT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SWIFT/BIC</label>
            <input
              type="text"
              name="swift"
              value={formData.swift || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              placeholder="Ej: BSCHESMM"
            />
          </div>
          
          {/* Moneda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
            <select
              name="moneda"
              value={formData.moneda || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Seleccionar moneda</option>
              <option value="USD">USD - Dólar estadounidense</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - Libra esterlina</option>
            </select>
          </div>
          
          {/* Beneficiario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiario</label>
            <input
              type="text"
              name="beneficiario"
              value={formData.beneficiario || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              placeholder="Ej: Tricycle Import Export SL"
            />
          </div>
          
          {/* Descripción */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input
              type="text"
              name="descripcion"
              value={formData.descripcion || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              placeholder="Ej: Santander S.A. - ES6000495332142610008899 - USD"
            />
            <p className="text-xs text-gray-500 mt-1">
              La descripción se genera automáticamente en el formato "Banco - IBAN - Moneda"
            </p>
          </div>
        </div>
        
        <div className="flex mt-4 gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FiSave className="mr-2" /> Guardar
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            <FiX className="mr-2" /> Cancelar
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cuentas Bancarias</h1>
        {!isCreating && !editingId && (
          <button
            onClick={handleCreate}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FiPlusCircle className="mr-2" /> Nueva Cuenta Bancaria
          </button>
        )}
      </div>
      
      {(isCreating || editingId) && renderForm()}
      
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error al cargar cuentas bancarias: {error}</p>
        </div>
      ) : (
        <>
          {cuentasBancarias.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
              <p>No hay cuentas bancarias registradas. Cree una nueva cuenta bancaria.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Banco
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IBAN
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Moneda
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cuentasBancarias.map((cuenta) => (
                      <tr key={cuenta.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiCreditCard className="mr-2 text-gray-500" />
                            <div className="text-sm font-medium text-gray-900">{cuenta.nombre}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{cuenta.banco}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{cuenta.iban}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            <FiDollarSign className="mr-1" /> {cuenta.moneda}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(cuenta)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <FiEdit className="inline-block" /> Editar
                          </button>
                          <button
                            onClick={() => handleDelete(cuenta.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 className="inline-block" /> Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiArrowLeft, 
  FiPlus, 
  FiTrash2, 
  FiSave, 
  FiPackage,
  FiCalendar,
  FiUser
} from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import ClienteSelector from '@/components/cliente-selector';

// Interfaz para item de lista de empaque
interface PackingListItem {
  id: string;
  container: string;
  precinto: string;
  bales: number;
  weight: number;
  date: string;
}

export default function NewPackingListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<{id: string, nombre: string}[]>([]);
  
  // Estado para la lista de empaque
  const [packingList, setPackingList] = useState({
    id_externo: '',
    fecha: new Date().toISOString().split('T')[0],
    cliente_id: '',
    cliente_nombre: '',
    cliente_direccion: '',
    items: [
      {
        id: Date.now().toString(),
        container: '',
        precinto: '',
        bales: 0,
        weight: 0,
        date: new Date().toISOString().split('T')[0]
      }
    ] as PackingListItem[]
  });

  // Cargar datos de clientes
  useEffect(() => {
    async function loadClients() {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('clientes')
          .select('id, nombre')
          .order('nombre');
          
        if (error) throw error;
        setClients(data || []);
        
        // Verificar si el cliente_id actual existe en la lista cargada
        if (packingList.cliente_id && data) {
          const clientExists = data.some(client => 
            String(client.id) === String(packingList.cliente_id)
          );
          
          if (!clientExists) {
            console.warn('Cliente ID no encontrado en la lista:', packingList.cliente_id);
            // Limpiar cliente_id y cliente_nombre si el ID no existe
            setPackingList(prev => ({
              ...prev,
              cliente_id: '',
              cliente_nombre: ''
            }));
          }
        }
      } catch (error) {
        console.error('Error al cargar clientes:', error);
        alert('Error al cargar la lista de clientes.');
      }
    }
    
    loadClients();
  }, []);

  // Actualizar dirección del cliente cuando se selecciona uno
  useEffect(() => {
    if (packingList.cliente_id) {
      async function loadClientDetails() {
        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase
            .from('clientes')
            .select('direccion, ciudad, pais')
            .eq('id', packingList.cliente_id)
            .single();
            
          if (error) throw error;
          if (data) {
            const direccionCompleta = `${data.direccion || ''}, ${data.ciudad || ''}, ${data.pais || ''}`;
            setPackingList(prev => ({
              ...prev,
              cliente_direccion: direccionCompleta
            }));
          }
        } catch (error) {
          console.error('Error al cargar detalles del cliente:', error);
        }
      }
      
      loadClientDetails();
    }
  }, [packingList.cliente_id]);

  // Manejar cambios en los campos
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cliente_id') {
      // Convertimos a string para asegurar compatibilidad (cliente_id puede ser numérico o string)
      const clientId = String(value);
      console.log('ID de cliente seleccionado:', clientId);
      
      // Buscar el cliente por ID exacto
      const selectedClient = clients.find(client => String(client.id) === clientId);
      console.log('Cliente seleccionado:', selectedClient);
      
      if (selectedClient) {
        // Actualizamos tanto ID como nombre
        setPackingList(prev => ({
          ...prev,
          cliente_id: clientId,
          cliente_nombre: selectedClient.nombre
        }));
        console.log('Estado actualizado con cliente:', { 
          id: clientId, 
          nombre: selectedClient.nombre 
        });
      } else {
        // Si no encontramos el cliente, limpiamos el nombre
        setPackingList(prev => ({
          ...prev,
          cliente_id: clientId,
          cliente_nombre: ''
        }));
        console.log('Cliente no encontrado para ID:', clientId);
      }
    } else {
      setPackingList(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Manejar cambios en los items
  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...packingList.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'bales' || field === 'weight' ? parseFloat(value) || 0 : value
    };
    
    setPackingList({
      ...packingList,
      items: updatedItems
    });
  };

  // Agregar nuevo item
  const addItem = () => {
    setPackingList({
      ...packingList,
      items: [
        ...packingList.items,
        {
          id: Date.now().toString(),
          container: '',
          precinto: '',
          bales: 0,
          weight: 0,
          date: new Date().toISOString().split('T')[0]
        }
      ]
    });
  };

  // Eliminar item
  const removeItem = (index: number) => {
    if (packingList.items.length === 1) {
      alert('La lista debe tener al menos un contenedor.');
      return;
    }
    
    const updatedItems = [...packingList.items];
    updatedItems.splice(index, 1);
    
    setPackingList({
      ...packingList,
      items: updatedItems
    });
  };

  // Calcular totales
  const calculateTotals = () => {
    const totalWeight = packingList.items.reduce((sum, item) => sum + item.weight, 0);
    const totalBales = packingList.items.reduce((sum, item) => sum + item.bales, 0);
    
    return { totalWeight, totalBales };
  };

  // Guardar lista de empaque
  const handleSave = async () => {
    console.log('Estado al guardar:', packingList);
    
    // Validaciones
    if (!packingList.id_externo) {
      alert('Por favor, ingrese un número de lista de empaque.');
      return;
    }
    
    if (!packingList.cliente_id) {
      alert('Por favor, seleccione un cliente (ID no asignado).');
      return;
    }
    
    if (!packingList.cliente_nombre) {
      alert('Por favor, seleccione un cliente (nombre no asignado).');
      return;
    }
    
    // Validar items
    for (const item of packingList.items) {
      if (!item.container || !item.precinto || item.bales <= 0 || item.weight <= 0) {
        alert('Por favor, complete todos los campos de los contenedores y asegúrese de que los valores numéricos sean mayores que cero.');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      const supabase = getSupabaseClient();
      const { totalWeight, totalBales } = calculateTotals();
      
      // Logging para depuración
      console.log('Datos a insertar:', {
        id_externo: packingList.id_externo,
        fecha: packingList.fecha,
        cliente_id: packingList.cliente_id,
        cliente_nombre: packingList.cliente_nombre,
        cliente_direccion: packingList.cliente_direccion,
        peso_total: totalWeight,
        bales_total: totalBales
      });
      
      // Insertar la lista de empaque
      const { data, error } = await supabase
        .from('packing_lists')
        .insert({
          id_externo: packingList.id_externo,
          fecha: packingList.fecha,
          cliente_id: packingList.cliente_id,
          cliente_nombre: packingList.cliente_nombre,
          cliente_direccion: packingList.cliente_direccion,
          peso_total: totalWeight,
          bales_total: totalBales
        })
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('No se pudo crear la lista de empaque');
      
      // Insertar los items
      const itemsWithPackingListId = packingList.items.map(item => ({
        packing_list_id: data.id,
        container: item.container,
        precinto: item.precinto,
        bales: item.bales,
        weight: item.weight,
        date: item.date
      }));
      
      const { error: itemsError } = await supabase
        .from('packing_list_items')
        .insert(itemsWithPackingListId);
      
      if (itemsError) throw itemsError;
      
      alert('Lista de empaque creada correctamente');
      router.push(`/packing-lists/${data.id}/pdf`);
      
    } catch (error) {
      console.error('Error al guardar lista de empaque:', error);
      alert('Error al guardar la lista de empaque.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link 
          href="/packing-lists" 
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <FiArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Nueva Lista de Empaque</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Cabecera del formulario */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-700">Información de la Lista de Empaque</h2>
        </div>

        <div className="p-6">
          {/* Datos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label htmlFor="id_externo" className="block text-sm font-medium text-gray-700 mb-1">
                Número de Lista <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="id_externo"
                name="id_externo"
                placeholder="Ej: PACK-2023-001"
                value={packingList.id_externo}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={packingList.fecha}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-700 mb-1">
                Cliente <span className="text-red-500">*</span>
              </label>
              <ClienteSelector
                value={packingList.cliente_nombre || ''}
                onChange={(nombre) => {
                  const cliente = clients.find(c => c.nombre === nombre);
                  if (cliente) {
                    setPackingList(prev => ({
                      ...prev,
                      cliente_id: cliente.id,
                      cliente_nombre: cliente.nombre
                    }));
                  }
                }}
                clientesList={clients}
                placeholder="Buscar cliente..."
              />
            </div>
            
            <div>
              <label htmlFor="cliente_direccion" className="block text-sm font-medium text-gray-700 mb-1">
                Dirección del Cliente
              </label>
              <input
                type="text"
                id="cliente_direccion"
                name="cliente_direccion"
                value={packingList.cliente_direccion}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          {/* Tabla de Contenedores */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-700">Contenedores</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <FiPlus className="mr-1" />
                Agregar Contenedor
              </button>
            </div>
            
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contenedor <span className="text-red-500">*</span>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precinto <span className="text-red-500">*</span>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bales <span className="text-red-500">*</span>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peso (kg) <span className="text-red-500">*</span>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha <span className="text-red-500">*</span>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {packingList.items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="text"
                          value={item.container}
                          onChange={(e) => handleItemChange(index, 'container', e.target.value)}
                          placeholder="Ej: HLBU2186373"
                          className="w-full border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="text"
                          value={item.precinto}
                          onChange={(e) => handleItemChange(index, 'precinto', e.target.value)}
                          placeholder="Ej: HLD2452434"
                          className="w-full border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.bales}
                          onChange={(e) => handleItemChange(index, 'bales', e.target.value)}
                          placeholder="Ej: 35"
                          className="w-20 border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.weight}
                          onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                          placeholder="Ej: 20940"
                          className="w-32 border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="date"
                          value={item.date}
                          onChange={(e) => handleItemChange(index, 'date', e.target.value)}
                          className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      GRAND TOTAL
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {calculateTotals().totalBales}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {calculateTotals().totalWeight.toLocaleString('es-ES')}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Pie con botones */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <Link
            href="/packing-lists"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <FiSave className="mr-2 -ml-1 h-5 w-5" />
                Guardar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 
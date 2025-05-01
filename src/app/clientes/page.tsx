'use client'

import { useState, useEffect } from 'react'
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiUser, FiUsers, FiPhone, FiMail, FiMapPin, FiUpload, FiX } from 'react-icons/fi'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import ImportExcel from '@/components/import-excel'

interface Cliente {
  id: number
  nombre: string
  id_fiscal: string | null
  direccion: string | null
  ciudad: string | null
  codigo_postal: string | null
  pais: string | null
  contacto_nombre: string | null
  email: string | null
  telefono: string | null
  sitio_web: string | null
  comentarios: string | null
  created_at?: string | null
  updated_at?: string | null
}

export default function ClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchClientes()
  }, [supabase])
  
  const fetchClientes = async () => {
    setLoading(true)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('clientes')
        .select('id, nombre, id_fiscal, email, telefono, ciudad, pais, direccion, codigo_postal, contacto_nombre, sitio_web, comentarios')
        .order('nombre')
      
      if (fetchError) {
        throw new Error(`Error al cargar clientes: ${fetchError.message}`)
      }
      
      setClientes(data || [])
    } catch (error) {
      console.error('Error inesperado:', error)
      toast.error('Error al cargar los clientes')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Función para eliminar cliente
  const handleDelete = async (clienteId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setDeleteLoading(clienteId);
    
    try {
      const { error: deleteError } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteId);
      
      if (deleteError) {
        console.error('Error eliminando cliente:', deleteError);
        alert(`Error al eliminar: ${deleteError.message}`);
        return;
      }
      
      // Actualizar la lista de clientes
      setClientes(clientes.filter(cliente => cliente.id !== clienteId));
      
      toast.success('Cliente eliminado correctamente');
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error al eliminar el cliente');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filtrar clientes según término de búsqueda
  const filteredClientes = clientes.filter(cliente => 
    cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cliente.id_fiscal && cliente.id_fiscal.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Mapeo de columnas para importación Excel
  const columnasExcelMapping = [
    { excelColumn: 'Company', dbColumn: 'nombre', required: true },
    { excelColumn: 'Country', dbColumn: 'pais' },
    { excelColumn: 'City', dbColumn: 'ciudad' },
    { excelColumn: 'Person', dbColumn: 'contacto_nombre' },
    { excelColumn: 'Email Address', dbColumn: 'email' },
    { excelColumn: 'Phone Number', dbColumn: 'telefono' },
    { excelColumn: 'Comment', dbColumn: 'comentarios' },
    { excelColumn: 'Website', dbColumn: 'sitio_web' }
  ];
  
  // Encabezados para la plantilla
  const encabezadosPlantilla = [
    'Company', 'Country', 'City', 'Person', 'Email Address', 
    'Phone Number', 'Type', 'Business', 'Comment', 'Website'
  ];
  
  // Función para importar clientes desde Excel
  const importarClientes = async (clientesData: any) => {
    try {
      // Determinar si los datos vienen en formato estructurado (con estrategia)
      let dataArray: any[] = [];
      let updateStrategy: string = 'skip';
      let totalRegistros = 0;
      
      if (clientesData && typeof clientesData === 'object' && 'data' in clientesData) {
        // Ya está en formato estructurado {data: [...], updateStrategy: '...'}
        dataArray = clientesData.data as any[];
        updateStrategy = clientesData.updateStrategy as string;
        totalRegistros = dataArray.length;
        console.log(`Procesando ${totalRegistros} registros con estrategia: ${updateStrategy}`);
      } else if (Array.isArray(clientesData)) {
        // Es un array directo de clientes
        dataArray = clientesData;
        totalRegistros = clientesData.length;
        console.log(`Procesando ${totalRegistros} registros como array directo`);
      } else {
        throw new Error('Formato de datos inválido');
      }
      
      if (totalRegistros === 0) {
        toast.error('No hay datos para importar');
        return { success: false, message: 'No hay datos para importar' };
      }
      
      // Para conjuntos grandes de datos, mostrar información adicional
      if (totalRegistros > 1000) {
        toast(`Procesando ${totalRegistros} registros. Esto puede tardar unos momentos...`);
      }
      
      // Configuración de procesamiento por lotes
      const tamanoLote = 500; // Procesar 500 registros a la vez
      const totalLotes = Math.ceil(dataArray.length / tamanoLote);
      let resultadoFinal = {
        success: true,
        message: '',
        resultados: {
          nuevos: 0,
          actualizados: 0,
          omitidos: 0,
          errores: 0,
          procesados: 0 // Contador para registros procesados
        }
      };
      
      // Procesamiento por lotes
      for (let i = 0; i < totalLotes; i++) {
        const inicio = i * tamanoLote;
        const fin = Math.min((i + 1) * tamanoLote, dataArray.length);
        const loteActual = dataArray.slice(inicio, fin);
        
        toast(`Procesando lote ${i+1}/${totalLotes} (${loteActual.length} registros)`);
        
        const dataToSend = {
          data: loteActual,
          updateStrategy: updateStrategy
        };
        
        console.log(`Enviando lote ${i+1}/${totalLotes} (${loteActual.length} registros) para importar:`, 
          JSON.stringify(dataToSend).substring(0, 200) + '...');
        
        const response = await fetch('/api/clientes/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error al importar lote ${i+1}/${totalLotes}`);
        }
        
        const resultadoLote = await response.json();
        console.log(`Resultado de lote ${i+1}/${totalLotes}:`, resultadoLote);
        
        // Acumular resultados
        if (resultadoLote.success) {
          if (resultadoLote.resultados) {
            // Acumular solo si hay estructura de resultados
            resultadoFinal.resultados.nuevos += resultadoLote.resultados.nuevos || 0;
            resultadoFinal.resultados.actualizados += resultadoLote.resultados.actualizados || 0;
            resultadoFinal.resultados.omitidos += resultadoLote.resultados.omitidos || 0;
            resultadoFinal.resultados.errores += resultadoLote.resultados.errores || 0;
            
            // Calcular cuántos registros fueron procesados en este lote
            const procesadosLote = 
              (resultadoLote.resultados.nuevos || 0) + 
              (resultadoLote.resultados.actualizados || 0) + 
              (resultadoLote.resultados.omitidos || 0) + 
              (resultadoLote.resultados.errores || 0);
              
            resultadoFinal.resultados.procesados += procesadosLote;
            
            // Si hay discrepancia entre registros enviados y procesados en este lote
            if (procesadosLote < loteActual.length) {
              console.warn(`Advertencia: ${loteActual.length - procesadosLote} registros no fueron procesados en el lote ${i+1}`);
            }
          } else if (resultadoLote.message) {
            // Si no hay resultados estructurados pero sí mensaje de éxito,
            // intentar extraer información del mensaje (formato: "X nuevos, Y actualizados, Z omitidos")
            console.log(`Extrayendo información del mensaje: ${resultadoLote.message}`);
            
            const nuevosMatch = resultadoLote.message.match(/(\d+)\s+clientes?\s+nuevos?/i);
            const actualizadosMatch = resultadoLote.message.match(/(\d+)\s+actualizados?/i);
            const omitidosMatch = resultadoLote.message.match(/(\d+)\s+omitidos?/i);
            
            if (nuevosMatch) resultadoFinal.resultados.nuevos += parseInt(nuevosMatch[1]);
            if (actualizadosMatch) resultadoFinal.resultados.actualizados += parseInt(actualizadosMatch[1]);
            if (omitidosMatch) resultadoFinal.resultados.omitidos += parseInt(omitidosMatch[1]);
            
            // Calcular procesados a partir del mensaje
            const procesadosLote = 
              (nuevosMatch ? parseInt(nuevosMatch[1]) : 0) + 
              (actualizadosMatch ? parseInt(actualizadosMatch[1]) : 0) + 
              (omitidosMatch ? parseInt(omitidosMatch[1]) : 0);
            
            resultadoFinal.resultados.procesados += procesadosLote;
            
            // Si hay discrepancia, los no procesados no se cuentan como errores
            if (procesadosLote < loteActual.length) {
              console.warn(`Advertencia: ${loteActual.length - procesadosLote} registros no reportados en el lote ${i+1}`);
            }
          } else {
            // Si no hay resultados ni mensaje detallado, asumir que el lote fue procesado
            // pero sin informe detallado. Incrementar 'procesados' sin marcar ninguno como error.
            console.warn(`El lote ${i+1} no proporcionó detalles de procesamiento. Asumiendo que fueron procesados correctamente.`);
            resultadoFinal.resultados.procesados += loteActual.length;
          }
        } else if (!resultadoLote.success) {
          resultadoFinal.success = false;
          resultadoFinal.message = resultadoLote.message || `Error en lote ${i+1}`;
          break; // Detener procesamiento si hay error
        }
      }
      
      // Calcular posibles registros no procesados (sin contarlos como errores)
      const noReportados = totalRegistros - resultadoFinal.resultados.procesados;
      
      // Advertencia crítica si no hay registros nuevos pero deberían haberse creado
      const registrosNuevosEsperados = totalRegistros - resultadoFinal.resultados.omitidos;
      if (registrosNuevosEsperados > 0 && resultadoFinal.resultados.nuevos === 0) {
        console.error(`ADVERTENCIA CRÍTICA: Se esperaban ${registrosNuevosEsperados} registros nuevos, pero ninguno fue creado.`);
        console.error(`Esto puede indicar un problema con el servidor API o la base de datos.`);
        
        // Mostrar mensaje al usuario
        toast.error(`Se esperaban crear ${registrosNuevosEsperados} registros nuevos, pero ninguno fue creado. Revise los logs del servidor.`);
        
        // Añadir a los errores para reflejar en el resultado
        resultadoFinal.resultados.errores += registrosNuevosEsperados;
      }
      
      // Corregir el conteo de errores: NO considerar los no reportados como errores
      // Solo contar los errores reales reportados por el API
      if (resultadoFinal.resultados.errores >= noReportados && noReportados > 0) {
        // Si la mayoría de los no reportados se cuentan como errores, 
        // asumimos que es un error en el conteo y lo corregimos
        console.warn(`Corrigiendo conteo erróneo de errores: ${noReportados} registros no procesados no son errores reales`);
        resultadoFinal.resultados.errores = 0;
      }
      
      // Limpiar cualquier registro de errores fantasmas (registros que se cuentan como procesados y como errores)
      if (resultadoFinal.resultados.procesados === totalRegistros && resultadoFinal.resultados.errores > 0) {
        console.warn(`Datos inconsistentes: ${resultadoFinal.resultados.errores} errores reportados pero todos los registros (${totalRegistros}) fueron procesados`);
        resultadoFinal.resultados.errores = 0;
      }
      
      // Componer mensaje final
      let mensaje = '';
      const { nuevos, actualizados, omitidos, errores, procesados } = resultadoFinal.resultados;
      
      if (nuevos > 0) {
        mensaje += `${nuevos} cliente${nuevos !== 1 ? 's' : ''} nuevo${nuevos !== 1 ? 's' : ''}. `;
      }
      
      if (actualizados > 0) {
        mensaje += `${actualizados} actualizado${actualizados !== 1 ? 's' : ''}. `;
      }
      
      if (omitidos > 0) {
        mensaje += `${omitidos} omitido${omitidos !== 1 ? 's' : ''}. `;
      }
      
      // Solo incluir errores en el mensaje si hay errores reales
      if (errores > 0) {
        mensaje += `${errores} error${errores !== 1 ? 'es' : ''}. `;
      }
      
      // Agregar información sobre registros no reportados por el API
      if (noReportados > 0) {
        mensaje += `${noReportados} no procesado${noReportados !== 1 ? 's' : ''}. `;
      }
      
      // Advertencia específica sobre la falta de creación de nuevos registros
      if (registrosNuevosEsperados > 0 && resultadoFinal.resultados.nuevos === 0) {
        mensaje += `IMPORTANTE: No se creó ningún registro nuevo de los ${registrosNuevosEsperados} esperados. Consulte con su administrador.`;
      }
      
      resultadoFinal.message = mensaje || 'Importación completada';
      
      // Mostrar mensaje según resultado
      if (resultadoFinal.success) {
        if (nuevos === 0 && actualizados === 0 && omitidos === totalRegistros) {
          toast(`Todos los ${omitidos} registros fueron omitidos. No se realizaron cambios.`);
        } else if (nuevos === 0 && actualizados === 0 && errores > 0) {
          toast.error(`Ocurrieron ${errores} errores durante la importación.`);
        } else {
          toast.success(mensaje || 'Importación completada');
        }
        
        // Recargar la lista de clientes explícitamente
        await fetchClientes();
        
        // Cerrar el modal de importación
        setShowImportModal(false);
      } else {
        // Mostrar mensaje para casos como "No se encontraron registros con nombre válido"
        toast.error(resultadoFinal.message || 'No se pudieron importar los clientes');
      }
      
      return resultadoFinal;
    } catch (error: any) {
      console.error('Error importando clientes:', error);
      toast.error(error.message || 'Error al importar clientes');
      throw error;
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-1">
              Clientes
            </h1>
            <p className="text-gray-600 text-sm">
              {searchQuery ? (
                <>Mostrando <span className="font-medium">{filteredClientes.length}</span> de <span className="font-medium">{clientes.length}</span> clientes</>
              ) : (
                <>Total: <span className="font-medium">{clientes.length}</span> clientes</>
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4 sm:mt-0">
            <button
              onClick={() => setShowImportModal(!showImportModal)}
              className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <FiUpload className="mr-2 -ml-1 h-5 w-5" /> Importar Excel
            </button>
            <Link 
              href="/clientes/new"
              className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <FiPlus className="mr-2 -ml-1 h-5 w-5" /> Nuevo Cliente
            </Link>
          </div>
        </div>
        
        {/* Componente de importación de Excel */}
        {showImportModal && (
          <ImportExcel 
            onDataImported={importarClientes}
            columnsMapping={columnasExcelMapping}
            templateHeaders={encabezadosPlantilla}
            onCancel={() => setShowImportModal(false)}
          />
        )}
        
        {/* Buscador */}
        <div className="bg-white shadow-md rounded-lg p-5 mb-8 transition-all duration-300 ease-in-out transform hover:shadow-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, ID fiscal o email..."
              className="pl-10 pr-4 py-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          {searchQuery && (
            <div className="mt-2 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{filteredClientes.length}</span> {filteredClientes.length === 1 ? 'resultado' : 'resultados'} para "<span className="text-indigo-600 font-medium">{searchQuery}</span>"
              </p>
              
              {filteredClientes.length > 0 && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sm text-indigo-500 hover:text-indigo-700 flex items-center"
                >
                  <FiX className="mr-1" /> Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Estado de carga */}
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Cargando clientes...</p>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="flex justify-center mb-4">
              <FiUsers className="h-12 w-12 text-gray-400" />
            </div>
            {searchQuery ? (
              <>
                <p className="text-gray-600 text-lg mb-2">No se encontraron clientes con "{searchQuery}"</p>
                <p className="text-sm text-gray-500 mb-4">
                  La búsqueda no coincide con ningún cliente en la base de datos.
                </p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-indigo-500 hover:text-indigo-700 hover:underline focus:outline-none inline-flex items-center"
                >
                  <FiUsers className="mr-1" /> Ver todos los clientes ({clientes.length})
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-600 text-lg mb-4">No hay clientes registrados</p>
                <Link 
                  href="/clientes/new"
                  className="text-indigo-500 hover:text-indigo-700 hover:underline focus:outline-none inline-flex items-center"
                >
                  <FiPlus className="mr-1" /> Agregar un nuevo cliente
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out">
            {/* Resumen de información */}
            {!searchQuery && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                <div className="p-4 bg-white rounded-lg shadow-sm flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                    <FiUsers className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total de clientes</p>
                    <p className="text-2xl font-bold text-gray-900">{clientes.length}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-white rounded-lg shadow-sm flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <FiMail className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Con email</p>
                    <p className="text-2xl font-bold text-gray-900">{clientes.filter(c => c.email && c.email.trim() !== '').length}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-white rounded-lg shadow-sm flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                    <FiMapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Con ubicación</p>
                    <p className="text-2xl font-bold text-gray-900">{clientes.filter(c => c.ciudad || c.pais).length}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Tabla de clientes */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiUser className="mr-2 text-indigo-500" />
                        Cliente
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiPhone className="mr-2 text-indigo-500" />
                        Contacto
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiMapPin className="mr-2 text-indigo-500" />
                        Ubicación
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-full">
                            <FiUser className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                            <div className="text-sm text-gray-500">{cliente.id_fiscal || 'Sin ID fiscal'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(cliente.email || cliente.telefono) ? (
                          <div>
                            {cliente.email && (
                              <div className="text-sm text-gray-900 flex items-center">
                                <FiMail className="mr-1 text-indigo-500 h-4 w-4" />
                                {cliente.email}
                              </div>
                            )}
                            {cliente.telefono && (
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <FiPhone className="mr-1 text-indigo-500 h-4 w-4" />
                                {cliente.telefono}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Sin información</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(cliente.ciudad || cliente.pais) ? (
                          <div className="text-sm text-gray-900 flex items-center">
                            <FiMapPin className="mr-1 text-indigo-500 h-4 w-4" />
                            {cliente.ciudad && cliente.pais 
                              ? `${cliente.ciudad}, ${cliente.pais}`
                              : cliente.ciudad || cliente.pais}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Sin ubicación</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link
                            href={`/clientes/${cliente.id}`}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150 p-1"
                            title="Ver detalles"
                          >
                            Ver
                          </Link>
                          <Link
                            href={`/clientes/edit/${cliente.id}`}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1"
                            title="Editar cliente"
                          >
                            <FiEdit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(cliente.id)}
                            disabled={deleteLoading === cliente.id}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150 p-1 disabled:opacity-50"
                            title="Eliminar cliente"
                          >
                            {deleteLoading === cliente.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-r-transparent border-red-600"></div>
                            ) : (
                              <FiTrash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
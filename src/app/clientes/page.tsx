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
  const [reloadingData, setReloadingData] = useState(false)
  const [verificandoDatos, setVerificandoDatos] = useState(false)
  const [estatusVerificacion, setEstatusVerificacion] = useState<{
    totalDB: number;
    totalCargados: number;
    ultimaVerificacion: Date | null;
  }>({
    totalDB: 0,
    totalCargados: 0,
    ultimaVerificacion: null
  });
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchClientes()
  }, [supabase])
  
  const fetchClientes = async () => {
    setLoading(true)
    
    try {
      // Forzar recarga completa sin caché
      await supabase.auth.refreshSession(); // Refrescar token para forzar nueva conexión
      
      // Contador para clientes totales en la base de datos
      let totalClientesEnDB = 0;
      
      // Primero, hacer una consulta para contar todos los clientes
      const { count, error: countError } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        throw new Error(`Error al contar clientes: ${countError.message}`);
      }
      
      totalClientesEnDB = count || 0;
      console.log(`Total de clientes en la base de datos: ${totalClientesEnDB}`);
      
      // Si hay muchos clientes, implementamos carga por lotes
      const tamanoLote = 1000; // Supabase tiene un límite por defecto de 1000
      const totalLotes = Math.ceil(totalClientesEnDB / tamanoLote);
      
      // Arreglo para almacenar todos los clientes
      let todosClientes: Cliente[] = [];
      
      // Cargar clientes por lotes
      if (totalLotes > 1) {
        for (let i = 0; i < totalLotes; i++) {
          const desde = i * tamanoLote;
          
          const { data: loteDatos, error: loteError } = await supabase
            .from('clientes')
            .select('id, nombre, id_fiscal, email, telefono, ciudad, pais, direccion, codigo_postal, contacto_nombre, sitio_web, comentarios')
            .order('nombre', { ascending: true })
            .range(desde, desde + tamanoLote - 1);
          
          if (loteError) {
            console.error(`Error al cargar lote ${i+1}:`, loteError);
            continue; // Intentar con el siguiente lote en lugar de fallar completamente
          }
          
          if (loteDatos && loteDatos.length > 0) {
            todosClientes = [...todosClientes, ...loteDatos];
            console.log(`Lote ${i+1}/${totalLotes} cargado: ${loteDatos.length} clientes (total acumulado: ${todosClientes.length})`);
          }
        }
      } else {
        // Si hay menos de 1000 clientes, cargar directamente
        const { data, error: fetchError } = await supabase
          .from('clientes')
          .select('id, nombre, id_fiscal, email, telefono, ciudad, pais, direccion, codigo_postal, contacto_nombre, sitio_web, comentarios')
          .order('nombre', { ascending: true });
        
        if (fetchError) {
          throw new Error(`Error al cargar clientes: ${fetchError.message}`);
        }
        
        todosClientes = data || [];
      }
      
      console.log(`Carga inicial completada: ${todosClientes.length}/${totalClientesEnDB} clientes cargados`);
      
      // Verificar si hay discrepancia entre lo reportado y lo cargado
      if (todosClientes.length < totalClientesEnDB) {
        console.warn(`¡Atención! Sólo se cargaron ${todosClientes.length} de ${totalClientesEnDB} clientes.`);
      }
      
      setClientes(todosClientes);
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
  
  // Función para forzar recarga de datos
  const handleReloadData = async () => {
    setReloadingData(true);
    
    try {
      // Crear una nueva instancia de cliente para evitar la caché
      const freshSupabase = createClientComponentClient();
      
      // Contador para clientes totales en la base de datos
      let totalClientesEnDB = 0;
      
      // Primero, hacer una consulta para contar todos los clientes
      const { count, error: countError } = await freshSupabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        throw new Error(`Error al contar clientes: ${countError.message}`);
      }
      
      totalClientesEnDB = count || 0;
      console.log(`Total de clientes en la base de datos: ${totalClientesEnDB}`);
      
      // Si hay muchos clientes, implementamos carga por lotes
      const tamanoLote = 1000; // Supabase tiene un límite por defecto de 1000
      const totalLotes = Math.ceil(totalClientesEnDB / tamanoLote);
      
      // Arreglo para almacenar todos los clientes
      let todosClientes: Cliente[] = [];
      
      // Cargar clientes por lotes
      if (totalLotes > 1) {
        toast.loading(`Cargando ${totalClientesEnDB} clientes en ${totalLotes} lotes...`, { duration: 3000 });
        
        for (let i = 0; i < totalLotes; i++) {
          const desde = i * tamanoLote;
          
          const { data: loteDatos, error: loteError } = await freshSupabase
            .from('clientes')
            .select('id, nombre, id_fiscal, email, telefono, ciudad, pais, direccion, codigo_postal, contacto_nombre, sitio_web, comentarios')
            .order('nombre', { ascending: true })
            .range(desde, desde + tamanoLote - 1);
          
          if (loteError) {
            console.error(`Error al cargar lote ${i+1}:`, loteError);
            continue; // Intentar con el siguiente lote en lugar de fallar completamente
          }
          
          if (loteDatos && loteDatos.length > 0) {
            todosClientes = [...todosClientes, ...loteDatos];
            console.log(`Lote ${i+1}/${totalLotes} cargado: ${loteDatos.length} clientes (total acumulado: ${todosClientes.length})`);
            
            // Actualizar la interfaz con los datos parciales para dar feedback al usuario
            if (i < totalLotes - 1) {
              toast.loading(`Cargando... ${Math.round((i+1) / totalLotes * 100)}% completado`, { duration: 1000 });
            }
          }
        }
      } else {
        // Si hay menos de 1000 clientes, cargar directamente
        const { data, error: fetchError } = await freshSupabase
          .from('clientes')
          .select('id, nombre, id_fiscal, email, telefono, ciudad, pais, direccion, codigo_postal, contacto_nombre, sitio_web, comentarios')
          .order('nombre', { ascending: true });
        
        if (fetchError) {
          throw new Error(`Error al cargar clientes: ${fetchError.message}`);
        }
        
        todosClientes = data || [];
      }
      
      console.log(`Recarga forzada completada: ${todosClientes.length}/${totalClientesEnDB} clientes cargados`);
      
      // Verificar si hay discrepancia entre lo reportado y lo cargado
      if (todosClientes.length < totalClientesEnDB) {
        console.warn(`¡Atención! Sólo se cargaron ${todosClientes.length} de ${totalClientesEnDB} clientes.`);
        toast(`⚠️ Atención: Sólo se pudieron cargar ${todosClientes.length} de ${totalClientesEnDB} clientes.`);
      }
      
      setClientes(todosClientes);
      toast.success(`Datos actualizados: ${todosClientes.length} clientes cargados (Total en DB: ${totalClientesEnDB})`);
    } catch (error) {
      console.error('Error al recargar datos:', error);
      toast.error('Error al recargar los datos. Por favor, inténtelo de nuevo.');
    } finally {
      setReloadingData(false);
    }
  };
  
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
      const tamanoLote = 200; // Reducir el tamaño del lote para evitar timeouts (era 500)
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
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minuto de timeout
        
        try {
          const response = await fetch('/api/clientes/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            
            try {
              // Intentar procesar como JSON
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || `Error al importar lote ${i+1}/${totalLotes}`;
            } catch (e) {
              // Si no es JSON, usar el texto directamente
              errorMessage = errorText || `Error al importar lote ${i+1}/${totalLotes}`;
            }
            
            throw new Error(errorMessage);
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
        } catch (error: any) {
          clearTimeout(timeoutId);
          console.error('Error importando lote de clientes:', error);
          toast.error(`Error al importar lote ${i+1}/${totalLotes}: ${error.message || 'Error desconocido'}`);
          resultadoFinal.success = false;
          resultadoFinal.message = error.message || `Error procesando lote ${i+1}/${totalLotes}`;
          resultadoFinal.resultados.errores += loteActual.length;
          // Esperar 2 segundos antes de intentar el siguiente lote
          await new Promise(resolve => setTimeout(resolve, 2000));
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
        
        // Recargar la lista de clientes de forma forzada
        try {
          // Esperar un pequeño tiempo para asegurar que la base de datos haya procesado todo
          await new Promise(resolve => setTimeout(resolve, 1500));
          await handleReloadData();
          console.log('Lista de clientes recargada después de importación'); 
        } catch (err) {
          console.error('Error al actualizar la lista después de importar:', err);
          toast.error('Los clientes fueron importados pero hubo un error al recargar la lista. Por favor, actualice manualmente.');
        }
        
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

  // Función para verificar la sincronización de datos entre DB y CRM
  const verificarDatos = async () => {
    setVerificandoDatos(true);
    
    try {
      // Consultar el total real en la base de datos
      const { count, error: countError } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        throw new Error(`Error al contar clientes: ${countError.message}`);
      }
      
      const totalEnDB = count || 0;
      const totalCargados = clientes.length;
      
      // Actualizar estado
      setEstatusVerificacion({
        totalDB: totalEnDB,
        totalCargados: totalCargados,
        ultimaVerificacion: new Date()
      });
      
      console.log(`Verificación completada: ${totalCargados} de ${totalEnDB} clientes están cargados en el CRM`);
      
      // Informar al usuario
      if (totalCargados < totalEnDB) {
        toast(`⚠️ Atención: Solo ${totalCargados} de ${totalEnDB} clientes están cargados. Se recomienda actualizar.`);
      } else if (totalCargados === totalEnDB) {
        toast.success(`✅ Todo correcto: Los ${totalCargados} clientes de la base de datos están cargados.`);
      } else {
        toast.error(`❌ Error de sincronización: Hay ${totalCargados} clientes cargados pero solo ${totalEnDB} en la base de datos.`);
      }
    } catch (error) {
      console.error('Error al verificar datos:', error);
      toast.error('No se pudo completar la verificación de datos');
    } finally {
      setVerificandoDatos(false);
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
              onClick={handleReloadData}
              disabled={reloadingData || verificandoDatos}
              className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {reloadingData ? (
                <>
                  <span className="inline-block animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Actualizando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualizar
                </>
              )}
            </button>
            
            <button
              onClick={verificarDatos}
              disabled={verificandoDatos || reloadingData}
              className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 transform hover:-translate-y-0.5"
              title="Verificar si todos los datos de la base de datos están cargados en el CRM"
            >
              {verificandoDatos ? (
                <>
                  <span className="inline-block animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Verificando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verificar datos
                </>
              )}
            </button>
            
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
        
        {/* Mostrar estado de verificación si existe */}
        {estatusVerificacion.ultimaVerificacion && (
          <div className={`mt-2 text-xs ${estatusVerificacion.totalCargados < estatusVerificacion.totalDB ? 'text-amber-600' : 'text-green-600'}`}>
            Última verificación: {estatusVerificacion.ultimaVerificacion.toLocaleTimeString()} - 
            {estatusVerificacion.totalCargados} de {estatusVerificacion.totalDB} clientes cargados
            {estatusVerificacion.totalCargados < estatusVerificacion.totalDB && (
              <button 
                onClick={handleReloadData}
                className="ml-2 text-blue-600 hover:text-blue-800 hover:underline"
                disabled={reloadingData}
              >
                (Actualizar ahora)
              </button>
            )}
          </div>
        )}
        
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
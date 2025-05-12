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

interface ClienteSeleccionado {
  cliente: Cliente;
  seleccionado: boolean;
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
  const [buscandoDuplicados, setBuscandoDuplicados] = useState(false)
  const [duplicados, setDuplicados] = useState<{
    porNombre: { [key: string]: Cliente[] },
    porEmail: { [key: string]: Cliente[] },
    porTelefono: { [key: string]: Cliente[] }
  }>({
    porNombre: {},
    porEmail: {},
    porTelefono: {}
  });
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
  const [mostrandoFusion, setMostrandoFusion] = useState(false);
  const [clientesSeleccionados, setClientesSeleccionados] = useState<ClienteSeleccionado[]>([]);
  const [clientePrincipal, setClientePrincipal] = useState<Cliente | null>(null);
  const [fusionando, setFusionando] = useState(false);
  const [tipoDuplicadoActual, setTipoDuplicadoActual] = useState<'nombre' | 'email' | 'telefono'>('nombre');
  const [valorDuplicadoActual, setValorDuplicadoActual] = useState<string>('');
  const [mostrarDuplicados, setMostrarDuplicados] = useState(false);
  const [fusionandoTodos, setFusionandoTodos] = useState(false);

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
    } catch (error: unknown) {
      console.error('Error inesperado:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar los clientes'
      toast.error(errorMessage)
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

  // Función para detectar duplicados
  const detectarDuplicados = async () => {
    console.log('Iniciando detección de duplicados...');
    setBuscandoDuplicados(true);
    setMostrarDuplicados(false);
    
    try {
      // Inicializar objetos para almacenar duplicados
      const duplicadosPorNombre: { [key: string]: Cliente[] } = {};
      const duplicadosPorEmail: { [key: string]: Cliente[] } = {};
      const duplicadosPorTelefono: { [key: string]: Cliente[] } = {};
      
      console.log('Total de clientes a analizar:', clientes.length);
      
      // Procesar cada cliente
      for (const cliente of clientes) {
        // Normalizar datos para comparación
        const nombreNormalizado = cliente.nombre?.toLowerCase().trim() || '';
        const emailNormalizado = cliente.email?.toLowerCase().trim() || '';
        const telefonoNormalizado = cliente.telefono?.replace(/\D/g, '') || '';
        
        // Verificar duplicados por nombre
        if (nombreNormalizado) {
          if (!duplicadosPorNombre[nombreNormalizado]) {
            duplicadosPorNombre[nombreNormalizado] = [];
          }
          duplicadosPorNombre[nombreNormalizado].push(cliente);
        }
        
        // Verificar duplicados por email
        if (emailNormalizado) {
          if (!duplicadosPorEmail[emailNormalizado]) {
            duplicadosPorEmail[emailNormalizado] = [];
          }
          duplicadosPorEmail[emailNormalizado].push(cliente);
        }
        
        // Verificar duplicados por teléfono
        if (telefonoNormalizado) {
          if (!duplicadosPorTelefono[telefonoNormalizado]) {
            duplicadosPorTelefono[telefonoNormalizado] = [];
          }
          duplicadosPorTelefono[telefonoNormalizado].push(cliente);
        }
      }
      
      // Filtrar solo los que tienen más de un registro
      const duplicadosFiltrados = {
        porNombre: Object.fromEntries(
          Object.entries(duplicadosPorNombre)
            .filter(([_, clientes]) => clientes.length > 1)
        ),
        porEmail: Object.fromEntries(
          Object.entries(duplicadosPorEmail)
            .filter(([_, clientes]) => clientes.length > 1)
        ),
        porTelefono: Object.fromEntries(
          Object.entries(duplicadosPorTelefono)
            .filter(([_, clientes]) => clientes.length > 1)
        )
      };
      
      console.log('Duplicados filtrados:', duplicadosFiltrados);
      
      // Verificar si hay duplicados antes de actualizar el estado
      const hayDuplicados = 
        Object.keys(duplicadosFiltrados.porNombre).length > 0 ||
        Object.keys(duplicadosFiltrados.porEmail).length > 0 ||
        Object.keys(duplicadosFiltrados.porTelefono).length > 0;
      
      console.log('¿Hay duplicados?', hayDuplicados);
      console.log('Duplicados por nombre:', Object.keys(duplicadosFiltrados.porNombre).length);
      console.log('Duplicados por email:', Object.keys(duplicadosFiltrados.porEmail).length);
      console.log('Duplicados por teléfono:', Object.keys(duplicadosFiltrados.porTelefono).length);
      
      // Actualizar el estado de duplicados
      await new Promise<void>(resolve => {
        setDuplicados(duplicadosFiltrados);
        resolve();
      });
      
      // Contar total de duplicados
      const totalPorNombre = Object.values(duplicadosFiltrados.porNombre)
        .reduce((acc, curr) => acc + curr.length, 0);
      const totalPorEmail = Object.values(duplicadosFiltrados.porEmail)
        .reduce((acc, curr) => acc + curr.length, 0);
      const totalPorTelefono = Object.values(duplicadosFiltrados.porTelefono)
        .reduce((acc, curr) => acc + curr.length, 0);
      
      const totalDuplicados = totalPorNombre + totalPorEmail + totalPorTelefono;
      
      console.log('Total de duplicados encontrados:', totalDuplicados);
      
      // Mostrar resumen
      if (totalDuplicados > 0) {
        const mensaje = `Se encontraron ${totalDuplicados} posibles duplicados: ` +
          `${Object.keys(duplicadosFiltrados.porNombre).length} por nombre, ` +
          `${Object.keys(duplicadosFiltrados.porEmail).length} por email, ` +
          `${Object.keys(duplicadosFiltrados.porTelefono).length} por teléfono.`;
        
        toast.success(mensaje);
        
        // Forzar la visualización después de actualizar el estado
        await new Promise<void>(resolve => {
          setMostrarDuplicados(true);
          resolve();
        });
      } else {
        toast.success('No se encontraron duplicados en la base de datos.');
      }
      
      return duplicadosFiltrados;
    } catch (error) {
      console.error('Error al detectar duplicados:', error);
      toast.error('Error al detectar duplicados');
      return null;
    } finally {
      setBuscandoDuplicados(false);
      console.log('Detección de duplicados finalizada');
    }
  };

  // Función para iniciar el proceso de fusión
  const iniciarFusion = (tipo: 'nombre' | 'email' | 'telefono', valor: string, clientes: Cliente[]) => {
    setTipoDuplicadoActual(tipo);
    setValorDuplicadoActual(valor);
    setClientesSeleccionados(clientes.map(cliente => ({ cliente, seleccionado: false })));
    setClientePrincipal(null);
    setMostrandoFusion(true);
  };

  // Función para fusionar los clientes seleccionados
  const fusionarClientes = async () => {
    if (!clientePrincipal) {
      toast.error('Debe seleccionar un cliente principal');
      return;
    }

    const clientesAFusionar = clientesSeleccionados
      .filter(cs => cs.seleccionado && cs.cliente.id !== clientePrincipal.id)
      .map(cs => cs.cliente);

    if (clientesAFusionar.length === 0) {
      toast.error('Debe seleccionar al menos un cliente para fusionar');
      return;
    }

    setFusionando(true);

    try {
      // 1. Combinar la información de todos los clientes
      const clienteFusionado = {
        ...clientePrincipal,
        // Mantener el nombre del cliente principal
        nombre: clientePrincipal.nombre,
        // Combinar emails únicos
        email: [
          clientePrincipal.email,
          ...clientesAFusionar.map(c => c.email).filter(Boolean)
        ].filter((email, index, self) => email && self.indexOf(email) === index).join('; '),
        // Combinar teléfonos únicos
        telefono: [
          clientePrincipal.telefono,
          ...clientesAFusionar.map(c => c.telefono).filter(Boolean)
        ].filter((tel, index, self) => tel && self.indexOf(tel) === index).join('; '),
        // Combinar direcciones si el principal no tiene
        direccion: clientePrincipal.direccion || clientesAFusionar.find(c => c.direccion)?.direccion || null,
        // Combinar ciudades si el principal no tiene
        ciudad: clientePrincipal.ciudad || clientesAFusionar.find(c => c.ciudad)?.ciudad || null,
        // Combinar países si el principal no tiene
        pais: clientePrincipal.pais || clientesAFusionar.find(c => c.pais)?.pais || null,
        // Combinar códigos postales si el principal no tiene
        codigo_postal: clientePrincipal.codigo_postal || clientesAFusionar.find(c => c.codigo_postal)?.codigo_postal || null,
        // Combinar IDs fiscales si el principal no tiene
        id_fiscal: clientePrincipal.id_fiscal || clientesAFusionar.find(c => c.id_fiscal)?.id_fiscal || null,
        // Combinar sitios web si el principal no tiene
        sitio_web: clientePrincipal.sitio_web || clientesAFusionar.find(c => c.sitio_web)?.sitio_web || null,
        // Combinar comentarios
        comentarios: [
          clientePrincipal.comentarios,
          ...clientesAFusionar.map(c => c.comentarios).filter(Boolean)
        ].filter((com, index, self) => com && self.indexOf(com) === index).join('\n\n')
      };

      // 2. Actualizar el cliente principal con la información combinada
      const { error: updateError } = await supabase
        .from('clientes')
        .update(clienteFusionado)
        .eq('id', clientePrincipal.id);

      if (updateError) {
        throw new Error(`Error al actualizar el cliente principal: ${updateError.message}`);
      }

      // 3. Eliminar los clientes fusionados
      const idsAEliminar = clientesAFusionar.map(c => c.id);
      const { error: deleteError } = await supabase
        .from('clientes')
        .delete()
        .in('id', idsAEliminar);

      if (deleteError) {
        throw new Error(`Error al eliminar los clientes fusionados: ${deleteError.message}`);
      }

      toast.success(`Fusión completada: ${clientesAFusionar.length} clientes fusionados con el cliente principal`);
      
      // 4. Actualizar la lista de clientes
      await handleReloadData();
      
      // 5. Cerrar el modal de fusión
      setMostrandoFusion(false);
    } catch (error) {
      console.error('Error al fusionar clientes:', error);
      toast.error(`Error al fusionar los clientes: ${error.message}`);
    } finally {
      setFusionando(false);
    }
  };

  // Función para determinar el registro más completo
  const encontrarRegistroMasCompleto = (clientes: Cliente[]): Cliente => {
    return clientes.reduce((mejor, actual) => {
      const puntuacionMejor = calcularPuntuacionCompletitud(mejor);
      const puntuacionActual = calcularPuntuacionCompletitud(actual);
      return puntuacionActual > puntuacionMejor ? actual : mejor;
    });
  };

  // Función para calcular qué tan completo está un registro
  const calcularPuntuacionCompletitud = (cliente: Cliente): number => {
    let puntuacion = 0;
    if (cliente.nombre) puntuacion += 2;
    if (cliente.email) puntuacion += 1;
    if (cliente.telefono) puntuacion += 1;
    if (cliente.direccion) puntuacion += 1;
    if (cliente.ciudad) puntuacion += 1;
    if (cliente.pais) puntuacion += 1;
    if (cliente.codigo_postal) puntuacion += 1;
    if (cliente.id_fiscal) puntuacion += 1;
    if (cliente.sitio_web) puntuacion += 1;
    if (cliente.comentarios) puntuacion += 1;
    return puntuacion;
  };

  // Función para truncar valores a 50 caracteres
  const truncarValor = (valor: string | null): string | null => {
    if (!valor) return null;
    return valor.length > 50 ? valor.substring(0, 47) + '...' : valor;
  };

  // Función para fusionar todos los duplicados
  const fusionarTodosLosDuplicados = async () => {
    if (!confirm('¿Está seguro de que desea fusionar todos los registros duplicados? Esta acción no se puede deshacer.')) {
      return;
    }

    setFusionandoTodos(true);
    let totalFusionados = 0;
    let errores = 0;

    try {
      // Procesar duplicados por nombre
      for (const [nombre, clientes] of Object.entries(duplicados.porNombre)) {
        try {
          const clientePrincipal = encontrarRegistroMasCompleto(clientes);
          const clientesAFusionar = clientes.filter(c => c.id !== clientePrincipal.id);

          // Combinar información
          const clienteFusionado = {
            ...clientePrincipal,
            nombre: truncarValor(clientePrincipal.nombre),
            email: truncarValor([
              clientePrincipal.email,
              ...clientesAFusionar.map(c => c.email).filter(Boolean)
            ].filter((email, index, self) => email && self.indexOf(email) === index).join('; ')),
            telefono: truncarValor([
              clientePrincipal.telefono,
              ...clientesAFusionar.map(c => c.telefono).filter(Boolean)
            ].filter((tel, index, self) => tel && self.indexOf(tel) === index).join('; ')),
            direccion: truncarValor(clientePrincipal.direccion || clientesAFusionar.find(c => c.direccion)?.direccion || null),
            ciudad: truncarValor(clientePrincipal.ciudad || clientesAFusionar.find(c => c.ciudad)?.ciudad || null),
            pais: truncarValor(clientePrincipal.pais || clientesAFusionar.find(c => c.pais)?.pais || null),
            codigo_postal: truncarValor(clientePrincipal.codigo_postal || clientesAFusionar.find(c => c.codigo_postal)?.codigo_postal || null),
            id_fiscal: truncarValor(clientePrincipal.id_fiscal || clientesAFusionar.find(c => c.id_fiscal)?.id_fiscal || null),
            sitio_web: truncarValor(clientePrincipal.sitio_web || clientesAFusionar.find(c => c.sitio_web)?.sitio_web || null),
            comentarios: truncarValor([
              clientePrincipal.comentarios,
              ...clientesAFusionar.map(c => c.comentarios).filter(Boolean)
            ].filter((com, index, self) => com && self.indexOf(com) === index).join('\n\n'))
          };

          // Actualizar cliente principal
          const { error: updateError } = await supabase
            .from('clientes')
            .update(clienteFusionado)
            .eq('id', clientePrincipal.id);

          if (updateError) throw updateError;

          // Eliminar clientes fusionados
          const idsAEliminar = clientesAFusionar.map(c => c.id);
          const { error: deleteError } = await supabase
            .from('clientes')
            .delete()
            .in('id', idsAEliminar);

          if (deleteError) throw deleteError;

          totalFusionados += clientesAFusionar.length;
        } catch (error) {
          console.error(`Error fusionando grupo de nombre ${nombre}:`, error);
          errores++;
        }
      }

      // Procesar duplicados por email
      for (const [email, clientes] of Object.entries(duplicados.porEmail)) {
        try {
          const clientePrincipal = encontrarRegistroMasCompleto(clientes);
          const clientesAFusionar = clientes.filter(c => c.id !== clientePrincipal.id);

          // Combinar información
          const clienteFusionado = {
            ...clientePrincipal,
            nombre: truncarValor(clientePrincipal.nombre),
            email: truncarValor([
              clientePrincipal.email,
              ...clientesAFusionar.map(c => c.email).filter(Boolean)
            ].filter((email, index, self) => email && self.indexOf(email) === index).join('; ')),
            telefono: truncarValor([
              clientePrincipal.telefono,
              ...clientesAFusionar.map(c => c.telefono).filter(Boolean)
            ].filter((tel, index, self) => tel && self.indexOf(tel) === index).join('; ')),
            direccion: truncarValor(clientePrincipal.direccion || clientesAFusionar.find(c => c.direccion)?.direccion || null),
            ciudad: truncarValor(clientePrincipal.ciudad || clientesAFusionar.find(c => c.ciudad)?.ciudad || null),
            pais: truncarValor(clientePrincipal.pais || clientesAFusionar.find(c => c.pais)?.pais || null),
            codigo_postal: truncarValor(clientePrincipal.codigo_postal || clientesAFusionar.find(c => c.codigo_postal)?.codigo_postal || null),
            id_fiscal: truncarValor(clientePrincipal.id_fiscal || clientesAFusionar.find(c => c.id_fiscal)?.id_fiscal || null),
            sitio_web: truncarValor(clientePrincipal.sitio_web || clientesAFusionar.find(c => c.sitio_web)?.sitio_web || null),
            comentarios: truncarValor([
              clientePrincipal.comentarios,
              ...clientesAFusionar.map(c => c.comentarios).filter(Boolean)
            ].filter((com, index, self) => com && self.indexOf(com) === index).join('\n\n'))
          };

          // Actualizar cliente principal
          const { error: updateError } = await supabase
            .from('clientes')
            .update(clienteFusionado)
            .eq('id', clientePrincipal.id);

          if (updateError) throw updateError;

          // Eliminar clientes fusionados
          const idsAEliminar = clientesAFusionar.map(c => c.id);
          const { error: deleteError } = await supabase
            .from('clientes')
            .delete()
            .in('id', idsAEliminar);

          if (deleteError) throw deleteError;

          totalFusionados += clientesAFusionar.length;
        } catch (error) {
          console.error(`Error fusionando grupo de email ${email}:`, error);
          errores++;
        }
      }

      // Procesar duplicados por teléfono
      for (const [telefono, clientes] of Object.entries(duplicados.porTelefono)) {
        try {
          const clientePrincipal = encontrarRegistroMasCompleto(clientes);
          const clientesAFusionar = clientes.filter(c => c.id !== clientePrincipal.id);

          // Combinar información
          const clienteFusionado = {
            ...clientePrincipal,
            nombre: truncarValor(clientePrincipal.nombre),
            email: truncarValor([
              clientePrincipal.email,
              ...clientesAFusionar.map(c => c.email).filter(Boolean)
            ].filter((email, index, self) => email && self.indexOf(email) === index).join('; ')),
            telefono: truncarValor([
              clientePrincipal.telefono,
              ...clientesAFusionar.map(c => c.telefono).filter(Boolean)
            ].filter((tel, index, self) => tel && self.indexOf(tel) === index).join('; ')),
            direccion: truncarValor(clientePrincipal.direccion || clientesAFusionar.find(c => c.direccion)?.direccion || null),
            ciudad: truncarValor(clientePrincipal.ciudad || clientesAFusionar.find(c => c.ciudad)?.ciudad || null),
            pais: truncarValor(clientePrincipal.pais || clientesAFusionar.find(c => c.pais)?.pais || null),
            codigo_postal: truncarValor(clientePrincipal.codigo_postal || clientesAFusionar.find(c => c.codigo_postal)?.codigo_postal || null),
            id_fiscal: truncarValor(clientePrincipal.id_fiscal || clientesAFusionar.find(c => c.id_fiscal)?.id_fiscal || null),
            sitio_web: truncarValor(clientePrincipal.sitio_web || clientesAFusionar.find(c => c.sitio_web)?.sitio_web || null),
            comentarios: truncarValor([
              clientePrincipal.comentarios,
              ...clientesAFusionar.map(c => c.comentarios).filter(Boolean)
            ].filter((com, index, self) => com && self.indexOf(com) === index).join('\n\n'))
          };

          // Actualizar cliente principal
          const { error: updateError } = await supabase
            .from('clientes')
            .update(clienteFusionado)
            .eq('id', clientePrincipal.id);

          if (updateError) throw updateError;

          // Eliminar clientes fusionados
          const idsAEliminar = clientesAFusionar.map(c => c.id);
          const { error: deleteError } = await supabase
            .from('clientes')
            .delete()
            .in('id', idsAEliminar);

          if (deleteError) throw deleteError;

          totalFusionados += clientesAFusionar.length;
        } catch (error) {
          console.error(`Error fusionando grupo de teléfono ${telefono}:`, error);
          errores++;
        }
      }

      // Mostrar resumen
      if (errores > 0) {
        toast.error(`Se fusionaron ${totalFusionados} registros con ${errores} errores.`);
      } else {
        toast.success(`Se fusionaron exitosamente ${totalFusionados} registros.`);
      }

      // Recargar datos
      await handleReloadData();
      
      // Limpiar estado de duplicados
      setDuplicados({
        porNombre: {},
        porEmail: {},
        porTelefono: {}
      });
      setMostrarDuplicados(false);

    } catch (error) {
      console.error('Error en la fusión masiva:', error);
      toast.error('Error al fusionar los registros');
    } finally {
      setFusionandoTodos(false);
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
              onClick={() => {
                console.log('Botón de detectar duplicados clickeado');
                detectarDuplicados().catch(error => {
                  console.error('Error al ejecutar detectarDuplicados:', error);
                  toast.error('Error al detectar duplicados');
                });
              }}
              disabled={buscandoDuplicados || reloadingData}
              className="inline-flex justify-center items-center py-2.5 px-6 rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 transform hover:-translate-y-0.5"
              title="Detectar clientes duplicados por nombre, email o teléfono"
            >
              {buscandoDuplicados ? (
                <>
                  <span className="inline-block animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Buscando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Detectar duplicados
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
                  {filteredClientes.map((cliente, index) => (
                    <tr key={`${cliente.id}-${index}`} className="hover:bg-gray-50 transition-colors duration-150">
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
        
        {/* Modal de fusión de clientes */}
        {mostrandoFusion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Fusionar Clientes Duplicados
                </h2>
                <button
                  onClick={() => setMostrandoFusion(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {tipoDuplicadoActual === 'nombre' ? 'Nombre' : 
                   tipoDuplicadoActual === 'email' ? 'Email' : 'Teléfono'}: {valorDuplicadoActual}
                </p>
              </div>

              <div className="space-y-4">
                {clientesSeleccionados.map((cs, index) => (
                  <div
                    key={cs.cliente.id}
                    className={`p-4 rounded-lg border ${
                      clientePrincipal?.id === cs.cliente.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <input
                        type="radio"
                        name="clientePrincipal"
                        checked={clientePrincipal?.id === cs.cliente.id}
                        onChange={() => setClientePrincipal(cs.cliente)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{cs.cliente.nombre}</h3>
                        <div className="mt-1 text-sm text-gray-500">
                          {cs.cliente.email && <p>📧 {cs.cliente.email}</p>}
                          {cs.cliente.telefono && <p>📞 {cs.cliente.telefono}</p>}
                          {cs.cliente.ciudad && <p>📍 {cs.cliente.ciudad}</p>}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={cs.seleccionado}
                          onChange={(e) => {
                            const nuevosSeleccionados = [...clientesSeleccionados];
                            nuevosSeleccionados[index].seleccionado = e.target.checked;
                            setClientesSeleccionados(nuevosSeleccionados);
                          }}
                          className="h-4 w-4 text-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setMostrandoFusion(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={fusionarClientes}
                  disabled={fusionando || !clientePrincipal}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {fusionando ? (
                    <>
                      <span className="inline-block animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Fusionando...
                    </>
                  ) : (
                    'Fusionar Clientes'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Sección de duplicados */}
        {mostrarDuplicados && (
          <div className="mt-8 bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-amber-800">Clientes Duplicados Detectados</h2>
                  <p className="text-sm text-amber-600 mt-1">
                    Se encontraron posibles duplicados. Revise cuidadosamente antes de tomar acciones.
                  </p>
                </div>
                <button
                  onClick={fusionarTodosLosDuplicados}
                  disabled={fusionandoTodos}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {fusionandoTodos ? (
                    <>
                      <span className="inline-block animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Fusionando...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Fusionar Todos
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Duplicados por nombre */}
            {Object.keys(duplicados.porNombre).length > 0 && (
              <div className="p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Duplicados por Nombre ({Object.keys(duplicados.porNombre).length} grupos)
                </h3>
                <div className="space-y-6">
                  {Object.entries(duplicados.porNombre).slice(0, 10).map(([nombre, clientes]) => (
                    <div key={nombre} className="bg-amber-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-amber-800">{nombre}</h4>
                        <button
                          onClick={() => iniciarFusion('nombre', nombre, clientes)}
                          className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          Fusionar ({clientes.length} registros)
                        </button>
                      </div>
                      <div className="space-y-2">
                        {clientes.map(cliente => (
                          <div key={cliente.id} className="bg-white p-3 rounded-md shadow-sm flex justify-between items-center">
                            <div>
                              <p className="font-medium">{cliente.nombre}</p>
                              <p className="text-sm text-gray-500">
                                {cliente.email && <span className="mr-3">📧 {cliente.email}</span>}
                                {cliente.telefono && <span>📞 {cliente.telefono}</span>}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Link
                                href={`/clientes/${cliente.id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Ver
                              </Link>
                              <Link
                                href={`/clientes/edit/${cliente.id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Editar
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(duplicados.porNombre).length > 10 && (
                    <div className="text-center text-gray-500">
                      Mostrando 10 de {Object.keys(duplicados.porNombre).length} grupos de duplicados por nombre
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Duplicados por email */}
            {Object.keys(duplicados.porEmail).length > 0 && (
              <div className="p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Duplicados por Email ({Object.keys(duplicados.porEmail).length} grupos)
                </h3>
                <div className="space-y-6">
                  {Object.entries(duplicados.porEmail).slice(0, 10).map(([email, clientes]) => (
                    <div key={email} className="bg-amber-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-amber-800">{email}</h4>
                        <button
                          onClick={() => iniciarFusion('email', email, clientes)}
                          className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          Fusionar ({clientes.length} registros)
                        </button>
                      </div>
                      <div className="space-y-2">
                        {clientes.map(cliente => (
                          <div key={cliente.id} className="bg-white p-3 rounded-md shadow-sm flex justify-between items-center">
                            <div>
                              <p className="font-medium">{cliente.nombre}</p>
                              <p className="text-sm text-gray-500">
                                {cliente.email && <span className="mr-3">📧 {cliente.email}</span>}
                                {cliente.telefono && <span>📞 {cliente.telefono}</span>}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Link
                                href={`/clientes/${cliente.id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Ver
                              </Link>
                              <Link
                                href={`/clientes/edit/${cliente.id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Editar
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(duplicados.porEmail).length > 10 && (
                    <div className="text-center text-gray-500">
                      Mostrando 10 de {Object.keys(duplicados.porEmail).length} grupos de duplicados por email
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Duplicados por teléfono */}
            {Object.keys(duplicados.porTelefono).length > 0 && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Duplicados por Teléfono ({Object.keys(duplicados.porTelefono).length} grupos)
                </h3>
                <div className="space-y-6">
                  {Object.entries(duplicados.porTelefono).slice(0, 10).map(([telefono, clientes]) => (
                    <div key={telefono} className="bg-amber-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-amber-800">{telefono}</h4>
                        <button
                          onClick={() => iniciarFusion('telefono', telefono, clientes)}
                          className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          Fusionar ({clientes.length} registros)
                        </button>
                      </div>
                      <div className="space-y-2">
                        {clientes.map(cliente => (
                          <div key={cliente.id} className="bg-white p-3 rounded-md shadow-sm flex justify-between items-center">
                            <div>
                              <p className="font-medium">{cliente.nombre}</p>
                              <p className="text-sm text-gray-500">
                                {cliente.email && <span className="mr-3">📧 {cliente.email}</span>}
                                {cliente.telefono && <span>📞 {cliente.telefono}</span>}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Link
                                href={`/clientes/${cliente.id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Ver
                              </Link>
                              <Link
                                href={`/clientes/edit/${cliente.id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Editar
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(duplicados.porTelefono).length > 10 && (
                    <div className="text-center text-gray-500">
                      Mostrando 10 de {Object.keys(duplicados.porTelefono).length} grupos de duplicados por teléfono
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 
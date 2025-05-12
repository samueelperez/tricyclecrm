import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

type UpdateStrategy = 'update' | 'skip' | 'create_new';

interface ImportRequest {
  data: any[];
  updateStrategy?: UpdateStrategy;
}

export async function POST(req: Request) {
  try {
    const startTime = Date.now();
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar la sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Configuración de timeout más largo para la respuesta
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 60000); // 60 segundos de timeout
    
    try {
      // Obtener los datos del cuerpo de la solicitud
      const requestData = await req.json();
      console.log('Datos recibidos en API (muestra):', JSON.stringify(requestData).substring(0, 200) + '...');
      
      // Determinar si se está utilizando el formato nuevo (con estrategia de actualización)
      let clientes: any[];
      let updateStrategy: UpdateStrategy = 'update'; // Estrategia por defecto
      
      if (Array.isArray(requestData)) {
        // Formato antiguo: array directo de clientes
        clientes = requestData;
        console.log(`API recibió array directo con ${clientes.length} clientes`);
      } else {
        // Formato nuevo: objeto con datos y estrategia
        const importRequest = requestData as ImportRequest;
        if (!Array.isArray(importRequest.data) || importRequest.data.length === 0) {
          console.log('Error: No se proporcionaron datos válidos en el objeto estructurado');
          return NextResponse.json({ error: 'No se proporcionaron datos de clientes válidos' }, { status: 400 });
        }
        clientes = importRequest.data;
        
        // Usar la estrategia proporcionada si es válida
        if (importRequest.updateStrategy) {
          updateStrategy = importRequest.updateStrategy;
          console.log(`API recibió ${clientes.length} clientes con estrategia: ${updateStrategy}`);
        }
      }
      
      // Evaluar tamaño de la solicitud
      const requestSize = JSON.stringify(clientes).length;
      console.log(`Tamaño de la solicitud: ${(requestSize / 1024 / 1024).toFixed(2)} MB`);
      
      if (clientes.length === 0) {
        console.log('Error: No hay clientes para importar');
        return NextResponse.json({ error: 'No se proporcionaron datos de clientes válidos' }, { status: 400 });
      }
      
      // Validar los datos básicos de cada cliente
      console.log(`Validando ${clientes.length} registros...`);
      const clientesValidados = clientes.filter(cliente => {
        // Verificar que el nombre no sea nulo o vacío
        return cliente.nombre && String(cliente.nombre).trim() !== '';
      }).map(cliente => {
        // Asegurarse de que los campos sean del tipo correcto
        return {
          nombre: String(cliente.nombre || '').trim(),
          id_fiscal: cliente.id_fiscal ? String(cliente.id_fiscal).trim() : null,
          direccion: cliente.direccion ? String(cliente.direccion).trim() : null,
          ciudad: cliente.ciudad ? String(cliente.ciudad).trim() : null,
          codigo_postal: cliente.codigo_postal ? String(cliente.codigo_postal).trim() : null,
          pais: cliente.pais ? String(cliente.pais).trim() : null,
          contacto_nombre: cliente.contacto_nombre ? String(cliente.contacto_nombre).trim() : null,
          email: cliente.email ? String(cliente.email).trim() : null,
          telefono: cliente.telefono ? String(cliente.telefono).trim() : null,
          sitio_web: cliente.sitio_web ? String(cliente.sitio_web).trim() : null,
          comentarios: cliente.comentarios ? String(cliente.comentarios).trim() : null
        };
      });
      
      const registrosInvalidos = clientes.length - clientesValidados.length;
      console.log(`Validación completa: ${clientesValidados.length} válidos, ${registrosInvalidos} inválidos`);
      
      // Si después de filtrar no quedan clientes válidos, informar
      if (clientesValidados.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: 'No se encontraron registros con nombre de cliente válido',
          resultados: {
            nuevos: 0,
            actualizados: 0,
            omitidos: clientes.length,
            errores: 0,
            invalidados: registrosInvalidos
          }
        });
      }
      
      // Obtener todos los clientes existentes para verificar duplicados
      console.log('Consultando clientes existentes...');
      const { data: clientesExistentes, error: errorConsulta } = await supabase
        .from('clientes')
        .select('id, nombre, id_fiscal, email, telefono');
        
      if (errorConsulta) {
        console.error('Error al consultar clientes existentes:', errorConsulta);
        return NextResponse.json({ error: 'Error al verificar duplicados' }, { status: 500 });
      }
      
      console.log(`Se encontraron ${clientesExistentes?.length || 0} clientes existentes en la base de datos`);
      
      // Crear mapas para verificación rápida de duplicados
      const nombreExistente = new Map();
      const emailExistente = new Map();
      const idFiscalExistente = new Map();
      
      if (clientesExistentes && clientesExistentes.length > 0) {
        clientesExistentes.forEach(cliente => {
          nombreExistente.set(cliente.nombre.toLowerCase(), cliente.id);
          if (cliente.email) {
            emailExistente.set(cliente.email.toLowerCase(), cliente.id);
          }
          if (cliente.id_fiscal) {
            idFiscalExistente.set(cliente.id_fiscal.toLowerCase(), cliente.id);
          }
        });
      }
      
      // Separar clientes según la estrategia
      const clientesNuevos = [];
      const clientesActualizar = [];
      const clientesOmitidos = [];
      
      for (const cliente of clientesValidados) {
        // Verificar si existe por nombre, email o id_fiscal
        const existePorNombre = nombreExistente.has(cliente.nombre.toLowerCase());
        const existePorEmail = cliente.email && emailExistente.has(cliente.email.toLowerCase());
        const existePorIdFiscal = cliente.id_fiscal && idFiscalExistente.has(cliente.id_fiscal.toLowerCase());
        
        if (existePorNombre || existePorEmail || existePorIdFiscal) {
          // Determinar el ID del cliente existente
          let clienteId: number;
          
          if (existePorNombre) {
            clienteId = nombreExistente.get(cliente.nombre.toLowerCase());
          } else if (existePorEmail) {
            clienteId = emailExistente.get(cliente.email!.toLowerCase());
          } else {
            clienteId = idFiscalExistente.get(cliente.id_fiscal!.toLowerCase());
          }
          
          // Aplicar estrategia para duplicados
          switch (updateStrategy) {
            case 'update':
              // Actualizar el cliente existente
              clientesActualizar.push({
                id: clienteId,
                ...cliente
              });
              break;
            case 'skip':
              // Omitir el cliente
              clientesOmitidos.push(cliente);
              break;
            case 'create_new':
              // Crear como nuevo a pesar de posible duplicado
              clientesNuevos.push(cliente);
              break;
          }
        } else {
          // Si no existe, lo agregamos a la lista de nuevos
          clientesNuevos.push(cliente);
        }
      }
      
      console.log(`Categorización de clientes completada:`);
      console.log(`- Nuevos: ${clientesNuevos.length}`);
      console.log(`- A actualizar: ${clientesActualizar.length}`);
      console.log(`- Omitidos: ${clientesOmitidos.length}`);
      
      // Batch processing mejorado para conjuntos grandes de datos
      const processBatch = async (batch: any[], operation: 'insert' | 'update') => {
        if (batch.length === 0) return { count: 0, errors: 0 };
        
        let processedCount = 0;
        let errorCount = 0;
        let attemptedCount = 0;
        
        // Procesar en lotes más pequeños para mejor manejo
        const BATCH_SIZE = 10; // Reducir el tamaño del lote para evitar timeouts
        const DELAY_MS = 200; // Aumentar el tiempo de espera entre lotes
        
        console.log(`Iniciando procesamiento de ${batch.length} registros en modo ${operation}`);
        console.time('tiempoProcesamiento');
        
        for (let i = 0; i < batch.length; i += BATCH_SIZE) {
          const currentBatch = batch.slice(i, i + BATCH_SIZE);
          attemptedCount += currentBatch.length;
          
          if (operation === 'insert') {
            try {
              // Insertar uno por uno para mejor rastreo de errores
              for (const cliente of currentBatch) {
                try {
                  const cleanCliente = { ...cliente };
                  // Asegurarse de que no haya valores undefined o campos vacíos
                  Object.keys(cleanCliente).forEach(key => {
                    if (cleanCliente[key] === undefined || cleanCliente[key] === '') {
                      cleanCliente[key] = null;
                    }
                  });
                  
                  const { data: singleData, error: singleError } = await supabase
                    .from('clientes')
                    .insert([cleanCliente])
                    .select();
                  
                  if (singleError) {
                    console.error(`Error al insertar cliente "${cliente.nombre}":`, singleError.message);
                    if (singleError.code) {
                      console.error(`Código de error: ${singleError.code}`);
                    }
                    errorCount++;
                  } else if (singleData && singleData.length > 0) {
                    processedCount++;
                  } else {
                    console.error(`No se insertó el cliente "${cliente.nombre}" pero tampoco hubo error.`);
                    errorCount++;
                  }
                } catch (err: any) {
                  console.error(`Excepción al insertar cliente "${cliente.nombre}":`, err.message || err);
                  errorCount++;
                }
              }
            } catch (err: any) {
              console.error(`Excepción general al insertar lote de clientes:`, err.message || err);
              errorCount += currentBatch.length;
            }
          } else if (operation === 'update') {
            // Actualizar uno por uno
            for (const cliente of currentBatch) {
              try {
                const { id, ...datosActualizar } = cliente;
                
                // Validar que no haya valores undefined o campos vacíos
                Object.keys(datosActualizar).forEach(key => {
                  if (datosActualizar[key] === undefined || datosActualizar[key] === '') {
                    datosActualizar[key] = null;
                  }
                });
                
                const { error } = await supabase
                  .from('clientes')
                  .update(datosActualizar)
                  .eq('id', id);
                
                if (error) {
                  console.error(`Error al actualizar cliente ID ${id}:`, error.message);
                  if (error.code) {
                    console.error(`Código de error: ${error.code}`);
                  }
                  errorCount++;
                } else {
                  processedCount++;
                }
              } catch (err: any) {
                console.error(`Excepción al actualizar cliente ID ${cliente.id}:`, err.message || err);
                errorCount++;
              }
            }
          }
          
          // Log de progreso cada 50 registros o al final de cada lote
          if ((i % 50 === 0 && i > 0) || i + BATCH_SIZE >= batch.length) {
            const porcentaje = Math.round((attemptedCount / batch.length) * 100);
            console.log(`Progreso ${operation}: ${attemptedCount}/${batch.length} registros (${porcentaje}%). Exitosos: ${processedCount}, Errores: ${errorCount}`);
          }
          
          // Esperar un poco entre lotes para evitar sobrecarga del servidor
          if (i + BATCH_SIZE < batch.length) {
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
          }
        }
        
        console.timeEnd('tiempoProcesamiento');
        console.log(`Finalizado ${operation}: ${processedCount} exitosos de ${batch.length} intentados (${errorCount} errores)`);
        
        return { count: processedCount, errors: errorCount };
      };
      
      // Resultados
      const resultados = {
        nuevos: 0,
        actualizados: 0,
        omitidos: clientesOmitidos.length,
        errores: 0,
        invalidados: registrosInvalidos,
        tiempo_ms: 0
      };
      
      // Insertar nuevos clientes en lotes
      if (clientesNuevos.length > 0) {
        console.log(`Iniciando inserción de ${clientesNuevos.length} clientes nuevos...`);
        const { count: insertedCount, errors: insertErrors } = await processBatch(clientesNuevos, 'insert');
        resultados.nuevos = insertedCount;
        resultados.errores += insertErrors;
        console.log(`Inserción completada: ${insertedCount} exitosos, ${insertErrors} errores`);
      }
      
      // Actualizar clientes existentes en lotes
      if (clientesActualizar.length > 0) {
        console.log(`Iniciando actualización de ${clientesActualizar.length} clientes existentes...`);
        const { count: updatedCount, errors: updateErrors } = await processBatch(clientesActualizar, 'update');
        resultados.actualizados = updatedCount;
        resultados.errores += updateErrors;
        console.log(`Actualización completada: ${updatedCount} exitosos, ${updateErrors} errores`);
      }
      
      // Calcular tiempo total
      resultados.tiempo_ms = Date.now() - startTime;
      
      // Enviar resultados al cliente
      console.log(`Importación completada en ${resultados.tiempo_ms}ms con resultados:`, resultados);
      
      return NextResponse.json({
        success: true,
        message: `Importación completada. Nuevos: ${resultados.nuevos}, Actualizados: ${resultados.actualizados}, Omitidos: ${resultados.omitidos}, Errores: ${resultados.errores}`,
        resultados: {
          ...resultados,
          procesados: resultados.nuevos + resultados.actualizados + resultados.omitidos
        }
      });
      
    } finally {
      clearTimeout(timeoutId);
    }
    
  } catch (error: any) {
    console.error('Error no controlado en importación:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Error interno del servidor al procesar la importación' 
    }, { status: 500 });
  }
} 
type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function generateChatResponse(messages: ChatMessage[]): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error en la comunicación con OpenAI:', error);
    return 'Lo siento, ha ocurrido un error al generar una respuesta. Por favor, inténtalo de nuevo más tarde.';
  }
}

/**
 * Utiliza la API de Asistentes de OpenAI para procesar mensajes
 * @param threadId ID del hilo de conversación o null para crear uno nuevo
 * @param message Mensaje del usuario
 * @returns Objeto con la respuesta y el ID del hilo
 */
export async function useAssistantAPI(threadId: string | null, message: string): Promise<{response: string, threadId: string}> {
  try {
    console.log('Iniciando useAssistantAPI con threadId:', threadId);
    
    // ID del asistente predefinido
    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    
    if (!assistantId) {
      console.error('Error: ID de asistente no configurado');
      throw new Error('ID de asistente no configurado');
    }
    
    console.log('Usando asistente con ID:', assistantId);
    
    // Crear un nuevo hilo si no existe
    let currentThreadId = threadId;
    if (!currentThreadId) {
      console.log('Creando nuevo hilo de conversación...');
      try {
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({})
        });
        
        if (!threadResponse.ok) {
          const errorText = await threadResponse.text();
          console.error('Error al crear hilo. Respuesta:', errorText);
          throw new Error(`Error al crear hilo: ${errorText}`);
        }
        
        const threadData = await threadResponse.json();
        currentThreadId = threadData.id;
        console.log('Hilo creado con ID:', currentThreadId);
      } catch (error) {
        console.error('Error al crear hilo:', error);
        throw error;
      }
    } else {
      console.log('Usando hilo existente con ID:', currentThreadId);
    }
    
    // Añadir mensaje al hilo
    console.log('Añadiendo mensaje al hilo...');
    try {
      const messageResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          role: 'user',
          content: message
        })
      });
      
      if (!messageResponse.ok) {
        const errorText = await messageResponse.text();
        console.error('Error al añadir mensaje. Respuesta:', errorText);
        throw new Error(`Error al añadir mensaje: ${errorText}`);
      }
      
      console.log('Mensaje añadido correctamente');
    } catch (error) {
      console.error('Error al añadir mensaje:', error);
      throw error;
    }
    
    // Ejecutar el asistente
    console.log('Ejecutando asistente...');
    let runId;
    try {
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          assistant_id: assistantId
        })
      });
      
      if (!runResponse.ok) {
        const errorText = await runResponse.text();
        console.error('Error al ejecutar asistente. Respuesta:', errorText);
        throw new Error(`Error al ejecutar asistente: ${errorText}`);
      }
      
      const runData = await runResponse.json();
      runId = runData.id;
      console.log('Ejecución iniciada con ID:', runId);
    } catch (error) {
      console.error('Error al ejecutar asistente:', error);
      throw error;
    }
    
    // Esperar a que termine la ejecución (polling)
    console.log('Esperando a que termine la ejecución...');
    let runStatus = 'in_progress';
    let attempts = 0;
    const maxAttempts = 30; // Máximo 30 intentos (30 segundos con 1s de espera)
    
    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
      
      try {
        const runStatusResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });
        
        if (!runStatusResponse.ok) {
          const errorText = await runStatusResponse.text();
          console.error('Error al verificar estado. Respuesta:', errorText);
          throw new Error(`Error al verificar estado: ${errorText}`);
        }
        
        const runStatusData = await runStatusResponse.json();
        runStatus = runStatusData.status;
        attempts++;
        console.log(`Estado de ejecución (intento ${attempts}): ${runStatus}`);
      } catch (error) {
        console.error('Error al verificar estado:', error);
        throw error;
      }
    }
    
    if (runStatus !== 'completed') {
      console.error(`La ejecución no se completó. Estado final: ${runStatus}`);
      throw new Error(`La ejecución no se completó. Estado final: ${runStatus}`);
    }
    
    // Obtener los mensajes
    console.log('Obteniendo mensajes...');
    try {
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      if (!messagesResponse.ok) {
        const errorText = await messagesResponse.text();
        console.error('Error al obtener mensajes. Respuesta:', errorText);
        throw new Error(`Error al obtener mensajes: ${errorText}`);
      }
      
      const messagesData = await messagesResponse.json();
      console.log('Mensajes obtenidos:', messagesData.data.length);
      
      // Obtener la última respuesta del asistente
      const assistantMessages = messagesData.data.filter((msg: any) => msg.role === 'assistant');
      
      if (assistantMessages.length === 0) {
        console.warn('No se encontraron mensajes del asistente');
        return {
          response: 'No se recibió respuesta del asistente',
          threadId: currentThreadId || ''
        };
      }
      
      // Obtener el contenido del último mensaje
      const latestMessage = assistantMessages[0];
      console.log('Contenido del mensaje:', JSON.stringify(latestMessage.content));
      
      // Extraer texto de los bloques de contenido
      let responseText = '';
      
      // Verificar que latestMessage.content es un array
      if (Array.isArray(latestMessage.content)) {
        for (const block of latestMessage.content) {
          if (block.type === 'text') {
            responseText += block.text.value + '\n';
          }
        }
      } else {
        console.warn('El contenido del mensaje no es un array:', latestMessage.content);
        responseText = 'Error: formato de respuesta inesperado';
      }
      
      console.log('Respuesta procesada exitosamente');
      return {
        response: responseText.trim() || 'El asistente envió una respuesta vacía',
        threadId: currentThreadId || ''
      };
    } catch (error) {
      console.error('Error al obtener o procesar los mensajes:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error general en useAssistantAPI:', error);
    return {
      response: `Lo siento, ocurrió un error al procesar tu mensaje con el asistente: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      threadId: threadId || ''
    };
  }
}

export async function searchCompanies(query: string): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'Eres un asistente especializado en encontrar empresas potenciales como clientes o proveedores. Proporciona información estructurada y relevante sobre empresas que coincidan con la consulta del usuario.',
    },
    {
      role: 'user',
      content: `Busca empresas que podrían ser proveedores o clientes potenciales relacionados con: ${query}`,
    },
  ];

  return generateChatResponse(messages);
}

export async function analyzeSalesConversation(conversation: string): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'Eres un experto en análisis de conversaciones de ventas. Evalúa la conversación proporcionada y ofrece feedback sobre la eficacia, puntos fuertes, áreas de mejora y recomendaciones.',
    },
    {
      role: 'user',
      content: `Analiza la siguiente conversación de ventas y evalúa su eficacia: ${conversation}`,
    },
  ];

  return generateChatResponse(messages);
}

export async function manageSalesConversation(context: string): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'Eres un experto en gestión de conversaciones de ventas. Ayuda a elaborar respuestas, sugerencias y estrategias para manejar las conversaciones con clientes de manera efectiva.',
    },
    {
      role: 'user',
      content: `Ayúdame a gestionar esta conversación con un cliente: ${context}`,
    },
  ];

  return generateChatResponse(messages);
} 
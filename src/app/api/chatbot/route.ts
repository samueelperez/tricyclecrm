import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchCompanies, analyzeSalesConversation, manageSalesConversation, useAssistantAPI } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    // Extraer los datos de la solicitud
    let messageData;
    try {
      messageData = await request.json();
    } catch (error) {
      console.error('Error al parsear el JSON de la solicitud:', error);
      return NextResponse.json({ error: 'Error al procesar la solicitud: formato JSON inválido' }, { status: 400 });
    }

    const { message, mode, conversationId, threadId } = messageData;
    
    if (!message || !mode) {
      return NextResponse.json(
        { error: 'Mensaje y modo son requeridos' },
        { status: 400 }
      );
    }

    // Inicializar Supabase
    let supabase;
    try {
      supabase = createClient();
    } catch (error) {
      console.error('Error al crear cliente Supabase:', error);
      return NextResponse.json({ error: 'Error de conexión a la base de datos' }, { status: 500 });
    }

    // Autenticación
    let user;
    try {
      const { data: userData } = await supabase.auth.getUser();
      user = userData.user;
      
      if (!user) {
        return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
      }
    } catch (error) {
      console.error('Error al verificar la autenticación:', error);
      return NextResponse.json({ error: 'Error al verificar la autenticación' }, { status: 500 });
    }

    // Preparar respuesta fallback para modo assistant
    let useFallbackMode = false;
    if (mode === 'assistant') {
      const openaiKey = process.env.OPENAI_API_KEY;
      const assistantId = process.env.OPENAI_ASSISTANT_ID;

      if (!openaiKey || openaiKey.startsWith('sk-placeholder') || !assistantId) {
        console.log('Usando modo fallback para assistant porque faltan credenciales');
        useFallbackMode = true;
      }
    }

    // Gestión de conversación
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      try {
        const title = `Conversación ${new Date().toLocaleString()}`;
        const { data: newConversation, error: convError } = await supabase
          .from('chatbot_conversations')
          .insert({
            title,
            mode: useFallbackMode ? 'management' : mode,
            user_id: user.id,
            thread_id: threadId
          })
          .select()
          .single();
        
        if (convError) throw convError;
        
        activeConversationId = newConversation.id;
        
        await supabase
          .from('chatbot_messages')
          .insert({
            conversation_id: activeConversationId,
            role: 'system',
            content: 'Soy tu asistente de TricycleCRM. ¿En qué puedo ayudarte hoy?',
          });
      } catch (error) {
        console.error('Error al crear conversación:', error);
        // Continuamos con conversationId nulo y manejamos errores después
      }
    }

    // Registrar el mensaje del usuario (si hay conversationId)
    if (activeConversationId) {
      try {
        // Registrar interacción
        await supabase.from('chatbot_interactions').insert({
          message,
          mode,
          user_id: user.id,
          timestamp: new Date().toISOString(),
        });

        // Guardar mensaje del usuario
        await supabase.from('chatbot_messages').insert({
          conversation_id: activeConversationId,
          role: 'user',
          content: message,
        });
      } catch (error) {
        console.error('Error al guardar mensaje del usuario:', error);
        // Continuamos para intentar proporcionar una respuesta
      }
    }

    // Obtener respuesta según modo
    let response: string;
    let newThreadId: string | null = threadId;
    
    try {
      // Si estamos en modo fallback, usar manageSalesConversation en lugar del asistente
      if (useFallbackMode) {
        console.log('Usando modo fallback (management) en lugar de assistant');
        response = await manageSalesConversation(message);
        response = `[MODO FALLBACK - Asistente API no disponible]\n\n${response}`;
      } else {
        switch (mode) {
          case 'prospecting':
            response = await searchCompanies(message);
            break;
          case 'analysis':
            response = await analyzeSalesConversation(message);
            break;
          case 'management':
            response = await manageSalesConversation(message);
            break;
          case 'assistant':
            try {
              console.log('Intentando usar API de asistentes...');
              const assistantResult = await useAssistantAPI(threadId, message);
              response = assistantResult.response;
              newThreadId = assistantResult.threadId;
              
              if (activeConversationId && newThreadId && newThreadId !== threadId) {
                await supabase
                  .from('chatbot_conversations')
                  .update({ thread_id: newThreadId })
                  .eq('id', activeConversationId);
              }
            } catch (error) {
              console.error('Error específico al usar API de asistentes:', error);
              // Si falla el asistente, usamos el modo de gestión como fallback
              response = await manageSalesConversation(message);
              response = `[ERROR ASISTENTE - Usando respuesta alternativa]\n\n${response}\n\nDetalles del error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
            }
            break;
          default:
            response = 'Modo no reconocido. Por favor, selecciona un modo válido.';
        }
      }
    } catch (error) {
      console.error('Error al generar respuesta:', error);
      response = 'Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, inténtalo de nuevo.';
    }

    // Guardar respuesta del asistente (si hay conversationId)
    if (activeConversationId) {
      try {
        await supabase.from('chatbot_messages').insert({
          conversation_id: activeConversationId,
          role: 'assistant',
          content: response,
        });

        await supabase
          .from('chatbot_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', activeConversationId);
      } catch (error) {
        console.error('Error al guardar respuesta:', error);
        // Continuamos para devolver la respuesta al usuario
      }
    }

    return NextResponse.json({
      response,
      conversationId: activeConversationId,
      threadId: newThreadId,
      fallbackMode: useFallbackMode
    });
  } catch (error) {
    console.error('Error general en el endpoint del chatbot:', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar la solicitud',
        details: error instanceof Error ? error.message : 'Error desconocido',
        response: 'Lo siento, ha ocurrido un error en el servidor. El equipo de soporte ha sido notificado.'
      },
      { status: 500 }
    );
  }
}

async function handleProspecting(message: string): Promise<string> {
  // Aquí integrarías una API externa como OpenAI para búsqueda de empresas
  // Por ahora, simularemos una respuesta
  return `Resultados de búsqueda para: "${message}"\n\n1. Empresa ABC - Sector: Tecnología - Web: www.abc.com\n2. Empresa XYZ - Sector: Manufactura - Web: www.xyz.com\n3. Empresa 123 - Sector: Servicios - Web: www.123.com`;
}

async function handleAnalysis(message: string): Promise<string> {
  // Aquí añadirías integración con API de AI para análisis de sentimiento y eficacia
  return `Análisis de conversación:\n\nPuntos fuertes: La comunicación fue clara y profesional.\nÁreas de mejora: El tiempo de respuesta podría ser más rápido. Recomendamos seguimiento más frecuente.\nEficacia general: 7/10`;
}

async function handleManagement(message: string): Promise<string> {
  // Aquí añadirías integración con LLMs para gestión de conversaciones
  return `Respuesta sugerida:\n\n"Gracias por su interés en nuestros servicios. Entiendo que está buscando una solución para optimizar sus procesos de producción. Tenemos varias opciones que podrían ajustarse a sus necesidades. ¿Podríamos agendar una llamada para discutir los detalles específicos de su proyecto?"`;
} 
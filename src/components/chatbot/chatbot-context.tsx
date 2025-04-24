'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  thinking?: boolean;
};

type ChatbotMode = 'prospecting' | 'analysis' | 'management' | 'assistant';

type Conversation = {
  id: string;
  title: string;
  mode: ChatbotMode;
  created_at: string;
  updated_at: string;
  thread_id?: string;
};

type ChatbotContextType = {
  messages: Message[];
  isLoading: boolean;
  mode: ChatbotMode;
  currentConversationId: string | null;
  conversations: Conversation[];
  isLoadingConversations: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setMode: (mode: ChatbotMode) => void;
  startNewConversation: (mode: ChatbotMode) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  deleteAllConversations: () => Promise<void>;
  loadConversations: () => Promise<void>;
  sendMessage: (messageText: string) => Promise<void>;
};

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: 'Soy tu asistente de TricycleCRM. ¿En qué puedo ayudarte hoy?',
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatbotMode>('management');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  // Cargar conversaciones al iniciar
  useEffect(() => {
    loadConversations();
  }, []);

  // Obtener la URL base para las peticiones API
  const getBaseUrl = () => {
    // En el lado del cliente, usar la ubicación actual
    if (typeof window !== 'undefined') {
      return ''; // URL relativa que se resolverá automáticamente
    }
    // En el servidor, usar la variable de entorno o localhost:3000 como fallback
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  };

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await fetch('/api/chatbot/history');
      const data = await response.json();
      
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const startNewConversation = async (newMode: ChatbotMode) => {
    try {
      setIsLoading(true);
      const title = `Conversación ${new Date().toLocaleString()}`;
      
      const response = await fetch('/api/chatbot/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          mode: newMode,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error al crear conversación: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.id) {
        setCurrentConversationId(data.id);
        setMode(newMode);
        setCurrentThreadId(null);
        setMessages([
          {
            id: '1',
            role: 'system',
            content: 'Soy tu asistente de TricycleCRM. ¿En qué puedo ayudarte hoy?',
            timestamp: Date.now(),
          },
        ]);
        await loadConversations();
      }
    } catch (error) {
      console.error('Error al crear conversación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/chatbot/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error al cargar conversación: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.conversation && data.messages) {
        setCurrentConversationId(conversationId);
        setMode(data.conversation.mode as ChatbotMode);
        setCurrentThreadId(data.conversation.thread_id || null);
        
        // Transformar mensajes de la base de datos al formato local
        const formattedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at).getTime(),
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error al cargar conversación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/chatbot/conversations?id=${conversationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error al eliminar conversación: ${response.status} ${response.statusText}`);
      }
      
      // Si la conversación actual fue eliminada, limpiar el estado
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setCurrentThreadId(null);
        clearMessages();
      }
      
      // Recargar lista de conversaciones
      await loadConversations();
    } catch (error) {
      console.error('Error al eliminar conversación:', error);
      throw error; // Relanzar el error para que se pueda manejar en el componente
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAllConversations = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/chatbot/conversations?all=true', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error al eliminar todas las conversaciones: ${response.status} ${response.statusText}`);
      }
      
      // Limpiar el estado actual
      setCurrentConversationId(null);
      setCurrentThreadId(null);
      clearMessages();
      
      // Recargar lista de conversaciones (debería estar vacía)
      await loadConversations();
    } catch (error) {
      console.error('Error al eliminar todas las conversaciones:', error);
      throw error; // Relanzar el error para que se pueda manejar en el componente
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const clearMessages = () => {
    setMessages([
      {
        id: '1',
        role: 'system',
        content: 'Soy tu asistente de TricycleCRM. ¿En qué puedo ayudarte hoy?',
        timestamp: Date.now(),
      },
    ]);
    setCurrentConversationId(null);
    setCurrentThreadId(null);
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    try {
      setIsLoading(true);
      
      // Añadir mensaje del usuario a la UI inmediatamente
      addMessage({ role: 'user', content: messageText });
      
      // Mostrar indicador de "pensando"
      const thinkingMsgId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: thinkingMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        thinking: true
      }]);
      
      // Si no hay conversación activa, crear una nueva
      if (!currentConversationId) {
        await startNewConversation(mode);
      }
      
      // Enviar mensaje al API
      let data;
      try {
        const response = await fetch('/api/chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageText,
            mode,
            conversationId: currentConversationId,
            threadId: currentThreadId
          }),
        });
        
        if (!response.ok) {
          // Si el servidor devuelve un error, intentamos extraer el mensaje
          const errorData = await response.json().catch(() => null);
          console.error('Error en la respuesta del servidor:', response.status, errorData);
          throw new Error(errorData?.error || `Error ${response.status}: ${response.statusText}`);
        }
        
        data = await response.json();
      } catch (error) {
        console.error('Error en la comunicación con el servidor:', error);
        throw new Error('Error de comunicación con el servidor. Asegúrate de que el servidor esté ejecutándose en el puerto correcto.');
      }
      
      // Eliminar mensaje de "pensando"
      setMessages(prev => prev.filter(msg => msg.id !== thinkingMsgId));
      
      // Si el servidor nos informa que está usando un modo fallback, actualizar el modo en la UI
      if (data.fallbackMode && mode === 'assistant') {
        console.log('Usando modo fallback debido a problemas con el asistente');
        setMode('management');
      }
      
      // Actualizar threadId si estamos usando el modo asistente
      if (mode === 'assistant' && data.threadId) {
        setCurrentThreadId(data.threadId);
        
        // Actualizar la conversación en la base de datos con el threadId
        if (currentConversationId) {
          try {
            const updateResponse = await fetch(`/api/chatbot/conversations`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: currentConversationId,
                thread_id: data.threadId
              }),
            });
            
            if (!updateResponse.ok) {
              console.error('Error al actualizar threadId:', updateResponse.status, updateResponse.statusText);
            }
          } catch (error) {
            console.error('Error al actualizar threadId:', error);
            // No interrumpimos el flujo si falla esta actualización
          }
        }
      }
      
      // Añadir respuesta del asistente
      addMessage({
        role: 'assistant',
        content: data.response || 'Lo siento, no pude procesar tu solicitud.'
      });
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      
      // Eliminar mensajes de "pensando"
      setMessages(prev => prev.filter(msg => !msg.thinking));
      
      // Añadir mensaje de error
      addMessage({
        role: 'assistant',
        content: error instanceof Error 
          ? `Lo siento, ha ocurrido un error: ${error.message}`
          : 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatbotContext.Provider
      value={{
        messages,
        isLoading,
        mode,
        currentConversationId,
        conversations,
        isLoadingConversations,
        addMessage,
        clearMessages,
        setMode,
        startNewConversation,
        loadConversation,
        deleteConversation,
        deleteAllConversations,
        loadConversations,
        sendMessage,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
} 
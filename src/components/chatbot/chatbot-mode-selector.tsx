'use client';

import { useChatbot } from './chatbot-context';

type ModeOption = {
  id: 'prospecting' | 'analysis' | 'management' | 'assistant';
  label: string;
  description: string;
};

const modes: ModeOption[] = [
  {
    id: 'prospecting',
    label: 'Búsqueda de Clientes',
    description: 'Encuentra empresas que puedan ser proveedores o clientes potenciales',
  },
  {
    id: 'analysis',
    label: 'Análisis de Conversaciones',
    description: 'Analiza la eficacia de las conversaciones de ventas con clientes',
  },
  {
    id: 'management',
    label: 'Gestión de Chats',
    description: 'Ayuda a gestionar las conversaciones con clientes de manera eficiente',
  },
  {
    id: 'assistant',
    label: 'Asistente Tricycle',
    description: 'Utiliza el asistente avanzado de TricycleCRM especializado en materiales reciclados',
  },
];

export default function ChatbotModeSelector() {
  const { 
    mode, 
    setMode, 
    clearMessages, 
    currentConversationId,
    startNewConversation 
  } = useChatbot();

  const handleModeChange = async (newMode: 'prospecting' | 'analysis' | 'management' | 'assistant') => {
    if (mode !== newMode) {
      // Si hay una conversación activa, preguntar al usuario si desea cambiar
      if (currentConversationId) {
        if (confirm('Cambiar el modo iniciará una nueva conversación. ¿Deseas continuar?')) {
          clearMessages();
          setMode(newMode);
          await startNewConversation(newMode);
        }
      } else {
        // Si no hay conversación activa, simplemente cambiar el modo
        setMode(newMode);
      }
    }
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-sm font-medium mb-2">Modo del Asistente</h2>
      <div className="flex flex-wrap gap-2">
        {modes.map((option) => (
          <button
            key={option.id}
            onClick={() => handleModeChange(option.id)}
            className={`px-3 py-1.5 rounded-md text-xs ${
              mode === option.id
                ? 'bg-white text-gray-800 font-medium'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            } transition-colors`}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
} 
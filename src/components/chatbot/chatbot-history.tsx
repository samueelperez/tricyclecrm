'use client';

import { useState } from 'react';
import { useChatbot } from './chatbot-context';
import { FiTrash, FiMessageCircle, FiRefreshCw, FiAlertCircle, FiTrash2 } from 'react-icons/fi';

export default function ChatbotHistory() {
  const { 
    conversations, 
    isLoadingConversations, 
    loadConversation, 
    deleteConversation,
    deleteAllConversations,
    loadConversations,
    currentConversationId,
    mode
  } = useChatbot();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadConversation = async (conversationId: string) => {
    try {
      setError(null);
      await loadConversation(conversationId);
    } catch (err) {
      setError('Error al cargar la conversación');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta conversación?')) {
      try {
        setIsDeleting(conversationId);
        setError(null);
        await deleteConversation(conversationId);
      } catch (err) {
        console.error('Error al eliminar conversación:', err);
        setError('Error al eliminar la conversación');
        setTimeout(() => setError(null), 3000);
      } finally {
        setIsDeleting(null);
      }
    }
  };
  
  const handleDeleteAllConversations = async () => {
    if (conversations.length === 0) {
      setError('No hay conversaciones para eliminar');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    if (confirm(`¿Estás seguro de que deseas eliminar TODAS las conversaciones (${conversations.length})? Esta acción no se puede deshacer.`)) {
      try {
        setIsDeletingAll(true);
        setError(null);
        await deleteAllConversations();
      } catch (err) {
        console.error('Error al eliminar todas las conversaciones:', err);
        setError('Error al eliminar todas las conversaciones');
        setTimeout(() => setError(null), 3000);
      } finally {
        setIsDeletingAll(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Si es hoy, mostrar solo la hora
    if (date.toDateString() === now.toDateString()) {
      return `Hoy, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Si es ayer, mostrar "Ayer" y la hora
    if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Si es en esta semana, mostrar el día de la semana
    const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7) {
      return date.toLocaleDateString('es-ES', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    }
    
    // Si es este año, mostrar día y mes
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    }
    
    // Para fechas más antiguas, mostrar día, mes y año
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'prospecting':
        return 'Búsqueda de Clientes';
      case 'analysis':
        return 'Análisis de Conversaciones';
      case 'management':
        return 'Gestión de Chats';
      case 'assistant':
        return 'Asistente';
      default:
        return 'Asistente';
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'prospecting':
        return 'bg-green-100 text-green-800';
      case 'analysis':
        return 'bg-purple-100 text-purple-800';
      case 'management':
        return 'bg-blue-100 text-blue-800';
      case 'assistant':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-lg">Historial de conversaciones</h3>
        <div className="flex items-center gap-2">
          {conversations.length > 0 && (
            <button 
              onClick={handleDeleteAllConversations} 
              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 flex items-center"
              title="Eliminar todas las conversaciones"
              disabled={isDeletingAll || isLoadingConversations}
            >
              {isDeletingAll ? (
                <div className="h-4 w-4 border-t-1 border-red-500 rounded-full animate-spin"></div>
              ) : (
                <FiTrash2 className="w-4 h-4" />
              )}
            </button>
          )}
          <button 
            onClick={() => loadConversations()} 
            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"
            title="Recargar conversaciones"
            disabled={isLoadingConversations}
          >
            <FiRefreshCw className={`w-4 h-4 ${isLoadingConversations ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-2 rounded-md mb-2 text-sm flex items-center">
          <FiAlertCircle className="w-4 h-4 mr-1" /> {error}
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="text-gray-500 text-sm py-4 flex flex-col items-center justify-center">
          {isLoadingConversations ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent mb-2"></div>
              <p>Cargando conversaciones...</p>
            </>
          ) : (
            <>
              <FiMessageCircle className="w-5 h-5 mb-2 text-gray-400" />
              <p>No hay conversaciones guardadas</p>
              <p className="text-xs mt-1">Tus conversaciones se guardarán automáticamente</p>
            </>
          )}
        </div>
      ) : (
        <ul className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
          {conversations.map((conversation) => (
            <li 
              key={conversation.id} 
              className={`p-3 rounded-md text-sm hover:bg-gray-50 transition-colors cursor-pointer border ${
                currentConversationId === conversation.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div 
                  className="flex-1 overflow-hidden" 
                  onClick={() => handleLoadConversation(conversation.id)}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <FiMessageCircle className="w-3 h-3 text-blue-600 flex-shrink-0" />
                    <span className="font-medium truncate">{conversation.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(conversation.updated_at)}</span>
                    <span className={`rounded-full px-2 py-0.5 ml-2 ${getModeColor(conversation.mode)}`}>
                      {getModeLabel(conversation.mode)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conversation.id);
                  }}
                  disabled={isDeleting === conversation.id}
                  className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-2"
                  title="Eliminar conversación"
                >
                  {isDeleting === conversation.id ? (
                    <div className="h-3 w-3 border-t-1 border-red-500 rounded-full animate-spin"></div>
                  ) : (
                    <FiTrash className="w-3 h-3" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 
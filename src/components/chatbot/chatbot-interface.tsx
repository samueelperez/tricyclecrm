'use client';

import { useState } from 'react';
import { useChatbot } from './chatbot-context';
import ChatbotMessageList from './chatbot-message-list';
import ChatbotInput from './chatbot-input';
import ChatbotModeSelector from './chatbot-mode-selector';
import ChatbotHistory from './chatbot-history';
import { FiPlus, FiMessageCircle, FiClock, FiArchive, FiChevronRight, FiChevronLeft, FiMenu } from 'react-icons/fi';

export default function ChatbotInterface() {
  const { mode, messages, isLoading, clearMessages, startNewConversation, conversations } = useChatbot();
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [showDesktopHistory, setShowDesktopHistory] = useState(true);

  const handleNewChat = async () => {
    clearMessages();
    await startNewConversation(mode);
  };

  return (
    <div className="grid grid-cols-4 gap-6 h-full">
      {/* Panel lateral (solo en pantallas medianas y grandes) */}
      {showDesktopHistory && (
        <div className="hidden md:block col-span-1">
          <div className="flex flex-col h-full gap-4">
            <button
              onClick={handleNewChat}
              className="flex items-center justify-center gap-2 bg-gray-800 text-white p-3 rounded-md hover:bg-gray-700 transition-colors w-full shadow-sm"
            >
              <FiPlus className="w-4 h-4" />
              <span className="font-medium">Nueva conversación</span>
            </button>
            
            <ChatbotHistory />
          </div>
        </div>
      )}

      {/* Interfaz principal del chatbot */}
      <div className={`col-span-4 ${showDesktopHistory ? 'md:col-span-3' : 'md:col-span-4'} flex flex-col bg-white rounded-lg shadow-lg overflow-hidden h-full border border-gray-100 transition-all`}>
        {/* Cabecera con selector de modo */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Botón para mostrar/ocultar el historial en escritorio */}
              <button
                onClick={() => setShowDesktopHistory(!showDesktopHistory)}
                className="hidden md:flex items-center justify-center p-2 rounded-md hover:bg-white hover:bg-opacity-10 transition-colors"
                title={showDesktopHistory ? "Ocultar historial" : "Mostrar historial"}
              >
                {showDesktopHistory ? <FiChevronLeft className="w-4 h-4" /> : <FiMenu className="w-4 h-4" />}
              </button>
              
              <div className="bg-white bg-opacity-20 p-2 rounded-md">
                <FiMessageCircle className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-lg">Asistente Empresarial</h2>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Botón de historial (solo en móviles) */}
              <button
                onClick={() => setShowMobileHistory(!showMobileHistory)}
                className="md:hidden flex items-center justify-center p-2 rounded-md hover:bg-white hover:bg-opacity-10 transition-colors relative"
                title="Ver historial de conversaciones"
              >
                <FiArchive className="w-4 h-4" />
                {conversations.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {conversations.length > 9 ? '9+' : conversations.length}
                  </span>
                )}
              </button>
              
              {/* Botón de nueva conversación (solo en móviles) */}
              <button
                onClick={handleNewChat}
                className="md:hidden flex items-center justify-center p-2 rounded-md hover:bg-white hover:bg-opacity-10 transition-colors"
                title="Nueva conversación"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="mt-4">
            <ChatbotModeSelector />
          </div>
        </div>
        
        {/* Panel de historial en móviles */}
        {showMobileHistory && (
          <div className="md:hidden p-4 border-b border-gray-200 bg-gray-50">
            <ChatbotHistory />
          </div>
        )}
        
        {/* Lista de mensajes */}
        <div className="flex-1 overflow-auto p-5 bg-gray-50">
          <ChatbotMessageList messages={messages} />
        </div>
        
        {/* Input del chatbot */}
        <div className="p-4 border-t border-gray-200 bg-white shadow-inner">
          <ChatbotInput isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
} 
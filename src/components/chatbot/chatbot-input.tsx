'use client';

import { useState, useRef, useEffect } from 'react';
import { FiSend, FiChevronDown, FiLoader } from 'react-icons/fi';
import { useChatbot } from './chatbot-context';
import TextareaAutosize from 'react-textarea-autosize';

interface ChatbotInputProps {
  isLoading: boolean;
}

export default function ChatbotInput({ isLoading }: ChatbotInputProps) {
  const { sendMessage } = useChatbot();
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading) return;
    
    sendMessage(message.trim());
    setMessage('');
    setRows(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Establecer foco en el input cuando se carga el componente
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-end rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-gray-700 focus-within:border-gray-700 transition-all">
        <TextareaAutosize
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
          className="flex-1 py-3 px-4 max-h-36 resize-none bg-transparent focus:outline-none text-gray-800"
          minRows={1}
          maxRows={5}
          disabled={isLoading}
        />
        
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className="p-3 h-12 flex items-center justify-center text-white bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 active:bg-gray-900 transition-colors"
        >
          {isLoading ? (
            <FiLoader className="w-5 h-5 animate-spin" />
          ) : (
            <FiSend className="w-5 h-5" />
          )}
        </button>
      </div>
      
      <div className="flex items-center justify-between mt-2 px-1 text-xs text-gray-500">
        <span className="flex items-center">
          <FiChevronDown className="w-3 h-3 mr-1" />
          <span>Presiona Enter para enviar, Shift+Enter para nueva línea</span>
        </span>
        <span>{message.length > 0 ? `${message.length} caracteres` : ''}</span>
      </div>
    </form>
  );
} 
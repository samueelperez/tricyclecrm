'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { BeatLoader } from 'react-spinners';
import { FiUser, FiCpu, FiInfo } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import Markdown from 'react-markdown';

const formatMessageTimestamp = (timestamp: number) => {
  try {
    return formatDistanceToNow(timestamp, { addSuffix: true, locale: es });
  } catch (error) {
    return '';
  }
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'user':
      return <FiUser className="w-4 h-4" />;
    case 'assistant':
      return <FiCpu className="w-4 h-4" />;
    case 'system':
      return <FiInfo className="w-4 h-4" />;
    default:
      return <FiInfo className="w-4 h-4" />;
  }
};

interface ChatbotMessageListProps {
  messages: Message[];
}

export default function ChatbotMessageList({ messages }: ChatbotMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length <= 1) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="bg-gray-100 p-3 rounded-full mb-4">
          <FiCpu className="w-6 h-6 text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Asistente Empresarial</h3>
        <p className="text-gray-500 max-w-md">
          Haz preguntas sobre tu negocio, analiza datos, o solicita ayuda con cualquier tarea relacionada con la gestión empresarial.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {messages.slice(1).map((message, i) => {
        const isUser = message.role === 'user';
        const isSystem = message.role === 'system';
        const timestamp = formatMessageTimestamp(message.timestamp || Date.now());

        return (
          <div 
            key={i} 
            className={cn(
              "group flex flex-col rounded-lg",
              isUser ? "items-end" : "items-start",
              isSystem && "opacity-80"
            )}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <div 
                className={cn(
                  "flex items-center justify-center p-1.5 rounded-md",
                  isUser ? "bg-gray-200 text-gray-700" : "bg-gray-800 text-white",
                  isSystem && "bg-amber-100 text-amber-800"
                )}
              >
                {getRoleIcon(message.role)}
              </div>
              <span className="text-xs font-medium text-gray-500">{timestamp}</span>
            </div>
            
            <div 
              className={cn(
                "max-w-[90%] rounded-lg px-4 py-3 shadow-sm border",
                isUser 
                  ? "bg-gray-100 border-gray-200 text-gray-800" 
                  : isSystem
                    ? "bg-amber-50 border-amber-100 text-amber-800"
                    : "bg-white border-gray-100 text-gray-800"
              )}
            >
              {message.thinking && !message.content && (
                <div className="py-2 px-3">
                  <BeatLoader size={8} color="#6B7280" />
                </div>
              )}
              
              {message.content && (
                <div className="prose prose-gray max-w-none text-sm">
                  <Markdown>{message.content}</Markdown>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
} 
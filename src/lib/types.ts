/**
 * Tipos y interfaces para el sistema de chatbot
 */

/**
 * Representa un mensaje en la conversación del chatbot
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  thinking?: boolean;
} 
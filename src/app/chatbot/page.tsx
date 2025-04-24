import { Suspense } from 'react';
import ChatbotInterface from '@/components/chatbot/chatbot-interface';
import { ChatbotProvider } from '@/components/chatbot/chatbot-context';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function ChatbotPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Asistente de TricycleCRM</h1>
      </div>
      
      <ChatbotProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <ChatbotInterface />
        </Suspense>
      </ChatbotProvider>
    </div>
  );
} 
-- Añadir columna thread_id a la tabla chatbot_conversations
ALTER TABLE IF EXISTS public.chatbot_conversations 
ADD COLUMN IF NOT EXISTS thread_id TEXT;

-- Crear índice para mejorar la búsqueda por thread_id
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_thread_id 
ON public.chatbot_conversations(thread_id);

-- Registrar la migración
INSERT INTO public.migrations (name, applied_at)
VALUES ('add_thread_id_to_chatbot_conversations', NOW())
ON CONFLICT (name) DO NOTHING; 
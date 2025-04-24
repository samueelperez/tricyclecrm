-- Crear tabla para almacenar las interacciones del chatbot
CREATE TABLE IF NOT EXISTS public.chatbot_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    mode TEXT NOT NULL, -- 'prospecting', 'analysis', 'management'
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    response TEXT,
    feedback TEXT -- Para recolectar feedback sobre la calidad de las respuestas
);

-- Crear políticas de seguridad para acceder a las interacciones del chatbot
ALTER TABLE public.chatbot_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios autenticados
CREATE POLICY "Usuarios pueden ver sus propias interacciones"
ON public.chatbot_interactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias interacciones"
ON public.chatbot_interactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar el feedback de sus interacciones"
ON public.chatbot_interactions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_chatbot_interactions_user_id ON public.chatbot_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_interactions_timestamp ON public.chatbot_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_chatbot_interactions_mode ON public.chatbot_interactions(mode);

-- Crear tabla para guardar conversaciones completas
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    mode TEXT NOT NULL -- 'prospecting', 'analysis', 'management'
);

-- Crear tabla para mensajes individuales en conversaciones
CREATE TABLE IF NOT EXISTS public.chatbot_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Crear políticas de seguridad para conversaciones
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios autenticados (conversaciones)
CREATE POLICY "Usuarios pueden ver sus propias conversaciones"
ON public.chatbot_conversations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias conversaciones"
ON public.chatbot_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias conversaciones"
ON public.chatbot_conversations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Políticas para usuarios autenticados (mensajes)
CREATE POLICY "Usuarios pueden ver mensajes de sus conversaciones"
ON public.chatbot_messages
FOR SELECT
USING (
    conversation_id IN (
        SELECT id FROM public.chatbot_conversations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Usuarios pueden insertar mensajes en sus conversaciones"
ON public.chatbot_messages
FOR INSERT
WITH CHECK (
    conversation_id IN (
        SELECT id FROM public.chatbot_conversations
        WHERE user_id = auth.uid()
    )
);

-- Índices para la tabla de mensajes
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_id ON public.chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_timestamp ON public.chatbot_messages(timestamp); 
-- Crear las tablas para el chatbot

-- Eliminar tablas si existen (para actualización limpia)
DROP TABLE IF EXISTS chatbot_messages;
DROP TABLE IF EXISTS chatbot_interactions;
DROP TABLE IF EXISTS chatbot_conversations;

-- Crear tabla para conversaciones
CREATE TABLE chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  mode TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para mejorar la consulta por usuario
CREATE INDEX idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);

-- Crear tabla para mensajes
CREATE TABLE chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para mejorar la consulta por conversación
CREATE INDEX idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);

-- Crear tabla para interacciones (análisis, seguimiento de uso)
CREATE TABLE chatbot_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  mode TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Crear índice para mejorar la consulta por usuario
CREATE INDEX idx_chatbot_interactions_user_id ON chatbot_interactions(user_id);

-- Configurar Row Level Security (RLS)
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para conversaciones
CREATE POLICY "Usuarios pueden ver sus propias conversaciones"
  ON chatbot_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias conversaciones"
  ON chatbot_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias conversaciones"
  ON chatbot_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias conversaciones"
  ON chatbot_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para mensajes
CREATE POLICY "Usuarios pueden ver mensajes de sus conversaciones"
  ON chatbot_messages
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chatbot_conversations c
    WHERE c.id = chatbot_messages.conversation_id
    AND c.user_id = auth.uid()
  ));

CREATE POLICY "Usuarios pueden insertar mensajes en sus conversaciones"
  ON chatbot_messages
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM chatbot_conversations c
    WHERE c.id = chatbot_messages.conversation_id
    AND c.user_id = auth.uid()
  ));

CREATE POLICY "Usuarios pueden eliminar mensajes de sus conversaciones"
  ON chatbot_messages
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM chatbot_conversations c
    WHERE c.id = chatbot_messages.conversation_id
    AND c.user_id = auth.uid()
  ));

-- Políticas RLS para interacciones
CREATE POLICY "Solo administradores pueden ver todas las interacciones"
  ON chatbot_interactions
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'admin@tricyclecrm.com'
    ) OR auth.uid() = user_id
  );

CREATE POLICY "Usuarios pueden insertar sus propias interacciones"
  ON chatbot_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger para actualizar automáticamente updated_at en conversaciones
CREATE OR REPLACE FUNCTION update_chatbot_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chatbot_conversation_updated_at
BEFORE UPDATE ON chatbot_conversations
FOR EACH ROW
EXECUTE FUNCTION update_chatbot_conversation_updated_at(); 
-- Crear vista para usuarios autenticados
DROP VIEW IF EXISTS auth_users_view;
CREATE VIEW auth_users_view AS
SELECT 
  id, 
  email,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users;

-- Eliminar tabla si existe (para actualización limpia)
DROP TABLE IF EXISTS usuario_secciones;

-- Crear tabla para gestionar visibilidad de secciones por usuario
CREATE TABLE usuario_secciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  seccion_id TEXT NOT NULL,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuario FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_usuario_secciones_user_id ON usuario_secciones(user_id);
CREATE INDEX idx_usuario_secciones_seccion_id ON usuario_secciones(seccion_id);

-- Configurar Row Level Security (RLS)
ALTER TABLE usuario_secciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Primero eliminar si existen
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias configuraciones" ON usuario_secciones;
DROP POLICY IF EXISTS "Solo admin puede insertar configuraciones" ON usuario_secciones;
DROP POLICY IF EXISTS "Solo admin puede actualizar configuraciones" ON usuario_secciones;
DROP POLICY IF EXISTS "Solo admin puede eliminar configuraciones" ON usuario_secciones;

-- Crear políticas RLS
CREATE POLICY "Usuarios pueden ver sus propias configuraciones"
  ON usuario_secciones
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Solo admin puede insertar configuraciones"
  ON usuario_secciones
  FOR INSERT
  WITH CHECK ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@tricyclecrm.com');

CREATE POLICY "Solo admin puede actualizar configuraciones"
  ON usuario_secciones
  FOR UPDATE
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@tricyclecrm.com');

CREATE POLICY "Solo admin puede eliminar configuraciones"
  ON usuario_secciones
  FOR DELETE
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@tricyclecrm.com');

-- Eliminar función y trigger si existen
DROP TRIGGER IF EXISTS set_updated_at ON usuario_secciones;
DROP FUNCTION IF EXISTS handle_updated_at();

-- Función para actualizar automáticamente updated_at
CREATE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON usuario_secciones
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at(); 
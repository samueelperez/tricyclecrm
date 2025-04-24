-- Crear la vista para acceder a los usuarios desde el cliente
CREATE OR REPLACE VIEW public.auth_users_view AS
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users;

-- Asegurar que solo los usuarios autenticados pueden acceder a la vista
ALTER VIEW public.auth_users_view OWNER TO authenticated;
GRANT SELECT ON public.auth_users_view TO authenticated;

-- Crear la tabla para almacenar las secciones visibles por usuario
CREATE TABLE IF NOT EXISTS public.usuario_secciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  secciones_visibles TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Configurar RLS para la tabla usuario_secciones
ALTER TABLE public.usuario_secciones ENABLE ROW LEVEL SECURITY;

-- Política para permitir a los administradores ver todas las configuraciones
CREATE POLICY "Administradores pueden ver todas las configuraciones" 
ON public.usuario_secciones FOR SELECT 
TO authenticated 
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@tricyclecrm.com'
);

-- Política para permitir a los usuarios ver su propia configuración
CREATE POLICY "Usuarios pueden ver su propia configuración" 
ON public.usuario_secciones FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Política para permitir a los administradores insertar configuraciones para cualquier usuario
CREATE POLICY "Administradores pueden insertar configuraciones" 
ON public.usuario_secciones FOR INSERT 
TO authenticated 
WITH CHECK (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@tricyclecrm.com'
);

-- Política para permitir a los administradores actualizar configuraciones para cualquier usuario
CREATE POLICY "Administradores pueden actualizar configuraciones" 
ON public.usuario_secciones FOR UPDATE 
TO authenticated 
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@tricyclecrm.com'
);

-- Política para permitir a los administradores eliminar configuraciones
CREATE POLICY "Administradores pueden eliminar configuraciones" 
ON public.usuario_secciones FOR DELETE 
TO authenticated 
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@tricyclecrm.com'
);

-- Crear función para actualizar el timestamp al actualizar registros
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar el timestamp automáticamente
CREATE TRIGGER update_usuario_secciones_updated_at
BEFORE UPDATE ON public.usuario_secciones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column(); 
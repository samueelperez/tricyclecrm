-- Crear tabla para almacenar la información del perfil de la empresa
DROP TABLE IF EXISTS public.company_profile CASCADE;

CREATE TABLE public.company_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    description TEXT NOT NULL,
    products_services TEXT NOT NULL,
    target_customers TEXT NOT NULL,
    competitors TEXT,
    unique_selling_points TEXT,
    regions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Crear políticas de seguridad para acceder al perfil de la empresa
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios pueden ver su perfil de empresa" ON public.company_profile;
DROP POLICY IF EXISTS "Usuarios pueden insertar su perfil de empresa" ON public.company_profile;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su perfil de empresa" ON public.company_profile;

-- Políticas para usuarios autenticados
CREATE POLICY "Usuarios pueden ver su perfil de empresa"
ON public.company_profile
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar su perfil de empresa"
ON public.company_profile
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su perfil de empresa"
ON public.company_profile
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Eliminar función y trigger existentes
DROP TRIGGER IF EXISTS update_company_profile_timestamp ON public.company_profile;
DROP FUNCTION IF EXISTS update_company_profile_modified_column();

-- Crear función para actualizar el timestamp updated_at
CREATE OR REPLACE FUNCTION update_company_profile_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar automáticamente updated_at
CREATE TRIGGER update_company_profile_timestamp
BEFORE UPDATE ON public.company_profile
FOR EACH ROW
EXECUTE FUNCTION update_company_profile_modified_column();

-- Eliminar y recrear función RPC para obtener datos de clientes del CRM
DROP FUNCTION IF EXISTS get_crm_insights();

CREATE OR REPLACE FUNCTION get_crm_insights()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Obtener información de clientes
  WITH customer_data AS (
    SELECT 
      COUNT(*) as customer_count,
      ARRAY_AGG(DISTINCT industry) FILTER (WHERE industry IS NOT NULL) as industries,
      ARRAY_AGG(DISTINCT region) FILTER (WHERE region IS NOT NULL) as regions
    FROM public.clientes
  ),
  -- Obtener información de negocios exitosos
  successful_deals AS (
    SELECT 
      AVG(valor_total) as avg_deal_value,
      COUNT(*) as successful_deals_count
    FROM public.negocios
    WHERE estado = 'completado' OR estado = 'cerrado'
  )
  -- Combinar la información
  SELECT 
    json_build_object(
      'customer_insights', (SELECT row_to_json(customer_data) FROM customer_data),
      'deal_insights', (SELECT row_to_json(successful_deals) FROM successful_deals)
    ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
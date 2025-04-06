-- Función segura para insertar materiales
CREATE OR REPLACE FUNCTION public.insertar_material(
  p_nombre text,
  p_descripcion text,
  p_precio_unitario numeric,
  p_unidad_medida text
)
RETURNS json AS $$
DECLARE
  v_material_id integer;
  v_result json;
BEGIN
  -- Insertar el material
  INSERT INTO public.materiales(
    nombre,
    descripcion,
    precio_unitario,
    unidad_medida,
    created_at,
    updated_at
  )
  VALUES (
    p_nombre,
    p_descripcion,
    p_precio_unitario,
    p_unidad_medida,
    now(),
    now()
  )
  RETURNING id INTO v_material_id;
  
  -- Preparar resultado
  SELECT json_build_object(
    'id', v_material_id,
    'nombre', p_nombre,
    'success', true
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
-- Función simple para insertar materiales (solo inserta en la tabla, sin caché de esquema)
CREATE OR REPLACE FUNCTION public.insertar_material_simple(
  nombre text,
  descripcion text,
  precio_unitario numeric,
  unidad_medida text
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.materiales(
    nombre,
    descripcion,
    precio_unitario,
    unidad_medida,
    created_at,
    updated_at
  )
  VALUES (
    nombre,
    descripcion,
    precio_unitario,
    unidad_medida,
    now(),
    now()
  );
END;
$$ LANGUAGE plpgsql; 
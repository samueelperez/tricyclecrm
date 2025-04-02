-- Migración para crear las tablas del módulo de Organización
-- Fecha: 2025-04-01

-- Tabla para columnas del tablero
CREATE TABLE IF NOT EXISTS columnas_tablero (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL,
  descripcion TEXT,
  color TEXT DEFAULT '#f3f4f6',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar columnas por defecto
INSERT INTO columnas_tablero (nombre, orden, descripcion, color, icon)
VALUES 
  ('Por hacer', 1, 'Tareas pendientes que aún no se han iniciado', '#f3f4f6', 'clipboard'),
  ('En progreso', 2, 'Tareas que están siendo trabajadas actualmente', '#dbeafe', 'trending-up'),
  ('Revisión', 3, 'Tareas completadas que requieren revisión', '#fef9c3', 'check-circle'),
  ('Completadas', 4, 'Tareas finalizadas y aprobadas', '#dcfce7', 'check-square');

-- Tabla para categorías
CREATE TABLE IF NOT EXISTS categorias_tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar categorías de ejemplo
INSERT INTO categorias_tareas (nombre, color, descripcion)
VALUES 
  ('Desarrollo', '#3b82f6', 'Tareas relacionadas con programación y desarrollo'),
  ('Diseño', '#ec4899', 'Tareas de diseño gráfico e interfaces'),
  ('Marketing', '#f97316', 'Tareas relacionadas con marketing y ventas'),
  ('Administración', '#14b8a6', 'Tareas administrativas y de gestión');

-- Tabla para etiquetas
CREATE TABLE IF NOT EXISTS etiquetas_tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#a855f7',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar etiquetas comunes
INSERT INTO etiquetas_tareas (nombre, color)
VALUES 
  ('Urgente', '#ef4444'),
  ('Bug', '#f97316'),
  ('Mejora', '#3b82f6'),
  ('Documentación', '#8b5cf6'),
  ('Cliente', '#10b981');

-- Tabla principal de tareas
CREATE TABLE IF NOT EXISTS tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  columna_id UUID NOT NULL,
  categoria_id UUID,
  prioridad TEXT NOT NULL DEFAULT 'media',
  fecha_limite TIMESTAMPTZ,
  fecha_inicio TIMESTAMPTZ,
  asignado_a UUID,
  completado BOOLEAN DEFAULT false,
  porcentaje_completado INTEGER DEFAULT 0,
  estimacion_horas NUMERIC(5,2),
  horas_trabajadas NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_columna
    FOREIGN KEY (columna_id)
    REFERENCES columnas_tablero(id)
    ON DELETE CASCADE,
    
  CONSTRAINT fk_categoria
    FOREIGN KEY (categoria_id)
    REFERENCES categorias_tareas(id)
    ON DELETE SET NULL,
    
  CONSTRAINT check_prioridad
    CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente'))
);

-- Tabla para etiquetas de tareas
CREATE TABLE IF NOT EXISTS tareas_etiquetas (
  tarea_id UUID NOT NULL,
  etiqueta_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  PRIMARY KEY (tarea_id, etiqueta_id),
  
  CONSTRAINT fk_tarea
    FOREIGN KEY (tarea_id)
    REFERENCES tareas(id)
    ON DELETE CASCADE,
    
  CONSTRAINT fk_etiqueta
    FOREIGN KEY (etiqueta_id)
    REFERENCES etiquetas_tareas(id)
    ON DELETE CASCADE
);

-- Tabla para comentarios
CREATE TABLE IF NOT EXISTS comentarios_tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL,
  usuario_id UUID NOT NULL,
  contenido TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_tarea
    FOREIGN KEY (tarea_id)
    REFERENCES tareas(id)
    ON DELETE CASCADE
);

-- Tabla para archivos
CREATE TABLE IF NOT EXISTS archivos_tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  ruta TEXT NOT NULL,
  tipo TEXT,
  tamano INTEGER,
  usuario_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_tarea
    FOREIGN KEY (tarea_id)
    REFERENCES tareas(id)
    ON DELETE CASCADE
);

-- Tabla para historial
CREATE TABLE IF NOT EXISTS historial_tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL,
  usuario_id UUID,
  tipo_cambio TEXT NOT NULL,
  valor_anterior JSONB,
  valor_nuevo JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_tarea
    FOREIGN KEY (tarea_id)
    REFERENCES tareas(id)
    ON DELETE CASCADE
);

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers
CREATE TRIGGER update_tareas_updated_at
BEFORE UPDATE ON tareas
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_categorias_tareas_updated_at
BEFORE UPDATE ON categorias_tareas
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_etiquetas_tareas_updated_at
BEFORE UPDATE ON etiquetas_tareas
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_columnas_tablero_updated_at
BEFORE UPDATE ON columnas_tablero
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_comentarios_tareas_updated_at
BEFORE UPDATE ON comentarios_tareas
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Crear permisos RLS para acceso público (se debe ajustar según las necesidades de seguridad)
ALTER TABLE columnas_tablero ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE etiquetas_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas_etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE archivos_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_tareas ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON columnas_tablero FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON categorias_tareas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON etiquetas_tareas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON tareas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON tareas_etiquetas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON comentarios_tareas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON archivos_tareas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON historial_tareas FOR SELECT TO authenticated USING (true);

-- Política para permitir escritura a usuarios autenticados
CREATE POLICY "Permitir escritura a usuarios autenticados" 
ON columnas_tablero FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir escritura a usuarios autenticados" 
ON categorias_tareas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir escritura a usuarios autenticados" 
ON etiquetas_tareas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir escritura a usuarios autenticados" 
ON tareas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir escritura a usuarios autenticados" 
ON tareas_etiquetas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir escritura a usuarios autenticados" 
ON comentarios_tareas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir escritura a usuarios autenticados" 
ON archivos_tareas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir escritura a usuarios autenticados" 
ON historial_tareas FOR INSERT TO authenticated WITH CHECK (true);

-- Política para permitir actualización a usuarios autenticados
CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON columnas_tablero FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON categorias_tareas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON etiquetas_tareas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON tareas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON tareas_etiquetas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON comentarios_tareas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON archivos_tareas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON historial_tareas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Política para permitir eliminación a usuarios autenticados
CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON columnas_tablero FOR DELETE TO authenticated USING (true);

CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON categorias_tareas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON etiquetas_tareas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON tareas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON tareas_etiquetas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON comentarios_tareas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON archivos_tareas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON historial_tareas FOR DELETE TO authenticated USING (true); 
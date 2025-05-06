CREATE TABLE IF NOT EXISTS facturas_logistica (
  id SERIAL PRIMARY KEY,
  fecha TIMESTAMP NOT NULL DEFAULT NOW(),
  proveedor_id INTEGER REFERENCES proveedores(id),
  numero_factura TEXT NOT NULL,
  descripcion TEXT,
  importe DECIMAL(12,2) NOT NULL DEFAULT 0,
  estado TEXT DEFAULT 'pendiente',
  nombre_archivo TEXT
); 
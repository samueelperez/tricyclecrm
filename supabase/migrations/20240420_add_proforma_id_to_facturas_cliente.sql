-- Añade la columna proforma_id a la tabla facturas_cliente si no existe
ALTER TABLE facturas_cliente 
ADD COLUMN IF NOT EXISTS proforma_id INTEGER REFERENCES proformas(id);

-- No ejecutamos la actualización automática de registros existentes porque las columnas no coinciden
-- Para actualizar manualmente, los administradores deberán usar la interfaz de Supabase
-- o ejecutar una consulta SQL personalizada
COMMENT ON COLUMN facturas_cliente.proforma_id IS 'ID de la proforma asociada a esta factura'; 
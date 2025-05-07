-- Crear tabla para cuentas bancarias
CREATE TABLE IF NOT EXISTS cuentas_bancarias (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,          -- Nombre descriptivo para la cuenta (ej: "BBVA USD ACCOUNT")
  banco TEXT NOT NULL,           -- Nombre del banco
  iban TEXT NOT NULL,            -- IBAN de la cuenta
  swift TEXT NOT NULL,           -- Código SWIFT/BIC
  moneda TEXT NOT NULL,          -- Moneda de la cuenta (USD, EUR, etc.)
  beneficiario TEXT NOT NULL,    -- Nombre del beneficiario
  descripcion TEXT NOT NULL,     -- Descripción completa usada como identificador en selects
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos iniciales (cuentas bancarias existentes)
INSERT INTO cuentas_bancarias (nombre, banco, iban, swift, moneda, beneficiario, descripcion)
VALUES 
  (
    'BBVA USD', 
    'BBVA', 
    'ESXX0182XXXXXXXXXXXX0000', 
    'BBVAESMM', 
    'USD', 
    'Tricycle Import Export SL', 
    'BBVA - ESXX0182XXXXXXXXXXXX0000 - USD'
  ),
  (
    'BBVA EUR', 
    'BBVA', 
    'ESXX0182XXXXXXXXXXXX0001', 
    'BBVAESMM', 
    'EUR', 
    'Tricycle Import Export SL', 
    'BBVA - ESXX0182XXXXXXXXXXXX0001 - EUR'
  ),
  (
    'Santander USD', 
    'Santander S.A.', 
    'ES6000495332142610008899', 
    'BSCHESMM', 
    'USD', 
    'Tricycle Import Export SL', 
    'Santander S.A. - ES6000495332142610008899 - USD'
  ),
  (
    'Santander EUR', 
    'Santander S.A.', 
    'ESXX0049XXXXXXXXXXXX0002', 
    'BSCHESMM', 
    'EUR', 
    'Tricycle Import Export SL', 
    'Santander S.A. - ESXX0049XXXXXXXXXXXX0002 - EUR'
  )
ON CONFLICT (id) DO NOTHING;

-- Índice para búsquedas rápidas por nombre y descripción
CREATE INDEX IF NOT EXISTS idx_cuentas_bancarias_nombre ON cuentas_bancarias (nombre);
CREATE INDEX IF NOT EXISTS idx_cuentas_bancarias_descripcion ON cuentas_bancarias (descripcion); 
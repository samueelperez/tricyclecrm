// Script para comprobar las proformas en la base de datos
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validar configuración
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌ Error: Las credenciales de Supabase no están configuradas.\n');
  console.error('Por favor, asegúrate de que tu archivo .env contiene:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio');
  process.exit(1);
}

// Crear cliente Supabase con clave de servicio
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkProformas() {
  try {
    console.log('📊 Consultando proformas en la base de datos...\n');
    
    // Consultar proformas
    const { data: proformas, error } = await supabase
      .from('proformas')
      .select('*')
      .order('fecha', { ascending: false });
    
    if (error) {
      throw new Error(`Error consultando proformas: ${error.message}`);
    }
    
    if (!proformas || proformas.length === 0) {
      console.log('❌ No se encontraron proformas en la base de datos.\n');
      return;
    }
    
    console.log(`✅ Se encontraron ${proformas.length} proformas:\n`);
    
    // Imprimir cada proforma en formato legible
    proformas.forEach((proforma, index) => {
      console.log(`Proforma ${index + 1}:`);
      console.log(`  ID: ${proforma.id}`);
      console.log(`  ID Externo: ${proforma.id_externo || 'No definido'}`);
      console.log(`  Número: ${proforma.numero || 'No definido'}`);
      console.log(`  Fecha: ${proforma.fecha || 'No definida'}`);
      console.log(`  Monto Total: ${proforma.monto_total !== undefined ? proforma.monto_total : (proforma.monto || 'No definido')}`);
      console.log(`  Puerto: ${proforma.puerto || 'No definido'}`);
      console.log(`  Origen: ${proforma.origen || 'No definido'}`);
      console.log(`  Negocio ID: ${proforma.negocio_id || 'No definido'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar la función principal
checkProformas();

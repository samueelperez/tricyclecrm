// Script para asociar una proforma a un negocio
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

// Obtener los IDs de los argumentos
const proformaId = process.argv[2];
const negocioId = process.argv[3];

if (!proformaId || !negocioId) {
  console.error('\n❌ Error: Debes proporcionar el ID de la proforma y el ID del negocio como argumentos.\n');
  console.error('Uso: node update-proforma.js [ID_PROFORMA] [ID_NEGOCIO]');
  process.exit(1);
}

// Crear cliente Supabase con clave de servicio
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateProforma(proformaId, negocioId) {
  try {
    console.log(`\n🔄 Asociando proforma ID: ${proformaId} al negocio ID: ${negocioId}...\n`);
    
    // Verificar que la proforma existe
    const { data: proforma, error: proformaError } = await supabase
      .from('proformas')
      .select('*')
      .eq('id', proformaId)
      .single();
    
    if (proformaError) {
      throw new Error(`Error consultando proforma: ${proformaError.message}`);
    }
    
    if (!proforma) {
      throw new Error(`No se encontró una proforma con ID: ${proformaId}`);
    }
    
    // Verificar que el negocio existe
    const { data: negocio, error: negocioError } = await supabase
      .from('negocios')
      .select('id, id_externo, cliente_nombre')
      .eq('id', negocioId)
      .single();
    
    if (negocioError) {
      throw new Error(`Error consultando negocio: ${negocioError.message}`);
    }
    
    if (!negocio) {
      throw new Error(`No se encontró un negocio con ID: ${negocioId}`);
    }
    
    console.log(`Proforma: ${proforma.id_externo || proforma.numero || `ID: ${proforma.id}`}`);
    console.log(`Negocio: ${negocio.id_externo} (${negocio.cliente_nombre})\n`);
    
    // Actualizar la proforma para asociarla al negocio
    const { data: updatedProforma, error: updateError } = await supabase
      .from('proformas')
      .update({ negocio_id: negocioId })
      .eq('id', proformaId)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Error actualizando proforma: ${updateError.message}`);
    }
    
    console.log('✅ Proforma actualizada correctamente:');
    console.log(`  ID: ${updatedProforma.id}`);
    console.log(`  ID Externo: ${updatedProforma.id_externo || 'No definido'}`);
    console.log(`  Número: ${updatedProforma.numero || 'No definido'}`);
    console.log(`  Negocio ID: ${updatedProforma.negocio_id}`);
    console.log();
    
    console.log('Para verificar todas las proformas asociadas al negocio, ejecuta:');
    console.log(`node check-negocio-proformas.js ${negocioId}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar la función principal
updateProforma(proformaId, negocioId); 
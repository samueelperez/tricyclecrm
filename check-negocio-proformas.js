// Script para comprobar las proformas asociadas a un negocio específico
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

// Función para listar todos los negocios disponibles
async function listNegocios() {
  try {
    console.log('\n📋 Listando todos los negocios disponibles...\n');
    
    // Consultar todos los negocios
    const { data: negocios, error: negociosError } = await supabase
      .from('negocios')
      .select('id, id_externo, cliente_nombre')
      .order('id');
      
    if (negociosError) {
      throw new Error(`Error consultando negocios: ${negociosError.message}`);
    }
    
    if (!negocios || negocios.length === 0) {
      console.log('❌ No se encontraron negocios en la base de datos.\n');
      return;
    }
    
    console.log(`✅ Se encontraron ${negocios.length} negocios:\n`);
    
    // Imprimir cada negocio
    negocios.forEach(negocio => {
      console.log(`Negocio ID: ${negocio.id}`);
      console.log(`  ID Externo: ${negocio.id_externo || 'No definido'}`);
      console.log(`  Cliente: ${negocio.cliente_nombre || 'No definido'}`);
      console.log(`  Para ver las proformas asociadas: node check-negocio-proformas.js ${negocio.id}`);
      console.log('');
    });
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Función principal
async function main() {
  // Obtener el ID del negocio de los argumentos
  const negocioId = process.argv[2];
  if (!negocioId) {
    // Si no se proporciona un ID, listar todos los negocios
    await listNegocios();
    return;
  }
  
  // Si se proporciona un ID, consultar las proformas asociadas
  await checkNegocioProformas(negocioId);
}

async function checkNegocioProformas(negocioId) {
  try {
    console.log(`\n📊 Consultando proformas para el negocio ID: ${negocioId}...\n`);
    
    // Consultar negocio para verificar que existe
    const { data: negocio, error: negocioError } = await supabase
      .from('negocios')
      .select('id, id_externo, cliente_nombre')
      .eq('id', negocioId)
      .single();
    
    if (negocioError) {
      throw new Error(`Error consultando negocio: ${negocioError.message}`);
    }
    
    if (!negocio) {
      console.log(`❌ No se encontró un negocio con ID: ${negocioId}\n`);
      
      // Listar negocios disponibles
      const { data: negocios, error: negociosError } = await supabase
        .from('negocios')
        .select('id, id_externo, cliente_nombre')
        .order('id');
        
      if (negociosError) {
        throw new Error(`Error consultando negocios: ${negociosError.message}`);
      }
      
      if (negocios && negocios.length > 0) {
        console.log('Negocios disponibles:');
        negocios.forEach(n => {
          console.log(`  ID: ${n.id} - ${n.id_externo} (${n.cliente_nombre})`);
        });
      }
      
      return;
    }
    
    console.log(`Negocio encontrado: ${negocio.id_externo} (${negocio.cliente_nombre})\n`);
    
    // Consultar proformas asociadas al negocio
    const { data: proformas, error: proformasError } = await supabase
      .from('proformas')
      .select('*')
      .eq('negocio_id', negocioId)
      .order('fecha', { ascending: false });
    
    if (proformasError) {
      throw new Error(`Error consultando proformas: ${proformasError.message}`);
    }
    
    if (!proformas || proformas.length === 0) {
      console.log(`❌ No se encontraron proformas asociadas al negocio ID: ${negocioId}`);
      
      // Verificar si hay proformas sin asociar
      const { data: proformasSinAsociar, error: errorSinAsociar } = await supabase
        .from('proformas')
        .select('id, id_externo, numero, fecha, monto_total, negocio_id')
        .is('negocio_id', null)
        .order('fecha', { ascending: false });
        
      if (!errorSinAsociar && proformasSinAsociar && proformasSinAsociar.length > 0) {
        console.log('\nProformas sin asociar a un negocio:');
        proformasSinAsociar.forEach(p => {
          console.log(`  ID: ${p.id} - ${p.id_externo || p.numero || 'Sin ID'} (${p.fecha})`);
        });
        
        // Asociar una proforma al negocio si se confirma
        const proformaParaAsociar = proformasSinAsociar[0]; // Primera proforma sin asociar
        console.log(`\n¿Quieres asociar la proforma ID ${proformaParaAsociar.id} al negocio ID ${negocioId}? (Ejecuta el siguiente comando para hacerlo):`);
        console.log(`node update-proforma.js ${proformaParaAsociar.id} ${negocioId}`);
      }
      
      return;
    }
    
    console.log(`✅ Se encontraron ${proformas.length} proformas asociadas al negocio:\n`);
    
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
      console.log('');
    });
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar la función principal
main().catch(error => {
  console.error(`❌ Error general: ${error.message}`);
  process.exit(1);
}); 
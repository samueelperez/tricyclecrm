// Script para crear un negocio de prueba en la base de datos
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

async function createNegocio() {
  try {
    console.log('\n🏢 Creando un negocio de prueba...\n');
    
    // Datos para el nuevo negocio
    const nuevoNegocio = {
      id_externo: `NEG-${Date.now().toString().slice(-6)}`,
      cliente_nombre: 'Cliente de Prueba',
      fecha_creacion: new Date().toISOString().split('T')[0],
      estado: 'En Curso',
      progreso: 50,
      total_ingresos: 100000,
      total_gastos: 70000,
      notas: 'Este es un negocio de prueba creado para asociar proformas.'
    };
    
    // Insertar el nuevo negocio
    const { data: negocioCreado, error: errorCreacion } = await supabase
      .from('negocios')
      .insert([nuevoNegocio])
      .select()
      .single();
    
    if (errorCreacion) {
      throw new Error(`Error al crear negocio: ${errorCreacion.message}`);
    }
    
    console.log('✅ Negocio creado correctamente:');
    console.log(`  ID: ${negocioCreado.id}`);
    console.log(`  ID Externo: ${negocioCreado.id_externo}`);
    console.log(`  Cliente: ${negocioCreado.cliente_nombre}`);
    console.log('');
    
    console.log('Para asociar una proforma a este negocio, ejecuta:');
    console.log(`node update-proforma.js [ID_PROFORMA] ${negocioCreado.id}`);
    
    console.log('\nPara verificar las proformas asociadas, ejecuta:');
    console.log(`node check-negocio-proformas.js ${negocioCreado.id}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar la función principal
createNegocio().catch(error => {
  console.error(`❌ Error general: ${error.message}`);
  process.exit(1);
}); 
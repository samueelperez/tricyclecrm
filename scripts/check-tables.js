#!/usr/bin/env node

/**
 * Script para verificar las tablas existentes en la base de datos
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar credenciales
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(`Error: Las credenciales de Supabase no están configuradas.`);
  console.error('Por favor, asegúrate de que tu archivo .env contiene:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio');
  process.exit(1);
}

// Crear cliente de Supabase con clave de servicio
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});

async function listTables() {
  try {
    // Consulta SQL básica para obtener tablas
    const { data, error } = await supabase.rpc('get_tables');
    
    if (error) {
      console.error(`Error al obtener tablas: ${error.message}`);
      
      // Si fallamos con RPC, intentemos usar la REST API para ver qué tablas podemos consultar
      console.log('Intentando método alternativo...');
      await checkTablesDirectly();
      return;
    }
    
    console.log('Tablas encontradas:');
    data.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
  } catch (error) {
    console.error(`Error inesperado: ${error.message}`);
    console.log('Intentando método alternativo...');
    await checkTablesDirectly();
  }
}

async function checkTablesDirectly() {
  // Lista de posibles tablas para verificar
  const tablesToCheck = [
    'clientes', 'proveedores', 'negocios', 'productos', 'facturas_cliente',
    'facturas_proveedor', 'albaranes', 'proformas', 'recibos', 'migrations'
  ];
  
  console.log('Verificando tablas conocidas:');
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`✅ Tabla '${table}' existe`);
      } else {
        console.log(`❌ Tabla '${table}' no existe o no es accesible: ${error.message}`);
      }
    } catch (error) {
      console.log(`❌ Error al verificar tabla '${table}': ${error.message}`);
    }
  }
}

// Ejecutar la función
console.log('🔍 Verificando las tablas de la base de datos...');
listTables().catch(error => {
  console.error(`Error fatal: ${error.message}`);
  process.exit(1); 
}); 
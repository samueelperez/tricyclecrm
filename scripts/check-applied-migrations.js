#!/usr/bin/env node

/**
 * Script para verificar las migraciones aplicadas
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { format } = require('date-fns');

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

async function checkAppliedMigrations() {
  try {
    // Obtener las migraciones aplicadas
    const { data, error } = await supabase
      .from('migrations')
      .select('*')
      .order('applied_at', { ascending: false });
    
    if (error) {
      console.error(`Error al obtener migraciones: ${error.message}`);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('No se han aplicado migraciones.');
      return;
    }
    
    console.log('Migraciones aplicadas:');
    console.log('=====================');
    
    data.forEach(migration => {
      const appliedAt = new Date(migration.applied_at);
      const formattedDate = format(appliedAt, 'dd/MM/yyyy HH:mm:ss');
      console.log(`- ${migration.name} (aplicada el ${formattedDate})`);
    });
  } catch (error) {
    console.error(`Error inesperado: ${error.message}`);
  }
}

// Ejecutar la función
console.log('🔍 Verificando migraciones aplicadas...');
checkAppliedMigrations().catch(error => {
  console.error(`Error fatal: ${error.message}`);
  process.exit(1);
}); 
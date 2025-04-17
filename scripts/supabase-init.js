#!/usr/bin/env node

/**
 * Script para inicializar Supabase de forma segura sin depender de funciones SQL o schemas especiales.
 * Este script utiliza métodos estándar de la API de Supabase.
 * 
 * Uso:
 * node scripts/supabase-init.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Crear cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Verifica si una tabla existe en la base de datos
 */
async function checkTableExists(tableName) {
  console.log(`Verificando si existe la tabla ${tableName}...`);
  
  try {
    // Intenta hacer una consulta básica a la tabla
    // Si la tabla no existe, devolverá un error específico
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    if (error) {
      // Si el error es que la tabla no existe, devolvemos false
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log(`La tabla ${tableName} no existe.`);
        return false;
      }
      
      // Cualquier otro error, lo registramos y asumimos que la tabla existe
      console.warn(`Error al verificar tabla ${tableName}:`, error);
      // Asumimos que existe para evitar problemas si es otro tipo de error
      return true;
    }
    
    console.log(`La tabla ${tableName} existe.`);
    return true;
  } catch (error) {
    console.error(`Error inesperado al verificar tabla ${tableName}:`, error);
    // En caso de error inesperado, asumimos que no existe
    return false;
  }
}

/**
 * Verifica si una columna existe en una tabla
 */
async function checkColumnExists(tableName, columnName) {
  console.log(`Verificando si existe la columna ${columnName} en tabla ${tableName}...`);
  
  try {
    // Intentamos hacer una consulta que incluya la columna específica
    // Si la columna no existe, devolverá un error específico
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);
    
    if (error) {
      // Si el error es que la columna no existe, devolvemos false
      if (error.code === '42703' || error.message.includes(`column "${tableName}.${columnName}" does not exist`) || error.message.includes(`column ${tableName}.${columnName} does not exist`)) {
        console.log(`La columna ${columnName} no existe en tabla ${tableName}.`);
        return false;
      }
      
      // Cualquier otro error, lo registramos y asumimos que la columna existe
      console.warn(`Error al verificar columna ${columnName}:`, error);
      // Asumimos que existe para evitar problemas si es otro tipo de error
      return true;
    }
    
    console.log(`La columna ${columnName} existe en tabla ${tableName}.`);
    return true;
  } catch (error) {
    console.error(`Error inesperado al verificar columna ${columnName}:`, error);
    // En caso de error inesperado, asumimos que no existe
    return false;
  }
}

/**
 * Ejecuta una migración específica para proformas_productos
 */
async function migrateProformasProductos() {
  console.log('Aplicando migración para proformas_productos...');
  
  try {
    // Verificar si la tabla existe
    const tableExists = await checkTableExists('proformas_productos');
    
    if (!tableExists) {
      console.log('La tabla proformas_productos no existe. Nada que migrar.');
      return true;
    }
    
    // Verificar si la columna ya existe
    const columnExists = await checkColumnExists('proformas_productos', 'proveedor_id');
    
    if (columnExists) {
      console.log('La columna proveedor_id ya existe. Nada que migrar.');
      return true;
    } else {
      // No podemos añadir la columna directamente sin las funciones SQL,
      // así que mostramos instrucciones al usuario
      console.log('\n⚠️ ACCIÓN MANUAL REQUERIDA ⚠️');
      console.log('------------------------------');
      console.log('Se necesita añadir la columna proveedor_id a proformas_productos.');
      console.log('Por favor, ejecuta la siguiente consulta en la consola SQL de Supabase:');
      console.log('\nALTER TABLE public.proformas_productos ADD COLUMN proveedor_id INTEGER;\n');
      console.log('------------------------------');
      
      return false;
    }
  } catch (error) {
    console.error('Error inesperado en migración de proformas_productos:', error);
    return false;
  }
}

/**
 * Ejecuta una migración específica para facturas_cliente
 */
async function migrateFacturasCliente() {
  console.log('Aplicando migración para facturas_cliente...');
  
  try {
    // Verificar si la tabla existe
    const tableExists = await checkTableExists('facturas_cliente');
    
    if (!tableExists) {
      console.log('La tabla facturas_cliente no existe. Nada que migrar.');
      return true;
    }
    
    // Verificar si la columna ya existe
    const columnExists = await checkColumnExists('facturas_cliente', 'cliente_id');
    
    if (columnExists) {
      console.log('La columna cliente_id ya existe. Nada que migrar.');
      return true;
    } else {
      // No podemos añadir la columna directamente sin las funciones SQL,
      // así que mostramos instrucciones al usuario
      console.log('\n⚠️ ACCIÓN MANUAL REQUERIDA ⚠️');
      console.log('------------------------------');
      console.log('Se necesita añadir la columna cliente_id a facturas_cliente.');
      console.log('Por favor, ejecuta la siguiente consulta en la consola SQL de Supabase:');
      console.log('\nALTER TABLE public.facturas_cliente ADD COLUMN cliente_id INTEGER REFERENCES public.clientes(id);\n');
      console.log('------------------------------');
      
      return false;
    }
  } catch (error) {
    console.error('Error inesperado en migración de facturas_cliente:', error);
    return false;
  }
}

/**
 * Aplica todas las migraciones de forma segura
 */
async function applyMigrations() {
  console.log('🔄 Iniciando migraciones...');
  
  // Lista de migraciones a aplicar
  const migrations = [
    { name: 'proformas_productos', function: migrateProformasProductos },
    { name: 'facturas_cliente', function: migrateFacturasCliente }
  ];
  
  // Aplicar cada migración
  let allSuccessful = true;
  for (const migration of migrations) {
    console.log(`\n📦 Aplicando migración: ${migration.name}`);
    try {
      const success = await migration.function();
      
      if (success) {
        console.log(`✅ Migración ${migration.name} completada correctamente`);
      } else {
        console.warn(`⚠️ Migración ${migration.name} requiere intervención manual`);
        allSuccessful = false;
      }
    } catch (error) {
      console.error(`❌ Error en migración ${migration.name}:`, error);
      allSuccessful = false;
    }
  }
  
  // Resumen final
  console.log('\n🔍 Resumen de migraciones:');
  if (allSuccessful) {
    console.log('✅ Todas las migraciones se han aplicado correctamente o no eran necesarias.');
  } else {
    console.log('⚠️ Algunas migraciones requieren intervención manual. Ver detalles arriba.');
  }
  
  return allSuccessful;
}

// Ejecutar migraciones
applyMigrations()
  .then((success) => {
    if (success) {
      console.log('✅ Proceso completado con éxito.');
    } else {
      console.log('⚠️ Proceso completado con advertencias.');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en el proceso principal:', error);
    process.exit(1);
  }); 
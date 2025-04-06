#!/usr/bin/env node

/**
 * Script para verificar la coherencia entre la base de datos y la estructura del proyecto
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar credenciales
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(`${colors.red}Error: Las credenciales de Supabase no están configuradas.${colors.reset}`);
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

// Directorios a verificar
const APP_DIR = path.join(__dirname, '..', 'src', 'app');
const COMPONENTS_DIR = path.join(__dirname, '..', 'src', 'components');

/**
 * Obtiene las tablas de la base de datos
 */
async function getTables() {
  try {
    const { data, error } = await supabase.rpc('get_tables');
    
    if (error) {
      console.error(`${colors.red}❌ Error al obtener tablas: ${error.message}${colors.reset}`);
      return [];
    }
    
    return data.map(row => row.table_name);
  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return [];
  }
}

/**
 * Verifica si una entidad tiene su correspondiente sección en la aplicación
 */
function hasEntitySection(entity, appDirs) {
  // Nombres de entidades comunes que deberían tener una sección en la aplicación
  const entityMapping = {
    'clientes': ['clientes', 'clients', 'customers'],
    'proveedores': ['proveedores', 'providers', 'suppliers'],
    'negocios': ['negocios', 'business', 'deals', 'opportunities'],
    'facturas_cliente': ['facturas', 'invoices', 'facturas-cliente'],
    'facturas_proveedor': ['facturas-proveedor', 'compras', 'purchases', 'supplier-invoices'],
    'proformas': ['proformas', 'quotes', 'presupuestos'],
    'albaranes': ['albaranes', 'delivery-notes'],
    'materiales': ['materiales', 'materials', 'productos', 'products'],
    'recibos': ['recibos', 'receipts', 'pagos', 'payments', 'cobros']
  };
  
  // Si la entidad no está en nuestro mapeo, la saltamos
  if (!entityMapping[entity]) {
    return null; // Null indica que no es una entidad principal que necesite su propia sección
  }
  
  // Buscar alguna variante del nombre de la entidad en los directorios
  for (const dirName of appDirs) {
    if (entityMapping[entity].some(variant => dirName.toLowerCase() === variant)) {
      return { exists: true, dirName };
    }
  }
  
  return { exists: false, expectedNames: entityMapping[entity] };
}

/**
 * Verifica si existen componentes para una entidad
 */
function hasEntityComponents(entity, allFiles) {
  // Nombres de componentes comunes para entidades
  const componentPatterns = [
    new RegExp(`${entity}-list`, 'i'),
    new RegExp(`${entity}-form`, 'i'),
    new RegExp(`${entity}-card`, 'i'),
    new RegExp(`${entity}-detail`, 'i')
  ];
  
  const matchingComponents = [];
  
  for (const file of allFiles) {
    for (const pattern of componentPatterns) {
      if (pattern.test(file)) {
        matchingComponents.push(file);
        break;
      }
    }
  }
  
  return matchingComponents;
}

/**
 * Función principal
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}🔍 Verificando coherencia entre la base de datos y la estructura del proyecto...${colors.reset}`);
  
  try {
    // 1. Obtener tablas de la base de datos
    const tables = await getTables();
    console.log(`${colors.cyan}Se encontraron ${tables.length} tablas en la base de datos${colors.reset}`);
    
    // 2. Obtener directorios de la aplicación
    const appDirs = fs.readdirSync(APP_DIR)
      .filter(dir => fs.statSync(path.join(APP_DIR, dir)).isDirectory() && !dir.startsWith('_') && !dir.startsWith('.'));
    
    console.log(`${colors.cyan}Se encontraron ${appDirs.length} directorios de secciones en la aplicación${colors.reset}`);
    
    // 3. Verificar consistencia entre entidades y secciones
    console.log(`\n${colors.bold}Verificando consistencia entre entidades y secciones de la aplicación:${colors.reset}`);
    console.log(`${colors.bold}=================================================================${colors.reset}`);
    
    // Entidades principales que deberían tener su propia sección
    const mainEntities = [
      'clientes', 'proveedores', 'negocios', 'facturas_cliente', 
      'facturas_proveedor', 'proformas', 'albaranes', 'materiales', 'recibos'
    ];
    
    // Filtrar solo las entidades principales que están en la base de datos
    const dbMainEntities = tables.filter(table => mainEntities.includes(table));
    
    // Verificar cada entidad principal
    for (const entity of dbMainEntities) {
      const sectionInfo = hasEntitySection(entity, appDirs);
      
      if (sectionInfo === null) {
        continue; // No es una entidad principal, la saltamos
      }
      
      if (sectionInfo.exists) {
        console.log(`${colors.green}✅ Entidad '${entity}' tiene su sección correspondiente: ${sectionInfo.dirName}${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ Entidad '${entity}' no tiene sección en la aplicación.${colors.reset}`);
        console.log(`${colors.yellow}   Nombres esperados: ${sectionInfo.expectedNames.join(', ')}${colors.reset}`);
      }
    }
    
    // 4. Verificar si hay secciones sin entidades correspondientes
    console.log(`\n${colors.bold}Verificando secciones sin entidades correspondientes:${colors.reset}`);
    console.log(`${colors.bold}=================================================${colors.reset}`);
    
    // Crear un mapa invertido de nombres de sección a entidades
    const sectionToEntityMap = {};
    for (const entity of mainEntities) {
      const mappings = {
        'clientes': ['clientes', 'clients', 'customers'],
        'proveedores': ['proveedores', 'providers', 'suppliers'],
        'negocios': ['negocios', 'business', 'deals', 'opportunities'],
        'facturas_cliente': ['facturas', 'invoices', 'facturas-cliente'],
        'facturas_proveedor': ['facturas-proveedor', 'compras', 'purchases', 'supplier-invoices'],
        'proformas': ['proformas', 'quotes', 'presupuestos'],
        'albaranes': ['albaranes', 'delivery-notes'],
        'materiales': ['materiales', 'materials', 'productos', 'products'],
        'recibos': ['recibos', 'receipts', 'pagos', 'payments', 'cobros']
      };
      
      if (mappings[entity]) {
        for (const sectionName of mappings[entity]) {
          sectionToEntityMap[sectionName] = entity;
        }
      }
    }
    
    // Verificar cada sección
    for (const dir of appDirs) {
      // Ignorar directorios comunes que no corresponden a entidades
      if (['components', 'dashboard', '(auth)', 'api', 'utils', 'lib', 'styles'].includes(dir)) {
        continue;
      }
      
      let found = false;
      for (const [sectionName, entity] of Object.entries(sectionToEntityMap)) {
        if (dir.toLowerCase() === sectionName) {
          if (tables.includes(entity)) {
            found = true;
            break;
          }
        }
      }
      
      if (!found) {
        console.log(`${colors.yellow}⚠️ Sección '${dir}' no tiene una entidad correspondiente clara en la base de datos${colors.reset}`);
      }
    }
    
    // 5. Sugerencias de mejora
    console.log(`\n${colors.bold}${colors.blue}Recomendaciones para mejorar la coherencia:${colors.reset}`);
    
    // Detectar entidades sin sección
    const entitiesWithoutSection = dbMainEntities.filter(entity => {
      const sectionInfo = hasEntitySection(entity, appDirs);
      return sectionInfo && !sectionInfo.exists;
    });
    
    if (entitiesWithoutSection.length > 0) {
      console.log(`${colors.yellow}1. Crear secciones para las siguientes entidades:${colors.reset}`);
      entitiesWithoutSection.forEach(entity => {
        const sectionInfo = hasEntitySection(entity, appDirs);
        console.log(`   - ${entity} (nombres sugeridos: ${sectionInfo.expectedNames.join(', ')})`);
      });
    }
    
    console.log(`\n${colors.bold}${colors.green}🎉 Verificación de coherencia completada!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Error inesperado: ${error.message}${colors.reset}`);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar la función principal
main().catch(error => {
  console.error(`${colors.red}❌ Error fatal: ${error.message}${colors.reset}`);
  process.exit(1);
}); 
/**
 * Validador de Consistencia con el CRM
 * 
 * Este archivo contiene funciones para validar que los archivos nuevos
 * mantengan coherencia con la estructura del CRM y la base de datos.
 */

// Importar el esquema de la base de datos
const { databaseSchema } = require('./supabase-schema.mdc');

// Definición de las secciones principales del CRM y sus entidades relacionadas
const crmSections = {
  auth: {
    entities: ['perfiles'],
    routes: ['(auth)'],
    description: 'Autenticación y gestión de usuarios'
  },
  dashboard: {
    entities: ['negocios', 'facturas_cliente', 'facturas_proveedor', 'albaranes'],
    routes: ['dashboard'],
    description: 'Panel de control con KPIs y resúmenes'
  },
  negocios: {
    entities: ['negocios', 'negocios_materiales', 'negocios_proveedores'],
    routes: ['negocios'],
    description: 'Gestión de negocios/operaciones comerciales'
  },
  clientes: {
    entities: ['clientes'],
    routes: ['clientes'],
    description: 'Gestión de clientes'
  },
  facturas: {
    entities: ['facturas_cliente', 'facturas_proveedor'],
    routes: ['facturas'],
    description: 'Gestión de facturas'
  },
  proformas: {
    entities: ['proformas', 'proformas_productos'],
    routes: ['proformas'],
    description: 'Gestión de cotizaciones/proformas'
  },
  albaranes: {
    entities: ['albaranes'],
    routes: ['albaranes'],
    description: 'Gestión de albaranes/documentos de transporte'
  },
  proveedores: {
    entities: ['proveedores'],
    routes: ['proveedores'],
    description: 'Gestión de proveedores'
  },
  materiales: {
    entities: ['materiales'],
    routes: ['materiales'],
    description: 'Gestión de materiales/productos'
  },
  recibos: {
    entities: ['recibos'],
    routes: ['recibos'],
    description: 'Gestión de recibos/pagos'
  }
};

/**
 * Verifica si un nuevo archivo es coherente con la sección del CRM a la que pertenece
 * @param {string} filePath - Ruta del archivo a verificar
 * @param {string} fileContent - Contenido del archivo
 * @returns {Object} Resultado de la validación
 */
function validateCRMConsistency(filePath, fileContent) {
  // Determinar la sección del CRM a la que pertenece el archivo
  const section = determineCRMSection(filePath);
  
  // Si no se identifica una sección, no podemos validar coherencia
  if (!section) {
    return {
      isValid: true, // No hay sección específica que validar
      warnings: [{
        message: `El archivo no pertenece a una sección específica del CRM. Verifica si debería estar en otra ubicación.`,
        severity: 'info'
      }]
    };
  }
  
  const issues = [];
  
  // Verificar que si es un servicio o componente, utilice las entidades correctas
  if (filePath.includes('services') || filePath.includes('components')) {
    const sectionEntities = crmSections[section].entities;
    
    // Verificar si el archivo hace referencia a las entidades de la sección
    const missingEntities = [];
    const incorrectEntities = [];
    
    sectionEntities.forEach(entity => {
      if (!fileContent.includes(entity)) {
        missingEntities.push(entity);
      }
    });
    
    // Buscar si hace referencia a entidades que no corresponden a la sección
    Object.keys(databaseSchema).forEach(entity => {
      if (!sectionEntities.includes(entity) && 
          (fileContent.includes(`from('${entity}'`) || 
           fileContent.includes(`${entity.charAt(0).toUpperCase() + entity.slice(1)}`))) {
        incorrectEntities.push(entity);
      }
    });
    
    if (missingEntities.length > 0) {
      issues.push({
        message: `El archivo podría no estar utilizando las entidades principales de la sección '${section}': ${missingEntities.join(', ')}`,
        severity: 'warning'
      });
    }
    
    if (incorrectEntities.length > 0) {
      issues.push({
        message: `El archivo hace referencia a entidades que no corresponden a la sección '${section}': ${incorrectEntities.join(', ')}`,
        severity: 'warning'
      });
    }
  }
  
  // Verificar coherencia en rutas de páginas
  if (filePath.includes('/app/') && filePath.endsWith('page.tsx')) {
    const routeParts = filePath.split('/app/')[1].split('/');
    const routeBase = routeParts[0];
    
    // Verificar si la ruta base corresponde a la sección del CRM
    if (!crmSections[section].routes.includes(routeBase)) {
      issues.push({
        message: `La ruta '${routeBase}' no corresponde a la sección '${section}' del CRM.`,
        severity: 'error'
      });
    }
  }
  
  // Verificar que los tipos utilizados sean coherentes con la base de datos
  if (fileContent.includes('type ') || fileContent.includes('interface ')) {
    Object.keys(databaseSchema).forEach(tableName => {
      const columnsInTable = Object.keys(databaseSchema[tableName].columns);
      
      // Buscar definiciones de tipos/interfaces relacionadas con la tabla
      const entityName = tableName.endsWith('s') ? tableName.slice(0, -1) : tableName;
      const pascalEntityName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
      
      if (fileContent.includes(`type ${pascalEntityName}`) || 
          fileContent.includes(`interface ${pascalEntityName}`)) {
        
        // Verificar que los campos definidos en el tipo existan en la tabla
        const missingColumns = [];
        columnsInTable.forEach(column => {
          if (!fileContent.includes(column) && column !== 'id' && 
              !column.includes('_at')) {
            missingColumns.push(column);
          }
        });
        
        if (missingColumns.length > 0) {
          issues.push({
            message: `El tipo o interfaz para '${pascalEntityName}' podría estar faltando campos importantes: ${missingColumns.join(', ')}`,
            severity: 'warning'
          });
        }
      }
    });
  }
  
  return {
    isValid: issues.filter(issue => issue.severity === 'error').length === 0,
    section,
    issues
  };
}

/**
 * Determina a qué sección del CRM pertenece un archivo
 * @param {string} filePath - Ruta del archivo
 * @returns {string|null} Nombre de la sección o null si no se identifica
 */
function determineCRMSection(filePath) {
  // Verificar rutas específicas
  for (const [section, info] of Object.entries(crmSections)) {
    for (const route of info.routes) {
      if (filePath.includes(`/app/${route}/`)) {
        return section;
      }
    }
  }
  
  // Verificar por nombre de entidad en la ruta
  for (const [section, info] of Object.entries(crmSections)) {
    for (const entity of info.entities) {
      // Convertir el nombre de la entidad a singular si es necesario
      const singularEntity = entity.endsWith('s') ? entity.slice(0, -1) : entity;
      
      if (filePath.includes(`/${entity}/`) || 
          filePath.includes(`/${singularEntity}.`) ||
          filePath.includes(`/${singularEntity}-`)) {
        return section;
      }
    }
  }
  
  // No se pudo determinar una sección específica
  return null;
}

/**
 * Genera recomendaciones para hacer un archivo coherente con el CRM
 * @param {Object} validationResult - Resultado de validación
 * @returns {Array} Recomendaciones para mejorar la coherencia
 */
function generateConsistencyRecommendations(validationResult) {
  if (!validationResult.section) {
    return [{
      suggestion: 'Considera ubicar este archivo dentro de una sección específica del CRM para mejor organización.'
    }];
  }
  
  const recommendations = [];
  
  validationResult.issues.forEach(issue => {
    if (issue.severity === 'error') {
      recommendations.push({
        suggestion: `Corrige: ${issue.message}`,
        priority: 'alta'
      });
    } else {
      recommendations.push({
        suggestion: `Considera: ${issue.message}`,
        priority: 'media'
      });
    }
  });
  
  // Añadir sugerencias generales según la sección
  const section = validationResult.section;
  const sectionInfo = crmSections[section];
  
  recommendations.push({
    suggestion: `Este archivo pertenece a la sección '${section}': ${sectionInfo.description}. Asegúrate de que el código sea coherente con esta funcionalidad.`,
    priority: 'baja'
  });
  
  return recommendations;
}

// Exportar funciones
return {
  validateCRMConsistency,
  generateConsistencyRecommendations,
  crmSections
}; 
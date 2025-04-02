/**
 * Validador de Consistencia con el CRM (Versión simplificada)
 * 
 * Este archivo contiene funciones para validar que los archivos nuevos
 * mantengan coherencia con la estructura del CRM y la base de datos.
 */

// Definir las secciones del CRM
const crmSections = {
  clients: {
    name: "clients",
    route: "/clients",
    entities: ["clientes"],
    description: "Gestión de clientes"
  },
  products: {
    name: "products",
    route: "/products",
    entities: ["materiales"],
    description: "Gestión de productos y materiales"
  },
  suppliers: {
    name: "suppliers",
    route: "/suppliers",
    entities: ["proveedores"],
    description: "Gestión de proveedores"
  },
  deals: {
    name: "deals",
    route: "/deals",
    entities: ["negocios", "negocios_materiales", "negocios_proveedores"],
    description: "Gestión de negocios y operaciones"
  },
  invoices: {
    name: "invoices",
    route: "/invoices",
    entities: ["facturas_cliente", "facturas_proveedor", "recibos"],
    description: "Gestión de facturas y pagos"
  },
  delivery: {
    name: "delivery",
    route: "/delivery",
    entities: ["albaranes"],
    description: "Gestión de envíos y albaranes"
  },
  quotes: {
    name: "quotes",
    route: "/quotes",
    entities: ["proformas", "proformas_productos"],
    description: "Gestión de proformas y presupuestos"
  },
  users: {
    name: "users",
    route: "/users",
    entities: ["perfiles"],
    description: "Gestión de usuarios"
  }
};

/**
 * Valida la coherencia de un archivo con la estructura del CRM
 * @param {string} filePath - Ruta del archivo
 * @param {string} fileContent - Contenido del archivo
 * @returns {Object} Resultado de la validación
 */
function validateCRMConsistency(filePath, fileContent) {
  // Inicializar resultado
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    sections: [],
    entities: []
  };
  
  // Verificar si es un archivo relevante
  if (!filePath.match(/\.(tsx?|jsx?)$/)) {
    result.warnings.push('El archivo no es un archivo de código JavaScript/TypeScript');
    return result;
  }
  
  // Extraer sección y entidad del path
  const pathSegments = filePath.split('/');
  const fileName = pathSegments[pathSegments.length - 1];
  
  // Detectar sección según la ruta
  let detectedSection = null;
  for (const section in crmSections) {
    const sectionInfo = crmSections[section];
    const sectionPath = sectionInfo.route.substring(1); // Quitar la barra inicial
    
    // Si la ruta contiene el nombre de la sección
    if (pathSegments.includes(sectionPath) || pathSegments.includes(section)) {
      detectedSection = section;
      result.sections.push(section);
      break;
    }
  }
  
  // Detectar entidades mencionadas en el contenido
  for (const section in crmSections) {
    const sectionInfo = crmSections[section];
    for (const entity of sectionInfo.entities) {
      // Buscar menciones de la entidad en el contenido
      const entityPattern = new RegExp(`\\b${entity}\\b`, 'i');
      if (entityPattern.test(fileContent)) {
        if (!result.entities.includes(entity)) {
          result.entities.push(entity);
        }
      }
    }
  }
  
  // Verificar coherencia
  if (detectedSection) {
    const sectionInfo = crmSections[detectedSection];
    
    // Verificar que las entidades mencionadas sean coherentes con la sección
    for (const entity of result.entities) {
      if (!sectionInfo.entities.includes(entity)) {
        // Si menciona entidades de otra sección, es una advertencia
        result.warnings.push(`El archivo menciona la entidad '${entity}' que no pertenece a la sección '${detectedSection}'`);
      }
    }
    
    // Si no menciona ninguna entidad de la sección, es una advertencia
    if (!result.entities.some(entity => sectionInfo.entities.includes(entity))) {
      result.warnings.push(`El archivo está en la sección '${detectedSection}' pero no menciona ninguna entidad relacionada`);
    }
  } else if (result.entities.length > 0) {
    // Si menciona entidades pero no está en una sección específica, sugerir secciones
    const suggestedSections = new Set();
    for (const entity of result.entities) {
      for (const section in crmSections) {
        if (crmSections[section].entities.includes(entity)) {
          suggestedSections.add(section);
        }
      }
    }
    
    if (suggestedSections.size > 0) {
      result.suggestions.push(`Considera mover este archivo a una de estas secciones: ${Array.from(suggestedSections).join(', ')}`);
    }
  }
  
  // Determinar si es válido
  result.isValid = result.errors.length === 0;
  
  return result;
}

/**
 * Genera recomendaciones para mejorar la coherencia con el CRM
 * @param {Object} validationResult - Resultado de la validación
 * @returns {Array} Lista de recomendaciones
 */
function generateConsistencyRecommendations(validationResult) {
  const recommendations = [];
  
  // Añadir errores como recomendaciones críticas
  validationResult.errors.forEach(error => {
    recommendations.push({
      type: 'critical',
      message: error,
      action: 'resolve'
    });
  });
  
  // Añadir advertencias como recomendaciones importantes
  validationResult.warnings.forEach(warning => {
    recommendations.push({
      type: 'warning',
      message: warning,
      action: 'review'
    });
  });
  
  // Añadir sugerencias como recomendaciones opcionales
  validationResult.suggestions.forEach(suggestion => {
    recommendations.push({
      type: 'suggestion',
      message: suggestion,
      action: 'consider'
    });
  });
  
  return recommendations;
}

// Exportar funciones y constantes
module.exports = {
  crmSections,
  validateCRMConsistency,
  generateConsistencyRecommendations
}; 
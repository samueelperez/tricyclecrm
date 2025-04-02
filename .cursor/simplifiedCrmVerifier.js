/**
 * Verificador de coherencia del CRM (Versión simplificada)
 * 
 * Este archivo contiene utilidades para verificar la coherencia
 * de nuevos archivos con la estructura del CRM.
 */

// Importar el validador de consistencia simplificado
const { 
  validateCRMConsistency, 
  generateConsistencyRecommendations, 
  crmSections 
} = require('./simplifiedCrmConsistencyValidator');

/**
 * Verifica la coherencia de un archivo con el CRM
 * @param {string} filePath - Ruta del archivo
 * @param {string} fileContent - Contenido del archivo
 * @returns {Object} Resultado de la verificación
 */
function verifyCRMFile(filePath, fileContent) {
  // Validar coherencia con el CRM
  const validationResult = validateCRMConsistency(filePath, fileContent);
  
  // Generar recomendaciones basadas en el resultado
  const recommendations = generateConsistencyRecommendations(validationResult);
  
  return {
    validation: validationResult,
    recommendations
  };
}

/**
 * Genera un servicio para una entidad específica del CRM
 * @param {string} entityName - Nombre de la entidad
 * @returns {Object} Servicio generado y resultado de validación
 */
function generateCRMService(entityName) {
  // Determinar la sección a la que pertenece la entidad
  let sectionKey = null;
  for (const section in crmSections) {
    if (crmSections[section].entities.includes(entityName)) {
      sectionKey = section;
      break;
    }
  }
  
  if (!sectionKey) {
    return {
      error: `La entidad '${entityName}' no está definida en ninguna sección del CRM.`
    };
  }
  
  // Generar contenido del servicio
  const serviceContent = `/**
 * Servicio para la entidad ${entityName}
 * Sección: ${crmSections[sectionKey].name}
 */

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export async function getAll${entityName.charAt(0).toUpperCase() + entityName.slice(1)}() {
  const { data, error } = await supabase
    .from('${entityName}')
    .select('*');
  
  if (error) {
    console.error('Error al obtener ${entityName}:', error);
    throw error;
  }
  
  return data;
}

export async function get${entityName.charAt(0).toUpperCase() + entityName.slice(1)}ById(id) {
  const { data, error } = await supabase
    .from('${entityName}')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(\`Error al obtener ${entityName} con id \${id}:\`, error);
    throw error;
  }
  
  return data;
}

export async function create${entityName.charAt(0).toUpperCase() + entityName.slice(1)}(${entityName}Data) {
  const { data, error } = await supabase
    .from('${entityName}')
    .insert(${entityName}Data)
    .select();
  
  if (error) {
    console.error('Error al crear ${entityName}:', error);
    throw error;
  }
  
  return data[0];
}

export async function update${entityName.charAt(0).toUpperCase() + entityName.slice(1)}(id, ${entityName}Data) {
  const { data, error } = await supabase
    .from('${entityName}')
    .update(${entityName}Data)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error(\`Error al actualizar ${entityName} con id \${id}:\`, error);
    throw error;
  }
  
  return data[0];
}

export async function delete${entityName.charAt(0).toUpperCase() + entityName.slice(1)}(id) {
  const { error } = await supabase
    .from('${entityName}')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(\`Error al eliminar ${entityName} con id \${id}:\`, error);
    throw error;
  }
  
  return true;
}`;

  // Construir la ruta del servicio
  const filePath = `src/services/${sectionKey}/${entityName}-service.ts`;
  
  // Verificar coherencia con el CRM
  const verificationResult = verifyCRMFile(filePath, serviceContent);
  
  return {
    content: serviceContent,
    filePath,
    verification: verificationResult
  };
}

/**
 * Genera una página para una sección específica del CRM
 * @param {string} section - Clave de la sección
 * @param {string} pageName - Nombre de la página
 * @returns {Object} Página generada y resultado de validación
 */
function generateCRMPage(section, pageName) {
  if (!crmSections[section]) {
    return {
      error: `La sección '${section}' no está definida en el CRM.`
    };
  }
  
  const sectionInfo = crmSections[section];
  const mainEntity = sectionInfo.entities[0];
  
  // Generar contenido de la página
  const pageContent = `/**
 * Página ${pageName} para la sección ${sectionInfo.name}
 */

import { Suspense } from 'react';
import { getAll${mainEntity.charAt(0).toUpperCase() + mainEntity.slice(1)} } from '@/services/${section}/${mainEntity}-service';

export const metadata = {
  title: '${pageName} - TricycleCRM',
  description: '${pageName} para la sección ${sectionInfo.description}'
};

async function ${pageName}Content() {
  const ${mainEntity}List = await getAll${mainEntity.charAt(0).toUpperCase() + mainEntity.slice(1)}();
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">${pageName}</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          {${mainEntity}List.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {${mainEntity}List.map((item) => (
                <li key={item.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.nombre || item.id_externo || item.numero || item.id}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        ID: {item.id}
                      </p>
                    </div>
                    <div>
                      <a
                        href={\`${sectionInfo.route}/\${item.id}\`}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                      >
                        Ver detalles
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No hay ${mainEntity} disponibles.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ${pageName}Page() {
  return (
    <Suspense fallback={<div className="p-8">Cargando...</div>}>
      <${pageName}Content />
    </Suspense>
  );
}`;

  // Construir la ruta de la página
  const fileName = pageName.toLowerCase().replace(/\s+/g, '-');
  const filePath = `src/app${sectionInfo.route}/${fileName}/page.tsx`;
  
  // Verificar coherencia con el CRM
  const verificationResult = verifyCRMFile(filePath, pageContent);
  
  return {
    content: pageContent,
    filePath,
    verification: verificationResult
  };
}

/**
 * Genera un componente para una sección específica del CRM
 * @param {string} section - Clave de la sección
 * @param {string} componentName - Nombre del componente
 * @param {boolean} isClientComponent - Si es un componente de cliente
 * @returns {Object} Componente generado y resultado de validación
 */
function generateCRMComponent(section, componentName, isClientComponent = false) {
  if (!crmSections[section]) {
    return {
      error: `La sección '${section}' no está definida en el CRM.`
    };
  }
  
  const sectionInfo = crmSections[section];
  const mainEntity = sectionInfo.entities[0];
  
  // Generar contenido del componente
  const componentContent = `${isClientComponent ? '"use client";\n\n' : ''}/**
 * Componente ${componentName} para la sección ${sectionInfo.name}
 */
${isClientComponent ? 'import { useState } from "react";\n' : ''}
export default function ${componentName}({ ${mainEntity} }) {
  ${isClientComponent ? `const [isLoading, setIsLoading] = useState(false);\n
  const handle${mainEntity.charAt(0).toUpperCase() + mainEntity.slice(1)}Action = async () => {
    setIsLoading(true);
    try {
      // Acción del componente
      console.log('Acción para', ${mainEntity});
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };\n` : ''}
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">${componentName}</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-500">ID</p>
          <p className="mt-1">{${mainEntity}.id}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-500">Nombre</p>
          <p className="mt-1">{${mainEntity}.nombre || 'N/A'}</p>
        </div>
        
        ${isClientComponent ? `<button
          onClick={handle${mainEntity.charAt(0).toUpperCase() + mainEntity.slice(1)}Action}
          disabled={isLoading}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isLoading ? 'Procesando...' : 'Realizar acción'}
        </button>` : ''}
      </div>
    </div>
  );
}`;

  // Construir la ruta del componente
  const fileName = componentName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const filePath = `src/components/${section}/${fileName}.tsx`;
  
  // Verificar coherencia con el CRM
  const verificationResult = verifyCRMFile(filePath, componentContent);
  
  return {
    content: componentContent,
    filePath,
    verification: verificationResult
  };
}

// Exportar funciones
module.exports = {
  verifyCRMFile,
  generateCRMService,
  generateCRMPage,
  generateCRMComponent
}; 
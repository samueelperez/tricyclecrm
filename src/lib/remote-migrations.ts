/**
 * Este archivo contiene utilidades para ejecutar migraciones de base de datos de forma remota.
 * Se pueden ejecutar desde herramientas de CI/CD, scripts o programáticamente.
 * 
 * Ejemplo de uso:
 * ```
 * const baseUrl = "https://tudominio.com";
 * await runRemoteMigrations(baseUrl);
 * ```
 */

/**
 * Ejecuta las migraciones de base de datos de forma remota
 * @param baseUrl URL base de la aplicación (ej: https://tudominio.com)
 * @param options Opciones adicionales para la migración
 * @returns Resultado de la operación
 */
export async function runRemoteMigrations(
  baseUrl: string,
  options: {
    applyForeignKey?: boolean;
    token?: string; // Token de seguridad si se ha implementado
  } = {}
): Promise<any> {
  try {
    // Construir la URL con las opciones
    const url = `${baseUrl}/api/db-migrate${options.applyForeignKey ? '?applyForeignKey=true' : ''}`;
    
    // Opciones de la petición
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // Añadir token de autorización si se ha proporcionado
    if (options.token) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${options.token}`
      };
    }
    
    // Ejecutar la petición
    console.log(`Ejecutando migraciones remotas en ${url}...`);
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Verificar el resultado
    if (result.status === 'success') {
      console.log('✅ Migraciones completadas con éxito');
    } else if (result.status === 'warning') {
      console.warn('⚠️ Migraciones completadas con advertencias');
    } else {
      console.error('❌ Error en las migraciones');
    }
    
    // Mostrar detalles de los pasos
    if (result.steps && result.steps.length > 0) {
      result.steps.forEach((step: any) => {
        if (step.success) {
          console.log(`✅ ${step.name}: ${step.message || 'Completado'}`);
        } else {
          console.error(`❌ ${step.name}: ${step.message || 'Fallido'}`);
        }
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error ejecutando migraciones remotas:', error);
    throw error;
  }
}

/**
 * Script para ejecutar desde línea de comandos
 * Ejemplo: node -r ts-node/register remote-migrations.ts https://tudominio.com
 */
if (typeof process !== 'undefined' && process.argv && process.argv.length > 2) {
  const baseUrl = process.argv[2];
  const applyForeignKey = process.argv.includes('--apply-foreign-key');
  const token = process.argv.find(arg => arg.startsWith('--token='))?.split('=')[1];
  
  console.log(`Ejecutando migraciones en ${baseUrl}...`);
  runRemoteMigrations(baseUrl, { 
    applyForeignKey,
    token
  })
  .then(result => {
    console.log('Migraciones completadas:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error ejecutando migraciones:', error);
    process.exit(1);
  });
} 
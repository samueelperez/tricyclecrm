'use client';

import { useState } from 'react';
import { FiDatabase, FiRefreshCw, FiCheck, FiX, FiChevronRight } from 'react-icons/fi';

interface MigrationStep {
  name: string;
  success: boolean;
  message?: string;
}

interface MigrationResult {
  status: 'success' | 'warning' | 'error';
  steps: MigrationStep[];
  message?: string;
}

export default function DatabaseAdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  async function runMigrations(applyForeignKey = false) {
    setLoading(true);
    setResult(null);
    
    try {
      // Construir URL con parámetros según opciones
      const url = `/api/db-migrate${applyForeignKey ? '?applyForeignKey=true' : ''}`;
      
      // Ejecutar la migración llamando a la API
      const response = await fetch(url);
      const data = await response.json();
      
      setResult(data);
    } catch (error) {
      setResult({
        status: 'error',
        steps: [],
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center">
          <FiDatabase className="mr-2" />
          Administración de Base de Datos
        </h1>
        <p className="text-gray-600 mt-2">
          Esta página permite ejecutar migraciones y verificar el estado de la base de datos.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Migraciones</h2>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => runMigrations(false)}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <FiRefreshCw className="animate-spin mr-2" />
            ) : (
              <FiRefreshCw className="mr-2" />
            )}
            Ejecutar migraciones básicas
          </button>
          
          <button
            onClick={() => runMigrations(true)}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <FiRefreshCw className="animate-spin mr-2" />
            ) : (
              <FiDatabase className="mr-2" />
            )}
            Aplicar claves foráneas
          </button>
        </div>

        {result && (
          <div className={`
            mt-6 border rounded-lg p-4
            ${result.status === 'success' ? 'border-green-200 bg-green-50' : ''}
            ${result.status === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''}
            ${result.status === 'error' ? 'border-red-200 bg-red-50' : ''}
          `}>
            <h3 className={`
              text-lg font-medium mb-2
              ${result.status === 'success' ? 'text-green-800' : ''}
              ${result.status === 'warning' ? 'text-yellow-800' : ''}
              ${result.status === 'error' ? 'text-red-800' : ''}
            `}>
              {result.status === 'success' && 'Migraciones completadas con éxito'}
              {result.status === 'warning' && 'Migraciones completadas con advertencias'}
              {result.status === 'error' && 'Error en las migraciones'}
            </h3>
            
            {result.message && (
              <p className="text-gray-700 mb-4">{result.message}</p>
            )}
            
            <div className="border rounded divide-y">
              {result.steps.map((step, index) => (
                <div key={index} className="p-3 flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {step.success ? (
                      <FiCheck className="text-green-500" />
                    ) : (
                      <FiX className="text-red-500" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">
                      {step.name === 'register_functions' && 'Registro de funciones SQL'}
                      {step.name === 'verify_proformas_productos' && 'Verificación de tabla proformas_productos'}
                      {step.name === 'verify_facturas_cliente' && 'Verificación de tabla facturas_cliente'}
                      {step.name === 'apply_foreign_key' && 'Aplicación de clave foránea'}
                    </p>
                    {step.message && <p className="text-sm text-gray-600">{step.message}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Flujo de migraciones</h2>
        
        <div className="space-y-4">
          <div className="border rounded p-4">
            <h3 className="font-medium mb-2 flex items-center">
              <FiChevronRight className="mr-1" />
              Migraciones automáticas al iniciar la aplicación
            </h3>
            <p className="text-gray-600 text-sm">
              Cuando la aplicación se inicia, el componente DatabaseInitializer registra
              las funciones SQL necesarias y verifica las tablas principales.
            </p>
          </div>
          
          <div className="border rounded p-4">
            <h3 className="font-medium mb-2 flex items-center">
              <FiChevronRight className="mr-1" />
              Ejecución manual desde esta página
            </h3>
            <p className="text-gray-600 text-sm">
              Puedes ejecutar migraciones manualmente desde esta página cuando sea necesario,
              por ejemplo, después de un despliegue o actualización.
            </p>
          </div>
          
          <div className="border rounded p-4">
            <h3 className="font-medium mb-2 flex items-center">
              <FiChevronRight className="mr-1" />
              Ejecución programada mediante API
            </h3>
            <p className="text-gray-600 text-sm">
              La ruta <code>/api/db-migrate</code> permite ejecutar migraciones programáticamente,
              ideal para tareas programadas o scripts de CI/CD.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
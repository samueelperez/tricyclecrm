'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FiDatabase, FiRefreshCw, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function SetupClientesMateriales() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'warning'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleSetupDatabase = async () => {
    setIsLoading(true);
    setStatus('loading');
    setMessage('Ejecutando migraciones para clientes-materiales...');
    
    try {
      const response = await fetch('/api/admin/setup-clientes-materiales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al configurar la base de datos');
      }
      
      if (data.warning) {
        setStatus('warning');
        setMessage(data.warning + (data.details ? `: ${data.details}` : ''));
        toast.success('Base de datos configurada con advertencias', { 
          duration: 5000,
          icon: '⚠️'
        });
      } else {
        setStatus('success');
        setMessage('Tablas configuradas correctamente.');
        toast.success('Tablas configuradas correctamente');
      }
      
      // Recargar la página después de 3 segundos para reflejar los cambios
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (error) {
      console.error('Error al configurar la base de datos:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Error al configurar la base de datos');
      toast.error(error instanceof Error ? error.message : 'Error al configurar la base de datos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-8 p-4 border rounded-md bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Configuración de Clientes-Materiales</h2>
      
      {status === 'error' && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          <div className="flex items-start">
            <FiAlertCircle className="mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Error al configurar la base de datos</p>
              <p className="text-sm mt-1">{message}</p>
            </div>
          </div>
        </div>
      )}
      
      {status === 'warning' && (
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 rounded">
          <div className="flex items-start">
            <FiAlertCircle className="mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Advertencia</p>
              <p className="text-sm mt-1">{message}</p>
            </div>
          </div>
        </div>
      )}
      
      {status === 'success' && (
        <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
          <div className="flex items-start">
            <FiCheckCircle className="mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Operación completada</p>
              <p className="text-sm mt-1">{message}</p>
              <p className="text-xs mt-2">La página se recargará automáticamente...</p>
            </div>
          </div>
        </div>
      )}
      
      <p className="mb-4 text-gray-600">
        {status === 'idle' ? (
          'Configura la estructura necesaria en la base de datos para gestionar la relación entre clientes y los materiales que compran.'
        ) : status === 'loading' ? (
          'Ejecutando migraciones. Por favor, espera...'
        ) : status === 'success' ? (
          'La configuración se ha completado. El sistema está listo para usar.'
        ) : (
          'Para reintentar la configuración, haz clic en el botón a continuación.'
        )}
      </p>
      
      <Button 
        onClick={handleSetupDatabase} 
        disabled={isLoading || status === 'success'}
        className="flex items-center gap-2"
        variant={status === 'error' ? "destructive" : "default"}
      >
        {status === 'error' ? (
          <>
            <FiRefreshCw className="h-4 w-4" />
            Reintentar configuración
          </>
        ) : (
          <>
            <FiDatabase className="h-4 w-4" />
            {isLoading ? 'Configurando...' : 'Configurar Relación Clientes-Materiales'}
          </>
        )}
      </Button>
    </div>
  );
} 
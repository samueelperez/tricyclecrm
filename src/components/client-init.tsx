'use client';

import { useEffect } from 'react';
import { verifyProformasProductosTable } from '@/lib/db-migrations';

export default function ClientComponent() {
  useEffect(() => {
    const runMigrations = async () => {
      try {
        console.log('Verificando estructura de tabla proformas_productos...');
        await verifyProformasProductosTable();
        console.log('Verificación completada con éxito');
      } catch (error) {
        console.error('Error al verificar tabla:', error);
      }
    };

    // Solo ejecutar en el lado del cliente
    if (typeof window !== 'undefined') {
      // Usar setTimeout para asegurar que el componente está completamente montado
      setTimeout(() => {
        runMigrations();
      }, 100);
    }
  }, []);

  // Este componente no renderiza nada visible
  return null;
} 
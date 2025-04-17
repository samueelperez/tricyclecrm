'use client';

import { useEffect, useState } from 'react';
import { verifyProformasProductosTable, verifyFacturasClienteTable } from '@/lib/db-migrations';
import { registerDatabaseFunctions } from '@/lib/supabase';

/**
 * Componente que inicializa la base de datos de forma segura
 * Se encarga de ejecutar migraciones pendientes sin bloquear la aplicación
 */
export default function DatabaseInitializer() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeDatabase() {
      try {
        console.log('Inicializando base de datos...');
        
        // Paso 1: Registrar funciones SQL necesarias en Supabase
        console.log('Registrando funciones SQL en la base de datos...');
        const { success: registerSuccess } = await registerDatabaseFunctions();
        
        if (registerSuccess) {
          console.log('Funciones SQL registradas correctamente');
        } else {
          console.warn('Algunas funciones SQL no pudieron registrarse');
        }
        
        // Paso 2: Verificar estructura de tablas principales
        console.log('Verificando tabla proformas_productos...');
        const proformasResult = await verifyProformasProductosTable();
        
        console.log('Verificando tabla facturas_cliente...');
        const facturasResult = await verifyFacturasClienteTable();
        
        if (proformasResult && facturasResult) {
          console.log('Base de datos inicializada correctamente');
          setInitialized(true);
        } else {
          console.warn('Base de datos inicializada con advertencias');
          setInitialized(true);
          setError('Algunas verificaciones no pasaron, pero la aplicación puede continuar');
        }
      } catch (err) {
        console.error('Error al inicializar la base de datos:', err);
        setError('Error al inicializar la base de datos');
        // Marcamos como inicializado para no bloquear la aplicación
        setInitialized(true);
      }
    }

    // Ejecutar inicialización con un pequeño retraso para no bloquear la carga inicial
    const timer = setTimeout(() => {
      initializeDatabase();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Este componente no renderiza nada visible
  return null;
} 
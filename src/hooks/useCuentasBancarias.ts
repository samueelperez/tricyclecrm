import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Interfaz para las cuentas bancarias
export interface CuentaBancaria {
  id: number;
  nombre: string;
  banco: string;
  iban: string;
  swift: string;
  moneda: string;
  beneficiario: string;
  descripcion: string;
}

// Valores de fallback por si falla la carga desde la base de datos
export function getCuentasBancariasFallback(): CuentaBancaria[] {
  return [
    {
      id: 1,
      nombre: 'BBVA USD',
      banco: 'BBVA',
      iban: 'ESXX0182XXXXXXXXXXXX0000',
      swift: 'BBVAESMM',
      moneda: 'USD',
      beneficiario: 'Tricycle Import Export SL',
      descripcion: 'BBVA - ESXX0182XXXXXXXXXXXX0000 - USD'
    },
    {
      id: 2,
      nombre: 'BBVA EUR',
      banco: 'BBVA',
      iban: 'ESXX0182XXXXXXXXXXXX0001',
      swift: 'BBVAESMM',
      moneda: 'EUR',
      beneficiario: 'Tricycle Import Export SL',
      descripcion: 'BBVA - ESXX0182XXXXXXXXXXXX0001 - EUR'
    },
    {
      id: 3,
      nombre: 'Santander USD',
      banco: 'Santander S.A.',
      iban: 'ES6000495332142610008899',
      swift: 'BSCHESMM',
      moneda: 'USD',
      beneficiario: 'Tricycle Import Export SL',
      descripcion: 'Santander S.A. - ES6000495332142610008899 - USD'
    },
    {
      id: 4,
      nombre: 'Santander EUR',
      banco: 'Santander S.A.',
      iban: 'ESXX0049XXXXXXXXXXXX0002',
      swift: 'BSCHESMM',
      moneda: 'EUR',
      beneficiario: 'Tricycle Import Export SL',
      descripcion: 'Santander S.A. - ESXX0049XXXXXXXXXXXX0002 - EUR'
    }
  ];
}

// Hook para obtener las cuentas bancarias
export function useCuentasBancarias() {
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCuentasBancarias = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const supabase = createClientComponentClient();
        const { data, error } = await supabase
          .from('cuentas_bancarias')
          .select('*')
          .order('id', { ascending: true });
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (data && data.length > 0) {
          setCuentas(data as CuentaBancaria[]);
        } else {
          // Si no hay datos, usar valores por defecto
          setCuentas(getCuentasBancariasFallback());
        }
      } catch (err) {
        console.error('Error al cargar cuentas bancarias:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar cuentas bancarias');
        // En caso de error, usar los valores de fallback
        setCuentas(getCuentasBancariasFallback());
      } finally {
        setLoading(false);
      }
    };
    
    fetchCuentasBancarias();
  }, []);
  
  return { cuentas, loading, error };
}

// Función auxiliar para obtener cuentas bancarias de forma estática (para SSR)
export async function getCuentasBancarias(): Promise<CuentaBancaria[]> {
  try {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('cuentas_bancarias')
      .select('*')
      .eq('activo', true)
      .order('nombre');
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (err) {
    console.error('Error al cargar cuentas bancarias:', err);
    return [];
  }
} 
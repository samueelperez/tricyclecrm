// Lista de puertos predefinidos
export const PUERTOS_SUGERIDOS = [
  'TEMA PORT - GHANA',
  'APAPA PORT - NIGERIA',
  'MERSIN PORT - TURKEY',
  'KLANG WEST PORT - MALAYSIA',
  'LAEMCHABANG PORT - THAILAND'
];

// Lista de términos de pago predefinidos
export const TERMINOS_PAGO_SUGERIDOS = [
  '30% CIA – 70% 14 days before ETA and after receiving copy of all documents required',
  '20% CIA – 80% 14 days before ETA and after receiving copy of all documents required',
  '50% CIA – 50% 14 days before ETA and after receiving copy of all documents required'
];

// Lista de opciones de empaque predefinidas
export const EMPAQUE_OPCIONES = ['Bales', 'Loose', 'Package', 'Roles'];

// OBSOLETO: No usar esta constante directamente. 
// En su lugar, utilizar el hook useCuentasBancarias o la función getCuentasBancariasFallback:
// import { useCuentasBancarias, getCuentasBancariasFallback } from '@/hooks/useCuentasBancarias';
// 
// Ejemplo:
// const { cuentas: cuentasBancarias, loading, error } = useCuentasBancarias();
// o
// const cuentasBancariasFallback = getCuentasBancariasFallback();
export const CUENTAS_BANCARIAS = []; 
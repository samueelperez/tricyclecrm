import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina múltiples clases de TailwindCSS de forma condicional y las fusiona de manera inteligente
 * para evitar duplicaciones o conflictos.
 * 
 * @param inputs Lista de clases o expresiones condicionales
 * @returns String de clases combinadas y optimizadas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 
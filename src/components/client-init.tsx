'use client';

import { useEffect } from 'react';
import DatabaseInitializer from '@/app/components/db-initializer';

export default function ClientComponent() {
  // Este componente ahora solo incluye el inicializador de base de datos
  // y puede extenderse en el futuro para otras inicializaciones del cliente
  return <DatabaseInitializer />;
} 
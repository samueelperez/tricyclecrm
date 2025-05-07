'use client';

import { ReactNode } from 'react';
import SideBar from '@/components/layout/side-bar';
import Link from 'next/link';
import { FiSettings, FiDollarSign, FiUsers, FiCreditCard } from 'react-icons/fi';
import { usePathname } from 'next/navigation';

// Menú de navegación para configuración
function ConfiguracionNav() {
  const pathname = usePathname();
  
  // Elementos del menú
  const menuItems = [
    {
      name: 'General',
      href: '/configuracion',
      icon: <FiSettings className="w-5 h-5" />
    },
    {
      name: 'Cuentas Bancarias',
      href: '/configuracion/cuentas-bancarias',
      icon: <FiCreditCard className="w-5 h-5" />
    },
    {
      name: 'Usuarios',
      href: '/configuracion/usuarios',
      icon: <FiUsers className="w-5 h-5" />
    }
  ];
  
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
      <nav className="flex flex-col">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function ConfiguracionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <SideBar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Configuración</h1>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Barra de navegación lateral */}
            <div className="w-full md:w-64 flex-shrink-0">
              <ConfiguracionNav />
            </div>
            
            {/* Contenido principal */}
            <div className="flex-1">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
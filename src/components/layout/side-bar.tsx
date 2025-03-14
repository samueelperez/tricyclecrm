"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FiHome, 
  FiTag, 
  FiFileText, 
  FiUsers, 
  FiTruck, 
  FiPackage,
  FiList,
  FiCreditCard,
  FiSettings,
  FiLogOut
} from "react-icons/fi";
import LogoutButton from "@/components/auth/logout-button";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: <FiHome className="w-5 h-5" /> },
  { name: "Negocios", href: "/negocios", icon: <FiTag className="w-5 h-5" /> },
  { name: "Proformas", href: "/proformas", icon: <FiFileText className="w-5 h-5" /> },
  { name: "Facturas", href: "/facturas", icon: <FiFileText className="w-5 h-5" /> },
  { name: "Proveedores", href: "/proveedores", icon: <FiUsers className="w-5 h-5" /> },
  { name: "Clientes", href: "/clientes", icon: <FiUsers className="w-5 h-5" /> },
  { name: "Envíos", href: "/envios", icon: <FiTruck className="w-5 h-5" /> },
  { name: "Listas de Empaque", href: "/listas-empaque", icon: <FiList className="w-5 h-5" /> },
  { name: "Instrucciones BL", href: "/instrucciones-bl", icon: <FiFileText className="w-5 h-5" /> },
  { name: "Cuentas", href: "/cuentas", icon: <FiCreditCard className="w-5 h-5" /> },
  { name: "Configuración", href: "/configuracion", icon: <FiSettings className="w-5 h-5" /> },
];

export default function SideBar() {
  const pathname = usePathname();

  return (
    <div className="h-screen w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-600">Tricycle CRM</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={isActive ? "sidebar-item-active" : "sidebar-item"}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
              <span className="text-sm font-semibold">UP</span>
            </div>
            <div>
              <p className="text-sm font-medium">Usuario CRM</p>
              <p className="text-xs text-gray-500">usuario@ejemplo.com</p>
            </div>
          </div>
          <div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
} 
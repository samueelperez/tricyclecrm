"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  FiLogOut,
  FiClipboard,
  FiCalendar,
  FiLayers,
  FiChevronDown,
  FiChevronRight,
  FiCloud
} from "react-icons/fi";
import LogoutButton from "@/components/auth/logout-button";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: <FiHome className="w-5 h-5" /> },
  { name: "Negocios", href: "/negocios", icon: <FiTag className="w-5 h-5" /> },
  { name: "Proformas", href: "/proformas", icon: <FiFileText className="w-5 h-5" /> },
  { name: "Facturas", href: "/facturas", icon: <FiFileText className="w-5 h-5" /> },
  { name: "Clientes", href: "/clientes", icon: <FiUsers className="w-5 h-5" /> },
  { name: "Proveedores", href: "/proveedores", icon: <FiUsers className="w-5 h-5" /> },
  { name: "Materiales", href: "/materiales", icon: <FiPackage className="w-5 h-5" /> },
  { 
    name: "Logística", 
    icon: <FiTruck className="w-5 h-5" />,
    submenu: [
      { name: "Albaranes", href: "/albaranes", icon: <FiClipboard className="w-4 h-4" /> },
      { name: "Envíos", href: "/envios", icon: <FiTruck className="w-4 h-4" /> },
      { name: "Listas de Empaque", href: "/packing-lists", icon: <FiList className="w-4 h-4" /> },
    ]
  },
  { name: "Recibos", href: "/recibos", icon: <FiCreditCard className="w-5 h-5" /> },
  { name: "Instrucciones BL", href: "/instrucciones-bl", icon: <FiFileText className="w-5 h-5" /> },
  { name: "Almacenamiento", href: "/archivos", icon: <FiCloud className="w-5 h-5" /> },
  { name: "Organización", href: "/organizacion", icon: <FiLayers className="w-5 h-5" /> },
  { name: "Configuración", href: "/configuracion", icon: <FiSettings className="w-5 h-5" /> },
];

export default function SideBar() {
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Comprobar si algún elemento del submenú está activo para mantener el submenú abierto
  const toggleSubmenu = (name: string) => {
    setOpenSubmenu(openSubmenu === name ? null : name);
  };

  return (
    <div className="h-screen w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 flex justify-center items-center">
        <Link href="/dashboard">
          <Image 
            src="/images/logo.png" 
            alt="Tricycle Products SI" 
            width={200} 
            height={62} 
            priority
            className="transition-all duration-300 hover:opacity-80"
          />
        </Link>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isSubmenuOpen = openSubmenu === item.name;
          
          // Comprobar si este elemento o alguno de sus subelementos está activo
          const isActive = 'href' in item 
            ? pathname === item.href || pathname.startsWith(`${item.href}/`)
            : hasSubmenu && item.submenu.some(subItem => 
                pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)
              );
          
          // Si hay un submenú activo, mantenerlo abierto
          if (isActive && hasSubmenu && openSubmenu !== item.name) {
            setOpenSubmenu(item.name);
          }
          
          return (
            <div key={item.name}>
              {hasSubmenu ? (
                <>
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`sidebar-item w-full flex justify-between items-center ${
                      isActive ? "text-primary-600 bg-primary-50" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center">
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                    </div>
                    {isSubmenuOpen ? (
                      <FiChevronDown className="w-4 h-4" />
                    ) : (
                      <FiChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  {isSubmenuOpen && (
                    <div className="pl-6 pt-1 space-y-1">
                      {item.submenu.map((subItem) => {
                        const isSubItemActive = pathname === subItem.href || pathname.startsWith(`${subItem.href}/`);
                        
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`sidebar-subitem ${
                              isSubItemActive ? "sidebar-item-active" : "sidebar-item"
                            }`}
                          >
                            {subItem.icon}
                            <span className="ml-3">{subItem.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={'href' in item && item.href ? item.href : '#'}
                  className={isActive ? "sidebar-item-active" : "sidebar-item"}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              )}
            </div>
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
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
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
  FiCloud,
  FiMessageCircle,
  FiEye,
  FiX,
  FiAlignLeft
} from "react-icons/fi";
import LogoutButton from "@/components/auth/logout-button";
import { toast } from "react-hot-toast";
// Comentar importaciones que causan errores
// import { Skeleton } from '@/components/ui/skeleton';
// import { Button } from '@/components/ui/button';

// Definición completa de los elementos del menú
const menuItems = [
  { id: "dashboard", name: "Dashboard", href: "/dashboard", icon: <FiHome className="w-5 h-5" /> },
  { id: "negocios", name: "Negocios", href: "/negocios", icon: <FiTag className="w-5 h-5" /> },
  { id: "proformas", name: "Proformas", href: "/proformas", icon: <FiFileText className="w-5 h-5" /> },
  { id: "facturas", name: "Facturas", href: "/facturas", icon: <FiFileText className="w-5 h-5" /> },
  { id: "clientes", name: "Clientes", href: "/clientes", icon: <FiUsers className="w-5 h-5" /> },
  { id: "proveedores", name: "Proveedores", href: "/proveedores", icon: <FiUsers className="w-5 h-5" /> },
  { id: "materiales", name: "Materiales", href: "/materiales", icon: <FiPackage className="w-5 h-5" /> },
  { 
    id: "logistica",
    name: "Logística", 
    icon: <FiTruck className="w-5 h-5" />,
    submenu: [
      { id: "facturas-logistica", name: "Facturas Logística", href: "/facturas-logistica", icon: <FiFileText className="w-4 h-4" /> },
      { id: "packing-lists", name: "Listas de Empaque", href: "/packing-lists", icon: <FiList className="w-4 h-4" /> },
    ]
  },
  { id: "recibos", name: "Recibos", href: "/recibos", icon: <FiCreditCard className="w-5 h-5" /> },
  { id: "instrucciones_bl", name: "Instrucciones BL", href: "/instrucciones-bl", icon: <FiFileText className="w-5 h-5" /> },
  { id: "almacenamiento", name: "Almacenamiento", href: "/archivos", icon: <FiCloud className="w-5 h-5" /> },
  { id: "organizacion", name: "Organización", href: "/organizacion", icon: <FiLayers className="w-5 h-5" /> },
  { id: "chatbot", name: "Asistente AI", href: "/chatbot", icon: <FiMessageCircle className="w-5 h-5" /> },
  { id: "configuracion", name: "Configuración", href: "/configuracion", icon: <FiSettings className="w-5 h-5" /> },
];

// Función auxiliar para obtener componente de icono según su nombre
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, JSX.Element> = {
    "FiHome": <FiHome className="w-5 h-5" />,
    "FiTag": <FiTag className="w-5 h-5" />,
    "FiFileText": <FiFileText className="w-5 h-5" />,
    "FiUsers": <FiUsers className="w-5 h-5" />,
    "FiTruck": <FiTruck className="w-5 h-5" />,
    "FiPackage": <FiPackage className="w-5 h-5" />,
    "FiList": <FiList className="w-5 h-5" />,
    "FiCreditCard": <FiCreditCard className="w-5 h-5" />,
    "FiSettings": <FiSettings className="w-5 h-5" />,
    "FiClipboard": <FiClipboard className="w-5 h-5" />,
    "FiCalendar": <FiCalendar className="w-5 h-5" />,
    "FiLayers": <FiLayers className="w-5 h-5" />,
    "FiCloud": <FiCloud className="w-5 h-5" />,
    "FiMessageCircle": <FiMessageCircle className="w-5 h-5" />,
    "FiEye": <FiEye className="w-5 h-5" />
  };
  
  return iconMap[iconName] || <FiSettings className="w-5 h-5" />;
};

export default function SideBar() {
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState<string>("UP");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [filteredMenuItems, setFilteredMenuItems] = useState(menuItems);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Obtener información del usuario y configuración de secciones visibles
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Obtener la sesión del usuario
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setIsLoading(false);
          return;
        }
        
        const email = session.user.email || 'usuario@ejemplo.com';
        setUserEmail(email);
        
        // Extraer iniciales del email
        const initials = email
          .split('@')[0]
          .split('.')
          .map(part => part.charAt(0).toUpperCase())
          .join('')
          .slice(0, 2);
        
        setUserInitials(initials || "UP");
        
        // Verificar si es admin@tricyclecrm.com
        const isAdminUser = email === 'admin@tricyclecrm.com';
        setIsAdmin(isAdminUser);
        
        if (isAdminUser) {
          // Los administradores siempre ven todas las secciones + la sección de admin
          const adminMenuItems = [...menuItems];
          adminMenuItems.push({ 
            id: "admin",
            name: "Admin Secciones", 
            href: "/admin/secciones", 
            icon: <FiEye className="w-5 h-5" /> 
          });
          setFilteredMenuItems(adminMenuItems);
          setIsLoading(false);
          return;
        }
        
        // Para usuarios no admin, intentar cargar su configuración específica
        try {
          const { data, error } = await supabase
            .from('usuario_secciones')
            .select('seccion_id, visible')
            .eq('user_id', session.user.id);
          
          if (error) {
            // Si hay un error al cargar la configuración
            if (error.code === '42P01') {
              // Si la tabla no existe, mostrar todas las secciones
              console.error('La tabla usuario_secciones no existe:', error.message);
              setFilteredMenuItems(menuItems);
            } else {
              console.error('Error al cargar secciones del usuario:', error);
              toast.error('Error al cargar el menú personalizado');
              setFilteredMenuItems(menuItems);
            }
          } else if (data && data.length > 0) {
            // Crear un mapa con las secciones visibles
            const sectionsMap = new Map<string, boolean>();
            data.forEach(item => {
              sectionsMap.set(item.seccion_id, item.visible);
            });
            
            // Filtrar el menú principal
            const filteredItems = menuItems.filter(item => {
              // Si es un elemento con submenú, verificar si algún elemento del submenú está visible
              if ('submenu' in item && item.submenu) {
                const visibleSubmenuItems = item.submenu.filter(subItem => 
                  sectionsMap.get(subItem.id) !== false // Si no está en el mapa o es true, es visible
                );
                
                // Si hay elementos visibles en el submenú, conservamos el elemento principal
                // pero ajustamos su submenú para incluir solo los visibles
                if (visibleSubmenuItems.length > 0) {
                  // @ts-ignore - Sabemos que item tiene submenu
                  item.submenu = visibleSubmenuItems;
                  return true;
                }
                return false;
              }
              
              // Para elementos simples, verificar si están visibles
              return sectionsMap.get(item.id) !== false; // Si no está en el mapa o es true, es visible
            });
            
            setFilteredMenuItems(filteredItems);
            console.log('Menú filtrado para el usuario:', filteredItems.map(i => i.id));
          } else {
            // Si no hay configuración específica, mostrar todas las secciones
            console.log('No se encontró configuración específica para el usuario, mostrando todo el menú');
            setFilteredMenuItems(menuItems);
          }
        } catch (error) {
          console.error('Error al procesar la configuración de secciones:', error);
          setFilteredMenuItems(menuItems);
        }
      } catch (error) {
        console.error('Error al cargar la información del usuario:', error);
        setFilteredMenuItems(menuItems);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [supabase]);

  // Comprobar si algún elemento del submenú está activo para mantener el submenú abierto
  const toggleSubmenu = (name: string) => {
    setOpenSubmenu(openSubmenu === name ? null : name);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
          </div>
        ) : (
          filteredMenuItems.map((item) => {
            const hasSubmenu = 'submenu' in item && item.submenu && item.submenu.length > 0;
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
              <div key={item.id || item.name}>
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
                              key={subItem.id || subItem.href}
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
          })
        )}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
              <span className="text-sm font-semibold">{userInitials}</span>
            </div>
            <div>
              <p className="text-sm font-medium">Usuario CRM</p>
              <p className="text-xs text-gray-500">{userEmail || 'usuario@ejemplo.com'}</p>
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
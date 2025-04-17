import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";
import { FiDatabase, FiSettings, FiShield, FiHome } from "react-icons/fi";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar si el usuario está autenticado
  const supabase = createServerComponentClient({ cookies });
  const { data: sessionData } = await supabase.auth.getSession();
  
  // Si el usuario no tiene sesión, redirigir al login
  if (!sessionData?.session) {
    redirect("/login");
  }
  
  // Verificar si el usuario tiene rol de administrador
  const { data: userData, error } = await supabase
    .from('perfiles')
    .select('cargo')
    .eq('id', sessionData.session.user.id)
    .single();
  
  if (!userData || error || userData.cargo !== 'admin') {
    // Redirigir a la página principal si no es administrador
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar de administración */}
      <div className="w-64 bg-gray-900 text-white">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold">Panel de Admin</h2>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link 
                href="/dashboard" 
                className="flex items-center px-3 py-2 rounded-md hover:bg-gray-800"
              >
                <FiHome className="mr-2" />
                Volver al Dashboard
              </Link>
            </li>
            
            <li className="mt-4 border-t border-gray-800 pt-4">
              <span className="px-3 py-1 text-gray-400 text-sm font-medium">
                Administración
              </span>
            </li>
            
            <li>
              <Link 
                href="/admin/db" 
                className="flex items-center px-3 py-2 rounded-md hover:bg-gray-800"
              >
                <FiDatabase className="mr-2" />
                Base de Datos
              </Link>
            </li>
            
            <li>
              <Link 
                href="/admin/users" 
                className="flex items-center px-3 py-2 rounded-md hover:bg-gray-800"
              >
                <FiShield className="mr-2" />
                Usuarios
              </Link>
            </li>
            
            <li>
              <Link 
                href="/admin/settings" 
                className="flex items-center px-3 py-2 rounded-md hover:bg-gray-800"
              >
                <FiSettings className="mr-2" />
                Configuración
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 
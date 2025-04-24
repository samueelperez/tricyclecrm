import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FiEye, FiUsers, FiSettings, FiDatabase } from "react-icons/fi";

export default async function AdminPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Verificar autenticación
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.log("Admin Page: No hay sesión, redirigiendo a login");
    redirect("/login");
  }
  
  // Verificar si es el usuario admin
  const email = session.user.email;
  if (email !== "admin@tricyclecrm.com") {
    console.log("Admin Page: Usuario no es admin, redirigiendo a dashboard");
    redirect("/dashboard");
  }
  
  console.log("Admin Page: Permitiendo acceso a", email);
  
  return (
    <div className="container mx-auto py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/secciones"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-2">
              <FiEye className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">Administrar Secciones</h2>
            </div>
            <p className="text-gray-600">
              Configure qué secciones estarán visibles para los usuarios en el sistema.
            </p>
          </Link>
          
          <Link
            href="/admin/users"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-2">
              <FiUsers className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold">Gestionar Usuarios</h2>
            </div>
            <p className="text-gray-600">
              Administre permisos y cuentas de usuario del sistema.
            </p>
          </Link>
          
          <Link
            href="/admin/db"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-2">
              <FiDatabase className="w-5 h-5 text-purple-600 mr-2" />
              <h2 className="text-xl font-semibold">Base de Datos</h2>
            </div>
            <p className="text-gray-600">
              Realice operaciones de mantenimiento en la base de datos.
            </p>
          </Link>
          
          <Link
            href="/admin/settings"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-2">
              <FiSettings className="w-5 h-5 text-amber-600 mr-2" />
              <h2 className="text-xl font-semibold">Configuración</h2>
            </div>
            <p className="text-gray-600">
              Configure parámetros globales y opciones del sistema.
            </p>
          </Link>
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-medium text-blue-800 mb-2">Área Restringida</h2>
          <p className="text-blue-700">
            Esta sección está destinada únicamente a administradores del sistema.
            Cualquier cambio realizado aquí afectará a todos los usuarios.
          </p>
        </div>
      </div>
    </div>
  );
} 
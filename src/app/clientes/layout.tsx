import { FiUser, FiUsers, FiPlus } from 'react-icons/fi'
import Link from 'next/link'
import MainLayout from "@/components/layout/main-layout"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

interface ClientesLayoutProps {
  children: React.ReactNode
}

export default async function ClientesLayout({ children }: ClientesLayoutProps) {
  // Verificar si el usuario está autenticado
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase.auth.getSession();
  
  // Si el usuario no tiene sesión, redirigir al login
  if (!data?.session) {
    redirect("/login");
  }

  return (
    <MainLayout>
      <div className="flex flex-col">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex space-x-4">
              <Link 
                href="/clientes" 
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
              >
                <FiUsers className="mr-2" />
                Todos los clientes
              </Link>
              <Link 
                href="/clientes/new" 
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
              >
                <FiPlus className="mr-2" />
                Nuevo cliente
              </Link>
            </nav>
          </div>
        </div>
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </MainLayout>
  )
} 
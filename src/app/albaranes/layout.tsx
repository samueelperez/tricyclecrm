import { FiClipboard, FiPlus, FiList, FiPackage, FiUser } from 'react-icons/fi'
import Link from 'next/link'
import MainLayout from "@/components/layout/main-layout"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

interface AlbaranesLayoutProps {
  children: React.ReactNode
}

export default async function AlbaranesLayout({ children }: AlbaranesLayoutProps) {
  // Verificar si el usuario está autenticado
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase.auth.getSession();
  
  // Si el usuario no tiene sesión, redirigir al login
  if (!data?.session) {
    redirect("/login");
  }

  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen">
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 py-3">
              <Link 
                href="/albaranes" 
                className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
              >
                <FiList className="mr-2 h-5 w-5 text-indigo-500" />
                Todos los albaranes
              </Link>
              <Link 
                href="/albaranes/new" 
                className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
              >
                <FiPlus className="mr-2 h-5 w-5 text-indigo-500" />
                Nuevo albarán
              </Link>
              <Link 
                href="/albaranes?filtroTipo=cliente" 
                className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
              >
                <FiUser className="mr-2 h-5 w-5 text-indigo-500" />
                Albaranes de cliente
              </Link>
              <Link 
                href="/albaranes?filtroTipo=proveedor" 
                className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
              >
                <FiPackage className="mr-2 h-5 w-5 text-indigo-500" />
                Albaranes de proveedor
              </Link>
            </nav>
          </div>
        </div>
        <main className="flex-grow bg-gradient-to-b from-gray-50 to-gray-100">
          {children}
        </main>
      </div>
    </MainLayout>
  )
} 
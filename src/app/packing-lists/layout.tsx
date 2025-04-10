import { FiList, FiPlus, FiPackage } from 'react-icons/fi'
import Link from 'next/link'
import MainLayout from "@/components/layout/main-layout"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

interface PackingListsLayoutProps {
  children: React.ReactNode
}

export default async function PackingListsLayout({ children }: PackingListsLayoutProps) {
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
                href="/packing-lists" 
                className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
              >
                <FiList className="mr-2 h-5 w-5 text-indigo-500" />
                Todas las listas
              </Link>
              <Link 
                href="/packing-lists/new" 
                className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
              >
                <FiPlus className="mr-2 h-5 w-5 text-indigo-500" />
                Nueva lista
              </Link>
            </nav>
          </div>
        </div>
        <main className="flex-grow">
      {children}
    </main>
      </div>
    </MainLayout>
  );
} 
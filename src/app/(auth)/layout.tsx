import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar si el usuario ya está autenticado
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase.auth.getSession();
  
  // Si el usuario ya tiene sesión, redirigir al dashboard
  if (data?.session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Tricycle CRM
          </h2>
          <p className="text-lg text-gray-500">
            Sistema de gestión para negocios, clientes y logística
          </p>
        </div>
        <div className="mt-10 flex justify-center">{children}</div>
      </div>
    </div>
  );
} 
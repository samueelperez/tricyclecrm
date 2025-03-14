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
    <div className="min-h-screen bg-[#f9fafb] flex flex-col justify-center items-center">
      <div className="w-full max-w-md bg-[#f9fafb] p-8">
        {children}
      </div>
      <div className="mt-4 text-sm text-gray-500">
        <p>Tricycle Products SL © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
} 
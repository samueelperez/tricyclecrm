import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import MainLayout from "@/components/layout/main-layout";

export default async function ChatbotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar si el usuario está autenticado
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase.auth.getSession();
  
  // Si el usuario no tiene sesión, redirigir al login
  if (!data?.session) {
    redirect("/login");
  }

  return <MainLayout>{children}</MainLayout>;
} 
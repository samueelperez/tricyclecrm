import { Metadata } from "next";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SetupDatabase from './setup-db';
import SectionVisibilityManager from './section-visibility-manager';

export const metadata: Metadata = {
  title: "Administrar Secciones | Tricycle CRM",
  description: "Gestión de visibilidad de secciones para usuarios",
};

async function isAdminUser() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return false;
  
  return session.user.email === 'admin@tricyclecrm.com';
}

export default async function AdminSeccionesPage() {
  // Verificar si el usuario es admin
  const isAdmin = await isAdminUser();
  
  if (!isAdmin) {
    redirect('/');
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Administrar Visibilidad de Secciones</h1>
      
      <SetupDatabase />
      
      <SectionVisibilityManager />
    </div>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        console.log("AdminGuard: Verificando sesión...");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("AdminGuard: No hay sesión, redirigiendo a login");
          toast.error("Sesión no encontrada. Por favor inicie sesión");
          router.push('/login');
          return;
        }

        const userEmail = session.user.email;
        console.log("AdminGuard: Email del usuario:", userEmail);
        
        if (userEmail !== 'admin@tricyclecrm.com') {
          console.log("AdminGuard: Usuario no es admin, redirigiendo a dashboard");
          toast.error("Acceso denegado: Solo administradores pueden ver esta página");
          router.push('/dashboard');
          return;
        }

        console.log("AdminGuard: Usuario es admin, permitiendo acceso");
        setIsAdmin(true);
        setLoading(false);
      } catch (error) {
        console.error('AdminGuard: Error al verificar el estado de administrador:', error);
        toast.error("Error al verificar permisos de administrador");
        router.push('/dashboard');
      }
    }

    checkAdminStatus();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-600">Verificando permisos de administrador...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
} 
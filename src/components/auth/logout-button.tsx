"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center"
    >
      {loading ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
} 
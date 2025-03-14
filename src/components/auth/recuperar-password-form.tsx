"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

export default function RecuperarPasswordForm() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMessage(
        "Se ha enviado un enlace para restablecer la contraseña a tu correo electrónico"
      );
    } catch (error) {
      console.error("Error al restablecer la contraseña:", error);
      setError("Ocurrió un error al intentar restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
        <p className="mt-2 text-gray-600">
          Ingresa tu correo electrónico para recibir un enlace de recuperación
        </p>
      </div>

      <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {message && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <p className="text-sm text-green-700">{message}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field mt-1"
            placeholder="ejemplo@correo.com"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex justify-center"
          >
            {loading ? "Enviando..." : "Enviar instrucciones"}
          </button>
        </div>

        <div className="text-center text-sm">
          <Link
            href="/login"
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </form>
    </div>
  );
} 
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

export default function RegistroForm() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
          },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMessage("Se ha enviado un enlace de verificación a tu correo electrónico");
    } catch (error) {
      console.error("Error al registrarse:", error);
      setError("Ocurrió un error al intentar registrarse");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Registro</h1>
        <p className="mt-2 text-gray-600">
          Crea una cuenta para acceder al sistema
        </p>
      </div>

      <form onSubmit={handleSignUp} className="mt-8 space-y-6">
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
            htmlFor="nombre"
            className="block text-sm font-medium text-gray-700"
          >
            Nombre completo
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="input-field mt-1"
            placeholder="Tu nombre y apellido"
          />
        </div>

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
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field mt-1"
            minLength={6}
          />
          <p className="mt-1 text-xs text-gray-500">
            Debe tener al menos 6 caracteres
          </p>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex justify-center"
          >
            {loading ? "Registrando..." : "Crear cuenta"}
          </button>
        </div>

        <div className="text-center text-sm">
          <span className="text-gray-600">¿Ya tienes una cuenta?</span>{" "}
          <Link
            href="/login"
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            Inicia sesión
          </Link>
        </div>
      </form>
    </div>
  );
} 
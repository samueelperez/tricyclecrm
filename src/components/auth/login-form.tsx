"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import Image from "next/image";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Redirigir al dashboard después de iniciar sesión correctamente
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setError("Ocurrió un error al intentar iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-6">
          {/* Intentaremos cargar el logo desde varias ubicaciones posibles */}
          <Image 
            src="/images/logo.png" 
            alt="Tricycle Products SL" 
            width={240} 
            height={80} 
            className="mb-4"
            onError={(e) => {
              // Si hay error, intentar con ruta alternativa
              const target = e.target as HTMLImageElement;
              if (target.src.includes('/images/logo.png')) {
                target.src = '/logo.png';
              }
            }}
          />
        </div>
        <h1 className="text-3xl font-bold text-blue-500">¡Bienvenido de nuevo!</h1>
        <p className="mt-2 text-gray-500">
          Por favor inicia sesión en tu cuenta
        </p>
      </div>

      <form onSubmit={handleSignIn} className="mt-8 space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Ingresa tu email"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Password"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember_me"
              name="remember_me"
              type="checkbox"
              className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300 rounded"
            />
            <label
              htmlFor="remember_me"
              className="ml-2 block text-sm text-gray-700"
            >
              Recordarme
            </label>
          </div>

          <div className="text-sm">
            <Link
              href="/recuperar-password"
              className="text-blue-500 hover:text-blue-600"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {loading ? "Iniciando sesión..." : "Login"}
          </button>
        </div>

        <div className="text-center text-sm mt-4">
          <span className="text-gray-600">¿No tienes una cuenta?</span>{" "}
          <Link
            href="/registro"
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Regístrate
          </Link>
        </div>
      </form>
    </div>
  );
} 
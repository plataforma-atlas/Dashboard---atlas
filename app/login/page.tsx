"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import LoginGridCanvas from "@/components/LoginGridCanvas";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar sesión");
        return;
      }
      router.push(searchParams.get("next") || "/");
      router.refresh();
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      <LoginGridCanvas />
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="animate-fade-in-up flex flex-col items-center gap-1.5 mb-8">
          {/* Colores fijos (no tokens de tema): este bloque vive sobre el fondo del
              LoginGridCanvas, que siempre es oscuro sin importar claro/oscuro. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vermetricas-icon.png" alt="" className="h-20 w-auto mb-2 drop-shadow-[0_0_24px_rgba(124,124,251,0.45)]" />
          <span className="text-xs uppercase tracking-[0.14em] text-secondary font-mono">Vermetricas</span>
          <h1 className="font-display text-[28px] leading-tight text-white font-semibold">Panel de clientes</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="animate-fade-in-up [animation-delay:60ms] rounded-lg border border-outline bg-surface p-6 flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border border-outline rounded-md px-3 py-2.5 text-[15px] text-on-surface focus:border-primary outline-none transition-colors duration-150"
              placeholder="tu@correo.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Contraseña</label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <Link href="/olvide-password" className="press self-end text-sm text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="press mt-2 rounded-md bg-primary text-on-primary text-[15px] font-medium py-3 hover:brightness-110 disabled:opacity-50 disabled:active:scale-100 transition-[transform,filter] duration-150"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <p className="animate-fade-in-up [animation-delay:120ms] text-center text-sm text-on-surface-variant mt-5">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="press text-primary hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

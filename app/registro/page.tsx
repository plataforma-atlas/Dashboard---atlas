"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useThemeMode } from "@/components/ThemeModeProvider";
import ThemeModeToggle from "@/components/ThemeModeToggle";

export default function RegistroPage() {
  const router = useRouter();
  const { mode, toggleMode } = useThemeMode();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo crear la cuenta");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex justify-end px-4 pt-4">
        <ThemeModeToggle mode={mode} onToggle={toggleMode} />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-1 mb-8">
          <span className="text-[11px] uppercase tracking-[0.14em] text-primary font-mono">Agencia Atlas</span>
          <h1 className="font-display text-2xl text-on-surface font-semibold">Crear cuenta</h1>
        </div>

        {success ? (
          <div className="rounded-lg border border-outline bg-surface p-6 text-center">
            <p className="text-secondary text-sm">Cuenta creada — redirigiendo a login…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-lg border border-outline bg-surface p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-[0.1em] text-on-surface-faint">Nombre</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary outline-none"
                placeholder="Tu nombre"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-[0.1em] text-on-surface-faint">Correo</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary outline-none"
                placeholder="tu@correo.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-[0.1em] text-on-surface-faint">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary outline-none"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && <p className="text-sm text-error">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-md bg-primary text-on-primary text-sm font-medium py-2.5 hover:brightness-110 disabled:opacity-50 transition"
            >
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </button>
            <p className="text-xs text-on-surface-faint text-center">
              Tu cuenta se crea sin acceso a ningún cliente todavía — un admin te lo asigna después.
            </p>
          </form>
        )}

        <p className="text-center text-sm text-on-surface-variant mt-5">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
}

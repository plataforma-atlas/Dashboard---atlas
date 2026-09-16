"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import LoginGridCanvas from "@/components/LoginGridCanvas";

export default function RestablecerPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/restablecer-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, nueva_password: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo actualizar la contraseña");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1800);
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
          <div className="flex flex-col items-center gap-1 mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/vermetricas-icon.png" alt="" className="h-20 w-auto mb-2 drop-shadow-[0_0_24px_rgba(124,124,251,0.45)]" />
            <span className="text-[11px] uppercase tracking-[0.14em] text-secondary font-mono">Vermetricas</span>
            <h1 className="font-display text-2xl text-white font-semibold text-center">Crear nueva contraseña</h1>
          </div>

          {success ? (
            <div className="rounded-lg border border-outline bg-surface p-6 text-center">
              <p className="text-secondary text-sm">Contraseña actualizada — redirigiendo a login…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-lg border border-outline bg-surface p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-[0.1em] text-on-surface-faint">Nueva contraseña</label>
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-[0.1em] text-on-surface-faint">Confirmar contraseña</label>
                <PasswordInput
                  value={passwordConfirm}
                  onChange={setPasswordConfirm}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Repite la contraseña"
                />
                {passwordConfirm && password !== passwordConfirm && (
                  <p className="text-xs text-error">Las contraseñas no coinciden</p>
                )}
              </div>

              {error && <p className="text-sm text-error">{error}</p>}

              <button
                type="submit"
                disabled={loading || (passwordConfirm !== "" && password !== passwordConfirm)}
                className="mt-2 rounded-md bg-primary text-on-primary text-sm font-medium py-2.5 hover:brightness-110 disabled:opacity-50 transition"
              >
                {loading ? "Guardando…" : "Guardar nueva contraseña"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-on-surface-variant mt-5">
            <Link href="/login" className="text-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

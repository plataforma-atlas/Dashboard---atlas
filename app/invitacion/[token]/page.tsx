"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useThemeMode } from "@/components/ThemeModeProvider";
import ThemeModeToggle from "@/components/ThemeModeToggle";
import PasswordInput from "@/components/PasswordInput";
import LoginGridCanvas from "@/components/LoginGridCanvas";

export default function InvitacionPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { mode, toggleMode } = useThemeMode();
  const [checking, setChecking] = useState(true);
  const [clienteNombre, setClienteNombre] = useState<string | null>(null);
  const [invalidToken, setInvalidToken] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/invitacion/verificar?token=${encodeURIComponent(params.token)}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          setInvalidToken(true);
          return;
        }
        setClienteNombre(data.cliente_nombre || data.cliente_id);
      } catch {
        setInvalidToken(true);
      } finally {
        setChecking(false);
      }
    })();
  }, [params.token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/registro-invitado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo crear la cuenta");
        return;
      }
      if (data.autoLogin) {
        router.push("/panel/conexiones");
        router.refresh();
      } else {
        router.push("/login");
      }
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      <LoginGridCanvas />
      <div className="relative z-10 flex justify-end px-4 pt-4">
        <ThemeModeToggle mode={mode} onToggle={toggleMode} />
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          {/* Colores fijos (no tokens de tema): este bloque vive sobre el fondo del
              LoginGridCanvas, que siempre es oscuro sin importar claro/oscuro. */}
          <div className="flex flex-col items-center gap-1 mb-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/vermetricas-icon.png" alt="" className="h-20 w-auto mb-2 drop-shadow-[0_0_24px_rgba(124,124,251,0.45)]" />
            <span className="text-[11px] uppercase tracking-[0.14em] text-secondary font-mono">Vermetricas</span>
            <h1 className="font-display text-2xl text-white font-semibold">Crea tu cuenta</h1>
            {clienteNombre && (
              <p className="text-sm text-white/70">
                Te invitaron como <span className="text-white font-medium">{clienteNombre}</span>
              </p>
            )}
          </div>

          {checking ? (
            <p className="text-sm text-on-surface-variant text-center">Verificando invitación…</p>
          ) : invalidToken ? (
            <div className="rounded-lg border border-outline-error bg-error-container p-6 text-center">
              <p className="text-sm text-error">Esta invitación no es válida o ya expiró. Pide a tu agencia que te envíe una nueva.</p>
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
                <PasswordInput value={password} onChange={setPassword} required minLength={6} autoComplete="new-password" placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-[0.1em] text-on-surface-faint">Confirmar contraseña</label>
                <PasswordInput value={passwordConfirm} onChange={setPasswordConfirm} required minLength={6} autoComplete="new-password" placeholder="Repite la contraseña" />
                {passwordConfirm && password !== passwordConfirm && <p className="text-xs text-error">Las contraseñas no coinciden</p>}
              </div>

              {error && <p className="text-sm text-error">{error}</p>}

              <button
                type="submit"
                disabled={loading || (passwordConfirm !== "" && password !== passwordConfirm)}
                className="mt-2 rounded-md bg-primary text-on-primary text-sm font-medium py-2.5 hover:brightness-110 disabled:opacity-50 transition"
              >
                {loading ? "Creando cuenta…" : "Crear cuenta y continuar"}
              </button>
              <p className="text-xs text-on-surface-faint text-center">
                Después de crear tu cuenta vas a poder conectar tus integraciones (GoHighLevel y las que apliquen) desde tu panel.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

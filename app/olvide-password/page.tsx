"use client";

import { useState } from "react";
import Link from "next/link";
import LoginGridCanvas from "@/components/LoginGridCanvas";

export default function OlvidePasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/olvide-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setEnviado(true);
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/vermetricas-icon.png" alt="" className="h-20 w-auto mb-2 drop-shadow-[0_0_24px_rgba(124,124,251,0.45)]" />
            <span className="text-xs uppercase tracking-[0.14em] text-secondary font-mono">Vermetricas</span>
            <h1 className="font-display text-[28px] leading-tight text-white font-semibold text-center">Recuperar contraseña</h1>
          </div>

          {enviado ? (
            <div className="animate-pop-in rounded-lg border border-outline bg-surface p-6 text-center flex flex-col gap-2">
              <p className="text-secondary text-[15px]">
                Si <span className="text-on-surface">{email}</span> tiene una cuenta con nosotros, te enviamos un correo con un enlace para crear una contraseña nueva.
              </p>
              <p className="text-xs text-on-surface-faint">Revisa también tu carpeta de spam.</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="animate-fade-in-up [animation-delay:60ms] rounded-lg border border-outline bg-surface p-6 flex flex-col gap-4"
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
              <p className="text-xs text-on-surface-faint">
                Te enviaremos un enlace para crear una contraseña nueva, válido por 1 hora.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="press mt-2 rounded-md bg-primary text-on-primary text-[15px] font-medium py-3 hover:brightness-110 disabled:opacity-50 disabled:active:scale-100 transition-[transform,filter] duration-150"
              >
                {loading ? "Enviando…" : "Enviar enlace"}
              </button>
            </form>
          )}

          <p className="animate-fade-in-up [animation-delay:120ms] text-center text-sm text-on-surface-variant mt-5">
            <Link href="/login" className="press text-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

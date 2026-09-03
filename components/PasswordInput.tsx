"use client";

import { useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  className?: string;
};

export default function PasswordInput({ value, onChange, placeholder, required, minLength, autoComplete, className }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          className ??
          "w-full bg-background border border-outline rounded-md px-3 py-2 pr-10 text-sm text-on-surface focus:border-primary outline-none"
        }
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        tabIndex={-1}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-faint hover:text-on-surface text-sm"
      >
        {visible ? "🙈" : "👁"}
      </button>
    </div>
  );
}

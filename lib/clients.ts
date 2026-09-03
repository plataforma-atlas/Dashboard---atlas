export type ClientTheme = {
  background: string;
  surface: string;
  surfaceHigh: string;
  outline: string;
  primary: string;
  secondary: string;
  onSurface: string;
  onSurfaceVariant: string;
  onSurfaceFaint: string;
};

export type ClientConfig = {
  id: string;
  name: string;
  theme: ClientTheme;
};

// Identidad única de todo el sistema — ya no varía por cliente (decisión: un solo
// look de agencia, tomado del Webinar Control Center real, en vez de theming por
// cliente). Ver app/webinar-control-center.css para la versión clara (light mode).
export const agencyTheme: ClientTheme = {
  background: "#0E1015",
  surface: "#181A22",
  surfaceHigh: "#1F222C",
  outline: "#272A35",
  primary: "#7C7CFB",
  secondary: "#A5A0FF",
  onSurface: "#F3F4F6",
  onSurfaceVariant: "#9CA3AF",
  onSurfaceFaint: "#6B7280",
};

// Todos los clientes usan la misma identidad fija — no hay overrides por cliente.
export function themeForClient(_clienteId: string): ClientTheme {
  return agencyTheme;
}

// La lista real de clientes ahora vive en Postgres (ver /api/clientes) — este
// solo se usa como fallback antes de que esa carga termine.
export const defaultClient: ClientConfig = { id: "floppy", name: "Cargando…", theme: agencyTheme };

// Variante clara de la identidad fija — mismos valores para todo el sistema.
export function toLightTheme(_theme: ClientTheme): ClientTheme {
  return {
    background: "#F6F7FB",
    surface: "#FFFFFF",
    surfaceHigh: "#F1F2F6",
    outline: "#E5E7EE",
    primary: "#5B5BF7",
    secondary: "#8B86FF",
    onSurface: "#17191F",
    onSurfaceVariant: "#707684",
    onSurfaceFaint: "#9CA3AF",
  };
}

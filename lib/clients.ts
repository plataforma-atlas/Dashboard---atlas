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

// Atlas = la agencia (shell fijo, no seleccionable). Ver DESIGN.md.
export const agencyTheme: ClientTheme = {
  background: "#1A1A1A",
  surface: "#221F1A",
  surfaceHigh: "#2A2620",
  outline: "#3A3428",
  primary: "#C9A96E",
  secondary: "#D4C5A0",
  onSurface: "#F5F0E8",
  onSurfaceVariant: "#B0A48C",
  onSurfaceFaint: "#7A715E",
};

// Paletas de marca propias, solo para los clientes que ya tienen una definida.
// Cualquier cliente que no aparezca aquí (incluyendo los creados desde
// Admin > Clientes) hereda el shell genérico de Atlas (agencyTheme) —
// DESIGN.md: no inventar colores de marca que el cliente no ha definido.
export const clientThemeOverrides: Record<string, ClientTheme> = {
  floppy: {
    background: "#0B0E14",
    surface: "#12161F",
    surfaceHigh: "#181D29",
    outline: "#232838",
    primary: "#F5A623",
    secondary: "#34D2A6",
    onSurface: "#E8EAF0",
    onSurfaceVariant: "#8892A6",
    onSurfaceFaint: "#4B5468",
  },
  andrea: {
    background: "#1A1410",
    surface: "#3D2314",
    surfaceHigh: "#6B3E26",
    outline: "#6B3E26",
    primary: "#B8915A",
    secondary: "#C9A45C",
    onSurface: "#FDFAF6",
    onSurfaceVariant: "#E8DDD0",
    onSurfaceFaint: "#43291B",
  },
};

export function themeForClient(clienteId: string): ClientTheme {
  return clientThemeOverrides[clienteId] ?? agencyTheme;
}

// La lista real de clientes ahora vive en Postgres (ver /api/clientes) — este
// solo se usa como fallback antes de que esa carga termine.
export const defaultClient: ClientConfig = { id: "floppy", name: "Cargando…", theme: agencyTheme };

// Variante clara de cualquier tema de cliente: los neutros (fondo/superficie/texto)
// se invierten a valores claros, pero primary/secondary (el color de marca de cada
// cliente) se conservan intactos para no perder identidad visual.
export function toLightTheme(theme: ClientTheme): ClientTheme {
  return {
    background: "#F7F5F1",
    surface: "#FFFFFF",
    surfaceHigh: "#F1EDE4",
    outline: "#E4DFD3",
    primary: theme.primary,
    secondary: theme.secondary,
    onSurface: "#1A1A1A",
    onSurfaceVariant: "#5B5348",
    onSurfaceFaint: "#8C8371",
  };
}

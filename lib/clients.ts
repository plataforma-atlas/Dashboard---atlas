export type ClientTheme = {
  bg: string; // fondo principal
  panel: string; // tarjetas
  panel2: string; // tarjetas elevadas
  stroke: string; // bordes sutiles
  accent: string; // acento primario (marca)
  accent2: string; // acento secundario (ingresos/éxito)
  text: string; // texto principal
  mute: string; // texto secundario
  faint: string; // texto terciario / labels
};

export type ClientConfig = {
  id: string;
  name: string;
  theme: ClientTheme;
  // Si cada cliente tiene su propia tabla/subcuenta en n8n, este id se manda
  // como query param al webhook para que el workflow sepa qué datos traer.
  clienteId?: string;
};

export const clients: ClientConfig[] = [
  {
    id: "atlas",
    name: "Atlas",
    clienteId: "atlas",
    theme: {
      bg: "#1a1a1a", // Negro Atlas
      panel: "#221f1a",
      panel2: "#2a2620",
      stroke: "#3a3428",
      accent: "#c9a96e", // Dorado Atlas
      accent2: "#d4c5a0", // Beige Arena
      text: "#f5f0e8", // Crema Marfil
      mute: "#b0a48c",
      faint: "#7a715e",
    },
  },
  {
    id: "floppy",
    name: "Método Floppy",
    clienteId: "floppy",
    theme: {
      bg: "#0B0E14",
      panel: "#12161F",
      panel2: "#181D29",
      stroke: "#232838",
      accent: "#F5A623",
      accent2: "#34D2A6",
      text: "#E8EAF0",
      mute: "#8892A6",
      faint: "#4B5468",
    },
  },
];

export const defaultClient = clients[0];

const ESTILOS: Record<"success" | "pending" | "neutral", string> = {
  success: "border-outline-success bg-success-container text-success",
  pending: "border-primary/40 bg-primary/10 text-primary",
  neutral: "border-outline text-on-surface-faint",
};

const ETIQUETA_DEFECTO: Record<"success" | "pending" | "neutral", string> = {
  success: "Conectado",
  pending: "Conectando",
  neutral: "No conectado",
};

function StatusDot({ variant }: { variant: "success" | "pending" | "neutral" }) {
  if (variant === "neutral") {
    return <span className="h-2 w-2 rounded-full bg-on-surface-faint" />;
  }
  if (variant === "pending") {
    return <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />;
  }
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
    </span>
  );
}

// Pill de estado de una conexión (GHL/Meta Ads/Hotmart en Conexiones) — antes
// repetido a mano 3 veces con la misma marca; acá queda un solo lugar para
// agregar un estado nuevo (ej. "error") más adelante.
export default function Status({
  variant,
  children,
}: {
  variant: "success" | "pending" | "neutral";
  children?: React.ReactNode;
}) {
  return (
    <span className={`flex items-center gap-2 text-[13px] px-3 py-1.5 rounded-full border shrink-0 ${ESTILOS[variant]}`}>
      <StatusDot variant={variant} />
      {children ?? ETIQUETA_DEFECTO[variant]}
    </span>
  );
}

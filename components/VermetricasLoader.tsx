export default function VermetricasLoader({ size = 72 }: { size?: number }) {
  return (
    <div className="verm-loader" style={{ width: size, height: size * 0.96 }} role="status" aria-label="Cargando">
      <svg viewBox="0 0 100 96" className="verm-loader__line" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="verm-loader-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-secondary)" />
          </linearGradient>
        </defs>
        <path
          d="M8 10 L50 80 L92 10"
          fill="none"
          stroke="url(#verm-loader-grad)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="1"
        />
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/vermetricas-icon.png" alt="" className="verm-loader__solid" />
    </div>
  );
}

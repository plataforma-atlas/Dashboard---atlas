"use client";

import { useEffect, useRef } from "react";

// Fondo animado de las pantallas de auth (login/registro/invitación): grid de
// rectángulos redondeados con un punto de luz que viaja y va iluminando a sus
// vecinos por distancia real. Siempre oscuro a propósito, sin importar el modo
// claro/oscuro del resto del sitio (mismo criterio que el LoginGridGlow que
// reemplaza). Afinado a mano con el usuario: 8 columnas x 3 filas, celdas
// cortas (no muy altas).
export default function LoginGridCanvas() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const COL = { base: "#0E1018", low: "#181A2D", mid: "#5B5BF7", hot: "#A5A0FF" };
    const cfg = {
      rows: 6,
      gapX: 7,
      gapY: 7,
      radius: 2,
      cycle: 4700,
      sourceRow: 3,
      shadowX: 7,
      shadowY: 7,
      spread: 3.2,
      spreadY: 1.8,
      spreadYEdge: 3.8,
    };

    let W = 0;
    let H = 0;
    let DPR = 1;
    let rafId = 0;
    // El canvas dibuja "bleed" px de más a cada lado (recortados por el
    // overflow-hidden del contenedor) para que el resplandor/sombra de las
    // celdas del borde no se corte en seco contra el límite del canvas —
    // sin esto, la luz parecía "salirse de la página" al llegar a cada
    // extremo del recorrido.
    const bleed = 24;

    function resize() {
      if (!stage || !canvas) return;
      const r = stage.getBoundingClientRect();
      W = r.width;
      H = r.height;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.left = `-${bleed}px`;
      canvas.style.width = `${W + bleed * 2}px`;
      canvas.width = Math.round((W + bleed * 2) * DPR);
      canvas.height = Math.round(H * DPR);
      ctx!.setTransform(DPR, 0, 0, DPR, bleed * DPR, 0);
    }

    const rgb = (h: string) => {
      const n = parseInt(h.replace("#", ""), 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    };
    const base = rgb(COL.base);
    const low = rgb(COL.low);
    const mid = rgb(COL.mid);
    const hot = rgb(COL.hot);
    const white = { r: 255, g: 255, b: 255 };

    const mix = (a: typeof base, b: typeof base, t: number) => ({
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
    });
    const rgba = (c: typeof base, a = 1) => `rgba(${c.r},${c.g},${c.b},${a})`;
    const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const smooth = (t: number) => t * t * (3 - 2 * t);
    function travel(t: number) {
      t %= 1;
      return t < 0.5 ? smooth(t * 2) : smooth((1 - t) * 2);
    }

    function rounded(x: number, y: number, w: number, h: number, r: number) {
      ctx!.beginPath();
      ctx!.moveTo(x + r, y);
      ctx!.arcTo(x + w, y, x + w, y + h, r);
      ctx!.arcTo(x + w, y + h, x, y + h, r);
      ctx!.arcTo(x, y + h, x, y, r);
      ctx!.arcTo(x, y, x + w, y, r);
      ctx!.closePath();
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Se detiene (congela el frame actual) mientras el usuario está escribiendo
    // en algún campo del formulario, para no distraer. Además, al enfocar un
    // campo la luz baja a la última fila (debajo de la card) y se queda ahí
    // — al dejar de escribir, retoma el recorrido desde ese mismo punto en
    // vez de saltar de vuelta a la fila original.
    let paused = false;
    let activeRow = cfg.sourceRow;
    let pauseStart = 0;
    let pausedElapsed = 0;
    let frozenNow = 0;
    const isFormField = (el: EventTarget | null) => {
      const tag = (el as HTMLElement)?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA";
    };
    const handleFocusIn = (e: FocusEvent) => {
      if (!isFormField(e.target)) return;
      pauseStart = performance.now();
      frozenNow = pauseStart - pausedElapsed;
      paused = true;
      activeRow = cfg.rows - 1;
    };
    const handleFocusOut = (e: FocusEvent) => {
      if (!isFormField(e.target)) return;
      paused = false;
      pausedElapsed += performance.now() - pauseStart;
    };
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    function draw(rawNow: number) {
      // Congelado: se sigue dibujando (para reflejar el cambio de fila al
      // enfocar un campo), pero con el reloj detenido en el instante en que
      // empezó la pausa, así la columna no avanza mientras se escribe.
      const now = paused ? frozenNow : rawNow - pausedElapsed;
      ctx!.clearRect(-bleed, 0, W + bleed * 2, H);

      const padX = 0;
      const padY = Math.max(18, H * 0.06);
      const usableW = W - padX * 2;
      const usableH = H - padY * 2;

      // Filas fijas (cubren toda la altura); columnas se recalculan según el
      // ancho disponible para que la celda SIEMPRE quede vertical (más alta
      // que ancha) y a la vez la grilla llene el ancho completo, sin huecos
      // ni rectángulos acostados en pantallas anchas.
      // Sin tope: si la ventana es más alta, la celda crece para llenar el
      // alto completo (igual criterio que las columnas con el ancho) — antes
      // un tope de 240px dejaba una franja vacía sin rectángulos abajo en
      // pantallas altas.
      const rawCellH = (usableH - cfg.gapY * (cfg.rows - 1)) / cfg.rows;
      const cellH = rawCellH;
      const targetCellW = cellH * 0.62;
      const cols = Math.max(1, Math.round((usableW + cfg.gapX) / (targetCellW + cfg.gapX)));
      const cellW = (usableW - cfg.gapX * (cols - 1)) / cols;
      // El alcance del brillo escala con la cantidad de columnas — si no, en
      // pantallas anchas (más columnas) gran parte de la grilla queda casi
      // apagada porque el radio de luz se pensó para una grilla más angosta.
      const spread = Math.max(cfg.spread, cols * 0.32);

      const gridW = cellW * cols + cfg.gapX * (cols - 1);
      const gridH = cellH * cfg.rows + cfg.gapY * (cfg.rows - 1);
      const startX = (W - gridW) / 2;
      const startY = (H - gridH) / 2;

      // El recorrido se pasa un poco de cada borde (overshoot) para que el
      // destello alcance a "salirse" de la página — la celda del borde deja
      // de verse como núcleo sólido y se apaga como si fuera solo la mitad
      // del destello, en vez de quedar pegado ahí como bloque fijo.
      const overshoot = 0.9;
      const t = reducedMotion ? 0.5 : (now % cfg.cycle) / cfg.cycle;
      const pos = -overshoot + travel(t) * (cols - 1 + overshoot * 2);
      const sourceX = startX + pos * (cellW + cfg.gapX);
      const sourceY = startY + (activeRow + 0.5) * (cellH + cfg.gapY);
      // La celda "núcleo" (la más brillante) es siempre UNA sola: la más
      // cercana en fila/columna a la posición de la luz. Antes se marcaba
      // por radio de distancia (dist < umbral), lo que dejaba dos celdas
      // igual de cerca prendidas a la vez cuando la luz pasaba justo entre
      // dos columnas.
      const coreCol = Math.max(0, Math.min(cols - 1, Math.round(pos)));
      const coreDist = Math.abs(pos - coreCol);
      const coreRow = Math.max(0, Math.min(cfg.rows - 1, Math.round(activeRow)));

      // Efecto abanico: cerca de cada extremo del recorrido, el bombillo se
      // "acerca al borde" y el haz se abre iluminando varias filas de esa
      // columna (como en la referencia), en vez de solo una. Al alejarse del
      // borde vuelve a cerrarse a una sola fila (spreadY normal).
      const distFromEdge = Math.min(pos, cols - 1 - pos);
      const edgeRange = 2.2;
      const fanT = smooth(clamp(1 - distFromEdge / edgeRange));
      const spreadY = cfg.spreadY + (cfg.spreadYEdge - cfg.spreadY) * fanT;

      const halo = ctx!.createRadialGradient(sourceX, sourceY, 0, sourceX, sourceY, cellW * 6.0);
      halo.addColorStop(0, rgba(hot, 0.075));
      halo.addColorStop(0.38, rgba(mid, 0.032));
      halo.addColorStop(1, rgba(mid, 0));
      ctx!.fillStyle = halo;
      ctx!.fillRect(-bleed, 0, W + bleed * 2, H);

      // Una fila extra arriba y otra abajo (fuera del rango "real" de filas)
      // para que se asome un rectángulo más en cada margen, en vez de dejar
      // ese espacio vacío — el degradado ya existente se encarga de
      // desvanecerlas hacia el borde.
      for (let r = -1; r <= cfg.rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = startX + c * (cellW + cfg.gapX);
          const y = startY + r * (cellH + cfg.gapY);
          const cx = x + cellW / 2;
          const cy = y + cellH / 2;

          const dx = (cx - sourceX) / (cellW + cfg.gapX);
          const dy = (cy - sourceY) / (cellH + cfg.gapY);

          // Caída anisotrópica: horizontal (spread, sigue el recorrido de la
          // luz) más amplia que la vertical (spreadY) — así la fila de
          // arriba/abajo de la celda que brilla se apaga notablemente más
          // rápido, en vez de quedar casi tan brillante como la fila activa.
          // spreadY se abre cerca de los bordes (efecto abanico).
          let intensity = Math.exp(-((dx * dx) / (2 * spread) + (dy * dy) / (2 * spreadY)));
          intensity = Math.pow(intensity, 1.04);
          // El núcleo solo se ve como bloque sólido mientras la luz está
          // razonablemente encima de esta celda — si se pasó de largo hacia
          // un borde (overshoot), deja de ser "núcleo" y se apaga con la
          // caída normal, como el destello quedándose a la mitad al salir.
          const core = r === coreRow && c === coreCol && coreDist < 0.55;
          if (core) intensity = 0.82;

          ctx!.save();
          ctx!.shadowColor = "rgba(0,0,0,.72)";
          ctx!.shadowBlur = 10;
          rounded(x + cfg.shadowX, y + cfg.shadowY, cellW, cellH, cfg.radius);
          ctx!.fillStyle = "rgba(3,6,7,.95)";
          ctx!.fill();
          ctx!.restore();

          let vx = sourceX - cx;
          let vy = sourceY - cy;
          const len = Math.hypot(vx, vy) || 1;
          vx /= len;
          vy /= len;

          const reach = Math.max(cellW, cellH) * 0.7;
          const gx1 = cx + vx * reach;
          const gy1 = cy + vy * reach;
          const gx2 = cx - vx * reach;
          const gy2 = cy - vy * reach;

          // Piso de contraste: incluso una celda sin nada de luz cerca debe
          // seguir viéndose como rectángulo (no como fondo vacío) — antes,
          // las filas lejos del recorrido de la luz quedaban casi negras.
          const dark = mix(base, low, 0.48 + intensity * 0.14);
          const lit = mix(low, mid, clamp(intensity * 0.86));
          const peak = mix(lit, hot, clamp((intensity - 0.24) * 1.25));

          rounded(x, y, cellW, cellH, cfg.radius);
          const g = ctx!.createLinearGradient(gx1, gy1, gx2, gy2);
          g.addColorStop(0, rgba(core ? hot : peak, 0.99));
          g.addColorStop(0.34, rgba(lit, 0.99));
          g.addColorStop(1, rgba(dark, 0.995));
          ctx!.fillStyle = g;
          ctx!.fill();

          rounded(x, y, cellW, cellH, cfg.radius);
          const depth = ctx!.createLinearGradient(x, y, x, y + cellH);
          depth.addColorStop(0, "rgba(255,255,255,.010)");
          depth.addColorStop(0.7, "rgba(0,0,0,.03)");
          depth.addColorStop(1, "rgba(0,0,0,.22)");
          ctx!.fillStyle = depth;
          ctx!.fill();

          const edge = ctx!.createLinearGradient(gx1, gy1, gx2, gy2);
          edge.addColorStop(0, rgba(mix(mid, white, 0.2), 0.16 + intensity * 0.2));
          edge.addColorStop(0.18, "rgba(255,255,255,0)");
          edge.addColorStop(1, "rgba(255,255,255,0)");
          rounded(x + 0.45, y + 0.45, cellW - 0.9, cellH - 0.9, cfg.radius);
          ctx!.strokeStyle = edge;
          ctx!.lineWidth = 0.8;
          ctx!.stroke();

          if (core) {
            // Bloque de color sólido y parejo (sin degradado interno), como
            // en la referencia — más gráfico que un resplandor continuo.
            rounded(x, y, cellW, cellH, cfg.radius);
            ctx!.save();
            ctx!.globalAlpha = 0.85;
            ctx!.fillStyle = rgba(hot, 1);
            ctx!.shadowColor = rgba(hot, 0.3);
            ctx!.shadowBlur = 14;
            ctx!.fill();
            ctx!.restore();
          }
        }
      }

      if (!reducedMotion) rafId = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();
    rafId = requestAnimationFrame(draw);

    return () => {
      ro.disconnect();
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={stageRef} className="absolute inset-0 overflow-hidden" style={{ background: "#090d0e" }} aria-hidden="true">
      <canvas ref={canvasRef} className="absolute top-0 h-full" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg,#090d0e 0%,#090d0e 28%,transparent 48%), linear-gradient(180deg,transparent 52%,rgba(9,13,14,.82) 72%), linear-gradient(180deg,rgba(9,13,14,.08),transparent 12%,transparent 90%,rgba(9,13,14,.14))",
        }}
      />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

// Sin `framer-motion`/`motion` como dependencia — este hook cubre lo único
// que necesitábamos de esa librería (saber si el usuario pidió menos
// movimiento), sin sumar un paquete nuevo para una sola bandera.
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  return reduced;
}

/**
 * El número sube desde el valor anterior al cambiar `value` (no siempre desde
 * cero — si era 12 y pasa a 15, cuenta 12→15, no 0→15).
 *
 * Medido con reloj real (`performance.now`), no contando frames: dura lo
 * mismo en 60Hz que en 120Hz y termina siempre en el valor exacto.
 *
 * Si la pestaña está en segundo plano el navegador no corre ningún frame de
 * animación, así que un contador que arranca en un valor viejo se quedaría
 * ahí — por eso, con la pestaña oculta o "reducir movimiento" activo, se
 * muestra el valor final de una vez en lugar de animar a medias o no animar.
 */
export default function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString("es-CO"),
  duration = 1100,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(0);
  const desde = useRef(0);

  useEffect(() => {
    if (reducedMotion || document.hidden) {
      setVisible(value);
      desde.current = value;
      return;
    }

    const inicio = performance.now();
    const arranca = desde.current;
    let vivo = true;

    function paso(ahora: number) {
      if (!vivo) return;
      const t = Math.min(1, (ahora - inicio) / duration);
      const suave = 1 - Math.pow(1 - t, 3); // easeOut cúbico
      setVisible(arranca + (value - arranca) * suave);
      if (t < 1) requestAnimationFrame(paso);
      else {
        setVisible(value);
        desde.current = value;
      }
    }
    requestAnimationFrame(paso);

    return () => {
      vivo = false;
    };
  }, [value, duration, reducedMotion]);

  return <span className="tabular">{format(visible)}</span>;
}

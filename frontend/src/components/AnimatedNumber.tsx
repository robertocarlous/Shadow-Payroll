import { useEffect, useRef, useState } from 'react';

/**
 * Renders a number that eases from its previous value to the new one,
 * so live on-chain updates read as motion instead of a hard swap.
 */
export function AnimatedNumber({
  value,
  duration = 900,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      prevRef.current = to;
      setDisplay(to);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <span className={className}>{display.toLocaleString('en-US')}</span>;
}

import { useEffect, useRef, useState } from 'react';
import { AnimatedNumber } from './AnimatedNumber';

const PHASES = [
  { svgPhase: 0, label: 'New moon — awaiting the first claim' },
  { svgPhase: 0.25, label: 'Waxing crescent — claims are starting' },
  { svgPhase: 0.5, label: 'First quarter — halfway there' },
  { svgPhase: 0.75, label: 'Waxing gibbous — most of the payroll is out' },
  { svgPhase: 1, label: 'Full moon — fully reconciled' },
];

function PhaseGlyph({ phase }: { phase: number }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="phase-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="50%" stopColor="#f2c94c" />
          <stop offset="100%" stopColor="#e8a13a" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#phase-grad)" />
      {phase < 1 && (
        <path
          d="M14 2a10 10 0 0 0 0 20c1.5-2 2.2-5.5 2.2-10S15.5 4 14 2z"
          fill="#0b0820"
          fillOpacity={phase === 0 ? 1 : 0.8}
        />
      )}
      {phase === 1 && <circle cx="12" cy="12" r="3.5" fill="#0b0820" fillOpacity="0.08" />}
    </svg>
  );
}

function phaseFor(pct: number): (typeof PHASES)[number] {
  if (pct >= 100) return PHASES[4];
  if (pct >= 75) return PHASES[3];
  if (pct >= 50) return PHASES[2];
  if (pct > 0) return PHASES[1];
  return PHASES[0];
}

/**
 * The signature dashboard visual: distribution progress drawn as the moon
 * filling from new to full, ringed by an exact-progress arc.
 */
export function MoonPhase({
  pct,
  reconciled,
  initialized,
}: {
  pct: number;
  reconciled: boolean;
  initialized: boolean;
}) {
  const phase = phaseFor(pct);
  const R = 104;
  const CIRC = 2 * Math.PI * R;
  const arcLen = (CIRC * Math.min(100, Math.max(0, pct))) / 100;

  return (
    <div className={`moonviz ${reconciled ? 'is-full' : ''} ${initialized ? '' : 'is-waiting'}`}>
      <div className="moonviz__stage">
        <svg className="moonviz__ring" viewBox="0 0 240 240" aria-hidden="true">
          <defs>
            <linearGradient id="ringArcGrad" x1="0" y1="1" x2="1" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7c6cf0" />
              <stop offset="55%" stopColor="#f0c356" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>
          <circle className="moonviz__ring-track" cx="120" cy="120" r={R} />
          <circle
            className="moonviz__ring-arc"
            cx="120"
            cy="120"
            r={R}
            strokeDasharray={`${arcLen} ${CIRC}`}
            transform="rotate(-90 120 120)"
          />
        </svg>

        <div className="moonviz__moon" role="img" aria-label={`Payroll ${pct}% distributed`}>
          <div className="moonviz__fill" style={{ height: `${pct}%` }} />
          <span className="moonviz__crater moonviz__crater--a" />
          <span className="moonviz__crater moonviz__crater--b" />
          <span className="moonviz__crater moonviz__crater--c" />
        </div>

        <div className="moonviz__readout">
          <span className="moonviz__phase-glyph">
            <PhaseGlyph phase={phase.svgPhase} />
          </span>
          <span className="moonviz__pct">
            <AnimatedNumber value={pct} />%
          </span>
        </div>
      </div>

      <p className="moonviz__phase-label">{phase.label}</p>
    </div>
  );
}

const CELEBRATION_MS = 7000;

/**
 * Fires a brief confetti burst only on the moment the payroll transitions
 * into "fully reconciled" during this session — never on initial page load,
 * even when the contract is already reconciled when the page is opened.
 */
export function CelebrateOnReconcile({ reconciled, initialized }: { reconciled: boolean; initialized: boolean }) {
  const prevRef = useRef<boolean | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    const isReconciled = reconciled && initialized;
    if (prevRef.current === false && isReconciled) {
      setCelebrating(true);
      const timer = setTimeout(() => setCelebrating(false), CELEBRATION_MS);
      prevRef.current = isReconciled;
      return () => clearTimeout(timer);
    }
    prevRef.current = isReconciled;
  }, [reconciled, initialized]);

  return celebrating ? <Celebration /> : null;
}

/** One 7s confetti burst. */
function Celebration() {
  const pieces = useRef(
    Array.from({ length: 20 }, (_, i) => {
      let seed = i * 7919 + 17;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      return {
        left: rand() * 100,
        delay: rand() * 1.2,
        duration: 2.4 + rand() * 1.8,
        size: 5 + rand() * 5,
        color: ['#f2c94c', '#7c6cff', '#35e0c4', '#ffdf8e'][Math.floor(rand() * 4)],
        round: rand() > 0.6,
      };
    }),
  ).current;

  return (
    <div className="celebrate" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (p.round ? 1 : 0.5),
            background: p.color,
            borderRadius: p.round ? '999px' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

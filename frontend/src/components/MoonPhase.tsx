import { useRef } from 'react';
import { AnimatedNumber } from './AnimatedNumber';

const PHASES = [
  { emoji: '🌑', label: 'New moon — awaiting the first claim' },
  { emoji: '🌒', label: 'Waxing crescent — claims are starting' },
  { emoji: '🌓', label: 'First quarter — halfway there' },
  { emoji: '🌔', label: 'Waxing gibbous — most of the payroll is out' },
  { emoji: '🌕', label: 'Full moon — fully reconciled' },
];

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
          <span className="moonviz__phase-emoji" aria-hidden="true">
            {phase.emoji}
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

/** Fires once when the payroll becomes fully reconciled. */
export function Celebration() {
  const pieces = useRef(
    Array.from({ length: 36 }, (_, i) => {
      let seed = i * 7919 + 17;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      return {
        left: rand() * 100,
        delay: rand() * 2.2,
        duration: 3 + rand() * 2.5,
        size: 6 + rand() * 6,
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
